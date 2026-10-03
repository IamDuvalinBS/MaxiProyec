import { obtenerMediaTikTok } from "../../descargas/redes.js";
import { enviarMedias } from "../../descargas/envio.js";
import { tarjetaDescarga, tarjetaUso, tarjetaError, campo } from "../../descargas/tarjetas.js";

export default {
  names: [".tiktok", ".tt"],
  usage: ".tiktok <link>",
  desc: "Descarga videos o fotos de TikTok sin marca de agua",
  category: "Descargas",
  handler: async ({ sender, cleanText, reply }) => {
    const link = cleanText.trim().split(/\s+/)[1];
    if (!link || !/tiktok\.com/i.test(link)) {
      return reply({
        text: tarjetaUso({ comando: ".tiktok <enlace>", ejemplo: ".tiktok https://www.tiktok.com/@usuario/video/123456789", nota: "Envía un enlace válido de TikTok." }),
        mentions: [sender]
      });
    }

    await reply({
      text: tarjetaDescarga({
        emoji: "🎵",
        titulo: "TIKTOK DOWNLOAD",
        sender,
        campos: [campo("🔗", "Enlace", link)],
        nota: "Descargando el contenido. Esto puede tardar unos segundos."
      }),
      mentions: [sender]
    });

    let medias;
    try {
      medias = await obtenerMediaTikTok(link);
    } catch (e) {
      return reply({ text: tarjetaError("No se pudo obtener el contenido de ese enlace.", e.message) });
    }

    await enviarMedias(medias, reply);
  }
};
