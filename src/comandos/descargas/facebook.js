import fs from "fs";
import { obtenerMediaFacebook } from "../../descargas/redes.js";
import { descargarATemporal, asegurarVideoCompatibleWhatsApp, LIMITE_VIDEO_WHATSAPP_MB } from "../../descargas/core.js";

export default {
  names: [".fb", ".facebook"],
  usage: ".fb <link del video>",
  desc: "Descarga videos públicos de Facebook a partir de un link",
  category: "Descargas",
  handler: async ({ cleanText, reply }) => {
    const link = cleanText.trim().split(/\s+/)[1];
    if (!link || !/facebook\.com|fb\.watch/i.test(link)) {
      return reply({ text: "📌 Mandame un link de un video de Facebook así:\n*.fb* https://www.facebook.com/.../videos/..." });
    }

    await reply({ text: "⏳ Descargando de Facebook, dame un segundo..." });

    let ruta;
    try {
      const [media] = await obtenerMediaFacebook(link);
      ruta = await descargarATemporal(media.url, "mp4");

      const pesoMB = fs.statSync(ruta).size / (1024 * 1024);
      if (pesoMB > LIMITE_VIDEO_WHATSAPP_MB) {
        return reply({ text: `⚠️ El video pesa ${pesoMB.toFixed(1)}MB, demasiado grande para enviarlo por WhatsApp.` });
      }

      const buffer = await asegurarVideoCompatibleWhatsApp(ruta);
      ruta = null;
      await reply({ video: buffer, mimetype: "video/mp4" });
    } catch (e) {
      await reply({ text: `❌ No pude descargar ese video: ${e.message}` });
    } finally {
      if (ruta && fs.existsSync(ruta)) fs.unlinkSync(ruta);
    }
  }
};
