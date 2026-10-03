import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR_CACHE = path.join(RAIZ, "cache");
const DIR_IMAGENES = path.join(DIR_CACHE, "imagenes");
const ARCHIVO_RELAY = path.join(DIR_CACHE, "relay.json");

export const LIMITE_IMAGENES_BYTES = 400 * 1024 * 1024;
export const VIGENCIA_RELAY_MS = 7 * 24 * 60 * 60 * 1000;

const MAXIMO_ENTRADAS_RELAY = 1500;
const CAMPOS_MEDIO = ["imageMessage", "videoMessage", "audioMessage", "documentMessage"];
const COMANDOS_SIN_CACHE = new Set([".play", ".yt", ".ytsearch", ".buscaryt"]);

try {
  fs.mkdirSync(DIR_IMAGENES, { recursive: true });
} catch (e) {
  console.log(`❌ No se pudo crear la carpeta de caché: ${e.message}`);
}

function huella(texto) {
  return crypto.createHash("sha1").update(String(texto)).digest("hex");
}

function reemplazar(clave, valor) {
  const original = this[clave];
  if (original instanceof Uint8Array) return { __b64: Buffer.from(original).toString("base64") };
  if (original && typeof original === "object" && typeof original.low === "number" && typeof original.high === "number") {
    return (original.low >>> 0) + original.high * 4294967296;
  }
  return valor;
}

function restaurar(clave, valor) {
  if (valor && typeof valor === "object" && typeof valor.__b64 === "string") {
    return Buffer.from(valor.__b64, "base64");
  }
  return valor;
}

export function rutaImagenCacheada(url) {
  const ruta = path.join(DIR_IMAGENES, huella(url));
  if (!fs.existsSync(ruta)) return null;
  try {
    const ahora = new Date();
    fs.utimesSync(ruta, ahora, ahora);
  } catch (e) {
    return null;
  }
  return ruta;
}

function podarImagenes() {
  try {
    const archivos = fs.readdirSync(DIR_IMAGENES).map((nombre) => {
      const ruta = path.join(DIR_IMAGENES, nombre);
      const info = fs.statSync(ruta);
      return { ruta, bytes: info.size, tiempo: info.mtimeMs };
    });
    let total = archivos.reduce((suma, a) => suma + a.bytes, 0);
    if (total <= LIMITE_IMAGENES_BYTES) return;
    archivos.sort((a, b) => a.tiempo - b.tiempo);
    for (const archivo of archivos) {
      if (total <= LIMITE_IMAGENES_BYTES * 0.9) break;
      fs.rmSync(archivo.ruta, { force: true });
      total -= archivo.bytes;
    }
  } catch (e) {
    console.log(`❌ No se pudo depurar la caché de imágenes: ${e.message}`);
  }
}

export function guardarImagenCacheada(url, rutaOrigen) {
  try {
    const destino = path.join(DIR_IMAGENES, huella(url));
    const temporal = `${destino}.parcial`;
    fs.copyFileSync(rutaOrigen, temporal);
    fs.renameSync(temporal, destino);
    podarImagenes();
  } catch (e) {
    console.log(`❌ No se pudo guardar la imagen en caché: ${e.message}`);
  }
}

let almacen = {};
try {
  if (fs.existsSync(ARCHIVO_RELAY)) {
    almacen = JSON.parse(fs.readFileSync(ARCHIVO_RELAY, "utf8"), restaurar);
  }
} catch (e) {
  almacen = {};
}

let temporizador = null;

function programarGuardado() {
  if (temporizador) return;
  temporizador = setTimeout(() => {
    temporizador = null;
    try {
      fs.writeFileSync(ARCHIVO_RELAY, JSON.stringify(almacen, reemplazar));
    } catch (e) {
      console.log(`❌ No se pudo guardar la caché de medios: ${e.message}`);
    }
  }, 2000);
}

function podarRelay() {
  const ahora = Date.now();
  for (const clave of Object.keys(almacen)) {
    if (ahora - almacen[clave].guardadoEn >= VIGENCIA_RELAY_MS) delete almacen[clave];
  }
  const claves = Object.keys(almacen);
  if (claves.length <= MAXIMO_ENTRADAS_RELAY) return;
  claves
    .sort((a, b) => almacen[a].guardadoEn - almacen[b].guardadoEn)
    .slice(0, claves.length - MAXIMO_ENTRADAS_RELAY)
    .forEach((clave) => delete almacen[clave]);
}

export function hayRelay(clave) {
  const entrada = almacen[clave];
  return Boolean(entrada && Date.now() - entrada.guardadoEn < VIGENCIA_RELAY_MS);
}

export function eliminarRelay(clave) {
  delete almacen[clave];
  programarGuardado();
}

export function guardarRelay(clave, medios) {
  if (!medios || !medios.length) return;
  almacen[clave] = { guardadoEn: Date.now(), medios };
  podarRelay();
  programarGuardado();
}

export function extraerMedio(enviado) {
  const mensaje = enviado?.message?.ephemeralMessage?.message || enviado?.message;
  if (!mensaje) return null;
  for (const campo of CAMPOS_MEDIO) {
    const medio = mensaje[campo];
    if (!medio) continue;
    const { contextInfo, ...contenido } = medio;
    if (!contenido.mediaKey || !(contenido.directPath || contenido.url)) return null;
    return { campo, contenido };
  }
  return null;
}

export function registrarMedio(lista, enviado) {
  const medio = extraerMedio(enviado);
  if (medio) lista.push(medio);
}

export function guardarMedioEnviado(clave, enviado) {
  const medio = extraerMedio(enviado);
  if (medio) guardarRelay(clave, [medio]);
}

function generarIdMensaje() {
  return `3EB0${crypto.randomBytes(9).toString("hex").toUpperCase()}`;
}

function construirContexto(citado, menciones) {
  const contexto = {};
  if (citado?.key?.id && citado.message) {
    contexto.stanzaId = citado.key.id;
    contexto.participant = citado.key.participant || citado.key.remoteJid;
    contexto.quotedMessage = citado.message;
  }
  if (menciones && menciones.length) contexto.mentionedJid = menciones;
  return Object.keys(contexto).length ? contexto : undefined;
}

export async function reenviarCacheado(sock, from, clave, citado, extra = {}) {
  if (!hayRelay(clave)) return null;
  try {
    let ultimo = null;
    for (const medio of almacen[clave].medios) {
      const contenido = { ...medio.contenido };
      if (extra.caption !== undefined && medio.campo !== "audioMessage") contenido.caption = extra.caption;
      const contexto = construirContexto(citado, extra.mentions);
      if (contexto) contenido.contextInfo = contexto;
      const id = generarIdMensaje();
      await sock.relayMessage(from, { [medio.campo]: contenido }, { messageId: id });
      ultimo = { key: { remoteJid: from, fromMe: true, id }, message: { [medio.campo]: contenido } };
    }
    return ultimo;
  } catch (e) {
    console.log(`❌ No se pudo reenviar el medio almacenado: ${e.message}`);
    eliminarRelay(clave);
    return null;
  }
}

export async function enviarConCache(sock, from, contenido, citado) {
  const { cacheKey, ...resto } = contenido;
  if (!cacheKey) return sock.sendMessage(from, contenido, { quoted: citado });

  const reenviado = await reenviarCacheado(sock, from, cacheKey, citado, {
    caption: resto.caption,
    mentions: resto.mentions
  });
  if (reenviado) return reenviado;

  if (!resto.image && !resto.video && !resto.audio) {
    throw new Error("El medio almacenado ya no está disponible.");
  }
  const enviado = await sock.sendMessage(from, resto, { quoted: citado });
  guardarMedioEnviado(cacheKey, enviado);
  return enviado;
}

export function claveDeDescarga(categoria, comando, texto) {
  if (categoria !== "Descargas" || COMANDOS_SIN_CACHE.has(comando)) return null;
  if (!/https?:\/\//i.test(texto)) return null;
  const resto = texto.trim().split(/\s+/).slice(1).join(" ");
  return `dl:${comando} ${resto}`;
}
