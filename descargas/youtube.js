import { resolverLinkYoutube, obtenerInfoYoutube } from "../core.js";

export default {
  names: [".play", ".yt"],
  desc: "Busca un video de YouTube y elegí si querés el audio o el video",
  category: "Descargas",
  usage: ".play <link o nombre>",
  handler: async ({ cleanText, reply }) => {
    const consulta = cleanText.trim().split(/\s+/).slice(1).join(" ");
    if (!consulta) {
      return reply({ text: "📌 Usalo así:\n*.play* nombre del video\n*.play* https://youtu.be/xxxxxxx" });
    }

    await reply({ text: "⏳ Buscando en YouTube, dame un segundo..." });

    let link, info;
    try {
      link = await resolverLinkYoutube(consulta);
      info = await obtenerInfoYoutube(link);
    } catch (e) {
      return reply({ text: `❌ No pude buscar eso: ${e.message}` });
    }

    const texto =
      `🎬 *YouTube*\n\n` +
      `📺 *TÍTULO* › ${info.titulo}\n` +
      `👤 *CANAL* › ${info.canal}\n` +
      `⏱️ *DURACIÓN* › ${info.duracionTexto}\n` +
      `👁️ *VISTAS* › ${info.vistas}\n\n` +
      `🎵 Selecciona un formato:`;

    // El texto que ve la persona es "Audio"/"Video", pero al tocar el
    // boton, WhatsApp le devuelve al bot el buttonId de forma invisible:
    // el bot recibe ".ytaudio <link>" o ".ytvideo <link>" y los ejecuta
    // como si fueran comandos normales (ver index.js y los comandos
    // .ytaudio / .ytvideo, que estan marcados como categoria "Oculto"
    // para no aparecer en el .menu).
    try {
      await reply({
        image: info.miniatura ? { url: info.miniatura } : undefined,
        caption: texto,
        footer: "Toca un formato para descargar",
        buttons: [
          { buttonId: `.ytaudio ${link}`, buttonText: { displayText: "🎧 Audio" }, type: 1 },
          { buttonId: `.ytvideo ${link}`, buttonText: { displayText: "🎬 Video" }, type: 1 }
        ],
        headerType: 4
      });
    } catch (e) {
      // Por si el telefono/version de WhatsApp del usuario no soporta
      // botones nativos: mandamos los comandos como texto de respaldo.
      await reply({
        text:
          `${texto}\n\n` +
          `🎧 Audio: \`.ytaudio ${link}\`\n` +
          `🎬 Video: \`.ytvideo ${link}\``
      });
    }
  }
};

