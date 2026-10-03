import { obtenerVideoReddit } from "../../descargas/redes.js";
import { asegurarImagenCompatibleWhatsApp, LIMITE_VIDEO_WHATSAPP_MB } from "../../descargas/core.js";
import { tarjetaDescarga, tarjetaUso, tarjetaError, tarjetaAviso, campo } from "../../descargas/tarjetas.js";

export default {
  names: [".reddit"],
  usage: ".reddit <link del post>",
  desc: "Descarga el video o la imagen de un post de Reddit",
  category: "Descargas",
  handler: async ({ sender, cleanText, reply }) => {
    const link = cleanText.trim().split(/\s+/)[1];
    if (!link || !/reddit\.com/i.test(link)) {
      return reply({
        text: tarjetaUso({
          comando: ".reddit <enlace>",
          ejemplo: ".reddit https://www.reddit.com/r/comunidad/comments/abc123/titulo/",
          nota: "Envía un enlace válido de una publicación de Reddit."
        }),
        mentions: [sender]
      });
    }

    await reply({
      text: tarjetaDescarga({
        emoji: "👽",
        titulo: "REDDIT DOWNLOAD",
        sender,
        campos: [campo("🔗", "Enlace", link)],
        nota: "Descargando el contenido. Esto puede tardar unos segundos."
      }),
      mentions: [sender]
    });

    try {
      const media = await obtenerVideoReddit(link);

      if (media.type === "video") {
        const pesoMB = media.buffer.length / (1024 * 1024);
        if (pesoMB > LIMITE_VIDEO_WHATSAPP_MB) {
          return reply({
            text: tarjetaAviso(
              "ARCHIVO MUY PESADO",
              `El video pesa ${pesoMB.toFixed(1)} MB y supera el límite de WhatsApp (${LIMITE_VIDEO_WHATSAPP_MB} MB).`
            )
          });
        }
        await reply({ video: media.buffer, mimetype: "video/mp4" });
      } else {
        const buffer = await asegurarImagenCompatibleWhatsApp(media.buffer);
        await reply({ image: buffer, mimetype: "image/jpeg" });
      }
    } catch (e) {
      await reply({ text: tarjetaError("No se pudo obtener el contenido de ese post.", e.message) });
    }
  }
};
