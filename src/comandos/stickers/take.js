import {
  extraerMediaDeMensaje,
  crearSticker,
  crearStickerConMeta,
  contextoMeta,
  metaPredeterminada,
  esStickerAnimado,
  MAX_SEGUNDOS_STICKER
} from "../../nucleo/sticker.js";

export default {
  names: [".take", ".robar", ".wm"],
  desc: "Cambia el pack y el autor de un sticker ajeno",
  category: "Stickers",
  usage: ".take <pack> • <autor> (respondiendo a un sticker)",
  handler: async ({ msg, sender, from, sock, cleanText, reply }) => {
    let media = null;
    try {
      media = await extraerMediaDeMensaje(msg);
    } catch (e) {
      console.log("❌ Error descargando el sticker para .take: " + e.message);
      await reply({ text: "❌ No se pudo descargar el sticker. Intenta nuevamente." });
      return;
    }

    if (!media) {
      await reply({ text: "🖼️ Responde a un sticker con *.take <pack> • <autor>* para robarlo con tu nombre.\n\n> Sin texto usa tu meta de *.setmeta*." });
      return;
    }

    if (media.segundos > MAX_SEGUNDOS_STICKER) {
      await reply({ text: `❌ El video dura ${media.segundos} segundos. Máximo ${MAX_SEGUNDOS_STICKER} segundos.` });
      return;
    }

    try {
      const contexto = await contextoMeta({ sock, from, sender, msg });
      const texto = cleanText.split(/\s+/).slice(1).join(" ").trim();
      let sticker;
      if (texto) {
        const [pack, autor] = texto.split("•").map((p) => p.trim());
        sticker = await crearStickerConMeta(media.buffer, pack || metaPredeterminada(contexto).pack, autor || metaPredeterminada(contexto).autor);
      } else {
        sticker = await crearSticker(media.buffer, sender, contexto);
      }
      await sock.sendMessage(from, { sticker, isAnimated: esStickerAnimado(sticker) }, { quoted: msg });
    } catch (e) {
      console.log("❌ Error en .take: " + e.message);
      await reply({ text: "❌ No se pudo cambiar el meta de ese sticker." });
    }
  }
};
