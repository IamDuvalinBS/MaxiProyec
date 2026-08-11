import { descargarAudioYoutube } from "../core.js";

export default {
  names: [".ytaudio"],
  desc: "Comando interno: descarga el audio (se dispara desde el botón Audio de .play)",
  category: "Oculto", // "Oculto" no está en ordenCategorias de menu.js, asi que nunca aparece en el .menu
  usage: ".ytaudio <link>",
  handler: async ({ cleanText, reply }) => {
    const link = cleanText.trim().split(/\s+/)[1];
    if (!link) return reply({ text: "❌ Faltó el link del video." });

    await reply({ text: "⏳ Descargando el audio..." });
    try {
      const audioBuffer = await descargarAudioYoutube(link);
      await reply({ audio: audioBuffer, mimetype: "audio/mpeg", ptt: false });
    } catch (e) {
      await reply({ text: `❌ No pude descargar el audio: ${e.message}` });
    }
  }
};

