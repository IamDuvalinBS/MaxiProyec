import { extraerImagenDeMensaje, crearSticker } from "../sticker.js";

export default {
  names: [".s", ".sticker"],
  desc: "Convierte una imagen (citada) en sticker",
  category: "Stickers",
  usage: ".s (respondiendo a una imagen)",
  handler: async ({ msg, sender, from, sock, reply }) => {
    let buffer = null;
    try {
      buffer = await extraerImagenDeMensaje(msg);
    } catch (e) {
      console.log("❌ Error descargando la imagen para sticker: " + e.message);
      await reply({ text: "❌ No se pudo descargar la imagen. Intenta enviarla nuevamente." });
      return;
    }

    if (!buffer) {
      await reply({ text: "🖼️ Responde a una imagen con *.s* para convertirla en sticker." });
      return;
    }

    try {
      const stickerBuffer = await crearSticker(buffer, sender);
      await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });
    } catch (e) {
      console.log("❌ Error creando sticker: " + e.message);
      await reply({ text: "❌ No se pudo convertir esa imagen en sticker." });
    }
  }
};
