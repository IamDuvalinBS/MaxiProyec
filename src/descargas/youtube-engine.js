import { Innertube, Platform } from "youtubei.js";
import axios from "axios";
import fs from "fs";
import os from "os";
import path from "path";
import { ytmp3 as vredenYtmp3, ytmp4 as vredenYtmp4 } from "@vreden/youtube_scraper";
import { youtube as btchYoutube } from "btch-downloader";
import {
  descargarBuffer,
  asegurarVideoCompatibleWhatsApp,
  asegurarAudioCompatibleWhatsApp,
  combinarVideoAudioWhatsApp,
  LIMITE_VIDEO_WHATSAPP_MB
} from "./core.js";

Platform.shim.eval = async (data, env) => {
  const propiedades = [];
  if (env.n) propiedades.push(`n: exportedVars.nFunction("${env.n}")`);
  if (env.sig) propiedades.push(`sig: exportedVars.sigFunction("${env.sig}")`);
  const codigo = `${data.output}\nreturn { ${propiedades.join(", ")} }`;
  return new Function(codigo)();
};

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
  errorOriginal(...args);
};

let clientePromise = null;
function obtenerCliente() {
  if (!clientePromise) clientePromise = Innertube.create();
  return clientePromise;
}

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

  const yt = await obtenerCliente();
  const resultados = await yt.search(consulta, { type: "video" });
  const videos = resultados.videos ?? (resultados.results || []).filter((r) => r.type === "Video");
  const video = videos[0];
  if (!video) throw new Error("No encontre ningun video con esa busqueda.");
  return `https://www.youtube.com/watch?v=${video.id}`;
}

function formatearDuracion(segundos) {
  if (!segundos || isNaN(segundos)) return "??:??";
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export async function obtenerInfoYoutube(link) {
  const yt = await obtenerCliente();
  const info = await yt.getBasicInfo(extraerIdDeLink(link));
  const basico = info.basic_info;
  const segundos = basico.duration || 0;

  const fechaCruda = basico.publish_date || basico.upload_date || null;

  return {
    titulo: textoDe(basico.title),
    canal: basico.channel?.name || basico.author || "Desconocido",
    duracionSeg: segundos,
    duracionTexto: formatearDuracion(segundos),
    vistas: Number(basico.view_count || 0).toLocaleString("es"),
    miniatura: basico.thumbnail?.[0]?.url || null,
    fecha: fechaCruda,
    etiquetas: Array.isArray(basico.tags) ? basico.tags : Array.isArray(basico.keywords) ? basico.keywords : [],
    enlace: `https://www.youtube.com/watch?v=${extraerIdDeLink(link)}`
  };
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

const CLIENTES_A_PROBAR = ["ANDROID", "IOS", "TV", "WEB"];

async function obtenerInfoParaDescarga(link) {
  const yt = await obtenerCliente();
  const id = extraerIdDeLink(link);
  let ultimoError = new Error("No pude obtener info descargable para ese video.");

  for (const cliente of CLIENTES_A_PROBAR) {
    try {
      const info = await yt.getInfo(id, cliente);
      const tieneFormatos =
        (info.streaming_data?.formats?.length || 0) > 0 ||
        (info.streaming_data?.adaptive_formats?.length || 0) > 0;
      if (tieneFormatos) {
        console.log(`[youtub] Cliente ${cliente} devolvió formatos utilizables`);
        return { yt, info };
      }
      console.log(`[youtub] Cliente ${cliente} respondió sin streaming_data util`);
    } catch (e) {
      console.log(`[youtub] Cliente ${cliente} fallo: ${e.message}`);
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
    throw new Error(`Ese video pesa ${pesoMB.toFixed(1)}MB, demasiado grande para WhatsApp.`);
  }

  return bufferListo;
}

export async function descargarAudioYoutube(link) {
  const { yt, info } = await obtenerInfoParaDescarga(link);
  const audios = formatosDeTipo(info, "audio");
  if (audios.length === 0) throw new Error("No encontré ningún formato de audio para ese video.");
  const url = await primeraUrlQueFuncione(audios, yt);
  return descargarBuffer(url);
}

async function descargarATemporal(url, ext) {
  const tmpPath = path.join(os.tmpdir(), `yt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`);
  const { data: stream } = await axios.get(url, { responseType: "stream", timeout: 120000 });
  const writer = fs.createWriteStream(tmpPath);
  stream.pipe(writer);
  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
  return tmpPath;
}

async function descargarBufferConfiable(url, ext) {
  const tmpPath = await descargarATemporal(url, ext);
  try {
    return fs.readFileSync(tmpPath);
  } finally {
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch (e) {}
    }
  }
}

const PROVEEDORES_AUDIO = [
  { nombre: "Vreden", obtenerUrl: async (link) => { const d = await vredenYtmp3(link); return d?.status && d?.download?.url ? d.download.url : null; } },
  { nombre: "Btch", obtenerUrl: async (link) => { const d = await btchYoutube(link); return d?.status && d?.mp3 ? d.mp3 : null; } }
];

const PROVEEDORES_VIDEO = [
  { nombre: "Vreden", obtenerUrl: async (link) => { const d = await vredenYtmp4(link); return d?.status && d?.download?.url ? d.download.url : null; } },
  { nombre: "Btch", obtenerUrl: async (link) => { const d = await btchYoutube(link); return d?.status && d?.mp4 ? d.mp4 : null; } }
];

async function primeraUrlDeProveedores(link, proveedores) {
  for (const p of proveedores) {
    try {
      const url = await p.obtenerUrl(link);
      if (url) return url;
    } catch (e) {
      console.log(`[youtube] Proveedor ${p.nombre} falló: ${e.message}`);
    }
  }
  return null;
}

export async function descargarAudioConProveedores(link) {
  const url = await primeraUrlDeProveedores(link, PROVEEDORES_AUDIO);
  const buffer = url ? await descargarBufferConfiable(url, "mp3") : await descargarAudioYoutube(link);
  return asegurarAudioCompatibleWhatsApp(buffer);
}

export async function descargarVideoConProveedores(link) {
  const url = await primeraUrlDeProveedores(link, PROVEEDORES_VIDEO);
  if (!url) return descargarVideoYoutube(link);

  const buffer = await descargarBufferConfiable(url, "mp4");
  const pesoMB = buffer.length / (1024 * 1024);
  if (pesoMB > LIMITE_VIDEO_WHATSAPP_MB) {
    throw new Error(`Ese video pesa ${pesoMB.toFixed(1)}MB, supera el límite de ${LIMITE_VIDEO_WHATSAPP_MB}MB para WhatsApp.`);
  }
  return asegurarVideoCompatibleWhatsApp(buffer);
}
