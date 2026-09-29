// motores/gacha-core.js
//
// Piezas compartidas por todos los comandos del gacha:
//  - descarga liviana de imágenes (buffer temporal, nunca se guarda en disco ni en la base)
//  - cooldowns en memoria (no escriben en MongoDB)
//  - reclamos pendientes (.claim)
//  - motor de combate PvP (Pokémon y Brawl Stars) con apuesta en el monedero real del bot
import axios from "axios";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { Transform } from "stream";
import { pipeline } from "stream/promises";
import {
  propietarios, reclamar, coleccionDe, contarColeccion, mejorDe, personajePorId
} from "./gacha-db.js";
import { getAccount, addToWallet } from "./db.js";
import { tarjeta, monto, fmt } from "../src/economia/formato.js";
import { formatTime } from "./ui.js";
import { initGachaDB } from "./gacha-db.js";

// Los comandos hacen `await gachaListo` antes de tocar la base.
export const gachaListo = initGachaDB().catch((e) => {
  console.log("❌ Gacha: no se pudo abrir la base SQLite: " + e.message);
  throw e;
});
gachaListo.catch(() => {});

const UA = "Mozilla/5.0 (compatible; MaxiBot/1.0)";
const arroba = (jid) => `@${jid.split("@")[0]}`;

export { tarjeta, monto, fmt, arroba };

// ---------------- imágenes ----------------
// La imagen NUNCA se carga entera en RAM: se baja en streaming a un archivo temporal, se manda
// a WhatsApp leyendo desde el disco ({ image: { url: ruta } }) y se borra. Los bytes son los
// originales (sin recomprimir), así que la calidad es la de la fuente.
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

async function bajarAArchivo(url) {
  const headers = { "User-Agent": UA };
  if (/yande\.re/i.test(url)) headers.Referer = "https://yande.re/";
  const res = await axios.get(url, { responseType: "stream", timeout: 25000, maxContentLength: LIMITE_BYTES, headers });
  const largo = Number(res.headers?.["content-length"] || 0);
  if (largo > LIMITE_BYTES) { res.data.destroy(); throw new Error("imagen demasiado pesada"); }
  const ruta = path.join(TMP_DIR, `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`);
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

// Prueba cada URL en orden (original -> jpeg -> sample). Devuelve { ruta, limpiar }.
export async function prepararImagen(urls) {
  return conCupo(async () => {
    let ultimoError = new Error("sin imágenes");
    for (const url of urls.filter(Boolean)) {
      try {
        const ruta = await bajarAArchivo(url);
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
export const VENTANA_CLAIM_MS = 30_000;
const pendientes = new Map(); // idMensaje -> { from, personaje, dueno, exclusivo, vence }

export function registrarPendiente(idMensaje, from, personaje, dueno) {
  pendientes.set(idMensaje, {
    from, personaje, dueno,
    exclusivo: personaje.categoria !== "waifu", // Pokémon/Brawlers: solo el que hizo el roll
    vence: Date.now() + VENTANA_CLAIM_MS
  });
  setTimeout(() => pendientes.delete(idMensaje), VENTANA_CLAIM_MS + 1000).unref();
}

export function buscarPendiente(from, idCitado, sender) {
  const ahora = Date.now();
  if (idCitado && pendientes.has(idCitado)) {
    const p = pendientes.get(idCitado);
    if (p.from === from && p.vence > ahora) return { id: idCitado, ...p };
  }
  let ultimo = null;
  for (const [id, p] of pendientes) {
    if (p.from !== from || p.vence <= ahora) continue;
    if (p.exclusivo && p.dueno !== sender) continue;
    if (!ultimo || p.vence > ultimo.vence) ultimo = { id, ...p };
  }
  return ultimo;
}

export function cerrarPendiente(id) { pendientes.delete(id); }

export function idMensajeCitado(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.stanzaId || null;
}

export function participanteCitado(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.participant || null;
}

// ---------------- tarjetas ----------------
const EMOJI = { waifu: "🎴", pokemon: "🔴", brawler: "⭐" };

export function lineasPersonaje(p) {
  const lineas = [`👤 *Nombre* ›› ${p.nombre}`];
  if (p.categoria === "waifu") {
    lineas.push(`⚥ *Género* ›› ${p.genero}`, `📖 *Serie* ›› ${p.serie}`);
  } else if (p.categoria === "pokemon" && p.stats) {
    lineas.push(`🔥 *Tipo* ›› ${p.stats.tipos.join(" / ")}`,
      `❤️ ${p.stats.hp}  ⚔️ ${p.stats.atk}  🛡️ ${p.stats.def}  💨 ${p.stats.spe}`);
  } else if (p.categoria === "brawler") {
    lineas.push(`📖 *Clase* ›› ${p.serie.replace("Brawl Stars · ", "")}`);
  }
  lineas.push(`✨ *Rareza* ›› ${p.rareza}`, `💴 *Valor* ›› ${monto(p.valor)}`);
  return lineas;
}

// Envía la imagen del personaje (streaming desde disco, se borra al terminar).
export async function enviarPersonaje({ reply, personaje, titulo, lineasExtra = [], mentions = [] }) {
  const img = await prepararImagen([personaje.img, ...(personaje.meta?.alt || [])]);
  try {
    const caption = tarjeta({
      emoji: EMOJI[personaje.categoria] || "🎴",
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
  const clave = `roll:${categoria}:${sender}`;
  const espera = tomarCooldown(clave, cooldownMs);
  if (espera > 0) return reply({ text: textoCooldown(espera) });

  let exito = false;
  try {
    for (let intento = 0; intento < 3; intento++) {
      const personaje = await obtener();
      if (!personaje) return reply({ text: textoVacio });

      const duenos = categoria === "waifu" ? propietarios(personaje.id) : [];
      const extra = [];
      const mentions = [];
      if (duenos.length) {
        extra.push(`👑 *Reclamada por* ›› ${arroba(duenos[0])}`);
        mentions.push(duenos[0]);
      } else {
        extra.push(categoria === "waifu"
          ? "✅ *Libre* — respondé con *.claim* para reclamarla (30s)."
          : "✅ Respondé con *.claim* para quedártelo (30s).");
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
    await reply({ text: "❌ No pude descargar la imagen, probá de nuevo en un momento." });
  } finally {
    if (!exito) soltarCooldown(clave);
  }
}

// ---------------- colección ----------------
export async function mostrarColeccion({ categoria, titulo, emoji, sender, cleanText, reply }) {
  const arg = cleanText.split(/\s+/)[1];
  const pagina = Math.max(1, parseInt(arg, 10) || 1);
  const POR_PAGINA = 15;
  const { n, total } = contarColeccion(sender, categoria);
  if (!n) return reply({ text: `📭 Todavía no tenés nada en *${titulo}*. Probá con un roll y usá *.claim*.` });

  const paginas = Math.ceil(n / POR_PAGINA);
  const p = Math.min(pagina, paginas);
  const filas = coleccionDe(sender, categoria, POR_PAGINA, (p - 1) * POR_PAGINA)
    .map((c, i) => `${(p - 1) * POR_PAGINA + i + 1}. *${c.nombre}* · ${c.rareza} · ${monto(c.valor)}`);

  return reply({
    text: tarjeta({
      emoji, titulo: titulo.toUpperCase(),
      lineas: [`📦 *Total* ›› ${n}`, `💰 *Valor* ›› ${monto(total)}`, "", ...filas, "", `📄 Página ${p}/${paginas}`]
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

// Stats base -> stats de nivel 50 (fórmula de la franquicia, simplificada)
const nivel50 = (base, esHP) => Math.floor((2 * base + 31) * 0.5) + (esHP ? 60 : 5);

function prepararLuchador(p) {
  const s = p.stats || { hp: 60, atk: 60, def: 60, spe: 60, tipos: [] };
  return {
    nombre: p.nombre,
    tipos: s.tipos || [],
    hpMax: nivel50(s.hp, true),
    hp: nivel50(s.hp, true),
    atk: nivel50(s.atk, false),
    def: nivel50(s.def, false),
    spe: nivel50(s.spe, false)
  };
}

function golpe(a, d) {
  // Con tipos (Pokémon): usa el mejor tipo propio contra el rival + STAB. Sin tipos (Brawlers): daño plano.
  let eff = 1, stab = 1;
  if (a.tipos.length) {
    eff = Math.max(...a.tipos.map((t) => efectividad(t, d.tipos)));
    stab = 1.5;
  }
  const base = ((22 * 70 * a.atk / d.def) / 50) + 2;
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

const desafios = new Map(); // `${from}:${rival}` -> { retador, rival, apuesta, vence }
const DESAFIO_MS = 2 * 60 * 1000;
const APUESTA_MINIMA = 100;

function claveDesafio(from, rival) { return `${from}:${rival}`; }

// Crea el handler de .pokemonpvp / .brawlstarspvp
export function crearHandlerPvp({ categoria, emoji, comando, nombreLuchador }) {
  return async ({ from, sender, cleanText, msg, reply }) => {
    const partes = cleanText.split(/\s+/);
    const sub = (partes[1] || "").toLowerCase();

    // ---- aceptar / rechazar ----
    if (sub === "aceptar" || sub === "rechazar") {
      const clave = claveDesafio(from, sender);
      const d = desafios.get(clave);
      if (!d || d.vence < Date.now()) {
        desafios.delete(clave);
        return reply({ text: "❌ No tenés ningún desafío pendiente en este chat." });
      }
      desafios.delete(clave);
      if (sub === "rechazar") {
        return reply({ text: `🏳️ ${arroba(sender)} rechazó el desafío de ${arroba(d.retador)}.`, mentions: [sender, d.retador] });
      }

      const luchaR = mejorDe(d.retador, categoria);
      const luchaV = mejorDe(sender, categoria);
      if (!luchaV) return reply({ text: `❌ No tenés ningún ${nombreLuchador}. Conseguí uno con *.${comando.replace("pvp", "")}* y *.claim*.` });
      if (!luchaR) return reply({ text: `❌ ${arroba(d.retador)} ya no tiene ningún ${nombreLuchador}.`, mentions: [d.retador] });
      if (getAccount(d.retador).wallet < d.apuesta || getAccount(sender).wallet < d.apuesta) {
        return reply({ text: "❌ Alguno de los dos ya no tiene saldo en mano para cubrir la apuesta. Combate cancelado." });
      }

      const r = simularCombate(luchaR, luchaV);
      const gana = r.ganador === "A" ? d.retador : sender;
      const pierde = r.ganador === "A" ? sender : d.retador;
      const luchaGana = r.ganador === "A" ? luchaR : luchaV;

      addToWallet(pierde, -d.apuesta);
      addToWallet(gana, d.apuesta);

      return reply({
        text: tarjeta({
          emoji, titulo: "COMBATE PVP",
          lineas: [
            `🥊 ${arroba(d.retador)} (*${luchaR.nombre}*) vs ${arroba(sender)} (*${luchaV.nombre}*)`,
            "",
            ...r.notas,
            "",
            `⏱️ *Rondas* ›› ${r.rondas}`,
            `❤️ *HP final* ›› ${luchaR.nombre} ${r.hpA}/${r.maxA} · ${luchaV.nombre} ${r.hpB}/${r.maxB}`,
            `🏆 *Ganador* ›› ${arroba(gana)} con *${luchaGana.nombre}*`,
            `🪙 *Premio* ›› +${monto(d.apuesta)} (los paga ${arroba(pierde)})`
          ]
        }),
        mentions: [d.retador, sender]
      });
    }

    // ---- desafiar ----
    const rival = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || participanteCitado(msg);
    const apuesta = parseInt((partes.find((x, i) => i > 0 && /^\d+$/.test(x))) || "", 10);

    if (!rival || !apuesta) {
      return reply({
        text: tarjeta({
          emoji, titulo: "COMBATE PVP",
          lineas: [
            `⚙️ *Desafiar* ›› .${comando} @usuario <apuesta>`,
            `✅ *Aceptar* ›› .${comando} aceptar`,
            `🏳️ *Rechazar* ›› .${comando} rechazar`,
            "",
            `Pelea tu mejor ${nombreLuchador} contra el del rival. El perdedor le paga la apuesta al ganador (mínimo ${APUESTA_MINIMA}, sale del dinero en mano).`
          ]
        })
      });
    }
    if (rival === sender) return reply({ text: "❌ No podés desafiarte a vos mismo." });
    if (apuesta < APUESTA_MINIMA) return reply({ text: `❌ La apuesta mínima es ${monto(APUESTA_MINIMA)}.` });
    if (!mejorDe(sender, categoria)) return reply({ text: `❌ Necesitás al menos un ${nombreLuchador}. Conseguí uno con *.${comando.replace("pvp", "")}* y *.claim*.` });
    if (getAccount(sender).wallet < apuesta) return reply({ text: `❌ No tenés ${monto(apuesta)} en mano.` });
    if (getAccount(rival).wallet < apuesta) return reply({ text: `❌ ${arroba(rival)} no tiene ${monto(apuesta)} en mano.`, mentions: [rival] });

    desafios.set(claveDesafio(from, rival), { retador: sender, rival, apuesta, vence: Date.now() + DESAFIO_MS });
    return reply({
      text: tarjeta({
        emoji, titulo: "DESAFÍO PVP",
        lineas: [
          `⚔️ ${arroba(sender)} desafía a ${arroba(rival)}`,
          `🪙 *Apuesta* ›› ${monto(apuesta)}`,
          "",
          `${arroba(rival)}, respondé con *.${comando} aceptar* o *.${comando} rechazar* (2 min).`
        ]
      }),
      mentions: [sender, rival]
    });
  };
}

export { personajePorId };
