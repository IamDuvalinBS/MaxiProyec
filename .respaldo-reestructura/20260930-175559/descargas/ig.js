// Motor de descargas de Instagram (fotos, carruseles y reels).
// No tiene comandos propios - solo funciones que los comandos de la carpeta
// "descargas/" van a importar via core.js, igual que db.js, ui.js, etc.
import axios from "axios";
import ffmpegPath from "ffmpeg-static";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

const HEADERS_EMBED = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "es-ES,es;q=0.9"
};

// Margen prudente: WhatsApp puede fallar mandando videos muy pesados.
export const LIMITE_VIDEO_WHATSAPP_MB = 60;

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

export async function descargarBuffer(url) {
  const { data } = await axios.get(url, {
    responseType: "arraybuffer",
    headers: HEADERS_EMBED,
    timeout: 30000,
    maxContentLength: 100 * 1024 * 1024 // corta si algo viene absurdamente pesado
  });
  return Buffer.from(data);
}

// Reencoda el video a h264/aac + faststart para que WhatsApp SIEMPRE lo
// reconozca como video reproducible (y no lo mande como documento o roto).
export async function asegurarVideoCompatibleWhatsApp(bufferEntrada) {
  const tmp = os.tmpdir();
  const entrada = path.join(tmp, `ig_in_${Date.now()}_${Math.random().toString(36).slice(2)}.mp4`);
  const salida = path.join(tmp, `ig_out_${Date.now()}_${Math.random().toString(36).slice(2)}.mp4`);

  fs.writeFileSync(entrada, bufferEntrada);

  try {
    await execFileAsync(ffmpegPath, [
      "-y",
      "-i", entrada,
      "-c:v", "libx264",
      "-profile:v", "baseline",
      "-level", "3.0",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      salida
    ]);
    return fs.readFileSync(salida);
  } finally {
    if (fs.existsSync(entrada)) fs.unlinkSync(entrada);
    if (fs.existsSync(salida)) fs.unlinkSync(salida);
  }
}

// Pasa la imagen a JPEG "plano" para evitar problemas con webp/formatos
// raros que a veces manda Instagram y que WhatsApp no siempre digiere bien.
export async function asegurarImagenCompatibleWhatsApp(bufferEntrada) {
  return sharp(bufferEntrada).jpeg({ quality: 90 }).toBuffer();
}
  
