// Motor único de YouTube: resolver link/búsqueda, info del video, buscar
// varios resultados, y descargar audio o video. Usa @distube/ytdl-core y
// yt-search (para poder buscar por texto y no solo por link).
import ytdl from "@distube/ytdl-core";
import ytSearch from "yt-search";
import { asegurarVideoCompatibleWhatsApp, LIMITE_VIDEO_WHATSAPP_MB } from "./descargas-core.js";

export function esLinkYoutube(texto) {
  return /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)/i.test(texto);
}

// Si le pasan un link lo usa directo; si le pasan texto, busca el primer
// resultado en YouTube y devuelve ese link.
export async function resolverLinkYoutube(consulta) {
  if (esLinkYoutube(consulta)) return consulta;

  const resultado = await ytSearch(consulta);
  const video = resultado.videos?.[0];
  if (!video) throw new Error("No encontre ningun video con esa busqueda.");
  return video.url;
}

function formatearDuracion(segundos) {
  if (!segundos || isNaN(segundos)) return "??:??";
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export async function obtenerInfoYoutube(link) {
  const info = await ytdl.getInfo(link);
  const segundos = parseInt(info.videoDetails.lengthSeconds, 10);

  return {
    titulo: info.videoDetails.title,
    canal: info.videoDetails.author?.name || "Desconocido",
    duracionSeg: segundos,
    duracionTexto: formatearDuracion(segundos),
    vistas: Number(info.videoDetails.viewCount || 0).toLocaleString("es"),
    miniatura: info.videoDetails.thumbnails?.pop()?.url || null
  };
}

// Devuelve hasta "limite" resultados de una busqueda (para .ytsearch).
export async function buscarVideosYoutube(consulta, limite = 10) {
  const resultado = await ytSearch(consulta);
  return (resultado.videos || []).slice(0, limite).map((v) => ({
    titulo: v.title,
    url: v.url,
    duracion: v.timestamp || "??:??",
    fecha: v.ago || "fecha desconocida",
    miniatura: v.thumbnail || v.image || null,
    canal: v.author?.name || "Desconocido"
  }));
}

function descargarFormato(info, formato) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    ytdl
      .downloadFromInfo(info, { format: formato })
      .on("data", (c) => chunks.push(c))
      .on("end", () => resolve(Buffer.concat(chunks)))
      .on("error", reject);
  });
}

// Descarga el video ya en un formato liviano (360p, con audio incluido) y
// lo re-codifica para asegurar compatibilidad con WhatsApp.
export async function descargarVideoYoutube(link) {
  const info = await ytdl.getInfo(link);
  const duracionMin = parseInt(info.videoDetails.lengthSeconds, 10) / 60;
  if (duracionMin > 20) {
    throw new Error("Ese video dura mas de 20 minutos, muy probable que pese demasiado para WhatsApp.");
  }

  const formato =
    ytdl.chooseFormat(info.formats, { quality: "18" }) || // itag 18 = 360p mp4 con audio, el mas compatible
    ytdl.chooseFormat(info.formats, { filter: "audioandvideo", quality: "highest" });

  const buffer = await descargarFormato(info, formato);

  const pesoMB = buffer.length / (1024 * 1024);
  if (pesoMB > LIMITE_VIDEO_WHATSAPP_MB) {
    throw new Error(`Ese video pesa ${pesoMB.toFixed(1)}MB, demasiado grande para WhatsApp.`);
  }

  return asegurarVideoCompatibleWhatsApp(buffer);
}

// Descarga solo el audio (para .ytaudio, disparado desde el boton "Audio").
export async function descargarAudioYoutube(link) {
  const info = await ytdl.getInfo(link);
  const formato = ytdl.chooseFormat(info.formats, { filter: "audioonly", quality: "highestaudio" });
  return descargarFormato(info, formato);
}

