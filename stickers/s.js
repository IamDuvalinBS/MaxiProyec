import { extraerImagenDeMensaje, crearSticker } from "../sticker.js";

export default {
  names: [".s", ".sticker"],
  desc: "Convierte una imagen (citada) en sticker",
  category: "Stickers",
  usage: ".s (respondiendo a una imagen)",
  handler: async ({ msg, sender, from, sock, reply }) => {
    const buffer = await extraerImagenDeMensaje(msg);
    if (!buffer) {
      await reply({ text: "🖼️ Respondé a una imagen con *.s* para convertirla en sticker." });
      return;
    }

    try {
      // Usa el meta que el usuario haya configurado con .setmeta, o el
      // predeterminado si todavia no configuro nada.
      const stickerBuffer = await crearSticker(buffer, sender);
      await sock.sendMessage(from, { sticker: stickerBuffer });
    } catch (e) {
      console.log("❌ Error creando sticker: " + e.message);
      await reply({ text: "❌ No pude convertir esa imagen en sticker." });
    }
  }
};

