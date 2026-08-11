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
    await execFileAsync("ffmpeg", [
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

