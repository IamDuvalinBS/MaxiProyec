import { obtenerVideoReddit, asegurarImagenCompatibleWhatsApp, LIMITE_VIDEO_WHATSAPP_MB } from "../core.js";

export default {
  names: [".reddit"],
  desc: "Descarga el video o imagen de un post de Reddit",
  category: "Descargas",
  usage: ".reddit <link del post>",
  handler: async ({ cleanText, reply }) => {
    const link = cleanText.trim().split(/\s+/)[1];
    if (!link || !/reddit\.com/i.test(link)) {
      return reply({ text: "📌 Mandame un link de un post de Reddit así:\n*.reddit* https://www.reddit.com/r/xxxx/comments/xxxxxx/..." });
    }

    await reply({ text: "⏳ Descargando de Reddit, dame un segundo..." });

    try {
      const media = await obtenerVideoReddit(link);

      if (media.type === "video") {
        const pesoMB = media.buffer.length / (1024 * 1024);
        if (pesoMB > LIMITE_VIDEO_WHATSAPP_MB) {
          return reply({ text: `⚠️ El video pesa ${pesoMB.toFixed(1)}MB, demasiado grande para enviarlo por WhatsApp.` });
        }
        await reply({ video: media.buffer, mimetype: "video/mp4" });
      } else {
        const buffer = await asegurarImagenCompatibleWhatsApp(media.buffer);
        await reply({ image: buffer, mimetype: "image/jpeg" });
      }
    } catch (e) {
      await reply({ text: `❌ No pude descargar ese post: ${e.message}` });
    }
  }
};

