import { resolverLinkYoutube, obtenerInfoYoutube, buscarVideosYoutube } from "../core.js";

// Fusiona lo que antes eran youtube.js (.play/.yt) y ytsearch.js
// (.ytsearch/.buscaryt) en un solo comando. Se mantiene UN solo
// "export default" (como en los archivos originales) para no depender
// de si el loader de comandos soporta que un archivo exporte varios
// comandos a la vez: acá se decide qué hacer mirando con qué alias
// entró el mensaje (primera palabra de cleanText).
export default {
  names: [".play", ".yt", ".ytsearch", ".buscaryt"],
  desc: "'.play' busca un video y te deja elegir audio o video; '.ytsearch' lista los primeros 10 resultados",
  category: "Descargas",
  usage: ".play <link o nombre> | .ytsearch <lo que quieras buscar>",
  handler: async ({ cleanText, reply }) => {
    const partes = cleanText.trim().split(/\s+/);
    const comando = partes[0].toLowerCase();
    const consulta = partes.slice(1).join(" ");
    const esListado = comando === ".ytsearch" || comando === ".buscaryt";

    if (!consulta) {
      return reply({
        text: esListado
          ? "📌 Usalo así:\n*.ytsearch* historias de terror"
          : "📌 Usalo así:\n*.play* nombre del video\n*.play* https://youtu.be/xxxxxxx"
      });
    }

    await reply({ text: "⏳ Buscando en YouTube, dame un segundo..." });

    // --- Rama .ytsearch / .buscaryt: lista de 10 resultados ---
    if (esListado) {
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

      // Solo se manda la miniatura del primer resultado, como antes.
      const primera = resultados[0];
      if (primera.miniatura) {
        await reply({ image: { url: primera.miniatura }, caption: texto.trim() });
      } else {
        await reply({ text: texto.trim() });
      }
      return;
    }

    // --- Rama .play / .yt: un solo video + botones Audio/Video ---
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
    // como si fueran comandos normales (ver yt-descargas.js, marcado
    // como categoria "Oculto" para no aparecer en el .menu).
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
