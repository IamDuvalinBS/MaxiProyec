import fs from "fs";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { FOTO_PATH } from "../../../motores/db.js";
import { ownerCommand } from "../../../motores/owner.js";

export default {
  names: [".setfoto"],
  usage: ".setfoto (con foto adjunta, o respondiendo a una)",
  desc: "Cambiar la foto de perfil del bot",
  category: "Utilidad",
  handler: ownerCommand(async ({ sock, from, msg, reply }) => {
    const imagen = msg.message?.imageMessage;
    const citada = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

    let objetivo = null;
    if (imagen) {
      objetivo = msg;
    } else if (citada) {
      const ctx = msg.message.extendedTextMessage.contextInfo;
      objetivo = {
        key: { remoteJid: from, id: ctx.stanzaId, participant: ctx.participant },
        message: ctx.quotedMessage
      };
    }

    if (!objetivo) {
      return reply({ text: "⚙️ Envía una imagen con *.setfoto* como descripción, o responde a una foto con *.setfoto*." });
    }

    try {
      const buffer = await downloadMediaMessage(objetivo, "buffer", {});
      fs.writeFileSync(FOTO_PATH, buffer);
      await sock.updateProfilePicture(sock.user.id, buffer);
      await reply({ text: "✅ Foto actualizada. También se utilizará como imagen del menú." });
    } catch (e) {
      await reply({ text: `❌ No se pudo cambiar la foto: ${e.message}` });
    }
  })
};
