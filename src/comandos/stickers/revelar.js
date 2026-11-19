import { buscarVistaUnica, desenvolver } from "../../nucleo/vistaunica.js";

export default {
  names: [".revelar", ".reveal"],
  desc: "Revela una foto, video o audio de ver una vez (citado)",
  category: "Utilidad",
  usage: ".revelar (respondiendo a un mensaje de ver una vez)",
  handler: async ({ msg, from, sock, reply }) => {
    const info = desenvolver(msg.message)?.extendedTextMessage?.contextInfo;
    if (!info?.stanzaId) {
      await reply({ text: "⧼👁️⧽ *REVELAR*\n\nResponde a una foto, video o audio de ver una vez para mostrarlo normalmente.\n\n> Usa *.revelar* respondiendo al mensaje." });
      return;
    }

    // Solo se busca en la carpeta local (las vistas únicas se guardan solas al llegar). No se lee el chat ni el historial.
    const r = buscarVistaUnica(info.stanzaId);

    if (!r?.buffer) {
      await reply({ text: "❌ No tengo guardado ese contenido. Solo puedo revelar vistas únicas que llegaron mientras el bot estaba encendido (y después de activar esta función)." });
      return;
    }

    const pie = `⧼👁️⧽ *REVELADO*\n\n${r.caption || ""}`.trimEnd();

    try {
      if (r.tipo === "imageMessage") {
        await sock.sendMessage(from, { image: r.buffer, caption: pie }, { quoted: msg });
      } else if (r.tipo === "videoMessage") {
        await sock.sendMessage(from, { video: r.buffer, caption: pie, mimetype: r.mimetype || "video/mp4" }, { quoted: msg });
      } else {
        await sock.sendMessage(from, { audio: r.buffer, mimetype: r.mimetype || "audio/ogg; codecs=opus", ptt: r.ptt ?? true }, { quoted: msg });
      }
    } catch (e) {
      console.log("❌ Error enviando contenido revelado: " + e.message);
      await reply({ text: "❌ No se pudo enviar el contenido revelado." });
    }
  }
};
