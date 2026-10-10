import { downloadMediaMessage } from "@fer2809fl/baileys";
import { comandoGrupo } from "../../grupos/nucleo.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo.js";

export default {
  names: [".fotogp", ".photogp"],
  usage: ".fotogp (con foto adjunta, o respondiendo a una)",
  desc: "Cambiar la foto del grupo",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "🖼️", titulo: "FOTOGP", botAdmin: true }, async ({ sock, from, sender, msg, responder, avisar }) => {
    const info = msg.message?.extendedTextMessage?.contextInfo;
    let objetivo = null;
    if (msg.message?.imageMessage) {
      objetivo = msg;
    } else if (info?.quotedMessage?.imageMessage) {
      objetivo = { key: { remoteJid: from, id: info.stanzaId, participant: info.participant }, message: info.quotedMessage };
    }

    if (!objetivo) return avisar("Envía una imagen con *.fotogp* como descripción, o responde a una imagen con *.fotogp*.");

    try {
      const buffer = await downloadMediaMessage(objetivo, "buffer", {});
      await sock.updateProfilePicture(from, buffer);
    } catch (e) {
      return avisar(`No fue posible cambiar la foto del grupo: ${e.message}`);
    }

    const texto = tarjetaMarcada({
      emoji: "🖼️",
      titulo: "FOTO ACTUALIZADA",
      relato: "La foto del grupo ha sido modificada.",
      lineas: ["⧼🎯⧽ *Responsable*::", `> ${mencion(sender)} actualizó la foto.`]
    });
    await responder(texto, [sender]);
  })
};
