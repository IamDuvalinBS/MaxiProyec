import {
  extraerMediaDeMensaje,
  crearSticker,
  contextoMeta,
  esStickerAnimado,
  MAX_SEGUNDOS_STICKER
} from "../../nucleo/sticker.js";

export default {
  names: [".s", ".sticker"],
  desc: "Convierte una imagen, GIF o video (citado) en sticker",
  category: "Stickers",
  usage: ".s (respondiendo a una imagen, GIF o video)",
  handler: async ({ msg, sender, from, sock, reply }) => {
    let media = null;
    try {
      media = await extraerMediaDeMensaje(msg);
    } catch (e) {
      console.log("❌ Error descargando el archivo para sticker: " + e.message);
      await reply({ text: "❌ No se pudo descargar el archivo. Intenta enviarlo nuevamente." });
      return;
    }

    if (!media) {
      await reply({ text: "🖼️ Responde a una imagen, GIF o video con *.s* para convertirlo en sticker." });
      return;
    }

    if (media.segundos > MAX_SEGUNDOS_STICKER) {
      await reply({ text: `❌ El video dura ${media.segundos} segundos. Máximo ${MAX_SEGUNDOS_STICKER} segundos.` });
      return;
    }

    try {
      const contexto = await contextoMeta({ sock, from, sender, msg });
      const stickerBuffer = await crearSticker(media.buffer, sender, contexto);
      await sock.sendMessage(
        from,
        { sticker: stickerBuffer, isAnimated: esStickerAnimado(stickerBuffer) },
        { quoted: msg }
      );
    } catch (e) {
      console.log("❌ Error creando sticker: " + e.message);
      await reply({ text: "❌ No se pudo convertir ese archivo en sticker." });
    }
  }
};
