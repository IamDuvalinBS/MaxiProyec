// Motor de descargas para redes sociales varias (X/Twitter, TikTok,
// Facebook, Pinterest, Reddit). Reusa las funciones de compatibilidad con
// WhatsApp que ya viven en descargas-core.js, para no repetir codigo.
import axios from "axios";
import ffmpegPath from "ffmpeg-static";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";
import {
  descargarBuffer,
  asegurarVideoCompatibleWhatsApp,
  asegurarImagenCompatibleWhatsApp,
  LIMITE_VIDEO_WHATSAPP_MB
} from "./descargas-core.js";

export { descargarBuffer, asegurarVideoCompatibleWhatsApp, asegurarImagenCompatibleWhatsApp, LIMITE_VIDEO_WHATSAPP_MB };

const execFileAsync = promisify(execFile);

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
};

/* ==================== X / TWITTER ==================== */

function extraerTweetId(link) {
  const m = link.match(/(?:twitter|x)\.com\/[^/]+\/status\/(\d+)/i);
  return m ? m[1] : null;
}

// Usa la API de sindicacion publica que el propio X usa para sus embeds
// (la que arma la vista previa de un tweet incrustado en otras webs).
export async function obtenerMediaTwitter(link) {
  const id = extraerTweetId(link);
  if (!id) throw new Error("Ese link no parece ser de un tweet/post de X valido.");

  const { data } = await axios.get(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=es`, {
    headers: HEADERS,
    timeout: 15000
  });

  const medias = [];
  if (data.video) {
    const variantes = (data.video.variants || []).filter((v) => v.type === "video/mp4");
    variantes.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    if (variantes[0]) medias.push({ type: "video", url: variantes[0].src });
  } else if (data.photos) {
    for (const foto of data.photos) medias.push({ type: "image", url: foto.url });
  }

  if (medias.length === 0) throw new Error("Ese tweet no tiene foto ni video, o es privado.");
  return medias;
}

/* ==================== TIKTOK ==================== */

// tikwm.com es una API publica muy usada por bots de este estilo para
// resolver el link real sin marca de agua. Si algun dia se cae, hay que
// reemplazarla por otra equivalente.
export async function obtenerMediaTikTok(link) {
  const { data } = await axios.get("https://tikwm.com/api/", {
    params: { url: link, hd: 1 },
    headers: HEADERS,
    timeout: 15000
  });

  const info = data?.data;
  if (!info) throw new Error("No se pudo procesar ese link de TikTok.");

  if (info.images && info.images.length > 0) {
    return info.images.map((url) => ({ type: "image", url })); // post tipo carrusel de fotos
  }

  const videoUrl = info.hdplay || info.play;
  if (!videoUrl) throw new Error("No se encontro el video de ese TikTok.");
  return [{ type: "video", url: videoUrl }];
}

/* ==================== FACEBOOK ==================== */

export async function obtenerMediaFacebook(link) {
  const { data: html } = await axios.get(link, { headers: HEADERS, timeout: 15000 });

  const hd = html.match(/"browser_native_hd_url":"([^"]+)"/);
  const sd = html.match(/"browser_native_sd_url":"([^"]+)"/);
  const crudo = (hd || sd)?.[1];

  if (!crudo) throw new Error("No se pudo encontrar el video (puede ser privado, o el link no es de un video).");

  const url = crudo.replace(/\\u0025/g, "%").replace(/\\\//g, "/");
  return [{ type: "video", url }];
}

/* ==================== PINTEREST ==================== */

export async function obtenerMediaPinterest(link) {
  const { data: html } = await axios.get(link, { headers: HEADERS, timeout: 15000 });

  const videoMatch = html.match(/<meta property="og:video" content="([^"]+)"/);
  const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);

  if (videoMatch) return [{ type: "video", url: videoMatch[1] }];
  if (imageMatch) return [{ type: "image", url: imageMatch[1] }];

  throw new Error("No se pudo encontrar imagen ni video en ese pin.");
}

/* ==================== REDDIT ==================== */

async function existeUrl(url) {
  try {
    await axios.head(url, { headers: HEADERS, timeout: 8000 });
    return true;
  } catch {
    return false;
  }
}

async function fusionarVideoYAudio(videoBuffer, audioBuffer) {
  const tmp = os.tmpdir();
  const sufijo = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const v = path.join(tmp, `rd_v_${sufijo}.mp4`);
  const a = path.join(tmp, `rd_a_${sufijo}.mp4`);
  const salida = path.join(tmp, `rd_out_${sufijo}.mp4`);

  fs.writeFileSync(v, videoBuffer);
  fs.writeFileSync(a, audioBuffer);

  try {
    await execFileAsync(ffmpegPath, [
      "-y", "-i", v, "-i", a,
      "-c:v", "copy", "-c:a", "aac",
      "-map", "0:v:0", "-map", "1:a:0",
      "-shortest", salida
    ]);
    return fs.readFileSync(salida);
  } finally {
    [v, a, salida].forEach((f) => fs.existsSync(f) && fs.unlinkSync(f));
  }
}

// Reddit separa el video y el audio en dos archivos distintos (formato
// DASH). Esta funcion devuelve la info y, si hace falta, ya deja el buffer
// final fusionado con audio y todo.
export async function obtenerVideoReddit(link) {
  const urlJson = link.split("?")[0].replace(/\/?$/, ".json");
  const { data } = await axios.get(urlJson, { headers: HEADERS, timeout: 15000 });

  const post = data?.[0]?.data?.children?.[0]?.data;
  if (!post) throw new Error("No se pudo leer ese post de Reddit.");

  if (post.secure_media?.reddit_video?.fallback_url) {
    const videoUrl = post.secure_media.reddit_video.fallback_url;
    const videoBuffer = await descargarBuffer(videoUrl);

    // El audio suele vivir en la misma carpeta con el nombre "DASH_audio.mp4"
    const audioUrl = videoUrl.replace(/DASH_\d+\.mp4.*/, "DASH_audio.mp4");
    if (await existeUrl(audioUrl)) {
      const audioBuffer = await descargarBuffer(audioUrl);
      return { type: "video", buffer: await fusionarVideoYAudio(videoBuffer, audioBuffer) };
    }
    return { type: "video", buffer: videoBuffer }; // clip sin audio (algunos no tienen)
  }

  if (post.url && /\.(jpg|jpeg|png|gif)$/i.test(post.url)) {
    return { type: "image", buffer: await descargarBuffer(post.url) };
  }

  throw new Error("Ese post no tiene un video o imagen descargable directamente (puede ser un link externo o solo texto).");
    }

