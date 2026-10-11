import { descargarBuffer } from "../../descargas/core.js";
import { delayAleatorio, simularEscritura } from "../../../motores/antiban.js";
import { reenviarCacheado, guardarMedioEnviado } from "../../../motores/cache-medios.js";
import {
  tarjetaDescarga,
  tarjetaUso,
  tarjetaError,
  campo
} from "../../descargas/tarjetas.js";

const API_URL = "https://astabot.hidenplay.net/api/v1/dl/instagram";
const API_KEY = process.env.ASTA_API_KEY || "ASTA-7C5O6EF95JIHVZTWNZ55";
const TIMEOUT_MS = 90 * 1000;
const MAX_MEDIOS = 10;

const REGEX_INSTAGRAM =
  /https?:\/\/(?:www\.)?(?:instagram\.com|instagr\.am)\/[^\s]+/i;

const CLAVES_IGNORADAS = /thumb|cover|avatar|profile|pic_url|preview|icon/i;

function limpiarEnlace(texto) {
  const m = texto.match(REGEX_INSTAGRAM);
  return m ? m[0].replace(/[)\]>.,;]+$/, "") : null;
}

// Detecta el tipo real del archivo por sus primeros bytes.
function detectarMimetype(buffer, cabecera = "") {
  const tipo = String(cabecera).split(";")[0].trim().toLowerCase();
  if (tipo.startsWith("video/") || tipo.startsWith("image/")) return tipo;

  if (buffer.length > 12) {
    if (buffer.slice(4, 8).toString("ascii") === "ftyp") return "video/mp4";
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";
    if (buffer.slice(1, 4).toString("ascii") === "PNG") return "image/png";
    if (
      buffer.slice(0, 4).toString("ascii") === "RIFF" &&
      buffer.slice(8, 12).toString("ascii") === "WEBP"
    ) return "image/webp";
    if (buffer.slice(0, 4).toString("hex") === "1a45dfa3") return "video/webm";
  }

  return null;
}

function esVideoPorUrl(url, tipo) {
  if (tipo && /video|reel|mp4/i.test(String(tipo))) return true;
  if (tipo && /image|photo|jpg|jpeg|png|webp/i.test(String(tipo))) return false;
  return /\.mp4(\?|$)/i.test(url) || /\/video\//i.test(url);
}

// Por si la API responde JSON con enlaces en lugar del archivo.
function extraerMediosDeJson(data) {
  const medios = [];
  const vistos = new Set();

  const agregar = (url, tipo) => {
    if (typeof url !== "string" || !/^https?:\/\//i.test(url) || vistos.has(url)) return;
    vistos.add(url);
    medios.push({ url, video: esVideoPorUrl(url, tipo) });
  };

  const recorrer = (nodo, clave = "") => {
    if (!nodo) return;
    if (typeof nodo === "string") {
      if (!CLAVES_IGNORADAS.test(clave)) agregar(nodo, null);
      return;
    }
    if (Array.isArray(nodo)) {
      for (const item of nodo) recorrer(item, clave);
      return;
    }
    if (typeof nodo === "object") {
      const directa = nodo.url || nodo.download_url || nodo.downloadUrl || nodo.link || nodo.src;
      if (typeof directa === "string" && !CLAVES_IGNORADAS.test(clave)) {
        agregar(directa, nodo.type || nodo.tipo || nodo.media_type || nodo.mimetype);
        return;
      }
      for (const [k, v] of Object.entries(nodo)) {
        if (!CLAVES_IGNORADAS.test(k)) recorrer(v, k);
      }
    }
  };

  recorrer(data?.result ?? data?.data ?? data?.medias ?? data?.media ?? data);
  return medios;
}

/**
 * Consulta la API. Devuelve una lista de archivos [{ buffer, mimetype }].
 * La API responde normalmente con el archivo directo (video/imagen);
 * si responde JSON con enlaces, los descarga uno por uno.
 */
async function descargarDeInstagram(link) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  try {
    const url = `${API_URL}?url=${encodeURIComponent(link)}&key=${encodeURIComponent(API_KEY)}`;
    const res = await fetch(url, { signal: controlador.signal });
    const cabecera = res.headers.get("content-type") || "";
    const cuerpo = Buffer.from(await res.arrayBuffer());

    const mimetype = detectarMimetype(cuerpo, cabecera);

    // Caso normal: la API entrega el archivo.
    if (res.ok && mimetype && cuerpo.length > 0) {
      return [{ buffer: cuerpo, mimetype }];
    }

    // Caso alterno: JSON (con enlaces o con un error).
    let data = null;
    try {
      data = JSON.parse(cuerpo.toString("utf8"));
    } catch (e) {}

    if (!res.ok || data?.status === false || data?.success === false || data?.error) {
      throw new Error(
        data?.message || data?.error || data?.msg || `Error de la API (HTTP ${res.status}).`
      );
    }

    if (!data) throw new Error("La API devolvió una respuesta que no es un video ni una imagen.");

    const medios = extraerMediosDeJson(data).slice(0, MAX_MEDIOS);
    if (medios.length === 0) throw new Error("No se encontró contenido descargable en ese enlace.");

    const archivos = [];
    for (const medio of medios) {
      const buffer = await descargarBuffer(medio.url);
      archivos.push({
        buffer,
        mimetype: detectarMimetype(buffer) || (medio.video ? "video/mp4" : "image/jpeg")
      });
    }
    return archivos;
  } catch (e) {
    if (e.name === "AbortError") throw new Error("La API tardó demasiado en responder.");
    throw e;
  } finally {
    clearTimeout(temporizador);
  }
}

export default {
  names: [".instagram", ".ig", ".igdl", ".instagramdl"],
  usage: ".instagram <enlace de Instagram>",
  desc: "Descarga videos, reels y fotos de Instagram a partir de su enlace",
  category: "Descargas",

  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const responder = (contenido) => sock.sendMessage(from, contenido, { quoted: msg });

    const entrada = cleanText.trim().split(/\s+/).slice(1).join(" ");
    const link = limpiarEnlace(entrada);

    if (!entrada || !link) {
      return reply({
        text: tarjetaUso({
          comando: ".instagram <enlace>",
          ejemplo: ".instagram https://www.instagram.com/reel/xxxxxxxxxxx/",
          nota: entrada
            ? "Ese enlace no parece ser de Instagram."
            : "Funciona con reels, publicaciones y videos."
        }),
        mentions: [sender]
      });
    }

    const claveCache = `ig:${link}`;
    if (await reenviarCacheado(sock, from, claveCache, msg)) return;

    const aviso = reply({
      text: tarjetaDescarga({
        emoji: "⏳",
        titulo: "INSTAGRAM DOWNLOAD",
        sender,
        campos: [campo("🔗", "Link", link)],
        nota: "Procesando la solicitud. Esto puede tardar unos segundos."
      }),
      mentions: [sender]
    }).catch(() => {});

    const descarga = descargarDeInstagram(link);
    descarga.catch(() => {});

    await aviso;

    const pausa = (async () => {
      await delayAleatorio(300, 900);
      await simularEscritura(sock, from, 800 + Math.floor(Math.random() * 1200));
    })();
    pausa.catch(() => {});

    let archivos;

    try {
      archivos = await descarga;
    } catch (e) {
      return reply({
        text: tarjetaError("No se pudo descargar el contenido de Instagram.", e.message)
      });
    }

    await pausa;

    const caption = tarjetaDescarga({
      emoji: "📸",
      titulo: "INSTAGRAM DOWNLOAD",
      sender,
      campos: [
        campo(
          "📦",
          "Contenido",
          archivos.length === 1
            ? (archivos[0].mimetype.startsWith("video/") ? "Video" : "Foto")
            : `${archivos.length} archivos`
        ),
        campo("🔗", "Link", link)
      ]
    });

    try {
      for (let i = 0; i < archivos.length; i++) {
        const { buffer, mimetype } = archivos[i];
        const extra = i === 0 ? { caption, mentions: [sender] } : {};

        const enviado = await responder(
          mimetype.startsWith("video/")
            ? { video: buffer, mimetype: "video/mp4", ...extra }
            : { image: buffer, ...extra }
        );

        if (archivos.length === 1) guardarMedioEnviado(claveCache, enviado);
        if (i < archivos.length - 1) await delayAleatorio(600, 1400);
      }
    } catch (e) {
      await reply({
        text: tarjetaError("No se pudo enviar el contenido de Instagram.", e.message)
      });
    }
  }
};
