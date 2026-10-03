import { obtenerMediaPinterest } from "../../descargas/redes.js";
import { enviarMedias } from "../../descargas/envio.js";
import { tarjetaDescarga, tarjetaUso, tarjetaError, campo } from "../../descargas/tarjetas.js";

export default {
  names: [".pin", ".pinterest"],
  usage: ".pin <link del pin>",
  desc: "Descarga la imagen o el video de un pin de Pinterest",
  category: "Descargas",
  handler: async ({ sender, cleanText, reply }) => {
    const link = cleanText.trim().split(/\s+/)[1];
    if (!link || !/pinterest\.[a-z.]+\/pin|pin\.it/i.test(link)) {
      return reply({
        text: tarjetaUso({
          comando: ".pin <enlace>",
          ejemplo: ".pin https://www.pinterest.com/pin/123456789/",
          nota: "Envía un enlace válido de un pin de Pinterest."
        }),
        mentions: [sender]
      });
    }

    await reply({
      text: tarjetaDescarga({
        emoji: "📌",
        titulo: "PINTEREST DOWNLOAD",
        sender,
        campos: [campo("🔗", "Enlace", link)],
        nota: "Descargando el contenido. Esto puede tardar unos segundos."
      }),
      mentions: [sender]
    });

    let media;
    try {
      [media] = await obtenerMediaPinterest(link);
    } catch (e) {
      return reply({ text: tarjetaError("No se pudo obtener el contenido de ese pin.", e.message) });
    }

    await enviarMedias([media], reply);
  }
};
