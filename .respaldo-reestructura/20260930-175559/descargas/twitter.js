import {
  obtenerMediaTwitter,
  descargarBuffer,
  asegurarVideoCompatibleWhatsApp,
  asegurarImagenCompatibleWhatsApp,
  LIMITE_VIDEO_WHATSAPP_MB
} from "../core.js";

export default {
  names: [".x", ".twitter"],
  desc: "Descarga videos o fotos de un post de X (Twitter)",
  category: "Descargas",
  usage: ".x <link del tweet>",
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
      try {
        let buffer = await descargarBuffer(media.url);
        if (media.type === "video") {
          const pesoMB = buffer.length / (1024 * 1024);
          if (pesoMB > LIMITE_VIDEO_WHATSAPP_MB) {
            await reply({ text: `⚠️ El video pesa ${pesoMB.toFixed(1)}MB, muy grande para WhatsApp. Se salteó.` });
            continue;
          }
          buffer = await asegurarVideoCompatibleWhatsApp(buffer);
          await reply({ video: buffer, mimetype: "video/mp4" });
        } else {
          buffer = await asegurarImagenCompatibleWhatsApp(buffer);
          await reply({ image: buffer, mimetype: "image/jpeg" });
        }
      } catch (e) {
        await reply({ text: `❌ Error descargando/enviando uno de los archivos: ${e.message}` });
      }
    }
  }
};
