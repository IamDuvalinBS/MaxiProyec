import fs from "fs";
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
const TIMEOUT_MS = 60 * 1000;
const MAX_MEDIOS = 10;

const REGEX_INSTAGRAM =
  /https?:\/\/(?:www\.)?(?:instagram\.com|instagr\.am)\/[^\s]+/i;

// Claves que NO son el medio principal (miniaturas, avatares, etc.)
const CLAVES_IGNORADAS = /thumb|cover|avatar|profile|pic_url|preview|icon/i;

function limpiarEnlace(texto) {
  const m = texto.match(REGEX_INSTAGRAM);
  return m ? m[0].replace(/[)\]>.,;]+$/, "") : null;
}

function esVideo(url, tipo) {
  if (tipo && /video|reel|mp4/i.test(String(tipo))) return true;
  if (tipo && /image|photo|jpg|jpeg|png|webp/i.test(String(tipo))) return false;
  return /\.mp4(\?|$)/i.test(url) || /\/video\//i.test(url);
}

/**
 * Recorre la respuesta de la API (sin importar su forma exacta) y devuelve
 * una lista [{ url, video }] con los medios encontrados.
 */
function extraerMedios(data) {
  const medios = [];
  const vistos = new Set();

  const agregar = (url, tipo) => {
    if (typeof url !== "string" || !/^https?:\/\//i.test(url)) return;
    if (vistos.has(url)) return;
    vistos.add(url);
    medios.push({ url, video: esVideo(url, tipo) });
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
      // Objeto tipo { url, type } / { download_url, type }
      const urlDirecta = nodo.url || nodo.download_url || nodo.downloadUrl || nodo.link || nodo.src;
      if (typeof urlDirecta === "string" && !CLAVES_IGNORADAS.test(clave)) {
        agregar(urlDirecta, nodo.type || nodo.tipo || nodo.media_type || nodo.mimetype);
        return;
      }

      for (const [k, v] of Object.entries(nodo)) {
        if (CLAVES_IGNORADAS.test(k)) continue;
        recorrer(v, k);
      }
    }
  };

  recorrer(data?.result ?? data?.data ?? data?.medias ?? data?.media ?? data);
  return medios;
}

function extraerInfo(data) {
  const base = data?.result ?? data?.data ?? data ?? {};
  const objeto = Array.isArray(base) ? base[0] || {} : base;

  const autor =
    objeto.username ||
    objeto.author ||
    objeto.owner?.username ||
    objeto.user?.username ||
    null;

  const descripcion =
    objeto.caption || objeto.title || objeto.description || objeto.text || null;

  return {
    autor: typeof autor === "string" ? autor : null,
    descripcion: typeof descripcion === "string" ? descripcion : null
  };
}

async function consultarApi(link) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  try {
    const url = `${API_URL}?url=${encodeURIComponent(link)}&key=${encodeURIComponent(API_KEY)}`;
    const res = await fetch(url, { signal: controlador.signal });

    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error(`La API respondió con un formato inválido (HTTP ${res.status}).`);
    }

    if (!res.ok || data?.status === false || data?.success === false || data?.error) {
      throw new Error(
        data?.message || data?.error || data?.msg || `Error de la API (HTTP ${res.status}).`
      );
    }

    return data;
  } catch (e) {
    if (e.name === "AbortError") throw new Error("La API tardó demasiado en responder.");
    throw e;
  } finally {
    clearTimeout(temporizador);
  }
}

async function enviarMedio({ responder, medio, caption, mentions }) {
  const extra = caption ? { caption, mentions } : {};
  let buffer;

  try {
    buffer = await descargarBuffer(medio.url);
  } catch (e) {
    buffer = null;
  }

  // Primero intenta con el buffer descargado; si falla, deja que WhatsApp lo tome por URL.
  const fuente = buffer && buffer.length ? buffer : { url: medio.url };

  return responder(
    medio.video
      ? { video: fuente, mimetype: "video/mp4", ...extra }
      : { image: fuente, ...extra }
  );
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
            : "Funciona con reels, publicaciones, videos y carruseles."
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

    const consulta = consultarApi(link);
    consulta.catch(() => {});

    await aviso;

    const pausa = (async () => {
      await delayAleatorio(300, 900);
      await simularEscritura(sock, from, 800 + Math.floor(Math.random() * 1200));
    })();
    pausa.catch(() => {});

    let data;
    let medios;

    try {
      data = await consulta;
      medios = extraerMedios(data).slice(0, MAX_MEDIOS);
    } catch (e) {
      return reply({
        text: tarjetaError("No se pudo descargar el contenido de Instagram.", e.message)
      });
    }

    if (medios.length === 0) {
      return reply({
        text: tarjetaError(
          "No se encontró contenido descargable en ese enlace.",
          "Verifica que la publicación sea pública y que el enlace sea correcto."
        )
      });
    }

    await pausa;

    const { autor, descripcion } = extraerInfo(data);
    const resumen = descripcion
      ? descripcion.length > 200
        ? `${descripcion.slice(0, 200).trim()}…`
        : descripcion
      : null;

    const campos = [];
    if (autor) campos.push(campo("👤", "Usuario", `@${autor.replace(/^@/, "")}`));
    if (resumen) campos.push(campo("💭", "Descripción", resumen));
    campos.push(
      campo("📦", "Contenido", medios.length === 1
        ? (medios[0].video ? "Video" : "Foto")
        : `${medios.length} archivos`)
    );
    campos.push(campo("🔗", "Link", link));

    const caption = tarjetaDescarga({
      emoji: "📸",
      titulo: "INSTAGRAM DOWNLOAD",
      sender,
      campos
    });

    try {
      for (let i = 0; i < medios.length; i++) {
        const enviado = await enviarMedio({
          responder,
          medio: medios[i],
          caption: i === 0 ? caption : undefined,
          mentions: [sender]
        });

        // Solo se cachea cuando es un único archivo (los carruseles se reenvían completos).
        if (medios.length === 1) guardarMedioEnviado(claveCache, enviado);

        if (i < medios.length - 1) await delayAleatorio(600, 1400);
      }
    } catch (e) {
      await reply({
        text: tarjetaError("No se pudo enviar el contenido de Instagram.", e.message)
      });
    }
  }
};
