import {
  obtenerMediaPinterest,
  descargarBuffer,
  asegurarVideoCompatibleWhatsApp,
  asegurarImagenCompatibleWhatsApp,
  LIMITE_VIDEO_WHATSAPP_MB
} from "../core.js";

export default {
  names: [".pin", ".pinterest"],
  desc: "Descarga la imagen o video de un pin de Pinterest",
  category: "Descargas",
  usage: ".pin <link del pin>",
  handler: async ({ cleanText, reply }) => {
    const link = cleanText.trim().split(/\s+/)[1];
    if (!link || !/pinterest\.[a-z.]+\/pin|pin\.it/i.test(link)) {
      return reply({ text: "📌 Mandame un link de un pin así:\n*.pin* https://www.pinterest.com/pin/123456789/" });
    }

    await reply({ text: "⏳ Descargando de Pinterest, dame un segundo..." });

    try {
      const [media] = await obtenerMediaPinterest(link);
      let buffer = await descargarBuffer(media.url);

      if (media.type === "video") {
        const pesoMB = buffer.length / (1024 * 1024);
        if (pesoMB > LIMITE_VIDEO_WHATSAPP_MB) {
          return reply({ text: `⚠️ El video pesa ${pesoMB.toFixed(1)}MB, demasiado grande para enviarlo por WhatsApp.` });
        }
        buffer = await asegurarVideoCompatibleWhatsApp(buffer);
        await reply({ video: buffer, mimetype: "video/mp4" });
      } else {
        buffer = await asegurarImagenCompatibleWhatsApp(buffer);
        await reply({ image: buffer, mimetype: "image/jpeg" });
      }
    } catch (e) {
      await reply({ text: `❌ No pude descargar ese pin: ${e.message}` });
    }
  }
};

