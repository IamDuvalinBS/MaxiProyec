// Motor único de YouTube: resolver link/búsqueda, info del video, buscar
// varios resultados, y descargar audio o video.
//
// Usa youtubei.js (habla con la API interna de YouTube, InnerTube) en vez
// de @distube/ytdl-core, que scrapeaba el HTML de la página del video y
// se rompía cada vez que YouTube cambiaba ese HTML.
import { Innertube } from "youtubei.js";
import {
  descargarBuffer,
  asegurarVideoCompatibleWhatsApp,
  combinarVideoAudioWhatsApp,
  LIMITE_VIDEO_WHATSAPP_MB
} from "./descargas-core.js";

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

  return {
    titulo: textoDe(basico.title),
    canal: basico.channel?.name || basico.author || "Desconocido",
    duracionSeg: segundos,
    duracionTexto: formatearDuracion(segundos),
    vistas: Number(basico.view_count || 0).toLocaleString("es"),
    miniatura: basico.thumbnail?.[0]?.url || null
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

// Si el formato ya trae "url" directa se usa tal cual; si no, hay que
// descifrarla (formatos con signatureCipher). Se espera el resultado con
// "await" porque en algunas versiones de youtubei.js decipher() devuelve
// el texto directo, y en otras una promesa - "await" funciona para las dos
// (esperar algo que ya no es una promesa no rompe nada).
async function urlDeFormato(formato, yt) {
  const url = formato.url ?? (await formato.decipher(yt.session.player));
  console.log(`[youtub] URL obtenida para itag ${formato.itag}: ${JSON.stringify(url)}`);
  return url;
}

// Se usa el mismo cliente por defecto que ya funciona para getBasicInfo
// (el truco de forzar el cliente "ANDROID" para esquivar el descifrado
// dejó de funcionar: YouTube empezó a rechazar esas peticiones con 400).
async function obtenerInfoParaDescarga(link) {
  const yt = await obtenerCliente();
  const info = await yt.getInfo(extraerIdDeLink(link));
  return { yt, info };
}

// chooseFormat() de youtubei.js tira su propio error cuando no encuentra
// nada (no devuelve null/undefined), asi que hay que atajarlo para poder
// probar el siguiente formato en vez de cortar toda la descarga ahi.
function intentarElegirFormato(info, opciones) {
  try {
    return info.chooseFormat(opciones);
  } catch (e) {
    return null;
  }
}

export async function descargarVideoYoutube(link) {
  const { yt, info } = await obtenerInfoParaDescarga(link);

  const duracionMin = (info.basic_info.duration || 0) / 60;
  if (duracionMin > 20) {
    throw new Error("Ese video dura mas de 20 minutos, muy probable que pese demasiado para WhatsApp.");
  }

  let bufferListo;
  const progresivo = intentarElegirFormato(info, { type: "video+audio", quality: "best" });

  if (progresivo) {
    const buffer = await descargarBuffer(await urlDeFormato(progresivo, yt));
    bufferListo = await asegurarVideoCompatibleWhatsApp(buffer);
  } else {
    // Cada vez es mas raro que YouTube ofrezca un formato con video+audio
    // juntos: se baja el video mudo y el audio por separado (esos siempre
    // existen) y se combinan con ffmpeg.
    const formatoVideo = intentarElegirFormato(info, { type: "video", quality: "best" });
    const formatoAudio = intentarElegirFormato(info, { type: "audio", quality: "best" });
    if (!formatoVideo || !formatoAudio) {
      throw new Error("No encontré ningún formato descargable para ese video.");
    }
    const [bufferVideo, bufferAudio] = await Promise.all([
      urlDeFormato(formatoVideo, yt).then(descargarBuffer),
      urlDeFormato(formatoAudio, yt).then(descargarBuffer)
    ]);
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
  const formato = intentarElegirFormato(info, { type: "audio", quality: "best" });
  if (!formato) throw new Error("No encontré ningún formato de audio para ese video.");
  return descargarBuffer(await urlDeFormato(formato, yt));
    }
