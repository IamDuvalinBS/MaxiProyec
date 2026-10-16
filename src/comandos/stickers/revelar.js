import { downloadMediaMessage } from "@fer2809fl/baileys";
import { desenvolverVistaUnica } from "../../nucleo/sticker.js";

const TIPOS = ["imageMessage", "videoMessage", "audioMessage"];

export default {
  names: [".revelar", ".reveal"],
  desc: "Revela una foto, video o audio de ver una vez (citado)",
  category: "Utilidad",
  usage: ".revelar (respondiendo a un mensaje de ver una vez)",
  handler: async ({ msg, from, sock, reply }) => {
    const info = msg.message?.extendedTextMessage?.contextInfo;
    const citado = desenvolverVistaUnica(info?.quotedMessage);
    const tipo = TIPOS.find((t) => citado?.[t]);

    if (!tipo) {
      await reply({ text: "⧼👁️⧽ *REVELAR*\n\nResponde a una foto, video o audio de ver una vez para mostrarlo normalmente.\n\n> Usa *.revelar* respondiendo al mensaje." });
      return;
    }

    let buffer;
    try {
      buffer = await downloadMediaMessage(
        { key: { remoteJid: from, id: info.stanzaId, participant: info.participant }, message: citado },
        "buffer",
        {}
      );
    } catch (e) {
      console.log("❌ Error revelando mensaje: " + e.message);
      await reply({ text: "❌ No se pudo descargar ese contenido. Puede que el bot no lo haya recibido o que ya haya expirado." });
      return;
    }

    const media = citado[tipo];
    const pie = `⧼👁️⧽ *REVELADO*\n\n${media.caption ? media.caption + "\n\n" : ""}> Usa *.revelar* respondiendo a un mensaje de ver una vez.`;

    try {
      if (tipo === "imageMessage") {
        await sock.sendMessage(from, { image: buffer, caption: pie }, { quoted: msg });
      } else if (tipo === "videoMessage") {
        await sock.sendMessage(from, { video: buffer, caption: pie, mimetype: media.mimetype || "video/mp4" }, { quoted: msg });
      } else {
        await sock.sendMessage(from, { audio: buffer, mimetype: media.mimetype || "audio/ogg; codecs=opus", ptt: media.ptt ?? true }, { quoted: msg });
      }
    } catch (e) {
      console.log("❌ Error enviando contenido revelado: " + e.message);
      await reply({ text: "❌ No se pudo enviar el contenido revelado." });
    }
  }
};
