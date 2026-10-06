import { buscarCancionSpotify } from "../core.js";

export default {
  names: [".spotify", ".sb"],
  desc: "Busca una canción en Spotify (info, portada y preview oficial de 30s)",
  category: "Descargas",
  usage: ".spotify <nombre de la cancion>",
  handler: async ({ cleanText, reply }) => {
    const consulta = cleanText.trim().split(/\s+/).slice(1).join(" ");
    if (!consulta) {
      return reply({ text: "📌 Usalo así:\n*.spotify* nombre de la cancion" });
    }

    await reply({ text: "⏳ Buscando en Spotify, dame un segundo..." });

    try {
      const cancion = await buscarCancionSpotify(consulta);
      const caption =
        `🎧 *${cancion.titulo}*\n` +
        `👤 ${cancion.artistas}\n` +
        `💿 ${cancion.album}\n` +
        `🔗 ${cancion.spotifyUrl}`;

      if (cancion.portada) {
        await reply({ image: { url: cancion.portada }, caption });
      } else {
        await reply({ text: caption });
      }

      if (cancion.previewUrl) {
        await reply({ audio: { url: cancion.previewUrl }, mimetype: "audio/mpeg", ptt: false });
      } else {
        await reply({
          text: "ℹ️ Esa canción no tiene preview disponible en Spotify. La escucha completa solo esta dentro de la app de Spotify."
        });
      }
    } catch (e) {
      await reply({ text: `❌ No pude buscar eso: ${e.message}` });
    }
  }
};

