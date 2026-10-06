import fs from "fs";
import { obtenerMediaPinterest } from "../../descargas/redes.js";
import { descargarATemporal, asegurarVideoCompatibleWhatsApp, asegurarImagenCompatibleWhatsApp, LIMITE_VIDEO_WHATSAPP_MB } from "../../descargas/core.js";

export default {
  names: [".pin", ".pinterest"],
  usage: ".pin <link del pin>",
  desc: "Descarga la imagen o video de un pin de Pinterest",
  category: "Descargas",
  handler: async ({ cleanText, reply }) => {
    const link = cleanText.trim().split(/\s+/)[1];
    if (!link || !/pinterest\.[a-z.]+\/pin|pin\.it/i.test(link)) {
      return reply({ text: "📌 Mandame un link de un pin así:\n*.pin* https://www.pinterest.com/pin/123456789/" });
    }

    await reply({ text: "⏳ Descargando de Pinterest, dame un segundo..." });

    let ruta;
    try {
      const [media] = await obtenerMediaPinterest(link);
      ruta = await descargarATemporal(media.url, media.type === "video" ? "mp4" : "img");

      if (media.type === "video") {
        const pesoMB = fs.statSync(ruta).size / (1024 * 1024);
        if (pesoMB > LIMITE_VIDEO_WHATSAPP_MB) {
          return reply({ text: `⚠️ El video pesa ${pesoMB.toFixed(1)}MB, demasiado grande para enviarlo por WhatsApp.` });
        }
        const buffer = await asegurarVideoCompatibleWhatsApp(ruta);
        ruta = null;
        await reply({ video: buffer, mimetype: "video/mp4" });
      } else {
        const buffer = await asegurarImagenCompatibleWhatsApp(ruta);
        ruta = null;
        await reply({ image: buffer, mimetype: "image/jpeg" });
      }
    } catch (e) {
      await reply({ text: `❌ No pude descargar ese pin: ${e.message}` });
    } finally {
      if (ruta && fs.existsSync(ruta)) fs.unlinkSync(ruta);
    }
  }
};
