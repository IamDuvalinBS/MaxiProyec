import fs from "fs";
import { obtenerMediaTwitter } from "../../descargas/redes.js";
import { descargarATemporal, asegurarVideoCompatibleWhatsApp, asegurarImagenCompatibleWhatsApp, LIMITE_VIDEO_WHATSAPP_MB } from "../../descargas/core.js";

export default {
  names: [".x", ".twitter"],
  usage: ".x <link del tweet>",
  desc: "Descarga videos o fotos de un post de X (Twitter)",
  category: "Descargas",
  handler: async ({ cleanText, reply }) => {
    const link = cleanText.trim().split(/\s+/)[1];
    if (!link || !/(twitter|x)\.com/i.test(link)) {
      return reply({ text: "📌 Mandame un link de un post de X así:\n*.x* https://x.com/usuario/status/123456789" });
    }

    await reply({ text: "⏳ Descargando de X, dame un segundo..." });

    let medias;
    try {
      medias = await obtenerMediaTwitter(link);
    } catch (e) {
      return reply({ text: `❌ No pude descargar ese link: ${e.message}` });
    }

    for (const media of medias) {
      let ruta;
      try {
        ruta = await descargarATemporal(media.url, media.type === "video" ? "mp4" : "img");
        if (media.type === "video") {
          const pesoMB = fs.statSync(ruta).size / (1024 * 1024);
          if (pesoMB > LIMITE_VIDEO_WHATSAPP_MB) {
            await reply({ text: `⚠️ El video pesa ${pesoMB.toFixed(1)}MB, muy grande para WhatsApp. Se salteó.` });
            continue;
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
        await reply({ text: `❌ Error descargando/enviando uno de los archivos: ${e.message}` });
      } finally {
        if (ruta && fs.existsSync(ruta)) fs.unlinkSync(ruta);
      }
    }
  }
};
