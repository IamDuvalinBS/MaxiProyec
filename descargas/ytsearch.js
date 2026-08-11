import { buscarVideosYoutube } from "../core.js";

export default {
  names: [".ytsearch", ".buscaryt"],
  desc: "Busca videos en YouTube y muestra los primeros 10 resultados",
  category: "Descargas",
  usage: ".ytsearch <lo que quieras buscar>",
  handler: async ({ cleanText, reply }) => {
    const consulta = cleanText.trim().split(/\s+/).slice(1).join(" ");
    if (!consulta) {
      return reply({ text: "📌 Usalo así:\n*.ytsearch* historias de terror" });
    }

    await reply({ text: "⏳ Buscando en YouTube, dame un segundo..." });

    let resultados;
    try {
      resultados = await buscarVideosYoutube(consulta, 10);
    } catch (e) {
      return reply({ text: `❌ No pude buscar eso: ${e.message}` });
    }

    if (resultados.length === 0) {
      return reply({ text: "😕 No encontré resultados para eso." });
    }

    let texto = `🔎 *Resultados para:* ${consulta}\n\n`;
    resultados.forEach((v, i) => {
      texto +=
        `*${i + 1}.* ${v.titulo}\n` +
        `⏱️ ${v.duracion} · 📅 ${v.fecha}\n` +
        `🔗 ${v.url}\n\n`;
    });

    // Solo se manda la miniatura del primer resultado, el resto se ignoran
    // (tal como se pidió) - los demas solo aparecen como texto en la lista.
    const primera = resultados[0];
    if (primera.miniatura) {
      await reply({ image: { url: primera.miniatura }, caption: texto.trim() });
    } else {
      await reply({ text: texto.trim() });
    }
  }
};
