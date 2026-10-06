import {
  obtenerMediaFacebook,
  descargarBuffer,
  asegurarVideoCompatibleWhatsApp,
  LIMITE_VIDEO_WHATSAPP_MB
} from "../core.js";

export default {
  names: [".fb", ".facebook"],
  desc: "Descarga videos publicos de Facebook a partir de un link",
  category: "Descargas",
  usage: ".fb <link del video>",
  handler: async ({ cleanText, reply }) => {
    const link = cleanText.trim().split(/\s+/)[1];
    if (!link || !/facebook\.com|fb\.watch/i.test(link)) {
      return reply({ text: "📌 Mandame un link de un video de Facebook así:\n*.fb* https://www.facebook.com/.../videos/..." });
    }

    await reply({ text: "⏳ Descargando de Facebook, dame un segundo..." });

    try {
      const [media] = await obtenerMediaFacebook(link);
      let buffer = await descargarBuffer(media.url);

      const pesoMB = buffer.length / (1024 * 1024);
      if (pesoMB > LIMITE_VIDEO_WHATSAPP_MB) {
        return reply({ text: `⚠️ El video pesa ${pesoMB.toFixed(1)}MB, demasiado grande para enviarlo por WhatsApp.` });
      }

      buffer = await asegurarVideoCompatibleWhatsApp(buffer);
      await reply({ video: buffer, mimetype: "video/mp4" });
    } catch (e) {
      await reply({ text: `❌ No pude descargar ese video: ${e.message}` });
    }
  }
};

