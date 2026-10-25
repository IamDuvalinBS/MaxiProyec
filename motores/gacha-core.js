import axios from "axios";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { Transform } from "stream";
import { pipeline } from "stream/promises";
import {
  initGachaDB, reclamar, coleccionDe, contarColeccion, personajePorId, propietarios, contarPersonajes
} from "./gacha-db.js";
import { tarjeta, fmt } from "../src/economia/formato.js";
import { moneda, esHalloween } from "../src/economia/temas.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { htmlColeccionGeneral } from "./coleccion-html.js";
import { TEMAS_COLECCION } from "./gacha-temas-coleccion.js";
import { tipoEs } from "./gacha-pokemon.js";
import { encabezado } from "../src/economia/estilo.js";
import { formatTime } from "./ui.js";
import { renderSnake } from "./gacha-snake.js";
import { TIENE_NIVELES, estrellasTexto, darFragmentos, FRAGMENTOS_POR_RAREZA, NIVEL_INICIAL, statsEfectivas, nivelMaxDe } from "./gacha-niveles.js";
import { registrarActividad } from "./gacha-misiones.js";
import { sumarEstadistica } from "./gacha-insignias.js";
import { elegirConGarantia, registrarTirada, pityDespuesDe } from "./gacha-banner.js";
import { PITY_TIRADAS, PITY_RANGO_MINIMO } from "./gacha-config.js";
import { RAREZA_NOMBRES } from "./gacha-niveles.js";
import { CAT } from "./gacha-categorias.js";
import { ticketsDe, sorteoTicket } from "./gacha-tickets.js";
import {
  bloqueCabecera, bloquesDePersonaje, repartirBloques, lineasPersonaje, textoStats, fuenteDe
} from "./gacha-estilo.js";

export const bloquesDePersonajeParaTicket = (personaje, nivel = NIVEL_INICIAL) => bloquesDePersonaje(personaje, nivel);
import { mensajeReclamo, enviarReclamo } from "./gacha-claim.js";
import { rutaImagenCacheada, guardarImagenCacheada, hayRelay } from "./cache-medios.js";
import { T } from "./gacha-tema.js";
import { revisarMigracion } from "./gacha-migracion.js";

export { tarjeta, fmt, personajePorId, CAT, lineasPersonaje, textoStats };

// El dinero se ve como calabazas en Halloween (el valor guardado es el mismo).
export const monto = (n) => `${fmt(n)} ${moneda()}`;
export const arroba = (jid) => `@${jid.split("@")[0]}`;

export const gachaListo = initGachaDB().catch((e) => {
  console.log("❌ Gacha: no se pudo cargar desde MongoDB: " + e.message);
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

export const textoCooldown = (ms) => T(`⏳ Debes esperar *${formatTime(ms)}* para volver a usar este comando.`, `⏳ Los espíritus aún descansan. Espera *${formatTime(ms)}* para volver a invocar.`);

setInterval(() => {
  const ahora = Date.now();
  for (const [k, v] of cooldowns) if (v < ahora) cooldowns.delete(k);
}, 10 * 60 * 1000).unref();

export const EXCLUSIVO_MS = 45_000;
export const VIGENCIA_MS = 90_000;

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
  const { principal, resto } = repartirBloques([cabecera, ...bloquesDePersonaje(personaje, personaje.nivelInicial ?? NIVEL_INICIAL)]);
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
    const aviso = T("> 🖼️ La imagen no está disponible en este momento. El personaje se puede reclamar con normalidad.", "> 🖼️ La imagen se perdió entre la niebla. El personaje se puede reclamar con normalidad.");
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
    encabezado("🎟️", T("TICKET OBTENIDO", "TICKET MALDITO OBTENIDO")),
    "",
    T(`> ${arroba(sender)} tuviste suerte y obtuviste *1 ticket* de ${cat.plural}.`, `> ${arroba(sender)}, un espíritu generoso te dejó *1 ticket* de ${cat.plural}.`),
    T(`> Úsalo con *${cat.ticketCmd} <ID>* para conseguir el personaje que elijas.`, `> Úsalo con *${cat.ticketCmd} <ID>* para invocar al personaje que elijas.`)
  ].join("\n");
}

const PRECARGA_ACTIVA = process.env.GACHA_PRECARGA !== "0";
const precargas = new Map();

function tomarPrecarga(clave, categoria) {
  const guardado = precargas.get(clave);
  precargas.delete(clave);
  if (!guardado) return null;
  const vigente = personajePorId(guardado.id);
  if (!vigente) return null;
  if (propietarios(vigente.id).length) return null;
  return vigente;
}

function programarPrecarga({ clave, categoria, obtener }) {
  if (!PRECARGA_ACTIVA) return;
  setTimeout(async () => {
    try {
      const personaje = await obtener();
      if (!personaje) return;
      precargas.set(clave, personaje);
      const urls = [personaje.img, ...(personaje.meta?.alt || [])].filter(Boolean);
      if (!urls.length || urls[0].startsWith("snake:") || hayRelay(`gacha:${personaje.categoria}:${personaje.img}`)) return;
      const img = await prepararImagen(urls);
      img.limpiar();
    } catch (e) {
      console.log(`[gacha] Precarga omitida (${categoria}): ${e.message}`);
    }
  }, 3000).unref();
}

export async function hacerRoll({ categoria, obtener, reply, sender, from, cooldownMs, titulo, textoVacio }) {
  await revisarMigracion({ sender, from, reply }).catch((e) => console.log("[gacha] migración: " + e.message));
  const cat = CAT[categoria];
  const clave = `roll:${categoria}:${sender}`;
  const espera = tomarCooldown(clave, cooldownMs);
  if (espera > 0) return reply({ text: textoCooldown(espera) });

  let exito = false;
  try {
    const INTENTOS = 2;
    for (let intento = 0; intento < INTENTOS; intento++) {
      const previo = intento === 0 ? tomarPrecarga(clave, categoria) : null;
      const { personaje: base, via } = await elegirConGarantia({ categoria, sender, obtener, previo });
      if (!base) return reply({ text: textoVacio });
      const personaje = { ...base, nivelInicial: NIVEL_INICIAL };

      const duenos = propietarios(personaje.id);
      const mentions = [sender];
      const extra = [];
      if (duenos.length) {
        extra.push(T(`Ya lo reclamó *${arroba(duenos[0])}*.`, `Ya lo capturó *${arroba(duenos[0])}*.`));
        mentions.push(duenos[0]);
      } else {
        extra.push(T(`Disponible para *${arroba(sender)}*. Solo tú puedes reclamarlo con *${cat.claimCmd}* en *${EXCLUSIVO_MS / 1000}s*.`, `Salió de la niebla para *${arroba(sender)}*. Solo tú puedes reclamarlo con *${cat.claimCmd}* en *${EXCLUSIVO_MS / 1000}s*.`));
      }

      if (via === "banner") extra.unshift(T("⭐ *Destacado de la semana.*", "🎃 *Destacado de la semana, bendecido por la luna.*"));
      if (via === "pity") extra.unshift(T(`🍀 *Garantía activada:* rareza ${RAREZA_NOMBRES[PITY_RANGO_MINIMO]} o superior.`, `🍀 *Garantía activada:* los espíritus aseguran rareza ${RAREZA_NOMBRES[PITY_RANGO_MINIMO]} o superior.`));
      extra.push(T(`Garantía ›› *${pityDespuesDe(sender, categoria, personaje)}/${PITY_TIRADAS}*`, `Garantía de la noche ›› *${pityDespuesDe(sender, categoria, personaje)}/${PITY_TIRADAS}*`));

      try {
        const enviado = await enviarPersonaje({
          reply, personaje, titulo, lineasExtra: extra, mentions,
          permitirSinImagen: intento === INTENTOS - 1
        });
        if (!duenos.length && enviado?.key?.id) registrarPendiente(enviado.key.id, from, personaje, sender);
        exito = true;
        registrarTirada(sender, categoria, personaje);
        if (sorteoTicket(sender, categoria)) {
          sumarEstadistica(sender, "tickets_suerte", 1);
          await reply({ text: tarjetaTicket(sender, cat), mentions: [sender] });
        }
        await registrarActividad({ reply, sender, eventos: [{ tipo: "tirada", categoria }] });
        programarPrecarga({ clave, categoria, obtener });
        return;
      } catch (e) {
        if (!(e instanceof ErrorDeImagen)) throw e;
        console.log(`[gacha] No se pudo preparar la imagen de "${personaje.nombre}" (${categoria}): ${e.message}`);
      }
    }
    await reply({ text: T("❌ No se pudo preparar la imagen. Inténtalo de nuevo en un momento.", "❌ La niebla cubrió la imagen. Inténtalo de nuevo en un momento.") });
  } finally {
    if (!exito) soltarCooldown(clave);
  }
}

export function crearComandoClaim({ categoria, names, desc }) {
  const cat = CAT[categoria];
  return {
    names, desc, category: "Gacha",
    handler: async ({ sock, from, sender, msg, reply }) => {
      await gachaListo;
      const r = buscarPendiente({ from, categoria, idCitado: idMensajeCitado(msg), sender });

      if (r.estado === "otra_categoria") {
        const otra = CAT[r.categoriaReal];
        return reply({ text: `❌ Ese personaje es ${otra.indef} y se reclama con *${otra.claimCmd}*.` });
      }
      if (r.estado === "nada") {
        return reply({ text: T(`❌ No hay ${cat.indef} disponible para reclamar. Puede que el tiempo haya vencido o que ya lo hayan reclamado. Genera uno nuevo con *${cat.rollCmd}*.`, `❌ No hay ${cat.indef} disponible. Se desvaneció con la niebla o alguien lo reclamó primero. Genera uno nuevo con *${cat.rollCmd}*.`) });
      }
      if (r.estado === "bloqueado") {
        const dueno = r.pendiente.dueno;
        return reply({
          text: T(`🔒 Este personaje pertenece a la tirada de ${arroba(dueno)}. Quedará libre para todos en *${Math.ceil(r.restanteMs / 1000)}s*.`, `🔒 Este personaje pertenece a la tirada de ${arroba(dueno)}. La oscuridad lo liberará para todos en *${Math.ceil(r.restanteMs / 1000)}s*.`),
          mentions: [dueno]
        });
      }

      const { pendiente } = r;
      const p = pendiente.personaje;
      const resultado = reclamar(sender, p, p.nivelInicial ?? NIVEL_INICIAL);
      if (resultado === "ocupado") {
        cerrarPendiente(r.id);
        return reply({ text: T("💨 Otra persona lo reclamó primero.", "💨 Otra alma se lo llevó primero.") });
      }
      if (resultado === "repetido") {
        cerrarPendiente(r.id);
        const fragmentos = FRAGMENTOS_POR_RAREZA[p.rareza] || 1;
        darFragmentos(sender, fragmentos);
        return reply({
          text: T(`📦 Ya tienes a *${p.nombre}* en tu colección. Se convirtió en *${fragmentos}* ${fragmentos === 1 ? "fragmento" : "fragmentos"} de ascensión. Úsalos con *.ascender*.`, `📦 *${p.nombre}* ya está en tu colección embrujada. Se convirtió en *${fragmentos}* ${fragmentos === 1 ? "fragmento" : "fragmentos"} de ascensión. Úsalos con *.ascender*.`)
        });
      }

      cerrarPendiente(r.id);
      const { texto, mentions } = mensajeReclamo({ categoria, sender, personaje: p });
      await enviarReclamo({ sock, from, msg, texto, mentions, reply });
      await registrarActividad({ reply, sender, eventos: [{ tipo: "reclamar", categoria, rareza: p.rareza }] });
    }
  };
}

const miniaturas = new Map();

async function miniaturaDe(c) {
  const clave = `${c.categoria}:${c.id}`;
  if (miniaturas.has(clave)) return miniaturas.get(clave);
  let uri = "";
  try {
    const img = await prepararImagen([c.img, ...(c.meta?.alt || [])]);
    try {
      const origen = await loadImage(fs.readFileSync(img.ruta));
      const lado = 128;
      const lienzo = createCanvas(lado, lado);
      const ctx = lienzo.getContext("2d");
      const k = Math.min(lado / origen.width, lado / origen.height);
      const w = Math.round(origen.width * k);
      const h = Math.round(origen.height * k);
      ctx.drawImage(origen, Math.round((lado - w) / 2), Math.round((lado - h) / 2), w, h);
      try {
        uri = "data:image/webp;base64," + lienzo.toBuffer("image/webp", 70).toString("base64");
      } catch {
        uri = "data:image/png;base64," + lienzo.toBuffer("image/png").toString("base64");
      }
    } finally {
      img.limpiar();
    }
  } catch (e) {
    console.log(`[gacha] Miniatura omitida (${c.nombre}): ${e.message}`);
  }
  if (uri) {
    if (miniaturas.size > 900) miniaturas.delete(miniaturas.keys().next().value);
    miniaturas.set(clave, uri);
  }
  return uri;
}

const POR_PARTE_HTML = 36;

function claseDe(c, categoria, series) {
  if (categoria === "brawler") return String(c.serie || "").split("·")[1]?.trim() || "Brawler";
  if (categoria === "pokemon") return c.stats?.tipos?.[0] ? tipoEs(c.stats.tipos[0]) : "Pokémon";
  if (categoria === "waifu") return series.get(c.serie || "Desconocida") >= 2 ? (c.serie || "Desconocida") : "Otras";
  if (["cod", "dragon", "clash"].includes(categoria)) return c.meta?.tipo || c.rareza;
  return c.rareza;
}

async function enviarColeccionHtml({ sock, from, msg, categoria, sender, pagina, todos, n }) {
  const cat = CAT[categoria];
  const partes = Math.ceil(n / POR_PARTE_HTML);
  const parte = Math.min(Math.max(1, pagina), partes);
  const trozo = todos.slice((parte - 1) * POR_PARTE_HTML, parte * POR_PARTE_HTML);

  const imagenes = [];
  for (let i = 0; i < trozo.length; i += 6) {
    imagenes.push(...await Promise.all(trozo.slice(i, i + 6).map(miniaturaDe)));
  }

  const conteo = new Map();
  const series = new Map();
  for (const c of todos) {
    conteo.set(c.rareza, (conteo.get(c.rareza) || 0) + 1);
    if (categoria === "waifu") series.set(c.serie || "Desconocida", (series.get(c.serie || "Desconocida") || 0) + 1);
  }
  const conNivel = TIENE_NIVELES(categoria);
  const tema = TEMAS_COLECCION[categoria] || TEMAS_COLECCION.brawler;

  const datos = {
    halloween: esHalloween(),
    cfg: { ...tema, sinNivel: !conNivel },
    nombre: msg?.pushName || arroba(sender),
    n,
    total: Math.max(n, contarPersonajes(categoria)),
    valorTxt: monto(todos.reduce((a, c) => a + c.valor, 0)),
    rarezas: [...conteo].map(([nombre, c]) => ({ n: nombre, c })),
    parte,
    partes,
    porParte: POR_PARTE_HTML,
    firma: "Powered By ItsDuva",
    items: trozo.map((c, i) => {
      const clase = claseDe(c, categoria, series);
      const item = { id: c.id, nombre: c.nombre, clase, claseN: clase, serie: fuenteDe(c), rareza: c.rareza, valorTxt: monto(c.valor), img: imagenes[i] };
      if (conNivel) {
        const st = statsEfectivas(c, c.nivel);
        Object.assign(item, { nivel: c.nivel, max: nivelMaxDe(categoria, c.estrellas), estrellas: c.estrellas || 0, st: { hp: st.hp, atk: st.atk, def: st.def, spe: st.spe } });
      } else {
        Object.assign(item, { nivel: 0, max: 0, estrellas: 0, st: null });
      }
      return item;
    })
  };

  await sock.sendHtml(from, htmlColeccionGeneral(datos), [], msg, {});
}

export async function mostrarColeccion({ sock, from, msg, categoria, sender, cleanText, reply }) {
  await revisarMigracion({ sender, from, reply }).catch((e) => console.log("[gacha] migración: " + e.message));
  const cat = CAT[categoria];
  const pagina = Math.max(1, parseInt(cleanText.split(/\s+/)[1], 10) || 1);
  const POR_PAGINA = 15;
  const { n, total } = contarColeccion(sender, categoria);
  const tickets = ticketsDe(sender, categoria);

  if (n && categoria !== "waifu" && sock && from && typeof sock.sendHtml === "function") {
    try {
      const todos = coleccionDe(sender, categoria, 100000, 0);
      await enviarColeccionHtml({ sock, from, msg, categoria, sender, pagina, todos, n });
      return;
    } catch (e) {
      console.log(`[gacha] La colección en HTML falló (${categoria}), se envía en texto: ${e.stack || e.message}`);
    }
  }

  if (!n) {
    return reply({
      text: [
        encabezado(cat.emoji, cat.tituloColeccion),
        "",
        T(`> Todavía no tienes ${cat.unidades} en tu cuenta. Genera uno con *${cat.rollCmd}* y reclámalo con *${cat.claimCmd}*.`, `> Tu colección está vacía como un cementerio sin visitas. Genera ${cat.indef} con *${cat.rollCmd}* y reclama el resultado con *${cat.claimCmd}*.`)
      ].join("\n")
    });
  }

  const paginas = Math.ceil(n / POR_PAGINA);
  const p = Math.min(pagina, paginas);
  const conNivel = TIENE_NIVELES(categoria);
  const filas = coleccionDe(sender, categoria, POR_PAGINA, (p - 1) * POR_PAGINA).flatMap((c) => {
    const detalle = [conNivel ? `Nivel ${c.nivel}${c.estrellas ? ` ${estrellasTexto(c.estrellas)}` : ""}` : null, c.rareza, `ID :: #${c.id}`];
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
    T(`⧼${cat.emojiValor}⧽ *Valor total* ››`, `⧼${cat.emojiValor}⧽ *Tesoro total* ››`),
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
    `> Arma tu equipo con *.equipo ${cat.clave}* y mira sus poderes con *.poderes ${cat.clave}*.`,
    `> Para obtener uno por su ID usa *${cat.ticketCmd} <ID>*.`
  ];

  return reply({ text: partes.join("\n") });
}
