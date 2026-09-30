import fs from "fs";
import { obtenerMediaInstagram } from "../../descargas/instagram.js";
import { descargarATemporal, asegurarVideoCompatibleWhatsApp, asegurarImagenCompatibleWhatsApp, LIMITE_VIDEO_WHATSAPP_MB } from "../../descargas/core.js";

async function enviarMedia(media, reply) {
  let ruta;
  try {
    ruta = await descargarATemporal(media.url, media.type === "video" ? "mp4" : "img");
    if (media.type === "video") {
      const pesoMB = fs.statSync(ruta).size / (1024 * 1024);
      if (pesoMB > LIMITE_VIDEO_WHATSAPP_MB) {
        await reply({ text: `⚠️ Un video pesa ${pesoMB.toFixed(1)}MB, demasiado grande para enviarlo por WhatsApp. Se salteó.` });
        return;
      }
      const buffer = await asegurarVideoCompatibleWhatsApp(ruta);
      ruta = null;
      await reply({ video: buffer, mimetype: "video/mp4" });
    } else {
      const buffer = await asegurarImagenCompatibleWhatsApp(ruta);
      ruta = null;
      await reply({ image: buffer, mimetype: "image/jpeg" });
    }
  } finally {
    if (ruta && fs.existsSync(ruta)) fs.unlinkSync(ruta);
  }
}

export default {
  names: [".ig", ".instagram"],
  usage: ".ig <link>",
  desc: "Descarga fotos, carruseles o reels de Instagram",
  category: "Descargas",
  handler: async ({ cleanText, reply }) => {
    const link = cleanText.trim().split(/\s+/)[1];
    if (!link || !/instagram\.com\/(p|reel|tv)\//i.test(link)) {
      return reply({ text: "📌 Usalo así:\n*.ig* https://www.instagram.com/reel/xxxxxxx/" });
    }

    await reply({ text: "⏳ Descargando de Instagram, dame un segundo..." });

    let medias;
    try {
      medias = await obtenerMediaInstagram(link);
    } catch (e) {
      return reply({ text: `❌ No pude descargar eso: ${e.message}` });
    }

    for (const media of medias) {
      try {
        await enviarMedia(media, reply);
      } catch (e) {
        await reply({ text: `❌ Error descargando/enviando uno de los archivos: ${e.message}` });
      }
    }
  }
};
