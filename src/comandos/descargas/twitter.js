import { obtenerMediaTwitter } from "../../descargas/redes.js";
import { enviarMedias } from "../../descargas/envio.js";
import { tarjetaDescarga, tarjetaUso, tarjetaError, campo } from "../../descargas/tarjetas.js";

export default {
  names: [".x", ".twitter"],
  usage: ".x <link del tweet>",
  desc: "Descarga videos o fotos de un post de X (Twitter)",
  category: "Descargas",
  handler: async ({ sender, cleanText, reply }) => {
    const link = cleanText.trim().split(/\s+/)[1];
    if (!link || !/(twitter|x)\.com/i.test(link)) {
      return reply({
        text: tarjetaUso({ comando: ".x <enlace>", ejemplo: ".x https://x.com/usuario/status/123456789", nota: "Envía un enlace válido de una publicación de X." }),
        mentions: [sender]
      });
    }

    await reply({
      text: tarjetaDescarga({
        emoji: "🐦",
        titulo: "X DOWNLOAD",
        sender,
        campos: [campo("🔗", "Enlace", link)],
        nota: "Descargando el contenido. Esto puede tardar unos segundos."
      }),
      mentions: [sender]
    });

    let medias;
    try {
      medias = await obtenerMediaTwitter(link);
    } catch (e) {
      return reply({ text: tarjetaError("No se pudo obtener el contenido de ese enlace.", e.message) });
    }

    await enviarMedias(medias, reply);
  }
};
