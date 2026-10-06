import axios from "axios";
import { descargarBuffer } from "./core.js";

const HEADERS_EMBED = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "es-ES,es;q=0.9"
};

function extraerShortcode(link) {
  const m = link.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

function desescaparUnicode(texto) {
  return texto.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))).replace(/\\\//g, "/");
}

async function obtenerViaEmbed(shortcode) {
  const url = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
  const { data: html } = await axios.get(url, { headers: HEADERS_EMBED, timeout: 15000 });

  const medias = [];
  const sidecarMatch = html.match(/"edge_sidecar_to_children":\{"edges":(\[.*?\])\}/s);
  if (sidecarMatch) {
    try {
      const edges = JSON.parse(desescaparUnicode(sidecarMatch[1]));
      for (const edge of edges) {
        const node = edge.node;
        if (node.is_video && node.video_url) medias.push({ type: "video", url: desescaparUnicode(node.video_url) });
        else if (node.display_url) medias.push({ type: "image", url: desescaparUnicode(node.display_url) });
      }
    } catch (e) {
    }
  }

  if (medias.length === 0) {
    const videoMatch = html.match(/"video_url":"([^"]+)"/);
    const imageMatch = html.match(/"display_url":"([^"]+)"/);
    if (videoMatch) medias.push({ type: "video", url: desescaparUnicode(videoMatch[1]) });
    else if (imageMatch) medias.push({ type: "image", url: desescaparUnicode(imageMatch[1]) });
  }
  return medias;
}

// Respaldo por si Instagram cambia el formato del embed. API pública de
// terceros: si deja de responder, hay que reemplazarla por otra.
async function obtenerViaApiRespaldo(link) {
  const { data } = await axios.get("https://api.ferdev.my.id/downloader/igdl", { params: { link }, timeout: 15000 });
  const items = data?.data || data?.result || [];
  if (!Array.isArray(items) || items.length === 0) return [];
  return items.map((it) => ({ type: it.type === "video" || /\.mp4(\?|$)/i.test(it.url) ? "video" : "image", url: it.url }));
}

export async function obtenerMediaInstagram(link) {
  const shortcode = extraerShortcode(link);
  if (!shortcode) throw new Error("Ese link no parece ser de un post/reel de Instagram.");

  let medias = [];
  try {
    medias = await obtenerViaEmbed(shortcode);
  } catch (e) {
    medias = [];
  }
  if (medias.length === 0) medias = await obtenerViaApiRespaldo(link);
  if (medias.length === 0) throw new Error("No se pudo extraer el contenido (post privado o Instagram cambió su formato).");
  return medias;
}

export { descargarBuffer };
