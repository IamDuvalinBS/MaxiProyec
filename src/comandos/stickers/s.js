import {
  extraerMediaDeMensaje,
  crearSticker,
  contextoMeta,
  esStickerAnimado,
  MAX_SEGUNDOS_STICKER
} from "../../nucleo/sticker.js";
import { subcomandoS } from "../../nucleo/sticker-acciones.js";

export default {
  names: [".s", ".sticker"],
  desc: "Convierte una imagen, GIF o video (citado) en sticker. Admins: .s cerrar / .s abrir registran stickers de acción",
  category: "Stickers",
  usage: ".s (respondiendo a una imagen, GIF o video) | .s ayuda",
  handler: async ({ msg, sender, from, sock, reply, cleanText }) => {
    // .s cerrar / abrir / lista / eliminar / ayuda → stickers de acción (si no es ninguno, sigue el .s normal)
    if (await subcomandoS({ sock, from, sender, cleanText, msg, reply })) return;

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
