import fs from "fs";
import path from "path";
import { downloadMediaMessage } from "@fer2809fl/baileys";
import { desenvolverVistaUnica } from "../../nucleo/sticker.js";
import { correrFfmpeg, conTemporal } from "../../nucleo/ffmpeg.js";
import { encabezado } from "../../economia/estilo.js";
import { limitarEspera } from "../../../motores/herramientas-ui.js";

const ESPERA_MS = 10000;
const MAX_SEGUNDOS = 60;
const esperas = new Map();

async function obtenerVideo(msg) {
  const m = desenvolverVistaUnica(msg.message) || {};
  const ctx = m.extendedTextMessage?.contextInfo || m.videoMessage?.contextInfo;
  const citado = desenvolverVistaUnica(ctx?.quotedMessage);

  if (m.videoMessage) {
    const buffer = await downloadMediaMessage({ key: msg.key, message: m }, "buffer", {});
    return { buffer, segundos: Number(m.videoMessage.seconds) || 0 };
  }
  if (citado?.videoMessage) {
    const objetivo = {
      key: { remoteJid: msg.key.remoteJid, id: ctx.stanzaId, participant: ctx.participant },
      message: citado
    };
    const buffer = await downloadMediaMessage(objetivo, "buffer", {});
    return { buffer, segundos: Number(citado.videoMessage.seconds) || 0 };
  }
  return null;
}

function aNotaDeVideo(buffer) {
  return conTemporal("nota", async (dir) => {
    const entrada = path.join(dir, "entrada");
    const salida = path.join(dir, "salida.mp4");
    await fs.promises.writeFile(entrada, buffer);
    await correrFfmpeg(
      [
        "-t", String(MAX_SEGUNDOS),
        "-i", entrada,
        "-vf", "crop=min(iw\\,ih):min(iw\\,ih),scale=640:640,setsar=1,format=yuv420p",
        "-c:v", "libx264", "-profile:v", "main", "-preset", "veryfast", "-crf", "27",
        "-maxrate", "1500k", "-bufsize", "3000k",
        "-c:a", "aac", "-b:a", "96k",
        "-movflags", "+faststart",
        salida
      ],
      180000
    );
    return fs.promises.readFile(salida);
  });
}

export default {
  names: [".nota", ".videonota", ".ptv"],
  desc: "Convierte un video en nota de video (circular)",
  category: "Tools",
  usage: ".nota (respondiendo a un video)",
  handler: async ({ msg, from, sender, sock, reply }) => {
    let video = null;
    try {
      video = await obtenerVideo(msg);
    } catch (e) {
      console.log("❌ Error descargando el video para .nota: " + e.message);
      await reply({ text: "❌ No se pudo descargar el video. Intenta enviarlo nuevamente." });
      return;
    }

    if (!video) {
      await reply({
        text: `${encabezado("🎥", "NOTA DE VIDEO")}\n\nResponde a un video con *.nota* para convertirlo en una nota de video circular.\n\n> Se recorta al centro en formato cuadrado y dura máximo ${MAX_SEGUNDOS} segundos.`
      });
      return;
    }

    const falta = limitarEspera(esperas, sender, ESPERA_MS);
    if (falta) {
      await reply({ text: `⏳ Espera ${falta}s antes de volver a usar *.nota*.` });
      return;
    }

    let nota;
    try {
      nota = await aNotaDeVideo(video.buffer);
    } catch (e) {
      console.log("❌ Error creando la nota de video: " + e.message);
      await reply({ text: "❌ No se pudo convertir ese video en nota de video." });
      return;
    }

    try {
      await sock.sendMessage(from, { video: nota, mimetype: "video/mp4", ptv: true }, { quoted: msg });
    } catch (e) {
      console.log("[nota] No se pudo mandar como nota de video, se manda como video normal: " + e.message);
      await sock.sendMessage(from, { video: nota, mimetype: "video/mp4" }, { quoted: msg });
    }

    if (video.segundos > MAX_SEGUNDOS) {
      await reply({ text: `✂️ El video duraba ${video.segundos} segundos, así que se recortó a ${MAX_SEGUNDOS}.` });
    }
  }
};
