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
import { encabezado } from "../src/economia/estilo.js";
import { formatTime } from "./ui.js";
import { renderSnake } from "./gacha-snake.js";
import { TIENE_NIVELES } from "./gacha-niveles.js";
import { CAT } from "./gacha-categorias.js";
import { ticketsDe, sorteoTicket } from "./gacha-tickets.js";
import {
  bloqueCabecera, bloquesDePersonaje, repartirBloques, lineasPersonaje, textoStats
} from "./gacha-estilo.js";

export const bloquesDePersonajeParaTicket = (personaje) => bloquesDePersonaje(personaje, 1);
import { rutaImagenCacheada, guardarImagenCacheada, hayRelay } from "./cache-medios.js";

export { tarjeta, monto, fmt, personajePorId, CAT, lineasPersonaje, textoStats };
export const arroba = (jid) => `@${jid.split("@")[0]}`;

export const gachaListo = initGachaDB().catch((e) => {
  console.log("❌ Gacha: no se pudo abrir la base SQLite: " + e.message);
  throw e;
});
gachaListo.catch(() => {});

const UA = "Mozilla/5.0 (compatible; MaxiBot/1.0)";
const TMP_DIR = path.join(os.tmpdir(), "maxibot-gacha");
const LIMITE_BYTES = 15 * 1024 * 1024;
const MAX_DESCARGAS_SIMULTANEAS = 3;
const TIEMPO_RESPUESTA_MS = 15000;
const TIEMPO_INACTIVIDAD_MS = 20000;
const PRESUPUESTO_IMAGEN_MS = 50000;

fs.mkdirSync(TMP_DIR, { recursive: true });
for (const f of fs.readdirSync(TMP_DIR)) fs.rm(path.join(TMP_DIR, f), { force: true }, () => {});

let activas = 0;
const cola = [];

async function conCupo(fn) {
  if (activas >= MAX_DESCARGAS_SIMULTANEAS) await new Promise((r) => cola.push(r));
  activas++;
  try {
    return await fn();
  } finally {
    activas--;
    cola.shift()?.();
  }
}

const rutaTemporal = (ext = "") => path.join(TMP_DIR, `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`);

function borrar(ruta) {
  try {
    fs.rmSync(ruta, { force: true });
  } catch (e) {
    console.log(`[gacha] No se pudo borrar ${ruta}: ${e.message}`);
  }
}

async function bajarAArchivo(url) {
  const headers = { "User-Agent": UA, "Accept-Encoding": "identity" };
  if (/yande\.re/i.test(url)) headers.Referer = "https://yande.re/";

  const res = await axios.get(url, {
    responseType: "stream",
    timeout: TIEMPO_RESPUESTA_MS,
    family: 4,
    maxRedirects: 3,
    maxContentLength: LIMITE_BYTES,
    headers
  });

  const largo = Number(res.headers?.["content-length"] || 0);
  if (largo > LIMITE_BYTES) {
    res.data.destroy();
    throw new Error("imagen demasiado pesada");
  }

  const ruta = rutaTemporal();
  let bytes = 0;
  let inactividad = null;
  const vigilar = () => {
    clearTimeout(inactividad);
    inactividad = setTimeout(() => res.data.destroy(new Error("la descarga se quedó sin datos")), TIEMPO_INACTIVIDAD_MS);
  };

  const tope = new Transform({
    transform(chunk, _codificacion, cb) {
      bytes += chunk.length;
      vigilar();
      cb(bytes > LIMITE_BYTES ? new Error("imagen demasiado pesada") : null, chunk);
    }
  });

  try {
    vigilar();
    await pipeline(res.data, tope, fs.createWriteStream(ruta));
    if (!bytes) throw new Error("respuesta vacía");
    return ruta;
  } catch (e) {
    borrar(ruta);
    throw e;
  } finally {
    clearTimeout(inactividad);
  }
}

const esErrorDeTiempo = (e) => /timeout|timed out|ETIMEDOUT|ECONNABORTED|ECONNRESET|sin datos/i.test(`${e.code || ""} ${e.message || ""}`);

async function bajarConReintento(url) {
  try {
    return await bajarAArchivo(url);
  } catch (e) {
    if (!esErrorDeTiempo(e)) throw e;
    return bajarAArchivo(url);
  }
}

async function dibujarSnake(clave) {
  const ruta = rutaTemporal(".png");
  try {
    await renderSnake(clave, ruta);
    return ruta;
  } catch (e) {
    borrar(ruta);
    throw e;
  }
}

export async function prepararImagen(urls) {
  return conCupo(async () => {
    let ultimoError = new Error("sin imágenes");
    const inicio = Date.now();
    for (const url of urls.filter(Boolean)) {
      if (Date.now() - inicio > PRESUPUESTO_IMAGEN_MS) break;
      try {
        if (url.startsWith("snake:")) {
          const rutaSnake = await dibujarSnake(url.slice(6));
          return { ruta: rutaSnake, limpiar: () => borrar(rutaSnake) };
        }
        const enCache = rutaImagenCacheada(url);
        if (enCache) return { ruta: enCache, limpiar: () => {} };
        const ruta = await bajarConReintento(url);
        guardarImagenCacheada(url, ruta);
        return { ruta, limpiar: () => borrar(ruta) };
      } catch (e) {
        ultimoError = e;
      }
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

export function soltarCooldown(clave) {
  cooldowns.delete(clave);
}

export const textoCooldown = (ms) => `⏳ Debes esperar *${formatTime(ms)}* para volver a usar este comando.`;

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

  let libre = null;
  let bloqueado = null;
  let otra = null;
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

export function cerrarPendiente(id) {
  pendientes.delete(id);
}

export function idMensajeCitado(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.stanzaId || null;
}

export function participanteCitado(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.participant || null;
}

class ErrorDeImagen extends Error {}

export async function enviarPersonaje({ reply, personaje, titulo, lineasExtra = [], mentions = [], permitirSinImagen = true }) {
  const cabecera = bloqueCabecera(personaje.categoria, titulo, lineasExtra);
  const { principal, resto } = repartirBloques([cabecera, ...bloquesDePersonaje(personaje, 1)]);
  const cacheKey = `gacha:${personaje.categoria}:${personaje.img}`;

  const enviarResto = async () => {
    if (resto) await reply({ text: resto, mentions });
  };

  if (hayRelay(cacheKey)) {
    try {
      const reenviado = await reply({ cacheKey, caption: principal, mentions });
      await enviarResto();
      return reenviado;
    } catch (e) {
      console.log(`[gacha] El reenvío almacenado no estuvo disponible: ${e.message}`);
    }
  }

  let img;
  try {
    img = await prepararImagen([personaje.img, ...(personaje.meta?.alt || [])]);
  } catch (e) {
    if (!permitirSinImagen) throw new ErrorDeImagen(e.message);
    console.log(`[gacha] Se envía sin imagen a "${personaje.nombre}": ${e.message}`);
    const aviso = "> 🖼️ La imagen no está disponible en este momento. El personaje se puede reclamar con normalidad.";
    const enviado = await reply({ text: `${principal}\n\n${aviso}`, mentions });
    await enviarResto();
    return enviado;
  }

  try {
    const enviado = await reply({ image: { url: img.ruta }, caption: principal, mentions, cacheKey });
    await enviarResto();
    return enviado;
  } finally {
    img.limpiar();
  }
}

function tarjetaTicket(sender, cat) {
  return [
    encabezado("🎟️", "TICKET OBTENIDO"),
    "",
    `> ${arroba(sender)} tuviste suerte y obtuviste *1 ticket* de ${cat.plural}.`,
    `> Úsalo con *${cat.ticketCmd} <ID>* para conseguir el personaje que elijas.`
  ].join("\n");
}

export async function hacerRoll({ categoria, obtener, reply, sender, from, cooldownMs, titulo, textoVacio }) {
  const cat = CAT[categoria];
  const clave = `roll:${categoria}:${sender}`;
  const espera = tomarCooldown(clave, cooldownMs);
  if (espera > 0) return reply({ text: textoCooldown(espera) });

  let exito = false;
  try {
    const INTENTOS = 2;
    for (let intento = 0; intento < INTENTOS; intento++) {
      const personaje = await obtener();
      if (!personaje) return reply({ text: textoVacio });

      const duenos = categoria === "waifu" ? propietarios(personaje.id) : [];
      const mentions = [sender];
      const extra = [];
      if (duenos.length) {
        extra.push(`Este personaje ya fue reclamado por *${arroba(duenos[0])}*.`);
        mentions.push(duenos[0]);
      } else {
        extra.push(
          `Personaje disponible para *${arroba(sender)}*. Tienes *${EXCLUSIVO_MS / 1000}s* para reclamarlo usando *${cat.claimCmd}* o respondiendo a este mensaje.`,
          `Pasado ese tiempo queda libre para todos durante *${VIGENCIA_MS / 60000} min*.`
        );
      }

      try {
        const enviado = await enviarPersonaje({
          reply, personaje, titulo, lineasExtra: extra, mentions,
          permitirSinImagen: intento === INTENTOS - 1
        });
        if (!duenos.length && enviado?.key?.id) registrarPendiente(enviado.key.id, from, personaje, sender);
        exito = true;
        if (sorteoTicket(sender, categoria)) await reply({ text: tarjetaTicket(sender, cat), mentions: [sender] });
        return;
      } catch (e) {
        if (!(e instanceof ErrorDeImagen)) throw e;
        console.log(`[gacha] No se pudo preparar la imagen de "${personaje.nombre}" (${categoria}): ${e.message}`);
      }
    }
    await reply({ text: "❌ No se pudo preparar la imagen. Inténtalo de nuevo en un momento." });
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
        return reply({ text: `❌ Ese personaje es ${otra.indef} y se reclama con *${otra.claimCmd}*.` });
      }
      if (r.estado === "nada") {
        return reply({ text: `❌ No hay ${cat.indef} disponible para reclamar. Puede que el tiempo haya vencido o que ya lo hayan reclamado. Genera uno nuevo con *${cat.rollCmd}*.` });
      }
      if (r.estado === "bloqueado") {
        const dueno = r.pendiente.dueno;
        return reply({
          text: `🔒 Este personaje pertenece a la tirada de ${arroba(dueno)}. Quedará libre para todos en *${Math.ceil(r.restanteMs / 1000)}s*.`,
          mentions: [dueno]
        });
      }

      const { pendiente } = r;
      const p = pendiente.personaje;
      const resultado = reclamar(sender, p);
      if (resultado === "ocupado") {
        cerrarPendiente(r.id);
        return reply({ text: "💨 Otra persona lo reclamó primero." });
      }
      if (resultado === "repetido") {
        cerrarPendiente(r.id);
        return reply({ text: `📦 Ya tienes a *${p.nombre}* en tu colección.` });
      }

      cerrarPendiente(r.id);
      const mentions = [sender];
      const lineas = [`*${arroba(sender)}* reclamó a *${p.nombre}*.`];
      if (pendiente.dueno !== sender) {
        lineas.push(`La tirada original era de *${arroba(pendiente.dueno)}*.`);
        mentions.push(pendiente.dueno);
      }
      const bloques = [bloqueCabecera(categoria, cat.reclamado, lineas), ...bloquesDePersonaje(p, 1)];
      await reply({ text: bloques.join("\n\n"), mentions });
    }
  };
}

export async function mostrarColeccion({ categoria, sender, cleanText, reply }) {
  const cat = CAT[categoria];
  const pagina = Math.max(1, parseInt(cleanText.split(/\s+/)[1], 10) || 1);
  const POR_PAGINA = 15;
  const { n, total } = contarColeccion(sender, categoria);
  const tickets = ticketsDe(sender, categoria);

  if (!n) {
    return reply({
      text: [
        encabezado(cat.emoji, cat.tituloColeccion),
        "",
        `> Todavía no tienes ${cat.unidades} en tu cuenta. Genera uno con *${cat.rollCmd}* y reclámalo con *${cat.claimCmd}*.`
      ].join("\n")
    });
  }

  const paginas = Math.ceil(n / POR_PAGINA);
  const p = Math.min(pagina, paginas);
  const conNivel = TIENE_NIVELES(categoria);
  const filas = coleccionDe(sender, categoria, POR_PAGINA, (p - 1) * POR_PAGINA).flatMap((c) => {
    const detalle = [conNivel ? `Nivel ${c.nivel}` : null, c.rareza, `ID :: #${c.id}`];
    if (categoria === "waifu" && c.serie) detalle.push(c.serie);
    return [`✦ *${c.nombre}*`, `> · ${detalle.filter(Boolean).join(" · ")}`];
  });

  const partes = [
    encabezado(cat.emoji, cat.tituloColeccion),
    "",
    `> ${cat.descripcionColeccion}`,
    "",
    `⧼${cat.emojiTotal}⧽ *${cat.etiquetaTotal}* ››`,
    `> ${fmt(n)} ${cat.unidades} en tu cuenta.`,
    `⧼${cat.emojiValor}⧽ *Valor total* ››`,
    `> ${monto(total)} en total.`,
    `⧼🎟️⧽ *${cat.etiquetaTickets}* ››`,
    `> ${tickets} ${tickets === 1 ? "ticket" : "tickets"} en tu cuenta.`,
    "",
    `〔${cat.emojiLista}〕 *${cat.tituloLista}*`,
    "",
    ...filas,
    "",
    paginas > p
      ? `> Página ${p}/${paginas}. Usa *${cat.coleccionCmd} ${p + 1}* para ver la siguiente página.`
      : `> Página ${p}/${paginas}.`,
    `> ${cat.subirNivel}`,
    `> Para obtener uno por su ID usa *${cat.ticketCmd} <ID>*.`
  ];

  return reply({ text: partes.join("\n") });
}
