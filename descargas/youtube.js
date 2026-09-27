import { resolverLinkYoutube, obtenerInfoYoutube, buscarVideosYoutube } from "../core.js";
import { registrarEsperaFormato } from "../motores/espera-formato.js";

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
  handler: async ({ from, sender, cleanText, reply }) => {
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

    const lineaFecha = info.fecha ? `📅 *PUBLICADO* › ${info.fecha}\n` : "";
    const texto =
      `🎬 *YouTube*\n\n` +
      `📺 *TÍTULO* › ${info.titulo}\n` +
      `👤 *CANAL* › ${info.canal}\n` +
      `⏱️ *DURACIÓN* › ${info.duracionTexto}\n` +
      `👁️ *VISTAS* › ${info.vistas}\n` +
      lineaFecha +
      `🔗 *ENLACE* › ${info.enlace}\n\n` +
      `🎵 Selecciona un formato:\n\n` +
      `Formatos\n` +
      `Audio: 1\n` +
      `Video: 2\n\n` +
      `> Elegí en que formato descargar el link\n\n` +
      `Pᴏᴡᴇʀᴇᴅ Bʏ • ItsDuva`;

    // Antes se intentaba mandar botones nativos de WhatsApp
    // (buttonsMessage). Se sacó porque WhatsApp ya no los muestra en
    // cuentas normales: Baileys arma el mensaje sin error, pero WhatsApp
    // le borra los botones y solo entrega el texto/caption. Ahora en vez
    // de eso se guarda una "espera" para que la persona responda solo
    // "1" o "2" (sin prefijo, sin citar el mensaje) y se resuelve en
    // index.js antes de Akinator/juegos/trivia (ver motores/espera-formato.js).
    registrarEsperaFormato(`${from}:${sender}`, link);

    // "externalAdReply" es el mismo truco que usa WhatsApp para mostrar la
    // vista previa de un link real (miniatura grande + titulo + dominio),
    // pero armado a mano: asi el mensaje se ve igual que si hubieras
    // pegado el link de YouTube directo, en vez de mandar la miniatura
    // como una imagen normal con caption.
    await reply({
      text: texto,
      contextInfo: {
        externalAdReply: {
          title: info.titulo,
          body: info.canal,
          thumbnailUrl: info.miniatura || undefined,
          mediaType: 1,
          renderLargerThumbnail: true,
          showAdAttribution: false,
          sourceUrl: info.enlace
        }
      }
    });
  }
};
