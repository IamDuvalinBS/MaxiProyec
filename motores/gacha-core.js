import axios from "axios";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { Transform } from "stream";
import { pipeline } from "stream/promises";
import {
  initGachaDB, reclamar, coleccionDe, contarColeccion, personajePorId, propietarios
} from "./gacha-db.js";
import { tarjeta, monto, fmt } from "../src/economia/formato.js";
import { formatTime } from "./ui.js";
import { renderSnake } from "./gacha-snake.js";
import { statsEfectivas, NIVEL_MAX, TIENE_NIVELES } from "./gacha-niveles.js";
import { tipoEs } from "./gacha-pokemon.js";
import { rutaImagenCacheada, guardarImagenCacheada, hayRelay } from "./cache-medios.js";

export { tarjeta, monto, fmt, personajePorId };
export const arroba = (jid) => `@${jid.split("@")[0]}`;

export const gachaListo = initGachaDB().catch((e) => {
  console.log("❌ Gacha: no se pudo abrir la base SQLite: " + e.message);
  throw e;
});
gachaListo.catch(() => {});

const UA = "Mozilla/5.0 (compatible; MaxiBot/1.0)";

export const CAT = {
  waifu:   { emoji: "🎴", singular: "waifu",   indef: "una waifu",   reclamado: "WAIFU RECLAMADA",   rollCmd: ".rw",         claimCmd: ".c" },
  pokemon: { emoji: "🔴", singular: "Pokémon", indef: "un Pokémon",  reclamado: "POKÉMON RECLAMADO", rollCmd: ".pokemon",    claimCmd: ".atrapar" },
  brawler: { emoji: "⭐", singular: "brawler", indef: "un brawler",  reclamado: "BRAWLER RECLAMADO", rollCmd: ".brawlstars", claimCmd: ".drop" },
  snake:   { emoji: "🐍", singular: "snake",   indef: "un snake",    reclamado: "SNAKE ADOPTADO",    rollCmd: ".snake",      claimCmd: ".adoptar" }
};

const TMP_DIR = path.join(os.tmpdir(), "maxibot-gacha");
const LIMITE_BYTES = 15 * 1024 * 1024;
const MAX_DESCARGAS_SIMULTANEAS = 3;
fs.mkdirSync(TMP_DIR, { recursive: true });
for (const f of fs.readdirSync(TMP_DIR)) fs.rm(path.join(TMP_DIR, f), { force: true }, () => {});

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

export async function prepararImagen(urls) {
  return conCupo(async () => {
    let ultimoError = new Error("sin imágenes");
    for (const url of urls.filter(Boolean)) {
      try {
        if (url.startsWith("snake:")) {
          const rutaSnake = await dibujarSnake(url.slice(6));
          return { ruta: rutaSnake, limpiar: () => { try { fs.rmSync(rutaSnake, { force: true }); } catch {} } };
        }
        const enCache = rutaImagenCacheada(url);
        if (enCache) return { ruta: enCache, limpiar: () => {} };
        const ruta = await bajarAArchivo(url);
        guardarImagenCacheada(url, ruta);
        return { ruta, limpiar: () => { try { fs.rmSync(ruta, { force: true }); } catch {} } };
      } catch (e) { ultimoError = e; }
    }
    throw ultimoError;
  });
}

const cooldowns = new Map();
export function tomarCooldown(clave, ms) {
  const ahora = Date.now();
  const vence = cooldowns.get(clave) || 0;
  if (vence > ahora) return vence - ahora;
  cooldowns.set(clave, ahora + ms);
  return 0;
}
export function soltarCooldown(clave) { cooldowns.delete(clave); }
export const textoCooldown = (ms) => `⏳ Todavía no puedes volver a usar este comando. Tiempo restante: *${formatTime(ms)}*.`;

setInterval(() => {
  const ahora = Date.now();
  for (const [k, v] of cooldowns) if (v < ahora) cooldowns.delete(k);
}, 10 * 60 * 1000).unref();

export const EXCLUSIVO_MS = 45_000;
export const VIGENCIA_MS = 3 * 60_000;

const pendientes = new Map();

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

function fuenteDe(p) {
  if (p.categoria === "waifu") return p.serie || "Desconocida";
  if (p.categoria === "pokemon") return "Pokémon";
  if (p.categoria === "brawler") return "Brawl Stars";
  return "Snake";
}

export const textoStats = (s) => `❤️ ${s.hp}  ⚔️ ${s.atk}  🛡️ ${s.def}  💨 ${s.spe}`;

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

export async function enviarPersonaje({ reply, personaje, titulo, lineasExtra = [], mentions = [] }) {
  const caption = tarjeta({
    emoji: CAT[personaje.categoria]?.emoji || "🎴",
    titulo,
    lineas: [...lineasPersonaje(personaje), ...(lineasExtra.length ? ["", ...lineasExtra] : [])]
  });
  const cacheKey = `gacha:${personaje.categoria}:${personaje.img}`;
  if (hayRelay(cacheKey)) {
    try {
      return await reply({ cacheKey, caption, mentions });
    } catch (e) {}
  }
  const img = await prepararImagen([personaje.img, ...(personaje.meta?.alt || [])]);
  try {
    return await reply({ image: { url: img.ruta }, caption, mentions, cacheKey });
  } finally {
    img.limpiar();
  }
}

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
          `👉 Reclámalo con *${cat.claimCmd}* (o respondiendo a este mensaje).`
        );
      }

      try {
        const enviado = await enviarPersonaje({ reply, personaje, titulo, lineasExtra: extra, mentions });
        if (!duenos.length && enviado?.key?.id) registrarPendiente(enviado.key.id, from, personaje, sender);
        exito = true;
        return;
      } catch (e) {
        console.log(`[gacha] no pude preparar la imagen de "${personaje.nombre}" (${categoria}):`, e.message);
      }
    }
    await reply({ text: "❌ No pude preparar la imagen, prueba de nuevo en un momento." });
  } finally {
    if (!exito) soltarCooldown(clave);
  }
}

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
        return reply({ text: `📦 Ya tienes a *${p.nombre}*.` });
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

export async function mostrarColeccion({ categoria, titulo, sender, cleanText, reply, pista = "" }) {
  const cat = CAT[categoria];
  const pagina = Math.max(1, parseInt(cleanText.split(/\s+/)[1], 10) || 1);
  const POR_PAGINA = 15;
  const { n, total } = contarColeccion(sender, categoria);
  if (!n) return reply({ text: `📭 Todavía no tienes nada en *${titulo}*. Prueba con *${cat.rollCmd}* y reclámalo con *${cat.claimCmd}*.` });

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
