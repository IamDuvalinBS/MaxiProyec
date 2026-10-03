import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";

const execFileAsync = promisify(execFile);
const PERFILES_H264_COMPATIBLES = new Set(["Baseline", "Constrained Baseline", "Main", "High"]);

function rutaTemporal(extension) {
  return path.join(os.tmpdir(), `vid_${Date.now()}_${Math.random().toString(36).slice(2)}.${extension}`);
}

function borrar(ruta) {
  try {
    if (ruta && fs.existsSync(ruta)) fs.unlinkSync(ruta);
  } catch (e) {
    console.log(`[video] No se pudo borrar ${ruta}: ${e.message}`);
  }
}

async function analizarPistas(ruta) {
  try {
    const { stdout } = await execFileAsync("ffprobe", ["-v", "error", "-print_format", "json", "-show_streams", ruta]);
    const datos = JSON.parse(stdout);
    return {
      video: datos.streams?.find((s) => s.codec_type === "video") || null,
      audio: datos.streams?.find((s) => s.codec_type === "audio") || null
    };
  } catch (e) {
    console.log(`[video] No se pudo analizar el archivo con ffprobe: ${e.message}`);
    return { video: null, audio: null };
  }
}

function esCompatible(video, audio) {
  if (!video || !audio) return false;
  if (video.codec_name !== "h264" || video.pix_fmt !== "yuv420p") return false;
  if (video.profile && !PERFILES_H264_COMPATIBLES.has(video.profile)) return false;
  return audio.codec_name === "aac";
}

export async function prepararVideoEnDisco(entrada) {
  const salida = rutaTemporal("mp4");
  const limpiar = () => borrar(salida);

  try {
    const { video, audio } = await analizarPistas(entrada);

    if (esCompatible(video, audio)) {
      try {
        await execFileAsync("ffmpeg", ["-y", "-i", entrada, "-c", "copy", "-movflags", "+faststart", salida]);
        borrar(entrada);
        return { ruta: salida, limpiar };
      } catch (e) {
        console.log(`[video] El remuxeo rápido falló, se re-codifica: ${e.message}`);
      }
    }

    await execFileAsync("ffmpeg", [
      "-y",
      "-i", entrada,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-profile:v", "baseline",
      "-level", "3.0",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      salida
    ]);
    borrar(entrada);
    return { ruta: salida, limpiar };
  } catch (e) {
    borrar(entrada);
    borrar(salida);
    throw e;
  }
}
