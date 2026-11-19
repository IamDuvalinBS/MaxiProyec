import { prepareWAMessageMedia, generateWAMessageFromContent, proto } from "@fer2809fl/baileys";
import {
  desenvolverVistaUnica,
  extraerMediaDeMensaje,
  crearSticker,
  contextoMeta,
  esStickerAnimado,
  MAX_SEGUNDOS_STICKER
} from "../../nucleo/sticker.js";
import { ERROR_PREMIUM, MENSAJE_PREMIUM } from "../../nucleo/premium.js";

const VALOR_PREMIUM = 1;

const esWebp = (b) => b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP";

const tieneMediaSubida = (s) => Boolean(s?.mediaKey && s.fileSha256 && s.fileEncSha256 && (s.directPath || s.url));

function contenidoDesdeCitado(sticker) {
  const copia = { ...sticker };
  delete copia.contextInfo;
  return { ...copia, stickerSentTs: Date.now(), premium: VALOR_PREMIUM };
}

async function contenidoDesdeBuffer(sock, buffer) {
  const subido = await prepareWAMessageMedia({ sticker: buffer }, { upload: sock.waUploadToServer, logger: sock.logger });
  const base = { ...subido.stickerMessage };
  return { ...base, isAnimated: esStickerAnimado(buffer), stickerSentTs: Date.now(), premium: VALOR_PREMIUM };
}

export default {
  names: [".sprem", ".premium", ".stickerpremium"],
  desc: "Convierte un sticker (o imagen/video) en un sticker premium",
  category: "Stickers",
  usage: ".sprem (respondiendo a un sticker, imagen o video)",
  handler: async ({ msg, sender, from, sock, reply }) => {
    const base = desenvolverVistaUnica(msg.message) || {};
    const ctx = base.extendedTextMessage?.contextInfo || base.imageMessage?.contextInfo || base.videoMessage?.contextInfo;
    const citado = desenvolverVistaUnica(ctx?.quotedMessage);
    const stickerCitado = citado?.stickerMessage || null;

    if (stickerCitado && Number(stickerCitado.premium) > 0) {
      await reply({ text: "💎 Ese sticker ya es premium." });
      return;
    }

    let contenido = null;

    if (tieneMediaSubida(stickerCitado)) {
      contenido = contenidoDesdeCitado(stickerCitado);
    } else {
      let media = null;
      try {
        media = await extraerMediaDeMensaje(msg, sender);
      } catch (e) {
        if (e.message === ERROR_PREMIUM) {
          await reply({ text: MENSAJE_PREMIUM });
          return;
        }
        console.log("❌ Error descargando el sticker para .sprem: " + e.message);
        await reply({ text: "❌ No se pudo descargar el sticker. Intenta nuevamente." });
        return;
      }

      if (!media) {
        await reply({ text: "⧼💎⧽ *STICKER PREMIUM*\n\nResponde a un sticker, imagen o video con *.sprem* para convertirlo en un sticker premium.\n\n> Un sticker premium no se puede guardar ni añadir a favoritos sin Meta One." });
        return;
      }

      if (media.segundos > MAX_SEGUNDOS_STICKER) {
        await reply({ text: `❌ El video dura ${media.segundos} segundos. Máximo ${MAX_SEGUNDOS_STICKER} segundos.` });
        return;
      }

      try {
        let buffer = media.buffer;
        if (!esWebp(buffer)) {
          const contexto = await contextoMeta({ sock, from, sender, msg });
          buffer = await crearSticker(buffer, sender, contexto);
        }
        contenido = await contenidoDesdeBuffer(sock, buffer);
      } catch (e) {
        console.log("❌ Error preparando el sticker premium: " + e.message);
        await reply({ text: "❌ No se pudo preparar el sticker premium." });
        return;
      }
    }

    try {
      const armado = generateWAMessageFromContent(
        from,
        { stickerMessage: proto.Message.StickerMessage.fromObject(contenido) },
        { userJid: sock.user?.id || sock.user?.jid, quoted: msg }
      );
      await sock.relayMessage(from, armado.message, { messageId: armado.key.id });
    } catch (e) {
      console.log("❌ Error en .sprem: " + e.message);
      await reply({ text: "❌ No se pudo enviar el sticker premium." });
    }
  }
};
