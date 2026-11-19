import { obtenerVistaUnica, desenvolver } from "../../nucleo/vistaunica.js";

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

    // Busca en orden: copia en disco -> descarga directa -> reenvío del teléfono -> historial del chat.
    let avisado = false;
    const r = await obtenerVistaUnica(sock, msg, info, async () => {
      if (avisado) return;
      avisado = true;
      try { await reply({ text: "⧼👁️⧽ Buscando el contenido, dame unos segundos..." }); } catch {}
    });

    if (!r?.buffer) {
      await reply({ text: "❌ No pude recuperar ese contenido. Puede que ya lo hayan abierto, que haya expirado, o que el teléfono no lo tenga disponible." });
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
