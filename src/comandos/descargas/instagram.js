import { obtenerMediaInstagram } from "../../descargas/instagram.js";
import { enviarMedias } from "../../descargas/envio.js";
import { tarjetaDescarga, tarjetaUso, tarjetaError, campo } from "../../descargas/tarjetas.js";

export default {
  names: [".ig", ".instagram"],
  usage: ".ig <link>",
  desc: "Descarga fotos, carruseles o reels de Instagram",
  category: "Descargas",
  handler: async ({ sender, cleanText, reply }) => {
    const link = cleanText.trim().split(/\s+/)[1];
    if (!link || !/instagram\.com\/(p|reel|tv)\//i.test(link)) {
      return reply({
        text: tarjetaUso({ comando: ".ig <enlace>", ejemplo: ".ig https://www.instagram.com/reel/xxxxxxx/", nota: "Envía un enlace válido de una publicación, reel o video de Instagram." }),
        mentions: [sender]
      });
    }

    await reply({
      text: tarjetaDescarga({
        emoji: "📸",
        titulo: "INSTAGRAM DOWNLOAD",
        sender,
        campos: [campo("🔗", "Enlace", link)],
        nota: "Descargando el contenido. Esto puede tardar unos segundos."
      }),
      mentions: [sender]
    });

    let medias;
    try {
      medias = await obtenerMediaInstagram(link);
    } catch (e) {
      return reply({ text: tarjetaError("No se pudo obtener el contenido de ese enlace.", e.message) });
    }

    await enviarMedias(medias, reply);
  }
};
