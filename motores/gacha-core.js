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
const TIEMPO_RESPUESTA_MS = Number(process.env.GACHA_T_RESPUESTA_MS) || 12000;
const TIEMPO_INACTIVIDAD_MS = Number(process.env.GACHA_T_INACTIVIDAD_MS) || 15000;
const PRESUPUESTO_IMAGEN_MS = Number(process.env.GACHA_T_PRESUPUESTO_MS) || 75000;
const REANUDACIONES_MAX = 4;
const VIGENCIA_PREFERENCIA_MS = 30 * 60 * 1000;
const PROXIES = (process.env.GACHA_PROXIES ?? "https://wsrv.nl/?url=,https://images.weserv.nl/?url=")
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);

fs.mkdirSync(TMP_DIR, { recursive: true });
for (const f of fs.readdirSync(TMP_DIR)) fs.rm(path.join(TMP_DIR, f), { force: true }, () => {});

let activas = 0;
const cola = [];
const preferencia = { indice: 0, hasta: 0 };

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

export function fuentesDeDescarga(url) {
  const fuentes = [{ indice: 0, url, nombre: "directa" }];
  PROXIES.forEach((base, i) => {
    fuentes.push({ indice: i + 1, url: `${base}${encodeURIComponent(url)}&q=100`, nombre: base.replace(/^https?:\/\//, "").split("/")[0] });
  });
  if (preferencia.indice > 0 && Date.now() < preferencia.hasta) {
    const preferida = fuentes.find((f) => f.indice === preferencia.indice);
    if (preferida) return [preferida, ...fuentes.filter((f) => f !== preferida)];
  }
  return fuentes;
}

function recordarFuente(indice) {
  if (indice === 0) {
    preferencia.indice = 0;
    return;
  }
  preferencia.indice = indice;
  preferencia.hasta = Date.now() + VIGENCIA_PREFERENCIA_MS;
}

function cabeceras(fuente, desde) {
  const h = { "User-Agent": UA, "Accept-Encoding": "identity" };
  if (/yande\.re/i.test(fuente) && !/[?&]url=/.test(fuente)) h.Referer = "https://yande.re/";
  if (desde > 0) h.Range = `bytes=${desde}-`;
  return h;
}

async function pedir(fuente, desde) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_RESPUESTA_MS);
  try {
    return await axios.get(fuente, {
      responseType: "stream",
      family: 4,
      timeout: 0,
      signal: controlador.signal,
      maxRedirects: 3,
      headers: cabeceras(fuente, desde),
      validateStatus: (estado) => estado === 200 || estado === 206
    });
  } catch (e) {
    if (axios.isCancel(e)) throw new Error("el servidor no respondió a tiempo");
    throw e;
  } finally {
    clearTimeout(temporizador);
  }
}

function tamanoTotal(res, desde) {
  const rango = String(res.headers?.["content-range"] || "").match(/\/(\d+)$/);
  if (rango) return Number(rango[1]);
  const largo = Number(res.headers?.["content-length"] || 0);
  return largo ? largo + (res.status === 206 ? desde : 0) : 0;
}

async function volcar(res, ruta, anexar) {
  let inactividad = null;
  const vigilar = () => {
    clearTimeout(inactividad);
    inactividad = setTimeout(() => res.data.destroy(new Error("la descarga se quedó sin datos")), TIEMPO_INACTIVIDAD_MS);
  };
  const medidor = new Transform({
    transform(chunk, _codificacion, cb) {
      vigilar();
      cb(null, chunk);
    }
  });
  try {
    vigilar();
    await pipeline(res.data, medidor, fs.createWriteStream(ruta, { flags: anexar ? "a" : "w" }));
  } finally {
    clearTimeout(inactividad);
  }
}

async function descargarConReanudacion(fuente, limite) {
  const ruta = rutaTemporal();
  let recibidos = 0;
  try {
    for (let pasada = 0; pasada <= REANUDACIONES_MAX; pasada++) {
      if (Date.now() > limite) throw new Error("se agotó el tiempo disponible para la imagen");
      const res = await pedir(fuente, recibidos);
      if (recibidos > 0 && res.status === 200) {
        fs.truncateSync(ruta, 0);
        recibidos = 0;
      }
      const total = tamanoTotal(res, recibidos);
      if (total > LIMITE_BYTES) {
        res.data.destroy();
        throw new Error("imagen demasiado pesada");
      }
      try {
        await volcar(res, ruta, recibidos > 0);
      } catch (e) {
        recibidos = fs.existsSync(ruta) ? fs.statSync(ruta).size : 0;
        if (recibidos > 0) continue;
        throw e;
      }
      recibidos = fs.statSync(ruta).size;
      if (recibidos > LIMITE_BYTES) throw new Error("imagen demasiado pesada");
      if (total && recibidos < total) continue;
      if (!recibidos) throw new Error("respuesta vacía");
      return ruta;
    }
    throw new Error("la descarga no se pudo completar");
  } catch (e) {
    borrar(ruta);
    throw e;
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
    const limite = Date.now() + PRESUPUESTO_IMAGEN_MS;
    for (const url of urls.filter(Boolean)) {
      if (Date.now() > limite) break;
      if (url.startsWith("snake:")) {
        try {
          const rutaSnake = await dibujarSnake(url.slice(6));
          return { ruta: rutaSnake, limpiar: () => borrar(rutaSnake) };
        } catch (e) {
          ultimoError = e;
          continue;
        }
      }
      const enCache = rutaImagenCacheada(url);
      if (enCache) return { ruta: enCache, limpiar: () => {} };

      for (const fuente of fuentesDeDescarga(url)) {
        if (Date.now() > limite) break;
        try {
          const ruta = await descargarConReanudacion(fuente.url, limite);
          recordarFuente(fuente.indice);
          guardarImagenCacheada(url, ruta);
          return { ruta, limpiar: () => borrar(ruta) };
        } catch (e) {
          ultimoError = e;
          console.log(`[gacha] Falló la descarga (${fuente.nombre}): ${e.message}`);
        }
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

export function restanteCooldown(clave) {
  return Math.max(0, (cooldowns.get(clave) || 0) - Date.now());
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
    `> ${fmt(n)} ${n === 1 ? cat.unidad : cat.unidades} en tu cuenta.`,
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
