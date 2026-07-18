import fs from "fs";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { FOTO_PATH } from "../core.js";

export default {
  names: [".setfoto"],
  desc: "Cambiar la foto de perfil del bot (con foto adjunta, o respondiendo a una)",
  category: "Utilidad",
  usage: ".setfoto (con foto adjunta, o respondiendo a una)",
  handler: async ({ sock, from, msg, reply }) => {
    const imgMsg = msg.message?.imageMessage;
    const quotedImg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

    let targetMsg = null;
    if (imgMsg) {
      targetMsg = msg;
    } else if (quotedImg) {
      const ctx = msg.message.extendedTextMessage.contextInfo;
      targetMsg = {
        key: { remoteJid: from, id: ctx.stanzaId, participant: ctx.participant },
        message: ctx.quotedMessage
      };
    }

    if (!targetMsg) {
      await reply({ text: "⚙️ Mandá una imagen con *.setfoto* de caption, o respondé a una foto ya enviada con *.setfoto*." });
      return;
    }

    try {
      const buffer = await downloadMediaMessage(targetMsg, "buffer", {});
      fs.writeFileSync(FOTO_PATH, buffer);
      await sock.updateProfilePicture(sock.user.id, buffer);
      await reply({ text: "✅ Foto de perfil actualizada. También se va a usar como imagen del .menu." });
    } catch (e) {
      await reply({ text: "❌ Error cambiando la foto: " + e.message });
    }
  }
};
