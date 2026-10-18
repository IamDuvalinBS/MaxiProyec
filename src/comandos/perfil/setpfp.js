import { downloadMediaMessage } from "@fer2809fl/baileys";
import fs from "fs";
import { pfpPath } from "../../../motores/profile.js";

const MAX_SEGUNDOS = 30;
const MAX_BYTES = 16 * 1024 * 1024;

export default {
  names: [".setpfp"],
  desc: "Cambiar tu perfil con una foto, video o GIF (adjunto o respondiendo a uno)",
  category: "Perfil",
  usage: ".setpfp (con foto/video/GIF adjunto, o respondiendo a uno)",
  handler: async ({ from, sender, msg, reply }) => {
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    const directo = msg.message?.imageMessage || msg.message?.videoMessage;
    const citado = ctx?.quotedMessage?.imageMessage || ctx?.quotedMessage?.videoMessage;
    const media = directo || citado;

    let targetMsg = null;
    if (directo) {
      targetMsg = msg;
    } else if (citado) {
      targetMsg = {
        key: { remoteJid: from, id: ctx.stanzaId, participant: ctx.participant },
        message: ctx.quotedMessage
      };
    }

    if (!targetMsg) {
      await reply({ text: "⚙️ Envía una foto, video o GIF con *.setpfp* como descripción, o responde a uno con *.setpfp*." });
      return;
    }

    const esVideo = !!(msg.message?.videoMessage || ctx?.quotedMessage?.videoMessage);
    const tipo = esVideo ? (media.gifPlayback ? "gif" : "video") : "image";

    if (esVideo && Number(media.seconds) > MAX_SEGUNDOS) {
      await reply({ text: `❌ El video es muy largo. Máximo ${MAX_SEGUNDOS} segundos.` });
      return;
    }

    try {
      const buffer = await downloadMediaMessage(targetMsg, "buffer", {});

      if (buffer.length > MAX_BYTES) {
        await reply({ text: "❌ El archivo pesa más de 16MB." });
        return;
      }

      fs.writeFileSync(pfpPath(sender), buffer);
      fs.writeFileSync(pfpPath(sender) + ".tipo", tipo);
      await reply({
        text: `✅ Perfil actualizado (${tipo === "image" ? "foto" : tipo === "gif" ? "GIF" : "video"}).`
      });
    } catch (e) {
      await reply({ text: `❌ Error cambiando el perfil: ${e.message}` });
    }
  }
};
                  
