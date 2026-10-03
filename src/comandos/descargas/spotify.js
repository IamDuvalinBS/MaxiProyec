import { buscarCancion } from "../../descargas/spotify.js";
import { tarjetaDescarga, tarjetaUso, tarjetaError, campo, duracionLarga } from "../../descargas/tarjetas.js";

export default {
  names: [".spotify", ".sb"],
  usage: ".spotify <nombre de la canción o enlace de Spotify>",
  desc: "Busca una canción (sin cuentas ni claves) y envía su información, portada y vista previa de 30 segundos",
  category: "Descargas",
  handler: async ({ sender, cleanText, reply }) => {
    const consulta = cleanText.trim().split(/\s+/).slice(1).join(" ");
    if (!consulta) {
      return reply({
        text: tarjetaUso({
          comando: ".spotify <canción o enlace>",
          ejemplo: ".spotify Shape of You Ed Sheeran",
          nota: "También acepta un enlace de una canción de Spotify."
        }),
        mentions: [sender]
      });
    }

    await reply({
      text: tarjetaDescarga({
        emoji: "🎧",
        titulo: "SPOTIFY SEARCH",
        sender,
        campos: [campo("🔎", "Búsqueda", consulta)],
        nota: "Buscando la canción. Esto puede tardar unos segundos."
      }),
      mentions: [sender]
    });

    let cancion;
    try {
      cancion = await buscarCancion(consulta);
    } catch (e) {
      return reply({ text: tarjetaError("No se pudo completar la búsqueda.", e.message) });
    }

    const caption = tarjetaDescarga({
      emoji: "🎧",
      titulo: "SPOTIFY SEARCH",
      sender,
      campos: [
        campo("💭", "Título", cancion.titulo),
        campo("👤", "Artista", cancion.artistas),
        campo("💿", "Álbum", cancion.album),
        campo("⏳", "Duración", duracionLarga(cancion.duracionSeg)),
        campo("🌐", "Fuente", cancion.fuente),
        campo("🔗", "Enlace", cancion.enlace || "No disponible")
      ],
      nota: "Se envía una vista previa de 30 segundos. Para la canción completa usa *.play <nombre>*."
    });

    if (cancion.portada) {
      await reply({ image: { url: cancion.portada }, caption, mentions: [sender], cacheKey: `spotify:imagen:${cancion.id}` });
    } else {
      await reply({ text: caption, mentions: [sender] });
    }

    if (!cancion.previewUrl) {
      return reply({ text: tarjetaError("Esta canción no tiene vista previa disponible.", "Usa *.play* para descargarla completa desde YouTube.") });
    }
    await reply({ audio: { url: cancion.previewUrl }, mimetype: "audio/mpeg", ptt: false, cacheKey: `spotify:audio:${cancion.id}` });
  }
};
