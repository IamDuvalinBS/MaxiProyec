import { downloadMediaMessage } from "@whiskeysockets/baileys";
import fs from "fs";
import { pfpPath } from "../core.js";

export default {
  names: [".setpfp"],
  desc: "Cambiar la foto de tu perfil (con imagen adjunta o respondiendo a una)",
  category: "Perfil",
  usage: ".setpfp (con imagen adjunta o respondiendo a una)",
  handler: async ({ from, sender, msg, reply }) => {
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
      await reply({ text: "⚙️ Mandá una imagen con *.setpfp* de caption, o respondé a una foto con *.setpfp*." });
      return;
    }

    try {
      const buffer = await downloadMediaMessage(targetMsg, "buffer", {});
      fs.writeFileSync(pfpPath(sender), buffer);
      await reply({ text: "✅ Foto de perfil actualizada." });
    } catch (e) {
      await reply({ text: "❌ Error cambiando la foto: " + e.message });
    }
  }
};
