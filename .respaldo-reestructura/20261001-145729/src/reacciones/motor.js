import { execFile } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

const UMBRAL_RECOMPRIMIR_BYTES = 1.5 * 1024 * 1024;
const HEADERS = { "User-Agent": "MaxiProyecBot/1.0 (WhatsApp bot, contacto en GitHub IamDuvalinBS)" };

// Descarga directo a un archivo temporal en disco (streaming) en vez de
// juntar todo el gif en un Buffer en RAM antes de guardarlo - con gifs
async function descargarATemporal(url, ext) {
  const tmpPath = path.join(os.tmpdir(), `react-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`);
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok || !res.body) throw new Error(`No se pudo descargar el archivo (HTTP ${res.status}).`);
  await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(tmpPath));
  return tmpPath;
}

function compactarSiHaceFalta(entrada, pesoBytes) {
  return new Promise((resolve) => {
    if (pesoBytes <= UMBRAL_RECOMPRIMIR_BYTES) {
      resolve(entrada);
      return;
    }
    const salida = entrada.replace(/\.gif$/, ".mp4");
    const args = ["-y", "-i", entrada, "-vf", "scale=400:-2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "24", "-preset", "veryfast", "-movflags", "faststart", "-an", salida];
    execFile("ffmpeg", args, { timeout: 20000 }, (error) => {
      if (fs.existsSync(entrada)) fs.unlinkSync(entrada);
      if (error) {
        resolve(null);
        return;
      }
      resolve(salida);
    });
  });
}

export function reactionCommand({ apiAction, fraseConOtro, fraseSolo }) {
  return async ({ sock, from, sender, msg, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const target = (mentioned && mentioned[0]) || sender;
    const esASiMismo = target === sender;

    let url;
    try {
      const res = await fetch(`https://nekos.best/api/v2/${apiAction}`, { headers: HEADERS });
      const data = await res.json();
      url = data.results?.[0]?.url;
      if (!url) throw new Error("Sin url en la respuesta.");
    } catch (e) {
      await reply({ text: "❌ No se pudo conseguir la imagen ahora mismo, intentá de nuevo." });
      return;
    }

    let rutaFinal;
    try {
      rutaFinal = await descargarATemporal(url, "gif");
      const peso = fs.statSync(rutaFinal).size;
      const compactada = await compactarSiHaceFalta(rutaFinal, peso);
      rutaFinal = compactada || rutaFinal;
    } catch (e) {
      await reply({ text: "❌ No se pudo descargar la imagen ahora mismo, intentá de nuevo." });
      return;
    }

    const buffer = fs.readFileSync(rutaFinal);
    if (fs.existsSync(rutaFinal)) fs.unlinkSync(rutaFinal);

    const nombreDe = "@" + sender.split("@")[0];
    const nombrePara = "@" + target.split("@")[0];
    const caption = esASiMismo ? `${nombreDe} ${fraseSolo}` : `${nombreDe} ${fraseConOtro} ${nombrePara}`;
    const mentions = esASiMismo ? [sender] : [sender, target];

    await sock.sendMessage(from, { video: buffer, gifPlayback: true, caption, mentions }, { quoted: msg });
  };
}
