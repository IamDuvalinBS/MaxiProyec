// Funciones compartidas de descarga/compatibilidad usadas por todos los
// motores (redes.js, ig.js, etc). Centralizadas aca para no repetir codigo.
import axios from "axios";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";

const execFileAsync = promisify(execFile);

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
};

// Margen prudente: WhatsApp puede fallar mandando videos muy pesados.
export const LIMITE_VIDEO_WHATSAPP_MB = 60;

// Perfiles de H264 que WhatsApp reproduce sin problema. Si el video que
// bajamos ya viene en alguno de estos (+ yuv420p + audio aac), no hace
// falta re-codificarlo: alcanza con "remuxearlo" (reordenar el archivo
// para que el moov atom quede al principio, sin tocar los datos de video
// ni audio). Un remux tarda segundos; un re-encode completo puede tardar
// varios minutos en un telefono - por eso vale la pena distinguir los dos
// casos en vez de reencodear siempre "por las dudas".
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
    // Si ffprobe no esta instalado o falla, simplemente no sabemos si es
    // compatible - se trata como "no compatible" y se re-codifica como
    // antes (no rompe nada, solo pierde la optimizacion de velocidad).
    console.log(`[descargas-core] No pude analizar el archivo con ffprobe: ${e.message}`);
    return { video: null, audio: null };
  }
}

function videoYaCompatible(video, audio) {
  if (!video || !audio) return false;
  if (video.codec_name !== "h264") return false;
  if (video.pix_fmt !== "yuv420p") return false;
  if (video.profile && !PERFILES_H264_OK.has(video.profile)) return false;
  if (audio.codec_name !== "aac") return false;
  return true;
}

export async function descargarBuffer(url) {
  const { data } = await axios.get(url, {
    responseType: "arraybuffer",
    headers: HEADERS,
    timeout: 30000,
    maxContentLength: 100 * 1024 * 1024 // corta si algo viene absurdamente pesado
  });
  return Buffer.from(data);
}

// Reencoda el video a h264/aac + faststart para que WhatsApp SIEMPRE lo
// reconozca como video reproducible (y no lo mande como documento o roto).
// Usa el "ffmpeg" del sistema (PATH) en vez de ffmpeg-static, para que
// funcione igual en cualquier dispositivo/Termux sin depender de un
// binario precompilado que a veces no existe para esa arquitectura.
export async function asegurarVideoCompatibleWhatsApp(bufferEntrada) {
  const tmp = os.tmpdir();
  const sufijo = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const entrada = path.join(tmp, `dc_in_${sufijo}.mp4`);
  const salida = path.join(tmp, `dc_out_${sufijo}.mp4`);

  fs.writeFileSync(entrada, bufferEntrada);

  try {
    const { video, audio } = await analizarPistas(entrada);

    if (videoYaCompatible(video, audio)) {
      try {
        // Remux: NO decodifica ni re-codifica nada, solo reacomoda el
        // contenedor. Rapidisimo (segundos) y sin perdida de calidad.
        await execFileAsync("ffmpeg", ["-y", "-i", entrada, "-c", "copy", "-movflags", "+faststart", salida]);
        console.log("[descargas-core] Video ya era compatible, se remuxeo sin re-codificar");
        return fs.readFileSync(salida);
      } catch (e) {
        console.log(`[descargas-core] Remux rapido fallo, se re-codifica completo: ${e.message}`);
        // sigue abajo al re-encode completo, como red de seguridad
      }
    }

    await execFileAsync("ffmpeg", [
      "-y",
      "-i", entrada,
      "-c:v", "libx264",
      "-preset", "veryfast", // mas rapido que el "medium" por defecto, mismo resultado compatible
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

// Muchos videos de YouTube ya NO tienen un formato con video+audio juntos
// (formato "progresivo"): solo ofrecen el video mudo y el audio por
// separado. Esto los combina en un solo mp4 y de paso deja todo en el
// mismo formato compatible con WhatsApp que asegurarVideoCompatibleWhatsApp.
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
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-profile:v", "baseline",
      "-level", "3.0",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "128k",
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

// Llama a una API de descarga tipo "creator/status" (el patrón que usan
// las APIs de alyacore.xyz: /dl/ytmp3, /dl/ytdlpmp3, /dl/ytmp4,
// /dl/ytdlpmp4, y potencialmente otras a futuro con la misma forma).
// Centralizada aca porque no es especifica de YouTube: sirve para
// cualquier motor que responda { status, message, result }.
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

// Intenta sacar la URL directa de descarga de las formas más comunes en
// las que responden estas APIs. No pude confirmar en vivo cuál usa
// alyacore.xyz (ver nota en yt-descargas.js), asi que prueba varios
// campos; si tu API devuelve el link en otro lado, agregalo a la lista.
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

// Reencoda el audio a mp3 real (libmp3lame). Si la API de turno entrega
// el audio en otro contenedor (m4a, opus, etc) pero se manda igual como
// "audio/mpeg" sin re-codificar, WhatsApp puede mostrar "contenido no
// visible" en vez del audio - esto asegura que el contenido siempre
// coincida con el mimetype que se declara.
export async function asegurarAudioCompatibleWhatsApp(bufferEntrada) {
  const tmp = os.tmpdir();
  const sufijo = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const entrada = path.join(tmp, `da_in_${sufijo}`);

  fs.writeFileSync(entrada, bufferEntrada);

  try {
    const { audio } = await analizarPistas(entrada);

    if (audio?.codec_name === "mp3") {
      // Ya es mp3 real: se devuelve el buffer tal cual llego, sin tocarlo.
      // Cero riesgo (no se modifica nada) y cero tiempo de proceso.
      console.log("[descargas-core] Audio ya era mp3, se devuelve sin reencodear");
      return bufferEntrada;
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

// Pasa la imagen a JPEG "plano" para evitar problemas con webp/formatos
// raros que a veces mandan las redes y que WhatsApp no siempre digiere bien.
// Usa el mismo "ffmpeg" del sistema que ya se usa para el video, en vez de
// sharp: así no depende de binarios nativos de npm (que en Termux/ARM suelen
// no tener build precompilado) y funciona igual en cualquier dispositivo sin
// instalar nada extra.
export async function asegurarImagenCompatibleWhatsApp(bufferEntrada) {
  const tmp = os.tmpdir();
  const sufijo = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const entrada = path.join(tmp, `di_in_${sufijo}`);
  const salida = path.join(tmp, `di_out_${sufijo}.jpg`);

  fs.writeFileSync(entrada, bufferEntrada);

  try {
    await execFileAsync("ffmpeg", [
      "-y",
      "-i", entrada,
      "-q:v", "2", // calidad alta (escala 2-31, mientras mas bajo mejor)
      "-pix_fmt", "yuvj420p",
      salida
    ]);
    return fs.readFileSync(salida);
  } finally {
    if (fs.existsSync(entrada)) fs.unlinkSync(entrada);
    if (fs.existsSync(salida)) fs.unlinkSync(salida);
  }
}

