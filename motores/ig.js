// Motor de descargas de Instagram (fotos, carruseles y reels).
// No tiene comandos propios - solo funciones que los comandos de la carpeta
// "descargas/" van a importar via core.js, igual que db.js, ui.js, etc.
import axios from "axios";
import {
  descargarBuffer,
  asegurarVideoCompatibleWhatsApp,
  asegurarImagenCompatibleWhatsApp,
  LIMITE_VIDEO_WHATSAPP_MB
} from "./descargas-core.js";

export { descargarBuffer, asegurarVideoCompatibleWhatsApp, asegurarImagenCompatibleWhatsApp, LIMITE_VIDEO_WHATSAPP_MB };

const HEADERS_EMBED = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "es-ES,es;q=0.9"
};

function extraerShortcode(link) {
  const match = link.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

function desescaparUnicode(texto) {
  return texto
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\\//g, "/");
}

// Metodo principal: lee la pagina de "embed" publica de Instagram (no
// necesita login) y saca la url de la imagen/video del HTML/JSON incrustado.
async function obtenerViaEmbed(shortcode) {
  const url = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
  const { data: html } = await axios.get(url, { headers: HEADERS_EMBED, timeout: 15000 });

  const medias = [];

  // Carrusel: post con varias fotos/videos adentro.
  const sidecarMatch = html.match(/"edge_sidecar_to_children":\{"edges":(\[.*?\])\}/s);
  if (sidecarMatch) {
    try {
      const edges = JSON.parse(desescaparUnicode(sidecarMatch[1]));
      for (const edge of edges) {
        const node = edge.node;
        if (node.is_video && node.video_url) {
          medias.push({ type: "video", url: desescaparUnicode(node.video_url) });
        } else if (node.display_url) {
          medias.push({ type: "image", url: desescaparUnicode(node.display_url) });
        }
      }
    } catch {
      // Si el JSON vino incompleto o cambio de forma, seguimos con el otro metodo abajo.
    }
  }

  // Post o reel simple (una sola foto o un solo video).
  if (medias.length === 0) {
    const videoMatch = html.match(/"video_url":"([^"]+)"/);
    const imageMatch = html.match(/"display_url":"([^"]+)"/);
    if (videoMatch) {
      medias.push({ type: "video", url: desescaparUnicode(videoMatch[1]) });
    } else if (imageMatch) {
      medias.push({ type: "image", url: desescaparUnicode(imageMatch[1]) });
    }
  }

  return medias;
}

// Metodo de respaldo por si Instagram cambia el formato del embed y el
// metodo de arriba deja de encontrar algo. Usa una API publica externa.
// OJO: las APIs publicas gratuitas se caen o cambian de URL seguido - si
// esta deja de andar, hay que reemplazarla por otra (o por una propia).
async function obtenerViaApiRespaldo(link) {
  const { data } = await axios.get("https://api.ferdev.my.id/downloader/igdl", {
    params: { link },
    timeout: 15000
  });

  const items = data?.data || data?.result || [];
  if (!Array.isArray(items) || items.length === 0) return [];

  return items.map((it) => ({
    type: it.type === "video" || /\.mp4(\?|$)/i.test(it.url) ? "video" : "image",
    url: it.url
  }));
}

// Devuelve un array [{ type: "image"|"video", url }, ...]
export async function obtenerMediaInstagram(link) {
  const shortcode = extraerShortcode(link);
  if (!shortcode) {
    throw new Error("Ese link no parece ser de un post/reel de Instagram.");
  }

  let medias = [];
  try {
    medias = await obtenerViaEmbed(shortcode);
  } catch {
    medias = [];
  }

  if (medias.length === 0) {
    medias = await obtenerViaApiRespaldo(link);
  }

  if (medias.length === 0) {
    throw new Error("No se pudo extraer el contenido (post privado o Instagram cambio su formato).");
  }

  return medias;
}

    
