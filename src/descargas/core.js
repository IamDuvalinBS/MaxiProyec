import axios from "axios";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

const execFileAsync = promisify(execFile);

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
};

export const LIMITE_VIDEO_WHATSAPP_MB = 60;

const PERFILES_H264_OK = new Set(["Baseline", "Constrained Baseline", "Main", "High"]);

async function analizarPistas(rutaArchivo) {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "error",
      "-print_format", "json",
      "-show_streams",
      rutaArchivo
    ]);
    const data = JSON.parse(stdout);
    const video = data.streams?.find((s) => s.codec_type === "video") || null;
    const audio = data.streams?.find((s) => s.codec_type === "audio") || null;
    return { video, audio };
  } catch (e) {
    console.log(`[descargas-core] No pude analizar el archivo con ffprobe: ${e.message}`);
    return { video: null, audio: null };
  }
}

export async function descargarBuffer(url) {
  const { data } = await axios.get(url, {
    responseType: "arraybuffer",
    headers: HEADERS,
    timeout: 30000,
    maxContentLength: 100 * 1024 * 1024
  });
  return Buffer.from(data);
}

export async function descargarATemporal(url, ext) {
  const tmpPath = path.join(os.tmpdir(), `dl_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok || !res.body) throw new Error(`No se pudo descargar el archivo (HTTP ${res.status}).`);
  await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(tmpPath));
  return tmpPath;
}

function comoRutaTemporal(entrada, ext) {
  if (typeof entrada === "string") return entrada;
  const ruta = path.join(os.tmpdir(), `dl_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
  fs.writeFileSync(ruta, entrada);
  return ruta;
}

const CODEC_VIDEO_RAPIDO = [
  "-c:v", "libx264",
  "-preset", "ultrafast",
  "-crf", "23",
  "-profile:v", "main",
  "-level", "4.0",
  "-pix_fmt", "yuv420p",
  "-threads", "0"
];
const CODEC_AUDIO_AAC = ["-c:a", "aac", "-b:a", "192k"];

export async function asegurarVideoCompatibleWhatsApp(entradaOriginal) {
  const tmp = os.tmpdir();
  const sufijo = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const entrada = comoRutaTemporal(entradaOriginal, "mp4");
  const salida = path.join(tmp, `dc_out_${sufijo}.mp4`);
  const inicio = Date.now();

  try {
    const { video, audio } = await analizarPistas(entrada);

    const videoOk = !!video && video.codec_name === "h264" && video.pix_fmt === "yuv420p" &&
      (!video.profile || PERFILES_H264_OK.has(video.profile));
    const audioOk = !!audio && audio.codec_name === "aac";

    // Se copia lo que ya es compatible y solo se re-codifica lo que haga falta.
    const planes = [];
    if (videoOk && audioOk) planes.push({ nombre: "copiando todo", args: ["-c", "copy"] });
    if (videoOk && audio) planes.push({ nombre: "copiando video, convirtiendo audio", args: ["-c:v", "copy", ...CODEC_AUDIO_AAC] });
    if (audioOk && video) planes.push({ nombre: "convirtiendo video, copiando audio", args: [...CODEC_VIDEO_RAPIDO, "-c:a", "copy"] });
    planes.push({ nombre: "convirtiendo video y audio", args: [...CODEC_VIDEO_RAPIDO, ...CODEC_AUDIO_AAC] });

    for (const plan of planes) {
      try {
        await execFileAsync("ffmpeg", ["-y", "-i", entrada, ...plan.args, "-movflags", "+faststart", salida]);
        console.log(`[descargas-core] Video listo (${plan.nombre}) en ${((Date.now() - inicio) / 1000).toFixed(1)}s`);
        return fs.readFileSync(salida);
      } catch (e) {
        console.log(`[descargas-core] Falló "${plan.nombre}": ${String(e.message).split("\n")[0]}`);
        if (fs.existsSync(salida)) fs.unlinkSync(salida);
      }
    }
    throw new Error("ffmpeg no pudo procesar el video");
  } finally {
    if (fs.existsSync(entrada)) fs.unlinkSync(entrada);
    if (fs.existsSync(salida)) fs.unlinkSync(salida);
  }
}

export async function combinarVideoAudioWhatsApp(bufferVideo, bufferAudio) {
  const tmp = os.tmpdir();
  const sufijo = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const entradaVideo = path.join(tmp, `dv_in_${sufijo}.mp4`);
  const entradaAudio = path.join(tmp, `da_in_${sufijo}.m4a`);
  const salida = path.join(tmp, `dv_out_${sufijo}.mp4`);

  fs.writeFileSync(entradaVideo, bufferVideo);
  fs.writeFileSync(entradaAudio, bufferAudio);

  try {
    await execFileAsync("ffmpeg", [
      "-y",
      "-i", entradaVideo,
      "-i", entradaAudio,
      "-map", "0:v:0",
      "-map", "1:a:0",
      ...CODEC_VIDEO_RAPIDO,
      ...CODEC_AUDIO_AAC,
      "-movflags", "+faststart",
      "-shortest",
      salida
    ]);
    return fs.readFileSync(salida);
  } finally {
    if (fs.existsSync(entradaVideo)) fs.unlinkSync(entradaVideo);
    if (fs.existsSync(entradaAudio)) fs.unlinkSync(entradaAudio);
    if (fs.existsSync(salida)) fs.unlinkSync(salida);
  }
}

export async function consultarApiDescarga(apiUrl, link, paramNombre = "url") {
  const { data } = await axios.get(apiUrl, {
    params: { [paramNombre]: link },
    headers: HEADERS,
    timeout: 20000
  });

  if (!data || data.status === false) {
    throw new Error(data?.message || `La API ${apiUrl} no devolvió un resultado válido.`);
  }
  return data;
}

export function extraerEnlaceDescarga(json) {
  const candidatos = [
    json?.result?.url,
    json?.result?.download,
    json?.result?.download_url,
    json?.result?.dl,
    json?.result?.link,
    json?.data?.url,
    json?.data?.download,
    json?.url,
    json?.download,
    json?.link
  ];
  const enlace = candidatos.find(Boolean);
  if (!enlace) throw new Error("No encontré el enlace de descarga en la respuesta de la API.");
  return enlace;
}

export async function asegurarAudioCompatibleWhatsApp(entradaOriginal) {
  const tmp = os.tmpdir();
  const sufijo = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const entrada = comoRutaTemporal(entradaOriginal, "audio");

  try {
    const { audio } = await analizarPistas(entrada);

    if (audio?.codec_name === "mp3") {
      console.log("[descargas-core] Audio ya era mp3, se devuelve sin reencodear");
      return fs.readFileSync(entrada);
    }

    const salida = path.join(tmp, `da_out_${sufijo}.mp3`);
    try {
      await execFileAsync("ffmpeg", ["-y", "-i", entrada, "-c:a", "libmp3lame", "-b:a", "192k", salida]);
      return fs.readFileSync(salida);
    } finally {
      if (fs.existsSync(salida)) fs.unlinkSync(salida);
    }
  } finally {
    if (fs.existsSync(entrada)) fs.unlinkSync(entrada);
  }
}

export async function asegurarImagenCompatibleWhatsApp(entradaOriginal) {
  const tmp = os.tmpdir();
  const sufijo = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const entrada = comoRutaTemporal(entradaOriginal, "img");
  const salida = path.join(tmp, `di_out_${sufijo}.jpg`);

  try {
    await execFileAsync("ffmpeg", [
      "-y",
      "-i", entrada,
      "-q:v", "2",
      "-pix_fmt", "yuvj420p",
      salida
    ]);
    return fs.readFileSync(salida);
  } finally {
    if (fs.existsSync(entrada)) fs.unlinkSync(entrada);
    if (fs.existsSync(salida)) fs.unlinkSync(salida);
  }
      }
