import { obtenerMediaFacebook } from "../../descargas/redes.js";
import { enviarMedias } from "../../descargas/envio.js";
import { tarjetaDescarga, tarjetaUso, tarjetaError, campo } from "../../descargas/tarjetas.js";

export default {
  names: [".fb", ".facebook"],
  usage: ".fb <link del video>",
  desc: "Descarga videos públicos de Facebook a partir de un enlace",
  category: "Descargas",
  handler: async ({ sender, cleanText, reply }) => {
    const link = cleanText.trim().split(/\s+/)[1];
    if (!link || !/facebook\.com|fb\.watch/i.test(link)) {
      return reply({
        text: tarjetaUso({
          comando: ".fb <enlace>",
          ejemplo: ".fb https://www.facebook.com/usuario/videos/123456789",
          nota: "Envía un enlace válido de un video público de Facebook."
        }),
        mentions: [sender]
      });
    }

    await reply({
      text: tarjetaDescarga({
        emoji: "📘",
        titulo: "FACEBOOK DOWNLOAD",
        sender,
        campos: [campo("🔗", "Enlace", link)],
        nota: "Descargando el video. Esto puede tardar unos segundos."
      }),
      mentions: [sender]
    });

    let media;
    try {
      [media] = await obtenerMediaFacebook(link);
    } catch (e) {
      return reply({ text: tarjetaError("No se pudo obtener el video de ese enlace.", e.message) });
    }

    await enviarMedias([{ ...media, type: "video" }], reply);
  }
};
