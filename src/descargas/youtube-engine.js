import axios from "axios";
import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import http from "http";
import https from "https";
import { Transform } from "stream";
import { pipeline } from "stream/promises";
import {
  descargarBuffer,
  asegurarVideoCompatibleWhatsApp,
  asegurarAudioCompatibleWhatsApp,
  combinarVideoAudioWhatsApp,
  unirVideoAudioSinReconvertir,
  LIMITE_VIDEO_WHATSAPP_MB
} from "./core.js";

const advertirOriginal = console.warn;
const errorOriginal = console.error;
function esRuidoDeYoutubei(args) {
  return typeof args[0] === "string" && args[0].includes("[YOUTUBEJS]");
}
console.warn = (...args) => {
  if (esRuidoDeYoutubei(args)) return;
  advertirOriginal(...args);
};
console.error = (...args) => {
  if (esRuidoDeYoutubei(args)) return;
  if (args[0] === "Converting error:") {
    console.log(`[youtube] savetube (Vreden) no devolvió el enlace de descarga: ${args[1]?.message || args[1]}`);
    return;
  }
  errorOriginal(...args);
};

let clientePromise = null;
function obtenerCliente() {
  if (!clientePromise) {
    clientePromise = (async () => {
      const { Innertube, Platform } = await import("youtubei.js");
      Platform.shim.eval = async (data, env) => {
        const propiedades = [];
        if (env.n) propiedades.push(`n: exportedVars.nFunction("${env.n}")`);
        if (env.sig) propiedades.push(`sig: exportedVars.sigFunction("${env.sig}")`);
        const codigo = `${data.output}\nreturn { ${propiedades.join(", ")} }`;
        return new Function(codigo)();
      };
      return Innertube.create();
    })().catch((e) => {
      clientePromise = null; // si falló, la próxima petición lo intenta de nuevo
      throw e;
    });
  }
  return clientePromise;
}

// Caché pequeño en memoria (10 min, máx. 50 entradas): repetir una búsqueda o un video no vuelve a consultar YouTube.
const CACHE_VIGENCIA_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRADAS = 50;
function crearCache() {
  const mapa = new Map();
  return {
    get(clave) {
      const e = mapa.get(clave);
      if (!e) return undefined;
      if (Date.now() - e.t > CACHE_VIGENCIA_MS) { mapa.delete(clave); return undefined; }
      return e.v;
    },
    set(clave, valor) {
      if (mapa.size >= CACHE_MAX_ENTRADAS) mapa.delete(mapa.keys().next().value);
      mapa.set(clave, { v: valor, t: Date.now() });
    }
  };
}
const cacheBusquedas = crearCache();
const cacheInfo = crearCache();

function textoDe(valor) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "string") return valor;
  return valor.text ?? String(valor);
}

export function esLinkYoutube(texto) {
  return /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)/i.test(texto);
}

function extraerIdDeLink(link) {
  const m = link.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : link;
}

export async function resolverLinkYoutube(consulta) {
  if (esLinkYoutube(consulta)) return consulta;

  const clave = consulta.trim().toLowerCase();
  const guardado = cacheBusquedas.get(clave);
  if (guardado) return guardado;

  const yt = await obtenerCliente();
  const resultados = await yt.search(consulta, { type: "video" });
  const videos = resultados.videos ?? (resultados.results || []).filter((r) => r.type === "Video");
  const video = videos[0];
  if (!video) throw new Error("No encontre ningun video con esa busqueda.");
  const link = `https://www.youtube.com/watch?v=${video.id}`;
  cacheBusquedas.set(clave, link);
  return link;
}

function formatearDuracion(segundos) {
  if (!segundos || isNaN(segundos)) return "??:??";
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export async function obtenerInfoYoutube(link) {
  const idVideo = extraerIdDeLink(link);
  const guardada = cacheInfo.get(idVideo);
  if (guardada) return guardada;

  const yt = await obtenerCliente();
  const info = await yt.getBasicInfo(idVideo);
  const basico = info.basic_info;
  const segundos = basico.duration || 0;

  const fechaCruda = basico.publish_date || basico.upload_date || null;

  const resultado = {
    titulo: textoDe(basico.title),
    canal: basico.channel?.name || basico.author || "Desconocido",
    duracionSeg: segundos,
    duracionTexto: formatearDuracion(segundos),
    vistas: Number(basico.view_count || 0).toLocaleString("es"),
    miniatura: basico.thumbnail?.[0]?.url || null,
    fecha: fechaCruda,
    etiquetas: Array.isArray(basico.tags) ? basico.tags : Array.isArray(basico.keywords) ? basico.keywords : [],
    enlace: `https://www.youtube.com/watch?v=${idVideo}`
  };
  cacheInfo.set(idVideo, resultado);
  return resultado;
}

export async function buscarVideosYoutube(consulta, limite = 10) {
  const yt = await obtenerCliente();
  const resultados = await yt.search(consulta, { type: "video" });
  const videos = resultados.videos ?? (resultados.results || []).filter((r) => r.type === "Video");

  return videos.slice(0, limite).map((v) => ({
    titulo: textoDe(v.title),
    url: `https://www.youtube.com/watch?v=${v.id}`,
    duracion: textoDe(v.duration) || "??:??",
    fecha: textoDe(v.published) || "fecha desconocida",
    miniatura: v.thumbnails?.[0]?.url || null,
    canal: v.author?.name || "Desconocido"
  }));
}

// ANDROID/IOS dan 400 (piden PO token) y "TV" a veces no es válido: se prueban primero los que sí suelen servir
// y se recuerda el que funcionó para no repetir intentos fallidos.
const CLIENTES_A_PROBAR = ["TV", "WEB_EMBEDDED", "MWEB", "WEB"];
const tieneUrl = (f) => !!(f.url || f.signature_cipher || f.cipher);
let clienteBueno = null;

async function obtenerInfoParaDescarga(link) {
  const yt = await obtenerCliente();
  const id = extraerIdDeLink(link);
  let ultimoError = new Error("No pude obtener info descargable para ese video.");

  const orden = clienteBueno
    ? [clienteBueno, ...CLIENTES_A_PROBAR.filter((c) => c !== clienteBueno)]
    : CLIENTES_A_PROBAR;

  for (const cliente of orden) {
    try {
      let info;
      try {
        info = await yt.getInfo(id, { client: cliente });
      } catch (e) {
        // Versiones viejas de youtubei.js reciben el cliente como texto.
        if (/invalid client/i.test(e.message)) continue;
        throw e;
      }
      const todos = [...(info.streaming_data?.formats || []), ...(info.streaming_data?.adaptive_formats || [])];
      if (todos.some(tieneUrl)) {
        clienteBueno = cliente;
        console.log(`[youtube] Cliente ${cliente} OK`);
        return { yt, info };
      }
    } catch (e) {
      ultimoError = e;
    }
  }
  throw ultimoError;
}

function formatosProgresivos(info) {
  return [...(info.streaming_data?.formats || [])]
    .filter((f) => f.has_video && f.has_audio)
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
}
function formatosDeTipo(info, tipo) {
  const lista = info.streaming_data?.adaptive_formats || [];
  const filtrados = tipo === "video" ? lista.filter((f) => f.has_video && !f.has_audio) : lista.filter((f) => f.has_audio && !f.has_video);
  return filtrados.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
}

async function primeraUrlQueFuncione(formatos, yt) {
  let ultimoError = new Error("No hay formatos para probar.");
  for (const formato of formatos) {
    try {
      const url = formato.url ?? (await formato.decipher(yt.session.player));
      console.log(`[youtub] Descifrado OK para itag ${formato.itag}`);
      return url;
    } catch (e) {
      console.log(`[youtub] Fallo descifrando itag ${formato.itag}: ${e.message}`);
      ultimoError = e;
    }
  }
  throw ultimoError;
}

export async function descargarVideoYoutube(link) {
  const { yt, info } = await obtenerInfoParaDescarga(link);

  const duracionMin = (info.basic_info.duration || 0) / 60;
  if (duracionMin > 20) {
    throw new Error("Ese video dura mas de 20 minutos, muy probable que pese demasiado para WhatsApp.");
  }

  let bufferListo = null;
  const progresivos = formatosProgresivos(info);

  if (progresivos.length > 0) {
    try {
      const url = await primeraUrlQueFuncione(progresivos, yt);
      const buffer = await descargarBuffer(url);
      bufferListo = await asegurarVideoCompatibleWhatsApp(buffer);
    } catch (e) {
      console.log(`[youtub] Fallo el plan A (formato progresivo) despues del decipher: ${e.message}`);
    }
  }

  if (!bufferListo) {
    const videos = formatosDeTipo(info, "video");
    const audios = formatosDeTipo(info, "audio");
    if (videos.length === 0 || audios.length === 0) {
      throw new Error("No encontré ningún formato descargable para ese video.");
    }
    const [urlVideo, urlAudio] = await Promise.all([primeraUrlQueFuncione(videos, yt), primeraUrlQueFuncione(audios, yt)]);
    const [bufferVideo, bufferAudio] = await Promise.all([descargarBuffer(urlVideo), descargarBuffer(urlAudio)]);
    bufferListo = await combinarVideoAudioWhatsApp(bufferVideo, bufferAudio);
  }

  const pesoMB = bufferListo.length / (1024 * 1024);
  if (pesoMB > LIMITE_VIDEO_WHATSAPP_MB) {
    const ruta = path.join(os.tmpdir(), `yt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp4`);
    fs.writeFileSync(ruta, bufferListo);
    return { ruta, nombre: `youtube-${extraerIdDeLink(link)}.mp4`, pesoMB };
  }

  return bufferListo;
}

const esH264 = (f) => /avc1/i.test(f.mime_type || "");
const esAac = (f) => /mp4a/i.test(f.mime_type || "");

// Pide a YouTube el video en H264 (hasta 720p) y el audio en AAC por separado y los une copiando las pistas.
// Vreden entrega AV1, que WhatsApp no reproduce bien y tarda minutos en convertirse en el celular; esto evita la conversión.
export async function descargarVideoH264Directo(link) {
  const { yt, info } = await conTiempoLimite(obtenerInfoParaDescarga(link), 30000);

  const duracionMin = (info.basic_info.duration || 0) / 60;
  if (duracionMin > 20) throw new Error("Ese video dura mas de 20 minutos, muy probable que pese demasiado para WhatsApp.");

  const lista = info.streaming_data?.adaptive_formats || [];
  const videos = lista
    .filter((f) => f.has_video && !f.has_audio && esH264(f) && (f.height || 0) <= 720)
    .sort((a, b) => (b.height || 0) - (a.height || 0) || (b.bitrate || 0) - (a.bitrate || 0));
  const audios = lista
    .filter((f) => f.has_audio && !f.has_video && esAac(f))
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
  if (!videos.length || !audios.length) throw new Error("YouTube no ofrece video H264 y audio AAC separados para este enlace.");

  const formatoVideo = videos[0];
  const formatoAudio = audios[0];
  console.log(`[youtube] H264 directo: video ${formatoVideo.height}p (itag ${formatoVideo.itag}), audio itag ${formatoAudio.itag}`);

  const urlDe = async (f) => f.url ?? (await f.decipher(yt.session.player));
  const [urlVideo, urlAudio] = await Promise.all([urlDe(formatoVideo), urlDe(formatoAudio)]);

  const t0 = Date.now();
  let rutaVideo = null;
  let rutaAudio = null;
  try {
    [rutaVideo, rutaAudio] = await Promise.all([descargarATemporal(urlVideo, "mp4"), descargarATemporal(urlAudio, "m4a")]);
  } catch (e) {
    for (const ruta of [rutaVideo, rutaAudio]) { try { if (ruta) fs.unlinkSync(ruta); } catch (err) {} }
    throw e;
  }
  console.log(`[youtube] H264 directo: descarga ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  // unirVideoAudioSinReconvertir borra los archivos temporales al terminar.
  return unirVideoAudioSinReconvertir(rutaVideo, rutaAudio);
}

export async function descargarAudioYoutube(link) {
  const { yt, info } = await obtenerInfoParaDescarga(link);
  const audios = formatosDeTipo(info, "audio");
  if (audios.length > 0) {
    try {
      const url = await primeraUrlQueFuncione(audios, yt);
      return await descargarBuffer(url);
    } catch (e) {
      // YouTube suele dar 403 en los formatos de solo audio; el formato con video+audio (itag 18) sí se deja bajar.
      console.log(`[youtube] Audio suelto no disponible (${String(e.message).split("\n")[0]}); se saca del formato con video`);
    }
  }
  const progresivos = formatosProgresivos(info);
  if (progresivos.length === 0) throw new Error("No encontré ningún formato de audio para ese video.");
  const url = await primeraUrlQueFuncione(progresivos, yt);
  return descargarBuffer(url); // core.js se encarga de quedarse solo con el audio y pasarlo a mp3
}

// ---------- Descarga rápida a disco ----------
// Si el servidor admite "Range" y el archivo es grande, se baja en varios pedazos a la vez (cada conexión
// aporta su propia velocidad) escribiendo directo en su lugar del archivo: no usa RAM extra.
// Si algo no cuadra (sin Range, un pedazo falla, etc.) se baja normal con una sola conexión, como siempre.
// Mismo User-Agent que usa core.js al bajar el itag 18 (que sí funciona); sin él YouTube puede responder 403.
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const RED = {
  httpAgent: new http.Agent({ keepAlive: true, maxSockets: 16 }),
  httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 16 }),
  headers: { "User-Agent": USER_AGENT }
};
const CONEXIONES_PARALELAS = 4;
const TAMANO_MINIMO_SEGMENTO = 1024 * 1024;
const REINTENTOS_SEGMENTO = 2;

async function descargarSegmento(url, ruta, inicio, fin, signal) {
  let ultimoError;
  for (let intento = 0; intento <= REINTENTOS_SEGMENTO; intento++) {
    if (signal.aborted) throw new Error("descarga cancelada");
    try {
      const res = await axios.get(url, {
        ...RED,
        signal,
        responseType: "stream",
        headers: { ...RED.headers, Range: `bytes=${inicio}-${fin}` },
        timeout: 120000,
        validateStatus: (estado) => estado === 206
      });
      let escritos = 0;
      const contador = new Transform({
        transform(trozo, _enc, cb) { escritos += trozo.length; cb(null, trozo); }
      });
      await pipeline(res.data, contador, fs.createWriteStream(ruta, { flags: "r+", start: inicio }), { signal });
      if (escritos !== fin - inicio + 1) throw new Error(`pedazo incompleto (${escritos} de ${fin - inicio + 1} bytes)`);
      return;
    } catch (e) {
      ultimoError = e;
      if (signal.aborted) break;
    }
  }
  throw ultimoError;
}

async function descargarSegmentado(url, ruta, total) {
  const conexiones = Math.min(CONEXIONES_PARALELAS, Math.max(1, Math.floor(total / TAMANO_MINIMO_SEGMENTO)));
  const manejador = await fs.promises.open(ruta, "w");
  await manejador.truncate(total);
  await manejador.close();

  const control = new AbortController();
  const tamano = Math.ceil(total / conexiones);
  const tareas = [];
  for (let i = 0; i < conexiones; i++) {
    const inicio = i * tamano;
    const fin = Math.min(total - 1, inicio + tamano - 1);
    if (inicio > fin) break;
    tareas.push(descargarSegmento(url, ruta, inicio, fin, control.signal));
  }
  try {
    await Promise.all(tareas);
  } catch (e) {
    control.abort();
    await Promise.allSettled(tareas); // que ningún pedazo siga escribiendo antes de limpiar
    throw e;
  }
}

async function descargarATemporal(url, ext) {
  const tmpPath = path.join(os.tmpdir(), `yt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`);
  try {
    // Un primer pedido de 1 byte dice si el servidor admite pedazos y cuánto pesa el archivo.
    let sondeo = null;
    try {
      sondeo = await axios.get(url, { ...RED, responseType: "stream", headers: { ...RED.headers, Range: "bytes=0-0" }, timeout: 120000 });
    } catch (e) {
      sondeo = null;
    }

    if (sondeo && sondeo.status === 206) {
      sondeo.data.resume();
      const total = Number(/\/(\d+)\s*$/.exec(sondeo.headers["content-range"] || "")?.[1] || 0);
      if (total >= CONEXIONES_PARALELAS * TAMANO_MINIMO_SEGMENTO) {
        try {
          await descargarSegmentado(url, tmpPath, total);
          return tmpPath;
        } catch (e) {
          console.log(`[youtube] Descarga en pedazos falló (${e.message}); se baja con una sola conexión`);
        }
      }
      sondeo = null;
    }

    // Una sola conexión. Si el servidor ignoró "Range" y respondió el archivo completo, se aprovecha esa misma respuesta.
    const stream = sondeo && sondeo.status === 200
      ? sondeo.data
      : (await axios.get(url, { ...RED, responseType: "stream", timeout: 120000 })).data;
    await pipeline(stream, fs.createWriteStream(tmpPath));
    return tmpPath;
  } catch (e) {
    try { fs.unlinkSync(tmpPath); } catch (err) {}
    throw e;
  }
}

const PROVEEDORES_AUDIO = [
  { nombre: "Vreden", obtenerUrl: async (link) => { const d = await (await import("@vreden/youtube_scraper")).ytmp3(link); return d?.status && d?.download?.url ? d.download.url : null; } }
];

// Vreden usa 360p si no se le indica calidad. Se prueba de mayor a menor y se baja de escalón si falla.
const CALIDADES_VIDEO = [720, 480, 360];

const PROVEEDORES_VIDEO = [
  ...CALIDADES_VIDEO.map((calidad) => ({
    nombre: `Vreden ${calidad}p`,
    // Las calidades altas tardan más en prepararse del lado del servicio: se les da más tiempo para no bajar de calidad sin necesidad.
    tiempoMs: calidad >= 720 ? 45000 : calidad >= 480 ? 30000 : 20000,
    obtenerUrl: async (link) => { const d = await (await import("@vreden/youtube_scraper")).ytmp4(link, calidad); return d?.status && d?.download?.url ? d.download.url : null; }
  }))
];

// El motor local de respaldo suele fallar con errores técnicos ("No valid URL to decipher") que no le sirven a nadie;
// si todo falló se muestra un motivo claro. Los motivos útiles (video muy largo) se dejan tal cual.
const MENSAJE_SIN_SERVICIO = "Los servicios de descarga no respondieron en este momento. Intenta de nuevo en unos minutos.";
async function respaldoLocal(descargar) {
  try {
    return await descargar();
  } catch (e) {
    console.log(`[youtube] El motor local de respaldo también falló: ${String(e.message).split("\n")[0]}`);
    if (/dura mas de/i.test(e.message)) throw e;
    throw new Error(MENSAJE_SIN_SERVICIO);
  }
}

// Si un proveedor se cuelga, se pasa al siguiente en vez de quedarse esperando.
const TIEMPO_MAX_PROVEEDOR_MS = 20000;
function conTiempoLimite(promesa, ms) {
  let temporizador;
  const limite = new Promise((_, rechazar) => {
    temporizador = setTimeout(() => rechazar(new Error(`no respondió en ${ms / 1000}s`)), ms);
  });
  return Promise.race([promesa, limite]).finally(() => clearTimeout(temporizador));
}

// ---------- Motor yt-dlp (opcional) ----------
// Si yt-dlp está instalado (pip install -U "yt-dlp[default]") es el primer motor; si no, todo sigue como antes.
// Cuidado con la RAM del teléfono: solo corre YTDLP_SIMULTANEAS descargas a la vez (las demás esperan turno)
// y todo se escribe a disco, nunca se guarda en memoria hasta el final.
const execFileAsync = promisify(execFile);
const YTDLP_SIMULTANEAS = 1;
let ytdlpActivos = 0;
const ytdlpEspera = [];

function esperarTurnoYtdlp() {
  return new Promise((resolver) => {
    if (ytdlpActivos < YTDLP_SIMULTANEAS) { ytdlpActivos++; resolver(); }
    else ytdlpEspera.push(resolver);
  });
}
function liberarTurnoYtdlp() {
  const siguiente = ytdlpEspera.shift();
  if (siguiente) siguiente(); // el turno pasa directo al siguiente en la fila
  else ytdlpActivos--;
}

let ytdlpDisponible = null;
async function hayYtdlp() {
  if (ytdlpDisponible !== null) return ytdlpDisponible;
  try {
    await execFileAsync("yt-dlp", ["--version"], { timeout: 15000 });
    ytdlpDisponible = true;
  } catch (e) {
    if (e.code === "ENOENT") {
      ytdlpDisponible = false;
      console.log('[youtube] yt-dlp no está instalado; se usa el motor interno (para instalarlo: pip install -U "yt-dlp[default]")');
    }
    return false;
  }
  return ytdlpDisponible;
}

function limpiarArchivosYtdlp(base) {
  try {
    for (const n of fs.readdirSync(os.tmpdir())) {
      if (n.startsWith(base)) { try { fs.unlinkSync(path.join(os.tmpdir(), n)); } catch (err) {} }
    }
  } catch (err) {}
}

// Devuelve la ruta del archivo descargado (quien la reciba debe borrarla).
async function ejecutarYtdlp(link, formato, extra) {
  if (!(await hayYtdlp())) throw new Error("yt-dlp no instalado");
  const base = `ytdlp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await esperarTurnoYtdlp();
  try {
    const t0 = Date.now();
    await execFileAsync("yt-dlp", [
      "--quiet", "--no-warnings", "--no-playlist",
      "--js-runtimes", "node",
      "--socket-timeout", "20",
      "--retries", "3",
      "-f", formato,
      ...extra,
      "-o", path.join(os.tmpdir(), `${base}.%(ext)s`),
      link
    ], { timeout: 180000, killSignal: "SIGKILL", maxBuffer: 1024 * 1024 });

    const archivos = fs.readdirSync(os.tmpdir())
      .filter((n) => n.startsWith(base))
      .map((n) => ({ ruta: path.join(os.tmpdir(), n), peso: fs.statSync(path.join(os.tmpdir(), n)).size }))
      .sort((a, b) => b.peso - a.peso);
    if (!archivos.length) throw new Error("yt-dlp no generó ningún archivo");
    for (const sobrante of archivos.slice(1)) { try { fs.unlinkSync(sobrante.ruta); } catch (err) {} }
    console.log(`[youtube] yt-dlp descargó en ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    return archivos[0].ruta;
  } catch (e) {
    limpiarArchivosYtdlp(base);
    const detalle = String(e.stderr || e.message).trim().split("\n").filter(Boolean).pop() || "error desconocido";
    throw new Error(`yt-dlp falló: ${detalle}`);
  } finally {
    liberarTurnoYtdlp();
  }
}

async function videoConYtdlp(link) {
  const info = await obtenerInfoYoutube(link).catch(() => null);
  if (info && info.duracionSeg > 20 * 60) {
    throw new Error("Ese video dura mas de 20 minutos, muy probable que pese demasiado para WhatsApp.");
  }
  // H264 hasta 720p + AAC (compatible con WhatsApp, sin reconvertir); si no hay, el mp4 con video y audio juntos.
  const ruta = await ejecutarYtdlp(
    link,
    "bv*[vcodec^=avc1][height<=720]+ba[acodec^=mp4a]/b[vcodec^=avc1][height<=720]/b[ext=mp4]",
    ["--merge-output-format", "mp4"]
  );
  const pesoMB = fs.statSync(ruta).size / (1024 * 1024);
  if (pesoMB > LIMITE_VIDEO_WHATSAPP_MB) {
    return { ruta, nombre: `youtube-${extraerIdDeLink(link)}.mp4`, pesoMB };
  }
  return asegurarVideoCompatibleWhatsApp(ruta); // core.js trabaja sobre el archivo y lo borra al terminar
}

async function audioConYtdlp(link) {
  const ruta = await ejecutarYtdlp(link, "ba[ext=m4a]/ba", []);
  return asegurarAudioCompatibleWhatsApp(ruta);
}

export async function descargarAudioConProveedores(link) {
  try {
    return await audioConYtdlp(link);
  } catch (e) {
    if (!/no instalado/.test(e.message)) console.log(`[youtube] ${String(e.message).split("\n")[0]}`);
  }

  // El motor local va después: es lo que hoy responde rápido. Los proveedores quedan de respaldo.
  try {
    return await asegurarAudioCompatibleWhatsApp(await descargarAudioYoutube(link));
  } catch (e) {
    console.log(`[youtube] Audio local no disponible, se usan los proveedores: ${String(e.message).split("\n")[0]}`);
  }

  for (const p of PROVEEDORES_AUDIO) {
    let rutaTmp = null;
    try {
      const t0 = Date.now();
      const url = await conTiempoLimite(p.obtenerUrl(link), p.tiempoMs || TIEMPO_MAX_PROVEEDOR_MS);
      if (!url) {
        console.log(`[youtube] Proveedor ${p.nombre} no devolvió enlace`);
        continue;
      }
      const t1 = Date.now();
      rutaTmp = await descargarATemporal(url, "mp3");
      console.log(`[youtube] Tiempos: enlace ${((t1 - t0) / 1000).toFixed(1)}s, descarga ${((Date.now() - t1) / 1000).toFixed(1)}s`);
      if (fs.statSync(rutaTmp).size < 10 * 1024) throw new Error("el archivo descargado está vacío o es inválido");
      console.log(`[youtube] Audio descargado con ${p.nombre}`);
      // Se pasa la ruta (no un Buffer): core.js trabaja sobre el archivo y lo borra al terminar.
      return await asegurarAudioCompatibleWhatsApp(rutaTmp);
    } catch (e) {
      console.log(`[youtube] Proveedor ${p.nombre} falló: ${String(e.message).split("\n")[0]}`);
      if (rutaTmp && fs.existsSync(rutaTmp)) {
        try { fs.unlinkSync(rutaTmp); } catch (err) {}
      }
    }
  }

  throw new Error(MENSAJE_SIN_SERVICIO);
}

// Devuelve un Buffer (video normal, hasta LIMITE_VIDEO_WHATSAPP_MB) o, si pesa más, un objeto
// { ruta, nombre, pesoMB } con el archivo en disco para mandarlo como DOCUMENTO (WhatsApp admite hasta 2GB).
// Quien reciba el objeto debe borrar `ruta` después de enviarlo.
export async function descargarVideoConProveedores(link) {
  const idVideo = extraerIdDeLink(link);

  try {
    return await videoConYtdlp(link);
  } catch (e) {
    if (/dura mas de/i.test(e.message)) throw e;
    if (!/no instalado/.test(e.message)) console.log(`[youtube] ${String(e.message).split("\n")[0]}`);
  }

  // El motor local (itag 18, 360p con audio) es lo que responde en ~1 s cuando yt-dlp no está.
  try {
    return await descargarVideoYoutube(link);
  } catch (e) {
    console.log(`[youtube] Motor local no disponible, se prueban las otras opciones: ${String(e.message).split("\n")[0]}`);
    if (/dura mas de/i.test(e.message)) throw e;
  }

  try {
    const buffer = await descargarVideoH264Directo(link);
    const pesoMB = buffer.length / (1024 * 1024);
    if (pesoMB <= LIMITE_VIDEO_WHATSAPP_MB) return buffer;
    const ruta = path.join(os.tmpdir(), `yt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp4`);
    fs.writeFileSync(ruta, buffer);
    return { ruta, nombre: `youtube-${idVideo}.mp4`, pesoMB };
  } catch (e) {
    console.log(`[youtube] H264 directo no disponible, se usan los proveedores: ${String(e.message).split("\n")[0]}`);
  }

  for (const p of PROVEEDORES_VIDEO) {
    let rutaTmp = null;
    try {
      const t0 = Date.now();
      const url = await conTiempoLimite(p.obtenerUrl(link), p.tiempoMs || TIEMPO_MAX_PROVEEDOR_MS);
      if (!url) {
        console.log(`[youtube] Proveedor ${p.nombre} no devolvió enlace`);
        continue;
      }
      const t1 = Date.now();
      rutaTmp = await descargarATemporal(url, "mp4");
      console.log(`[youtube] Tiempos: enlace ${((t1 - t0) / 1000).toFixed(1)}s, descarga ${((Date.now() - t1) / 1000).toFixed(1)}s`);
      const pesoMB = fs.statSync(rutaTmp).size / (1024 * 1024);
      if (pesoMB < 0.01) throw new Error("el archivo descargado está vacío o es inválido");
      console.log(`[youtube] Video descargado con ${p.nombre} (${pesoMB.toFixed(1)}MB)`);

      if (pesoMB > LIMITE_VIDEO_WHATSAPP_MB) {
        return { ruta: rutaTmp, nombre: `youtube-${idVideo}.mp4`, pesoMB };
      }
      // Se pasa la ruta (no un Buffer): core.js trabaja sobre el archivo y lo borra al terminar.
      return await asegurarVideoCompatibleWhatsApp(rutaTmp);
    } catch (e) {
      console.log(`[youtube] Proveedor ${p.nombre} falló: ${String(e.message).split("\n")[0]}`);
      if (rutaTmp && fs.existsSync(rutaTmp)) {
        try { fs.unlinkSync(rutaTmp); } catch (err) {}
      }
      // Servicio caído: no tiene caso probar las demás calidades.
      if (/no respondió en/.test(e.message)) break;
    }
  }

  throw new Error(MENSAJE_SIN_SERVICIO);
}
           
