import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";

const execFileAsync = promisify(execFile);
const OPCIONES_FFMPEG = { timeout: 45 * 60 * 1000, killSignal: "SIGKILL", maxBuffer: 10 * 1024 * 1024 };
const FFMPEG_BASE = ["-hide_banner", "-loglevel", "error", "-nostdin"];
// Por encima de este peso no se re-codifica (tardaría horas en un celular): se manda tal cual, ya remuxado a un mp4 válido.
const MAX_RECODIFICAR_MB = 500;
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

// Deja el video como un MP4 real (H264 + AAC, "faststart") que WhatsApp sí abre. Trabaja siempre sobre el disco.
// Antes, los videos grandes se mandaban tal cual salían del servicio de descarga (a veces WebM/AV1 con extensión .mp4)
// y WhatsApp los marcaba como "formato inusual". Ahora siempre se revisan y, si hace falta, se arreglan.
export async function prepararVideoEnDisco(entrada) {
  const salida = rutaTemporal("mp4");
  const limpiar = () => borrar(salida);
  const pesoMB = fs.statSync(entrada).size / (1024 * 1024);

  const ok = () => {
    const peso = fs.existsSync(salida) ? fs.statSync(salida).size : 0;
    if (peso < 1024) throw new Error("ffmpeg generó un archivo vacío");
  };

  try {
    const { video, audio } = await analizarPistas(entrada);
    if (!video) throw new Error("el archivo descargado no contiene video");

    // 1) Ya es compatible: solo se reempaqueta como mp4 limpio (segundos, sin perder calidad).
    // 2) Video compatible pero audio no (opus, etc.): se copia el video y se convierte solo el audio.
    const videoOk = video.codec_name === "h264" && video.pix_fmt === "yuv420p" && (!video.profile || PERFILES_H264_COMPATIBLES.has(video.profile));
    const planes = [];
    if (videoOk && audio && audio.codec_name === "aac") planes.push(["-c", "copy"]);
    if (videoOk && audio) planes.push(["-c:v", "copy", "-c:a", "aac", "-b:a", "160k"]);
    if (videoOk && !audio) planes.push(["-c:v", "copy"]);

    for (const args of planes) {
      try {
        await execFileAsync("ffmpeg", [...FFMPEG_BASE, "-y", "-i", entrada, ...args, "-movflags", "+faststart", salida], OPCIONES_FFMPEG);
        ok();
        borrar(entrada);
        return { ruta: salida, limpiar };
      } catch (e) {
        console.log(`[video] El remuxeo rápido falló, se prueba otra forma: ${String(e.message).split("\n")[0]}`);
        borrar(salida);
      }
    }

    // 3) Hay que re-codificar el video (AV1, VP9, HEVC...).
    if (pesoMB > MAX_RECODIFICAR_MB) {
      console.log(`[video] ${pesoMB.toFixed(0)} MB con códec no compatible: demasiado grande para re-codificar, se manda sin convertir`);
      return { ruta: entrada, limpiar: () => borrar(entrada), sinConvertir: true };
    }
    await execFileAsync("ffmpeg", [
      ...FFMPEG_BASE, "-y",
      "-i", entrada,
      "-map", "0:v:0", ...(audio ? ["-map", "0:a:0"] : []),
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "26",
      "-profile:v", "main",
      "-level", "4.0",
      "-pix_fmt", "yuv420p",
      ...(audio ? ["-c:a", "aac", "-b:a", "128k"] : []),
      "-movflags", "+faststart",
      salida
    ], OPCIONES_FFMPEG);
    ok();
    borrar(entrada);
    return { ruta: salida, limpiar };
  } catch (e) {
    borrar(salida);
    // Si ffmpeg no está o falla, no se pierde la descarga: se devuelve el archivo original.
    if (fs.existsSync(entrada)) {
      console.log(`[video] No se pudo preparar el video (${String(e.message).split("\n")[0]}); se manda el original`);
      return { ruta: entrada, limpiar: () => borrar(entrada), sinConvertir: true };
    }
    throw e;
  }
}
