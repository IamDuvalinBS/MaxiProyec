import {
  obtenerMediaInstagram,
  obtenerStoriesInstagram,
  descargarBuffer,
  asegurarVideoCompatibleWhatsApp,
  asegurarImagenCompatibleWhatsApp,
  LIMITE_VIDEO_WHATSAPP_MB
} from "../core.js";

// Manda un buffer ya descargado, re-codificando segun el tipo para que
// WhatsApp lo reciba siempre como video/imagen reproducible (no roto).
async function enviarMedia(media, reply) {
  let buffer = await descargarBuffer(media.url);

  if (media.type === "video") {
    const pesoMB = buffer.length / (1024 * 1024);
    if (pesoMB > LIMITE_VIDEO_WHATSAPP_MB) {
      await reply({
        text: `⚠️ Un video pesa ${pesoMB.toFixed(1)}MB, demasiado grande para enviarlo por WhatsApp. Se salteó.`
      });
      return;
    }
    buffer = await asegurarVideoCompatibleWhatsApp(buffer);
    await reply({ video: buffer, mimetype: "video/mp4" });
  } else {
    buffer = await asegurarImagenCompatibleWhatsApp(buffer);
    await reply({ image: buffer, mimetype: "image/jpeg" });
  }
}

export default {
  names: [".ig", ".instagram"],
  desc: "Descarga fotos, carruseles, reels o historias de Instagram",
  category: "Descargas",
  usage: ".ig <link o @usuario para historias>",
  handler: async ({ cleanText, reply }) => {
    const argumento = cleanText.trim().split(/\s+/)[1];

    if (!argumento) {
      return reply({
        text:
          "📌 Usalo así:\n" +
          "*.ig* https://www.instagram.com/reel/xxxxxxx/ → post/reel\n" +
          "*.ig* @usuario → historias activas de ese usuario"
      });
    }

    const esStory =
      /instagram\.com\/stories\//i.test(argumento) ||
      argumento.startsWith("@") ||
      (!argumento.includes("instagram.com") && !/^https?:\/\//i.test(argumento));

    await reply({ text: `⏳ Descargando ${esStory ? "historias" : "contenido"} de Instagram, dame un segundo...` });

    let medias;
    try {
      medias = esStory ? await obtenerStoriesInstagram(argumento) : await obtenerMediaInstagram(argumento);
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
