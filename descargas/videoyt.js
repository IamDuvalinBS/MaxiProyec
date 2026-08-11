import { descargarVideoYoutube, obtenerInfoYoutube } from "../core.js";

export default {
  names: [".ytvideo"],
  desc: "Comando interno: descarga el video (se dispara desde el botón Video de .play)",
  category: "Oculto", // "Oculto" no está en ordenCategorias de menu.js, asi que nunca aparece en el .menu
  usage: ".ytvideo <link>",
  handler: async ({ cleanText, reply }) => {
    const link = cleanText.trim().split(/\s+/)[1];
    if (!link) return reply({ text: "❌ Faltó el link del video." });

    await reply({ text: "⏳ Descargando el video..." });
    try {
      const [videoBuffer, info] = await Promise.all([descargarVideoYoutube(link), obtenerInfoYoutube(link)]);
      await reply({ video: videoBuffer, mimetype: "video/mp4", caption: info.titulo });
    } catch (e) {
      await reply({ text: `❌ No pude descargar el video: ${e.message}` });
    }
  }
};

