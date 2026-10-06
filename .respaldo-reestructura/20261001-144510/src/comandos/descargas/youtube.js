import {
  resolverLinkYoutube,
  obtenerInfoYoutube,
  buscarVideosYoutube,
  descargarAudioConProveedores,
  descargarVideoConProveedores
} from "../../descargas/youtube-engine.js";
import { descargarBuffer } from "../../descargas/core.js";
import { registrarEspera } from "../../nucleo/espera.js";

const DURACION_ESPERA_MS = 5 * 60 * 1000;

async function enviarDescarga({ sock, from, msg, link, esAudio }) {
  const responder = (contenido) => sock.sendMessage(from, contenido, { quoted: msg });
  await responder({ text: esAudio ? "⏳ Descargando el audio..." : "⏳ Descargando el video..." });

  try {
    if (esAudio) {
      const audio = await descargarAudioConProveedores(link);
      await responder({ audio, mimetype: "audio/mpeg", ptt: false });
    } else {
      const video = await descargarVideoConProveedores(link);
      await responder({ video, mimetype: "video/mp4" });
    }
  } catch (e) {
    await responder({ text: `❌ No pude descargar el ${esAudio ? "audio" : "video"}: ${e.message}` });
  }
}

export default {
  names: [".play", ".yt", ".ytsearch", ".buscaryt"],
  usage: ".play <link o nombre> | .ytsearch <lo que quieras buscar>",
  desc: "'.play' busca un video y te deja elegir audio o video; '.ytsearch' lista los primeros 10 resultados",
  category: "Descargas",
  handler: async ({ sock, from, sender, cleanText, reply }) => {
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

    if (esListado) {
      let resultados;
      try {
        resultados = await buscarVideosYoutube(consulta, 10);
      } catch (e) {
        return reply({ text: `❌ No pude buscar eso: ${e.message}` });
      }
      if (resultados.length === 0) return reply({ text: "😕 No encontré resultados para eso." });

      let texto = `🔎 *Resultados para:* ${consulta}\n\n`;
      resultados.forEach((v, i) => {
        texto += `*${i + 1}.* ${v.titulo}\n⏱️ ${v.duracion} · 📅 ${v.fecha}\n🔗 ${v.url}\n\n`;
      });

      const primera = resultados[0];
      if (primera.miniatura) await reply({ image: { url: primera.miniatura }, caption: texto.trim() });
      else await reply({ text: texto.trim() });
      return;
    }

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
      `🎵 Selecciona un formato:\n\nFormatos\nAudio: 1\nVideo: 2\n\n` +
      `> Elegí en que formato descargar el link\n\nPᴏᴡᴇʀᴇᴅ Bʏ • ItsDuva`;

    registrarEspera(`${from}:${sender}`, {
      duracionMs: DURACION_ESPERA_MS,
      alResponder: async (respuesta, ctx) => {
        const opcion = respuesta.trim();
        if (opcion !== "1" && opcion !== "2") return false;
        await enviarDescarga({ sock: ctx.sock, from: ctx.from, msg: ctx.msg, link, esAudio: opcion === "1" });
        return true;
      }
    });

    let miniatura;
    try {
      miniatura = info.miniatura ? await descargarBuffer(info.miniatura) : undefined;
    } catch (e) {
      miniatura = undefined;
    }

    await reply({
      text: texto,
      contextInfo: {
        isForwarded: true,
        forwardingScore: 999,
        externalAdReply: {
          title: info.titulo,
          body: `${info.canal} · Pᴏᴡᴇʀᴇᴅ Bʏ • ItsDuva`,
          mediaType: 1,
          thumbnail: miniatura,
          renderLargerThumbnail: true,
          showAdAttribution: false,
          sourceUrl: info.enlace
        }
      }
    });
  }
};
