// Motor único de YouTube: resolver link/búsqueda, info del video, buscar
// varios resultados, y descargar audio o video.
//
// Usa youtubei.js (habla con la API interna de YouTube, InnerTube) en vez
// de @distube/ytdl-core, que scrapeaba el HTML de la página del video y
// se rompía cada vez que YouTube cambiaba ese HTML.
import { Innertube, Platform } from "youtubei.js";
import {
  descargarBuffer,
  asegurarVideoCompatibleWhatsApp,
  combinarVideoAudioWhatsApp,
  LIMITE_VIDEO_WHATSAPP_MB
} from "./descargas-core.js";

// Desde hace unas versiones, youtubei.js ya NO trae incluido un
// interprete de JavaScript para descifrar las URLs de los videos (antes
// si lo traia). Sin esto, TODOS los formatos fallan con "No valid URL to
// decipher" / "you must provide your own JavaScript evaluator". Esto le
// da el evaluador que pide, usando el propio motor de JS de Node
// (new Function), tal como recomienda la documentacion oficial:
// https://ytjs.dev/guide/getting-started.html#providing-a-custom-javascript-interpreter
Platform.shim.eval = async (data, env) => {
  const propiedades = [];
  if (env.n) propiedades.push(`n: exportedVars.nFunction("${env.n}")`);
  if (env.sig) propiedades.push(`sig: exportedVars.sigFunction("${env.sig}")`);
  const codigo = `${data.output}\nreturn { ${propiedades.join(", ")} }`;
  return new Function(codigo)();
};

// youtubei.js tira avisos internos larguísimos ("[YOUTUBEJS][Parser]...")
// cada vez que YouTube agrega un tipo de bloque nuevo que la libreria
// todavia no reconoce. Son inofensivos (sigue funcionando igual) pero
// tapan cualquier otro log util en la terminal - se silencian aca.
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

// Se usa el mismo cliente por defecto que ya funciona para getBasicInfo.
// YouTube viene exigiendo cada vez mas un "PO token" (token anti-bot) para
// el cliente WEB, que es el que usa youtubei.js por defecto - sin eso,
// a veces ni siquiera manda datos utiles para descifrar el formato (por
// eso fallaba TODO con "No valid URL to decipher", incluso con el
// evaluador ya puesto). Los clientes de Android/iOS/TV no piden ese
// token, asi que se prueban en orden hasta que alguno funcione.
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

// Listas de formatos ordenadas del mas pesado/mejor al mas liviano, leidas
// directo de streaming_data (no de chooseFormat, que solo da UN candidato
// y tira error si ese en particular no se puede descifrar).
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

// Prueba descifrar cada formato de la lista, del mejor al peor, y se queda
// con el PRIMERO que funcione. A veces YouTube rompe el descifrado de
// algunos formatos puntuales pero no de todos, asi que en vez de fallar
// con el primero que no anda, se sigue probando antes de rendirse.
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
      // Puede fallar por el decipher, pero tambien por la descarga del
      // buffer o por ffmpeg (asegurarVideoCompatibleWhatsApp) - antes esto
      // se tragaba en silencio y parecia que "ningun formato se pudo
      // descifrar" cuando en realidad el decipher ya habia funcionado.
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
