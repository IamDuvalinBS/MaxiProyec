// motores/gacha-core.js
//
// Piezas compartidas por todos los comandos del gacha:
//  - diseño de las tarjetas (roll, reclamo, colecciones, combates)
//  - imágenes livianas (streaming a disco / skins de snake dibujadas al vuelo)
//  - cooldowns y reclamos pendientes en memoria (nada de esto toca MongoDB)
//  - motor de combate PvP con apuesta en el monedero real del bot
import axios from "axios";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { Transform } from "stream";
import { pipeline } from "stream/promises";
import {
  initGachaDB, reclamar, coleccionDe, contarColeccion, mejorDe, personajePorId, propietarios
} from "./gacha-db.js";
import { getAccount, addToWallet } from "./db.js";
import { tarjeta, monto, fmt } from "../src/economia/formato.js";
import { formatTime } from "./ui.js";
import { renderSnake } from "./gacha-snake.js";
import { statsEfectivas, NIVEL_MAX, TIENE_NIVELES, TIENDAS, alimentar } from "./gacha-niveles.js";
import { tipoEs } from "./gacha-pokemon.js";

export { tarjeta, monto, fmt, personajePorId };
export const arroba = (jid) => `@${jid.split("@")[0]}`;

// Los comandos hacen `await gachaListo` antes de tocar la base.
export const gachaListo = initGachaDB().catch((e) => {
  console.log("❌ Gacha: no se pudo abrir la base SQLite: " + e.message);
  throw e;
});
gachaListo.catch(() => {});

const UA = "Mozilla/5.0 (compatible; MaxiBot/1.0)";

// ---------------- categorías (nombres, emojis y comandos) ----------------
export const CAT = {
  waifu:   { emoji: "🎴", singular: "waifu",   indef: "una waifu",   reclamado: "WAIFU RECLAMADA",   rollCmd: ".rw",         claimCmd: ".c" },
  pokemon: { emoji: "🔴", singular: "Pokémon", indef: "un Pokémon",  reclamado: "POKÉMON RECLAMADO", rollCmd: ".pokemon",    claimCmd: ".atrapar" },
  brawler: { emoji: "⭐", singular: "brawler", indef: "un brawler",  reclamado: "BRAWLER RECLAMADO", rollCmd: ".brawlstars", claimCmd: ".drop" },
  snake:   { emoji: "🐍", singular: "snake",   indef: "un snake",    reclamado: "SNAKE ADOPTADO",    rollCmd: ".snake",      claimCmd: ".adoptar" }
};

// ---------------- imágenes ----------------
// Nunca se carga una imagen entera en RAM: se baja en streaming a un archivo temporal (o se dibuja la
// skin de snake), se envía leyendo desde el disco ({ image: { url: ruta } }) y se borra.
const TMP_DIR = path.join(os.tmpdir(), "maxibot-gacha");
const LIMITE_BYTES = 15 * 1024 * 1024;     // WhatsApp acepta imágenes de hasta 16 MB
const MAX_DESCARGAS_SIMULTANEAS = 3;
fs.mkdirSync(TMP_DIR, { recursive: true });
for (const f of fs.readdirSync(TMP_DIR)) fs.rm(path.join(TMP_DIR, f), { force: true }, () => {}); // restos de un cierre brusco

let activas = 0;
const cola = [];
async function conCupo(fn) {
  if (activas >= MAX_DESCARGAS_SIMULTANEAS) await new Promise((r) => cola.push(r));
  activas++;
  try { return await fn(); }
  finally { activas--; cola.shift()?.(); }
}

const rutaTemporal = (ext = "") => path.join(TMP_DIR, `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`);

async function bajarAArchivo(url) {
  const headers = { "User-Agent": UA };
  if (/yande\.re/i.test(url)) headers.Referer = "https://yande.re/";
  const res = await axios.get(url, { responseType: "stream", timeout: 25000, maxContentLength: LIMITE_BYTES, headers });
  const largo = Number(res.headers?.["content-length"] || 0);
  if (largo > LIMITE_BYTES) { res.data.destroy(); throw new Error("imagen demasiado pesada"); }
  const ruta = rutaTemporal();
  let bytes = 0;
  const tope = new Transform({
    transform(chunk, _e, cb) {
      bytes += chunk.length;
      cb(bytes > LIMITE_BYTES ? new Error("imagen demasiado pesada") : null, chunk);
    }
  });
  try {
    await pipeline(res.data, tope, fs.createWriteStream(ruta));
    if (!bytes) throw new Error("respuesta vacía");
    return ruta;
  } catch (e) {
    try { fs.rmSync(ruta, { force: true }); } catch {}
    throw e;
  }
}

async function dibujarSnake(clave) {
  const ruta = rutaTemporal(".png");
  try {
    await renderSnake(clave, ruta);
    return ruta;
  } catch (e) {
    try { fs.rmSync(ruta, { force: true }); } catch {}
    throw e;
  }
}

// Prueba cada URL en orden (original -> jpeg -> sample). "snake:<clave>" se dibuja localmente.
export async function prepararImagen(urls) {
  return conCupo(async () => {
    let ultimoError = new Error("sin imágenes");
    for (const url of urls.filter(Boolean)) {
      try {
        const ruta = url.startsWith("snake:") ? await dibujarSnake(url.slice(6)) : await bajarAArchivo(url);
        return { ruta, limpiar: () => { try { fs.rmSync(ruta, { force: true }); } catch {} } };
      } catch (e) { ultimoError = e; }
    }
    throw ultimoError;
  });
}

// ---------------- cooldown en memoria ----------------
const cooldowns = new Map();
export function tomarCooldown(clave, ms) {
  const ahora = Date.now();
  const vence = cooldowns.get(clave) || 0;
  if (vence > ahora) return vence - ahora;
  cooldowns.set(clave, ahora + ms);
  return 0;
}
export function soltarCooldown(clave) { cooldowns.delete(clave); }
export const textoCooldown = (ms) => `⏳ Todavía no podés volver a usar este comando. Tiempo restante: *${formatTime(ms)}*.`;

setInterval(() => {
  const ahora = Date.now();
  for (const [k, v] of cooldowns) if (v < ahora) cooldowns.delete(k);
}, 10 * 60 * 1000).unref();

// ---------------- reclamos pendientes ----------------
// Línea de tiempo de cada roll:
//   0 - 45 s  : SOLO puede reclamarlo quien hizo el roll.
//   45 s - 3 m: queda libre, cualquiera puede reclamarlo.
//   3 min     : expira para todos.
export const EXCLUSIVO_MS = 45_000;
export const VIGENCIA_MS = 3 * 60_000;

const pendientes = new Map(); // idMensaje -> { from, personaje, categoria, dueno, creado, exclusivoHasta, vence }

export function registrarPendiente(idMensaje, from, personaje, dueno) {
  const ahora = Date.now();
  pendientes.set(idMensaje, {
    from, personaje, categoria: personaje.categoria, dueno,
    creado: ahora, exclusivoHasta: ahora + EXCLUSIVO_MS, vence: ahora + VIGENCIA_MS
  });
  setTimeout(() => pendientes.delete(idMensaje), VIGENCIA_MS + 1000).unref();
}

function evaluar(p, sender, ahora) {
  if (p.vence <= ahora) return { estado: "vencido" };
  if (sender === p.dueno || ahora >= p.exclusivoHasta) return { estado: "ok" };
  return { estado: "bloqueado", restanteMs: p.exclusivoHasta - ahora };
}

// Devuelve { estado: "ok" | "bloqueado" | "otra_categoria" | "nada", id?, pendiente?, restanteMs?, categoriaReal? }
export function buscarPendiente({ from, categoria, idCitado, sender }) {
  const ahora = Date.now();

  if (idCitado && pendientes.has(idCitado)) {
    const p = pendientes.get(idCitado);
    if (p.from === from) {
      if (p.categoria !== categoria) return { estado: "otra_categoria", categoriaReal: p.categoria };
      const ev = evaluar(p, sender, ahora);
      if (ev.estado !== "vencido") return { ...ev, id: idCitado, pendiente: p };
    }
  }

  let libre = null, bloqueado = null, otra = null;
  for (const [id, p] of pendientes) {
    if (p.from !== from) continue;
    if (p.categoria !== categoria) {
      if (p.vence > ahora && evaluar(p, sender, ahora).estado === "ok") otra = otra || p.categoria;
      continue;
    }
    const ev = evaluar(p, sender, ahora);
    if (ev.estado === "ok") {
      const mio = p.dueno === sender ? 1 : 0;
      if (!libre || mio > libre.mio || (mio === libre.mio && p.creado > libre.pendiente.creado)) libre = { ...ev, id, pendiente: p, mio };
    } else if (ev.estado === "bloqueado") {
      if (!bloqueado || ev.restanteMs < bloqueado.restanteMs) bloqueado = { ...ev, id, pendiente: p };
    }
  }
  if (libre) return libre;
  if (bloqueado) return bloqueado;
  if (otra) return { estado: "otra_categoria", categoriaReal: otra };
  return { estado: "nada" };
}

export function cerrarPendiente(id) { pendientes.delete(id); }

export function idMensajeCitado(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.stanzaId || null;
}

export function participanteCitado(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.participant || null;
}

// ---------------- diseño de las tarjetas ----------------
function fuenteDe(p) {
  if (p.categoria === "waifu") return p.serie || "Desconocida";
  if (p.categoria === "pokemon") return "Pokémon";
  if (p.categoria === "brawler") return "Brawl Stars";
  return "Snake";
}

export const textoStats = (s) => `❤️ ${s.hp}  ⚔️ ${s.atk}  🛡️ ${s.def}  💨 ${s.spe}`;

// Campos de una tarjeta de personaje. `nivel` solo aplica a categorías con niveles.
export function lineasPersonaje(p, nivel = null) {
  const l = [`🆔 *ID* ›› #${p.id}`, `👤 *Nombre* ›› ${p.nombre}`, `🌐 *Fuente* ›› ${fuenteDe(p)}`];
  if (p.categoria === "waifu" && p.genero) l.push(`⚥ *Género* ›› ${p.genero}`);
  if (p.categoria === "pokemon" && p.stats?.tipos?.length) l.push(`🧬 *Tipo* ›› ${p.stats.tipos.map(tipoEs).join(" / ")}`);
  if (p.categoria === "brawler" && p.serie.includes("·")) l.push(`🎯 *Clase* ›› ${p.serie.split("·")[1].trim()}`);
  l.push(`✨ *Rareza* ›› ${p.rareza}`);
  if (TIENE_NIVELES(p.categoria)) {
    const n = nivel ?? 1;
    l.push(`📊 *Nivel* ›› ${n}/${NIVEL_MAX[p.categoria]}`, textoStats(statsEfectivas(p, n)));
  }
  l.push(`💴 *Valor* ›› ${monto(p.valor)}`);
  return l;
}

// Envía la imagen del personaje (streaming desde disco, se borra al terminar).
export async function enviarPersonaje({ reply, personaje, titulo, lineasExtra = [], mentions = [] }) {
  const img = await prepararImagen([personaje.img, ...(personaje.meta?.alt || [])]);
  try {
    const caption = tarjeta({
      emoji: CAT[personaje.categoria]?.emoji || "🎴",
      titulo,
      lineas: [...lineasPersonaje(personaje), ...(lineasExtra.length ? ["", ...lineasExtra] : [])]
    });
    return await reply({ image: { url: img.ruta }, caption, mentions });
  } finally {
    img.limpiar();
  }
}

// ---------------- roll genérico ----------------
export async function hacerRoll({ categoria, obtener, reply, sender, from, cooldownMs, titulo, textoVacio }) {
  const cat = CAT[categoria];
  const clave = `roll:${categoria}:${sender}`;
  const espera = tomarCooldown(clave, cooldownMs);
  if (espera > 0) return reply({ text: textoCooldown(espera) });

  let exito = false;
  try {
    for (let intento = 0; intento < 3; intento++) {
      const personaje = await obtener();
      if (!personaje) return reply({ text: textoVacio });

      const duenos = categoria === "waifu" ? propietarios(personaje.id) : [];
      const extra = [`🙋 *Solicitado por* ›› ${arroba(sender)}`];
      const mentions = [sender];
      if (duenos.length) {
        extra.push(`👑 *Reclamada por* ›› ${arroba(duenos[0])}`);
        mentions.push(duenos[0]);
      } else {
        extra.push(
          `🔒 Solo ${arroba(sender)} puede reclamarlo durante *${EXCLUSIVO_MS / 1000}s*.`,
          `🔓 Después queda libre para todos hasta los *${VIGENCIA_MS / 60000} min*.`,
          `👉 Reclamalo con *${cat.claimCmd}* (o respondiendo a este mensaje).`
        );
      }

      try {
        const enviado = await enviarPersonaje({ reply, personaje, titulo, lineasExtra: extra, mentions });
        if (!duenos.length && enviado?.key?.id) registrarPendiente(enviado.key.id, from, personaje, sender);
        exito = true;
        return;
      } catch (e) {
        // imagen caída: probamos otro personaje
      }
    }
    await reply({ text: "❌ No pude preparar la imagen, probá de nuevo en un momento." });
  } finally {
    if (!exito) soltarCooldown(clave);
  }
}

// ---------------- comando de reclamo (uno por categoría) ----------------
export function crearComandoClaim({ categoria, names, desc }) {
  const cat = CAT[categoria];
  return {
    names, desc, category: "Gacha",
    handler: async ({ from, sender, msg, reply }) => {
      await gachaListo;
      const r = buscarPendiente({ from, categoria, idCitado: idMensajeCitado(msg), sender });

      if (r.estado === "otra_categoria") {
        const otra = CAT[r.categoriaReal];
        return reply({ text: `❌ Eso es ${otra.indef}, se reclama con *${otra.claimCmd}*.` });
      }
      if (r.estado === "nada") {
        return reply({ text: `❌ No hay ${cat.indef} para reclamar ahora (venció el tiempo o ya lo reclamaron). Se genera con *${cat.rollCmd}*.` });
      }
      if (r.estado === "bloqueado") {
        const dueno = r.pendiente.dueno;
        return reply({
          text: `🔒 Este roll es de ${arroba(dueno)}. Queda libre para todos en *${Math.ceil(r.restanteMs / 1000)}s*.`,
          mentions: [dueno]
        });
      }

      const { pendiente } = r;
      const p = pendiente.personaje;
      const resultado = reclamar(sender, p);
      if (resultado === "ocupado") {
        cerrarPendiente(r.id);
        return reply({ text: "💨 Alguien fue más rápido, ya la reclamaron." });
      }
      if (resultado === "repetido") {
        cerrarPendiente(r.id);
        return reply({ text: `📦 Ya tenés a *${p.nombre}*.` });
      }

      cerrarPendiente(r.id);
      const lineas = [...lineasPersonaje(p, 1), "", `🙋 *Reclamado por* ›› ${arroba(sender)}`];
      const mentions = [sender];
      if (pendiente.dueno !== sender) {
        lineas.push(`🎁 *Roll de* ›› ${arroba(pendiente.dueno)}`);
        mentions.push(pendiente.dueno);
      }
      await reply({ text: tarjeta({ emoji: cat.emoji, titulo: cat.reclamado, lineas }), mentions });
    }
  };
}

// ---------------- colección ----------------
export async function mostrarColeccion({ categoria, titulo, sender, cleanText, reply, pista = "" }) {
  const cat = CAT[categoria];
  const pagina = Math.max(1, parseInt(cleanText.split(/\s+/)[1], 10) || 1);
  const POR_PAGINA = 15;
  const { n, total } = contarColeccion(sender, categoria);
  if (!n) return reply({ text: `📭 Todavía no tenés nada en *${titulo}*. Probá con *${cat.rollCmd}* y reclamalo con *${cat.claimCmd}*.` });

  const paginas = Math.ceil(n / POR_PAGINA);
  const p = Math.min(pagina, paginas);
  const conNivel = TIENE_NIVELES(categoria);
  const filas = coleccionDe(sender, categoria, POR_PAGINA, (p - 1) * POR_PAGINA).map((c, i) =>
    `${(p - 1) * POR_PAGINA + i + 1}. *${c.nombre}*${conNivel ? ` · Nv.${c.nivel}` : ""} · ${c.rareza} · #${c.id}`);

  return reply({
    text: tarjeta({
      emoji: cat.emoji, titulo: titulo.toUpperCase(),
      lineas: [
        `📦 *Total* ›› ${n}`, `💰 *Valor* ›› ${monto(total)}`, "", ...filas, "",
        `📄 Página ${p}/${paginas}`, ...(pista ? [pista] : [])
      ]
    })
  });
}

// ---------------- PvP ----------------
const EFECTIVIDAD = {
  normal: { rock: .5, ghost: 0, steel: .5 },
  fire: { fire: .5, water: .5, grass: 2, ice: 2, bug: 2, rock: .5, dragon: .5, steel: 2 },
  water: { fire: 2, water: .5, grass: .5, ground: 2, rock: 2, dragon: .5 },
  electric: { water: 2, electric: .5, grass: .5, ground: 0, flying: 2, dragon: .5 },
  grass: { fire: .5, water: 2, grass: .5, poison: .5, ground: 2, flying: .5, bug: .5, rock: 2, dragon: .5, steel: .5 },
  ice: { fire: .5, water: .5, grass: 2, ice: .5, ground: 2, flying: 2, dragon: 2, steel: .5 },
  fighting: { normal: 2, ice: 2, poison: .5, flying: .5, psychic: .5, bug: .5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: .5 },
  poison: { grass: 2, poison: .5, ground: .5, rock: .5, ghost: .5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: .5, poison: 2, flying: 0, bug: .5, rock: 2, steel: 2 },
  flying: { electric: .5, grass: 2, fighting: 2, bug: 2, rock: .5, steel: .5 },
  psychic: { fighting: 2, poison: 2, psychic: .5, dark: 0, steel: .5 },
  bug: { fire: .5, grass: 2, fighting: .5, poison: .5, flying: .5, psychic: 2, ghost: .5, dark: 2, steel: .5, fairy: .5 },
  rock: { fire: 2, ice: 2, fighting: .5, ground: .5, flying: 2, bug: 2, steel: .5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: .5 },
  dragon: { dragon: 2, steel: .5, fairy: 0 },
  dark: { fighting: .5, psychic: 2, ghost: 2, dark: .5, fairy: .5 },
  steel: { fire: .5, water: .5, electric: .5, ice: 2, rock: 2, steel: .5, fairy: 2 },
  fairy: { fire: .5, fighting: 2, poison: .5, dragon: 2, dark: 2, steel: .5 }
};

function efectividad(tipoAtaque, tiposDefensor) {
  let m = 1;
  for (const t of tiposDefensor) m *= EFECTIVIDAD[tipoAtaque]?.[t] ?? 1;
  return m;
}

// El luchador usa las stats REALES según su nivel y su rareza.
function prepararLuchador(p) {
  const s = statsEfectivas(p, p.nivel || 1);
  return { nombre: p.nombre, tipos: s.tipos, hpMax: s.hp, hp: s.hp, atk: s.atk, def: s.def, spe: s.spe, nivelCombate: s.nivelCombate };
}

function golpe(a, d) {
  // Con tipos (Pokémon): mejor tipo propio contra el rival + STAB. Sin tipos (Brawlers/Snakes): daño plano.
  let eff = 1, stab = 1;
  if (a.tipos.length) {
    eff = Math.max(...a.tipos.map((t) => efectividad(t, d.tipos)));
    stab = 1.5;
  }
  const base = (((2 * a.nivelCombate) / 5 + 2) * 70 * a.atk / d.def) / 50 + 2;
  const azar = 0.85 + Math.random() * 0.15;
  const critico = Math.random() < 1 / 16 ? 1.5 : 1;
  return { dano: Math.max(1, Math.floor(base * stab * eff * azar * critico)), eff, critico: critico > 1 };
}

export function simularCombate(pa, pb) {
  const A = prepararLuchador(pa);
  const B = prepararLuchador(pb);
  const notas = [];
  let rondas = 0;
  while (A.hp > 0 && B.hp > 0 && rondas < 60) {
    rondas++;
    const primeroA = A.spe > B.spe || (A.spe === B.spe && Math.random() < 0.5);
    const orden = primeroA ? [[A, B], [B, A]] : [[B, A], [A, B]];
    for (const [atacante, defensor] of orden) {
      if (atacante.hp <= 0 || defensor.hp <= 0) break;
      const g = golpe(atacante, defensor);
      defensor.hp = Math.max(0, defensor.hp - g.dano);
      if (rondas <= 3 || g.critico || g.eff !== 1) {
        const extra = g.critico ? " 💥 ¡crítico!" : g.eff >= 2 ? " ✨ súper efectivo" : g.eff === 0 ? " 🚫 no afecta" : g.eff < 1 ? " 🔻 poco efectivo" : "";
        if (notas.length < 6) notas.push(`• ${atacante.nombre} golpea a ${defensor.nombre} (-${g.dano})${extra}`);
      }
    }
  }
  const gana = A.hp === B.hp ? (Math.random() < 0.5 ? "A" : "B") : (A.hp > B.hp ? "A" : "B");
  return { ganador: gana, rondas, notas, hpA: A.hp, hpB: B.hp, maxA: A.hpMax, maxB: B.hpMax };
}

const desafios = new Map(); // `${from}:${rival}` -> { retador, rival, apuesta, charId, vence }
const DESAFIO_MS = 2 * 60 * 1000;
const APUESTA_MINIMA = 100;
const claveDesafio = (from, rival) => `${from}:${rival}`;
const conNivel = (p) => (TIENE_NIVELES(p.categoria) ? `${p.nombre} (Nv.${p.nivel})` : p.nombre);

// Crea el handler de .pokemonpvp / .brawlstarspvp / .snakepvp
//   .cmd @usuario <apuesta> [#id]     desafía (con #id elegís tu luchador; si no, el de mayor nivel)
//   .cmd aceptar [#id]                acepta   |   .cmd rechazar
export function crearHandlerPvp({ categoria, comando, nombreLuchador }) {
  const cat = CAT[categoria];
  return async ({ from, sender, cleanText, msg, reply }) => {
    const partes = cleanText.split(/\s+/).slice(1);
    const sub = (partes[0] || "").toLowerCase();
    const idTok = partes.find((x) => /^#\d+$/.test(x));
    const charId = idTok ? parseInt(idTok.slice(1), 10) : null;

    // ---- aceptar / rechazar ----
    if (sub === "aceptar" || sub === "rechazar") {
      const clave = claveDesafio(from, sender);
      const d = desafios.get(clave);
      if (!d || d.vence < Date.now()) {
        desafios.delete(clave);
        return reply({ text: "❌ No tenés ningún desafío pendiente en este chat." });
      }
      if (sub === "rechazar") {
        desafios.delete(clave);
        return reply({ text: `🏳️ ${arroba(sender)} rechazó el desafío de ${arroba(d.retador)}.`, mentions: [sender, d.retador] });
      }

      const luchaR = mejorDe(d.retador, categoria, d.charId);
      const luchaV = mejorDe(sender, categoria, charId);
      if (!luchaV) {
        return reply({ text: charId
          ? `❌ No tenés ningún ${nombreLuchador} con ID #${charId}.`
          : `❌ No tenés ningún ${nombreLuchador
