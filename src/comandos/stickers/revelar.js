import { downloadMediaMessage } from "@fer2809fl/baileys";
import { desenvolverVistaUnica } from "../../nucleo/sticker.js";
import { buscarVistaUnica, recuperarVistaUnica } from "../../nucleo/vistaunica.js";

const TIPOS = ["imageMessage", "videoMessage", "audioMessage"];

export default {
  names: [".revelar", ".reveal"],
  desc: "Revela una foto, video o audio de ver una vez (citado)",
  category: "Utilidad",
  usage: ".revelar (respondiendo a un mensaje de ver una vez)",
  handler: async ({ msg, from, sock, reply }) => {
    const info = msg.message?.extendedTextMessage?.contextInfo;
    if (!info?.stanzaId) {
      await reply({ text: "⧼👁️⧽ *REVELAR*\n\nResponde a una foto, video o audio de ver una vez para mostrarlo normalmente.\n\n> Usa *.revelar* respondiendo al mensaje." });
      return;
    }

    let tipo = null;
    let buffer = null;
    let mimetype = null;
    let caption = "";
    let ptt = null;

    let guardado = buscarVistaUnica(info.stanzaId);
    if (!guardado) {
      const citado0 = desenvolverVistaUnica(info.quotedMessage);
      let directo = false;
      if (TIPOS.find((t) => citado0?.[t])) {
        try {
          await downloadMediaMessage({ key: { remoteJid: from, id: info.stanzaId, participant: info.participant }, message: citado0 }, "buffer", {});
          directo = true;
        } catch {}
      }
      if (!directo) {
        await reply({ text: "⏳ Ese mensaje no estaba guardado. Intentando recuperarlo desde tu teléfono, puede tardar unos segundos..." });
        guardado = await recuperarVistaUnica(sock, msg, info);
      }
    }
    if (guardado) {
      tipo = guardado.tipo;
      buffer = guardado.buffer;
      mimetype = guardado.mimetype;
      caption = guardado.caption || "";
      ptt = guardado.ptt;
    } else {
      const citado = desenvolverVistaUnica(info.quotedMessage);
      tipo = TIPOS.find((t) => citado?.[t]);
      if (tipo) {
        try {
          buffer = await downloadMediaMessage(
            { key: { remoteJid: from, id: info.stanzaId, participant: info.participant }, message: citado },
            "buffer",
            {}
          );
          const media = citado[tipo];
          mimetype = media.mimetype || null;
          caption = media.caption || "";
          ptt = media.ptt ?? null;
        } catch (e) {
          console.log("❌ Error revelando mensaje: " + e.message);
        }
      }
    }

    if (!tipo || !buffer) {
      await reply({ text: "❌ No se pudo descargar ese contenido. El bot no alcanzó a guardarlo (lo enviaron antes de que el bot estuviera conectado) o ya expiró en los servidores de WhatsApp." });
      return;
    }

    const pie = `⧼👁️⧽ *REVELADO*\n\n${caption}`.trimEnd();

    try {
      if (tipo === "imageMessage") {
        await sock.sendMessage(from, { image: buffer, caption: pie }, { quoted: msg });
      } else if (tipo === "videoMessage") {
        await sock.sendMessage(from, { video: buffer, caption: pie, mimetype: mimetype || "video/mp4" }, { quoted: msg });
      } else {
        await sock.sendMessage(from, { audio: buffer, mimetype: mimetype || "audio/ogg; codecs=opus", ptt: ptt ?? true }, { quoted: msg });
      }
    } catch (e) {
      console.log("❌ Error enviando contenido revelado: " + e.message);
      await reply({ text: "❌ No se pudo enviar el contenido revelado." });
    }
  }
};
