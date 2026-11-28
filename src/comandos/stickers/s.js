import {
  extraerMediaDeMensaje,
  crearSticker,
  contextoMeta,
  esStickerAnimado,
  MAX_SEGUNDOS_STICKER
} from "../../nucleo/sticker.js";
import { ERROR_PREMIUM, MENSAJE_PREMIUM } from "../../nucleo/premium.js";
import { subcomandoS } from "../../nucleo/sticker-acciones.js";
import { esSubcomandoAudio, stickerConAudio } from "../../nucleo/sticker-audio.js";

export default {
  names: [".s", ".sticker"],
  desc: "Convierte una imagen, GIF, video, nota de video o previa de link en sticker (.saudio = con sonido, .shelp = ayuda)",
  category: "Stickers",
  usage: ".s",
  handler: async ({ msg, sender, from, sock, reply, cleanText }) => {
    // .s cerrar / abrir / lista / eliminar / ayuda → stickers de acción (si no es ninguno, sigue el .s normal)
    if (await subcomandoS({ sock, from, sender, cleanText, msg, reply })) return;

    // .s audio → sticker con audio (función beta de WhatsApp)
    if (esSubcomandoAudio(cleanText)) {
      await stickerConAudio({ sock, from, sender, msg, reply });
      return;
    }

    let media = null;
    try {
      media = await extraerMediaDeMensaje(msg, sender);
    } catch (e) {
        if (e.message === ERROR_PREMIUM) {
          await reply({ text: MENSAJE_PREMIUM });
          return;
        }
      console.log("❌ Error descargando el archivo para sticker: " + e.message);
      await reply({ text: "❌ No se pudo descargar el archivo. Intenta enviarlo nuevamente." });
      return;
    }

    if (!media) {
      await reply({ text: "🖼️ Responde a una imagen, GIF, video, nota de video o previa de link con *.s* para convertirlo en sticker." });
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
