// Motor único de YouTube: resolver link/búsqueda, info del video, buscar
// varios resultados, y descargar audio o video.
//
// Migrado de @distube/ytdl-core a youtubei.js: ytdl-core scrapea el HTML
// de la página del video (watch.html) y se rompe cada vez que YouTube
// cambia ese HTML (por eso los errores "Error when parsing watch.html" y
// "Failed to find any playable formats"). youtubei.js en cambio habla
// directo con la API interna de YouTube (InnerTube), la misma que usan
// sus apps oficiales, así que es mucho más estable ante esos cambios.
import { Innertube } from "youtubei.js";
import { descargarBuffer, asegurarVideoCompatibleWhatsApp, LIMITE_VIDEO_WHATSAPP_MB } from "./descargas-core.js";

// Una sola sesión de Innertube reutilizada entre llamadas (crearla de
// nuevo cada vez es lento: descarga y parsea el reproductor de YouTube).
let clientePromise = null;
function obtenerCliente() {
  if (!clientePromise) clientePromise = Innertube.create();
  return clientePromise;
}

// Los campos de texto de youtubei.js a veces vienen como string y a veces
// como objeto Text ({ text: "..." }); esto normaliza a string siempre.
function textoDe(valor) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "string") return valor;
  return valor.text ?? String(valor);
}

export function esLinkYoutube(texto) {
  return /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)/i.test(texto);
}

// getInfo/getBasicInfo de youtubei.js piden el ID del video, no la URL completa.
function extraerIdDeLink(link) {
  const m = link.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : link;
}

// Si le pasan un link lo usa directo; si le pasan texto, busca el primer
// resultado en YouTube y devuelve ese link.
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

// Devuelve hasta "limite" resultados de una busqueda (para .ytsearch).
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

async function urlDirectaDeFormato(link, opciones) {
  const yt = await obtenerCliente();
  const info = await yt.getInfo(extraerIdDeLink(link));
  const formato = info.chooseFormat(opciones);
  if (!formato) throw new Error("No encontré ningún formato descargable para ese video.");
  return { formato, url: formato.decipher(yt.session.player), info };
}

// Descarga el video ya en un formato liviano (con audio incluido) y lo
// re-codifica para asegurar compatibilidad con WhatsApp.
export async function descargarVideoYoutube(link) {
  const { url, info } = await urlDirectaDeFormato(link, { type: "video+audio", quality: "best" });

  const duracionMin = (info.basic_info.duration || 0) / 60;
  if (duracionMin > 20) {
    throw new Error("Ese video dura mas de 20 minutos, muy probable que pese demasiado para WhatsApp.");
  }

  const buffer = await descargarBuffer(url);
  const pesoMB = buffer.length / (1024 * 1024);
  if (pesoMB > LIMITE_VIDEO_WHATSAPP_MB) {
    throw new Error(`Ese video pesa ${pesoMB.toFixed(1)}MB, demasiado grande para WhatsApp.`);
  }

  return asegurarVideoCompatibleWhatsApp(buffer);
}

// Descarga solo el audio (para .ytaudio, disparado desde el boton "Audio").
export async function descargarAudioYoutube(link) {
  const { url } = await urlDirectaDeFormato(link, { type: "audio", quality: "best" });
  return descargarBuffer(url);
}
