import axios from "axios";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";
import http from "http";
import https from "https";
import zlib from "zlib";
import { pipeline } from "stream/promises";

const execFileAsync = promisify(execFile);
// Sin "-loglevel error" ffmpeg llena el búfer con su progreso y Node lo mata ("maxBuffer exceeded") en videos largos.
const OPCIONES_FFMPEG = { timeout: 45 * 60 * 1000, killSignal: "SIGKILL", maxBuffer: 10 * 1024 * 1024 };
const FFMPEG_BASE = ["-hide_banner", "-loglevel", "error", "-nostdin"];

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
};

// ───────────────────────── Límites de WhatsApp ─────────────────────────
// Video "normal" (se ve en el chat): hasta ~100 MB pasa sin problema. Por encima, WhatsApp lo rechaza o lo trata como archivo raro.
// Documento: WhatsApp admite hasta 2 GB; se deja un margen. Todo se puede cambiar con variables de entorno.
export const LIMITE_VIDEO_WHATSAPP_MB = Number(process.env.LIMITE_VIDEO_MB) || 100;
export const LIMITE_DOCUMENTO_MB = Number(process.env.LIMITE_DOCUMENTO_MB) || 1900;

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const INACTIVIDAD_MS = 45000; // si el servidor deja de enviar datos tanto tiempo, se corta y se reintenta

// Conexiones reutilizadas: menos errores de "socket hang up" y de tiempo agotado al pedir muchas cosas seguidas.
export const AGENTES = {
  httpAgent: new http.Agent({ keepAlive: true, maxSockets: 16 }),
  httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 16 })
};
export { HEADERS };

// ───────────────────────── Reintentos ─────────────────────────
const CODIGOS_TRANSITORIOS = new Set([
  "ECONNRESET", "ETIMEDOUT", "ECONNABORTED", "ESOCKETTIMEDOUT", "EAI_AGAIN", "EPIPE", "ENETUNREACH",
  "ECONNREFUSED", "UND_ERR_SOCKET", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT", "UND_ERR_BODY_TIMEOUT", "ERR_STREAM_PREMATURE_CLOSE"
]);
const ESTADOS_TRANSITORIOS = new Set([408, 409, 425, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524]);

export function estadoHttp(e) {
  const directo = e?.response?.status || e?.status || e?.statusCode || e?.output?.statusCode; // output: errores Boom de Baileys (408 = Timed Out)
  if (directo) return Number(directo);
  const m = String(e?.message || "").match(/(?:status code|HTTP)\s*(\d{3})/i);
  return m ? Number(m[1]) : null;
}

export function esErrorTransitorio(e) {
  const estado = estadoHttp(e);
  if (estado) return ESTADOS_TRANSITORIOS.has(estado);
  if (e?.code && CODIGOS_TRANSITORIOS.has(e.code)) return true;
  return /timeout|timed out|socket hang up|aborted|network|fetch failed|premature|no respond|sin datos|incompleta|closed|reset/i.test(String(e?.message || ""));
}

const resumenError = (e) => {
  const estado = estadoHttp(e);
  return estado ? `HTTP ${estado}` : String(e?.code || e?.message || e).split("\n")[0];
};

// Mensaje claro para el usuario (en vez de "Request failed with status code 408").
export function errorAmigable(e) {
  const estado = estadoHttp(e);
  if (estado === 408 || /timeout|timed out|sin datos|no respond/i.test(String(e?.message))) {
    return new Error("El servidor tardó demasiado en responder (408). Intenta de nuevo en unos segundos.");
  }
  if (estado === 429) return new Error("El servicio recibió demasiadas peticiones (429). Espera un momento e inténtalo otra vez.");
  if (estado && estado >= 500) return new Error(`El servidor de descarga está fallando (HTTP ${estado}). Intenta más tarde.`);
  if (estado === 403 || estado === 401) return new Error(`El servidor rechazó la descarga (HTTP ${estado}).`);
  if (estado === 404 || estado === 410) return new Error("El archivo ya no está disponible en el servidor.");
  return e instanceof Error ? e : new Error(String(e));
}

// Ejecuta fn y, si falla por algo pasajero (408, 429, 5xx, cortes de red), espera un poco y la repite.
export async function reintentar(fn, { intentos = 3, espera = 1500, etiqueta = "petición" } = {}) {
  let ultimo;
  for (let i = 1; i <= intentos; i++) {
    try {
      return await fn(i);
    } catch (e) {
      ultimo = e;
      if (i === intentos || !esErrorTransitorio(e)) break;
      const ms = espera * i + Math.floor(Math.random() * 500);
      console.log(`[descargas-core] ${etiqueta} falló (${resumenError(e)}); reintento ${i}/${intentos - 1} en ${(ms / 1000).toFixed(1)}s`);
      await pausa(ms);
    }
  }
  throw ultimo;
}

const borrarSilencioso = (ruta) => { try { if (ruta && fs.existsSync(ruta)) fs.unlinkSync(ruta); } catch (e) {} };

const PERFILES_H264_OK = new Set(["Baseline", "Constrained Baseline", "Main", "High"]);

async function analizarPistas(rutaArchivo) {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "error",
      "-print_format", "json",
      "-show_streams",
      rutaArchivo
    ], { timeout: 60000, maxBuffer: 10 * 1024 * 1024 });
    const data = JSON.parse(stdout);
    const video = data.streams?.find((s) => s.codec_type === "video") || null;
    const audio = data.streams?.find((s) => s.codec_type === "audio") || null;
    return { video, audio };
  } catch (e) {
    console.log(`[descargas-core] No pude analizar el archivo con ffprobe: ${e.message}`);
    return { video: null, audio: null };
  }
}

export async function descargarBuffer(url, { headers = {} } = {}) {
  try {
    return await reintentar(async () => {
      const { data } = await axios.get(url, {
        ...AGENTES,
        responseType: "arraybuffer",
        headers: { ...HEADERS, ...headers },
        timeout: INACTIVIDAD_MS,
        maxContentLength: 300 * 1024 * 1024,
        maxBodyLength: 300 * 1024 * 1024
      });
      return Buffer.from(data);
    }, { intentos: 3, etiqueta: "descarga" });
  } catch (e) {
    throw errorAmigable(e);
  }
}

async function descargarUnaVez(url, ext, headers) {
  const ruta = path.join(os.tmpdir(), `dl_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
  const control = new AbortController();
  let inactividad;
  const armar = () => { clearTimeout(inactividad); inactividad = setTimeout(() => control.abort(), INACTIVIDAD_MS); };
  armar();
  try {
    const res = await axios.get(url, {
      ...AGENTES,
      responseType: "stream",
      headers: { ...HEADERS, ...headers },
      signal: control.signal,
      timeout: 60000,
      maxRedirects: 5,
      validateStatus: (estado) => estado >= 200 && estado < 300
    });
    res.data.on("data", armar);
    await pipeline(res.data, fs.createWriteStream(ruta), { signal: control.signal });

    const peso = fs.statSync(ruta).size;
    if (peso < 512) throw Object.assign(new Error("el archivo descargado está vacío"), { code: "ECONNRESET" });
    const esperado = Number(res.headers["content-length"] || 0);
    if (esperado && !res.headers["content-encoding"] && peso < esperado) {
      throw Object.assign(new Error(`descarga incompleta (${peso} de ${esperado} bytes)`), { code: "ECONNRESET" });
    }
    return ruta;
  } catch (e) {
    borrarSilencioso(ruta);
    if (control.signal.aborted) throw Object.assign(new Error("el servidor dejó de enviar datos (timeout)"), { code: "ETIMEDOUT" });
    throw e;
  } finally {
    clearTimeout(inactividad);
  }
}

// Baja a disco (nunca a memoria). `entrada` puede ser una URL o una lista de URLs alternativas: se prueba una tras otra,
// y cada una se reintenta si el servidor responde 408/429/5xx o corta la conexión.
export async function descargarATemporal(entrada, ext, { headers = {} } = {}) {
  const urls = [...new Set((Array.isArray(entrada) ? entrada : [entrada]).filter(Boolean))];
  if (!urls.length) throw new Error("No hay enlace para descargar.");
  let ultimo;
  for (const url of urls) {
    try {
      return await reintentar(() => descargarUnaVez(url, ext, headers), { intentos: urls.length > 1 ? 2 : 3, etiqueta: "descarga a disco" });
    } catch (e) {
      ultimo = e;
      console.log(`[descargas-core] No se pudo bajar ${String(url).slice(0, 80)}… (${resumenError(e)})${urls.length > 1 ? "; se prueba la siguiente variante" : ""}`);
    }
  }
  throw errorAmigable(ultimo);
}

// ───────────────────────── .zip sin dependencias ─────────────────────────
// Para videos que pasan del límite de video de WhatsApp: se mandan como documento .zip (formato "store", sin recomprimir,
// así es rápido y el video queda idéntico). Streaming: no carga el archivo en RAM.
const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32Trozo(crc, buf) {
  if (typeof zlib.crc32 === "function") return zlib.crc32(buf, crc);
  let c = (crc ^ 0xffffffff) >>> 0;
  for (let i = 0; i < buf.length; i++) c = TABLA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function crc32DeArchivo(ruta) {
  let crc = 0;
  for await (const trozo of fs.createReadStream(ruta, { highWaterMark: 1024 * 1024 })) crc = crc32Trozo(crc, trozo);
  return crc >>> 0;
}

function fechaDos(fecha) {
  const f = new Date(fecha);
  const hora = (f.getHours() << 11) | (f.getMinutes() << 5) | (f.getSeconds() >> 1);
  const dia = (Math.max(0, f.getFullYear() - 1980) << 9) | ((f.getMonth() + 1) << 5) | f.getDate();
  return { hora, dia };
}

export function nombreSeguro(texto, respaldo = "archivo") {
  const limpio = String(texto || "").replace(/[\\/:*?"<>|\n\r\t]/g, " ").replace(/\s+/g, " ").trim().replace(/^[.\-\s]+/, "").slice(0, 100);
  return limpio || respaldo;
}

// Crea `rutaZip` con un solo archivo adentro (`nombreInterno`). No borra el original.
export async function crearZip(rutaOrigen, nombreInterno, rutaZip) {
  const peso = fs.statSync(rutaOrigen).size;
  if (peso >= 0xffffffff) throw new Error("El archivo es demasiado grande para empaquetarlo en .zip.");
  const crc = await crc32DeArchivo(rutaOrigen);
  const { hora, dia } = fechaDos(Date.now());
  const nombre = Buffer.from(nombreInterno, "utf8");

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6); // nombre en UTF-8
  local.writeUInt16LE(0, 8);      // sin compresión
  local.writeUInt16LE(hora, 10);
  local.writeUInt16LE(dia, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(peso, 18);
  local.writeUInt32LE(peso, 22);
  local.writeUInt16LE(nombre.length, 26);
  local.writeUInt16LE(0, 28);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(0, 10);
  central.writeUInt16LE(hora, 12);
  central.writeUInt16LE(dia, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(peso, 20);
  central.writeUInt32LE(peso, 24);
  central.writeUInt16LE(nombre.length, 28);
  central.writeUInt32LE(0, 42); // posición del encabezado local

  const inicioCentral = local.length + nombre.length + peso;
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(1, 8);
  fin.writeUInt16LE(1, 10);
  fin.writeUInt32LE(central.length + nombre.length, 12);
  fin.writeUInt32LE(inicioCentral, 16);

  try {
    const salida = fs.createWriteStream(rutaZip);
    const escribir = (b) => new Promise((ok, fallo) => salida.write(b, (err) => (err ? fallo(err) : ok())));
    await escribir(local);
    await escribir(nombre);
    await pipeline(fs.createReadStream(rutaOrigen, { highWaterMark: 1024 * 1024 }), salida, { end: false });
    await escribir(central);
    await escribir(nombre);
    await new Promise((ok, fallo) => salida.end(fin, (err) => (err ? fallo(err) : ok())));
    return rutaZip;
  } catch (e) {
    borrarSilencioso(rutaZip);
    throw e;
  }
}

// Atajo: zip temporal de un video. Devuelve { ruta, nombre } (quien lo reciba borra `ruta`).
export async function empaquetarEnZip(rutaVideo, titulo = "video") {
  const base = nombreSeguro(titulo, "video").replace(/\.(mp4|mkv|webm|mov|m4v)$/i, "");
  const rutaZip = path.join(os.tmpdir(), `zip_${Date.now()}_${Math.random().toString(36).slice(2)}.zip`);
  await crearZip(rutaVideo, `${base}.mp4`, rutaZip);
  return { ruta: rutaZip, nombre: `${base}.zip` };
}

function comoRutaTemporal(entrada, ext) {
  if (typeof entrada === "string") return entrada;
  const ruta = path.join(os.tmpdir(), `dl_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
  fs.writeFileSync(ruta, entrada);
  return ruta;
}

const CODEC_VIDEO_RAPIDO = [
  "-c:v", "libx264",
  "-preset", "superfast",
  "-crf", "24",
  "-profile:v", "main",
  "-level", "4.0",
  "-pix_fmt", "yuv420p",
  "-threads", "0"
];
const CODEC_AUDIO_AAC = ["-c:a", "aac", "-b:a", "192k"];

export async function asegurarVideoCompatibleWhatsApp(entradaOriginal) {
  const tmp = os.tmpdir();
  const sufijo = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const entrada = comoRutaTemporal(entradaOriginal, "mp4");
  const salida = path.join(tmp, `dc_out_${sufijo}.mp4`);
  const inicio = Date.now();

  try {
    const { video, audio } = await analizarPistas(entrada);

    console.log(`[descargas-core] Pistas: video ${video ? `${video.codec_name}/${video.profile || "-"}/${video.pix_fmt}` : "no detectado"}, audio ${audio ? audio.codec_name : "no detectado"}`);
    const videoOk = !!video && video.codec_name === "h264" && video.pix_fmt === "yuv420p" &&
      (!video.profile || PERFILES_H264_OK.has(video.profile));
    const audioOk = !!audio && audio.codec_name === "aac";

    // Se copia lo que ya es compatible y solo se re-codifica lo que haga falta.
    const planes = [];
    if (videoOk && audioOk) planes.push({ nombre: "copiando todo", args: ["-c", "copy"] });
    if (videoOk && audio) planes.push({ nombre: "copiando video, convirtiendo audio", args: ["-c:v", "copy", ...CODEC_AUDIO_AAC] });
    if (audioOk && video) planes.push({ nombre: "convirtiendo video, copiando audio", args: [...CODEC_VIDEO_RAPIDO, "-c:a", "copy"] });
    planes.push({ nombre: "convirtiendo video y audio", args: [...CODEC_VIDEO_RAPIDO, ...CODEC_AUDIO_AAC] });

    for (const plan of planes) {
      try {
        await execFileAsync("ffmpeg", [...FFMPEG_BASE, "-y", "-i", entrada, ...plan.args, "-movflags", "+faststart", salida], OPCIONES_FFMPEG);
        console.log(`[descargas-core] Video listo (${plan.nombre}) en ${((Date.now() - inicio) / 1000).toFixed(1)}s`);
        return fs.readFileSync(salida);
      } catch (e) {
        console.log(`[descargas-core] Falló "${plan.nombre}": ${String(e.message).split("\n")[0]}`);
        if (fs.existsSync(salida)) fs.unlinkSync(salida);
      }
    }
    throw new Error("ffmpeg no pudo procesar el video");
  } finally {
    if (fs.existsSync(entrada)) fs.unlinkSync(entrada);
    if (fs.existsSync(salida)) fs.unlinkSync(salida);
  }
}

// Une un video H264 y un audio AAC que YA son compatibles: solo copia las pistas, tarda segundos.
export async function unirVideoAudioSinReconvertir(rutaVideo, rutaAudio) {
  const salida = path.join(os.tmpdir(), `uc_out_${Date.now()}_${Math.random().toString(36).slice(2)}.mp4`);
  const inicio = Date.now();
  try {
    await execFileAsync("ffmpeg", [
      ...FFMPEG_BASE,
      "-y",
      "-i", rutaVideo,
      "-i", rutaAudio,
      "-map", "0:v:0",
      "-map", "1:a:0",
      "-c", "copy",
      "-movflags", "+faststart",
      "-shortest",
      salida
    ], OPCIONES_FFMPEG);
    console.log(`[descargas-core] Video y audio unidos sin reconvertir en ${((Date.now() - inicio) / 1000).toFixed(1)}s`);
    return fs.readFileSync(salida);
  } finally {
    for (const ruta of [rutaVideo, rutaAudio, salida]) {
      try { if (fs.existsSync(ruta)) fs.unlinkSync(ruta); } catch (e) {}
    }
  }
}

export async function combinarVideoAudioWhatsApp(bufferVideo, bufferAudio) {
  const tmp = os.tmpdir();
  const sufijo = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const entradaVideo = path.join(tmp, `dv_in_${sufijo}.mp4`);
  const entradaAudio = path.join(tmp, `da_in_${sufijo}.m4a`);
  const salida = path.join(tmp, `dv_out_${sufijo}.mp4`);

  fs.writeFileSync(entradaVideo, bufferVideo);
  fs.writeFileSync(entradaAudio, bufferAudio);

  try {
    await execFileAsync("ffmpeg", [
      ...FFMPEG_BASE,
      "-y",
      "-i", entradaVideo,
      "-i", entradaAudio,
      "-map", "0:v:0",
      "-map", "1:a:0",
      ...CODEC_VIDEO_RAPIDO,
      ...CODEC_AUDIO_AAC,
      "-movflags", "+faststart",
      "-shortest",
      salida
    ], OPCIONES_FFMPEG);
    return fs.readFileSync(salida);
  } finally {
    if (fs.existsSync(entradaVideo)) fs.unlinkSync(entradaVideo);
    if (fs.existsSync(entradaAudio)) fs.unlinkSync(entradaAudio);
    if (fs.existsSync(salida)) fs.unlinkSync(salida);
  }
}

export async function consultarApiDescarga(apiUrl, link, paramNombre = "url") {
  const { data } = await axios.get(apiUrl, {
    params: { [paramNombre]: link },
    headers: HEADERS,
    timeout: 20000
  });

  if (!data || data.status === false) {
    throw new Error(data?.message || `La API ${apiUrl} no devolvió un resultado válido.`);
  }
  return data;
}

export function extraerEnlaceDescarga(json) {
  const candidatos = [
    json?.result?.url,
    json?.result?.download,
    json?.result?.download_url,
    json?.result?.dl,
    json?.result?.link,
    json?.data?.url,
    json?.data?.download,
    json?.url,
    json?.download,
    json?.link
  ];
  const enlace = candidatos.find(Boolean);
  if (!enlace) throw new Error("No encontré el enlace de descarga en la respuesta de la API.");
  return enlace;
}

export async function asegurarAudioCompatibleWhatsApp(entradaOriginal) {
  const tmp = os.tmpdir();
  const sufijo = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const entrada = comoRutaTemporal(entradaOriginal, "audio");

  try {
    const { audio } = await analizarPistas(entrada);

    if (audio?.codec_name === "mp3") {
      console.log("[descargas-core] Audio ya era mp3, se devuelve sin reencodear");
      return fs.readFileSync(entrada);
    }

    const salida = path.join(tmp, `da_out_${sufijo}.mp3`);
    try {
      await execFileAsync("ffmpeg", [...FFMPEG_BASE, "-y", "-i", entrada, "-vn", "-c:a", "libmp3lame", "-b:a", "192k", salida], OPCIONES_FFMPEG);
      return fs.readFileSync(salida);
    } finally {
      if (fs.existsSync(salida)) fs.unlinkSync(salida);
    }
  } finally {
    if (fs.existsSync(entrada)) fs.unlinkSync(entrada);
  }
}

export async function asegurarImagenCompatibleWhatsApp(entradaOriginal) {
  const tmp = os.tmpdir();
  const sufijo = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const entrada = comoRutaTemporal(entradaOriginal, "img");
  const salida = path.join(tmp, `di_out_${sufijo}.jpg`);

  try {
    await execFileAsync("ffmpeg", [
      ...FFMPEG_BASE,
      "-y",
      "-i", entrada,
      "-q:v", "2",
      "-pix_fmt", "yuvj420p",
      salida
    ], OPCIONES_FFMPEG);
    return fs.readFileSync(salida);
  } finally {
    if (fs.existsSync(entrada)) fs.unlinkSync(entrada);
    if (fs.existsSync(salida)) fs.unlinkSync(salida);
  }
}
  
