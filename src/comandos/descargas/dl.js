import axios from "axios";
import { descargarBuffer } from "../../descargas/core.js";
import { reenviarCacheado, guardarMedioEnviado } from "../../../motores/cache-medios.js";
import { encabezado } from "../../economia/estilo.js";
import {
  tarjetaDescarga,
  tarjetaUso,
  tarjetaError,
  campo
} from "../../descargas/tarjetas.js";

const PIE_DE_PAGINA = "Pᴏᴡᴇʀᴇᴅ Bʏ • ItsDuva";
const URL_SPOTIFY = /open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|episode)/i;

const limpiarNombre = (texto, respaldo) =>
  (texto || respaldo).replace(/[\\/:*?"<>|]/g, "").trim() || respaldo;

async function spotifyDownload(url) {
  const extraer = (data) => ({
    title: data.data?.title || data.title,
    artist: data.data?.artist || data.artist,
    album: data.data?.album || data.album,
    download: data.data?.dl || data.data?.download || data.download,
    thumbnail: data.data?.image || data.data?.thumbnail || data.image,
    duration: data.data?.duration || data.duration
  });

  const apis = [
    `https://api.stellarwa.xyz/dl/spotify?url=${encodeURIComponent(url)}&key=api-7dSKm`,
    `https://api.alyacore.xyz/dl/spotify?url=${encodeURIComponent(url)}&key=oboe`
  ];

  for (const api of apis) {
    try {
      const { data } = await axios.get(api, { timeout: 30000 });
      const resultado = extraer(data);
      if (resultado.download) return resultado;
    } catch {
      continue;
    }
  }
  return null;
}

export default {
  names: [".spotify", ".sp", ".spotifydl", ".spdl"],
  usage: ".spotify <enlace de Spotify>",
  desc: "Descarga canciones de Spotify en audio MP3",
  category: "Descargas",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const partes = cleanText.trim().split(/\s+/);
    const link = partes[1]?.trim();

    if (!link) {
      return reply({
        text: tarjetaUso({
          comando: ".spotify <enlace>",
          ejemplo: ".spotify https://open.spotify.com/track/xxxxxxxxxxxxxxxxxxxxxx",
          nota: "El enlace debe ser de open.spotify.com."
        }),
        mentions: [sender]
      });
    }

    if (!URL_SPOTIFY.test(link)) {
      return reply({
        text: tarjetaError("Enlace no válido. Debe ser de open.spotify.com (track, album, playlist o episode).")
      });
    }

    const claveCache = `sp:audio:${link}`;
    if (await reenviarCacheado(sock, from, claveCache, msg)) return;

    let dl;
    try {
      dl = await spotifyDownload(link);
      if (!dl?.download) throw new Error("No se pudo obtener el audio.");
    } catch (e) {
      return reply({ text: tarjetaError("No se pudo obtener la información de la canción.", e.message) });
    }

    const texto = tarjetaDescarga({
      emoji: "🎵",
      titulo: "SPOTIFY DOWNLOAD",
      sender,
      campos: [
        campo("💭", "Título", dl.title || "Spotify"),
        campo("🎤", "Artista", dl.artist || "Desconocido"),
        campo("💿", "Álbum", dl.album || "Single"),
        campo("⏳", "Duración", dl.duration || "N/A"),
        campo("🔗", "Link", link)
      ],
      nota: "Descargando el audio. Esto puede tardar unos segundos."
    });

    if (dl.thumbnail) {
      await reply({ image: { url: dl.thumbnail }, caption: texto, mentions: [sender] });
    } else {
      await reply({ text: texto, mentions: [sender] });
    }

    try {
      const audio = await descargarBuffer(dl.download);
      const fileName = `${limpiarNombre(dl.title, "spotify")} - ${limpiarNombre(dl.artist, "artist")}.mp3`;

      const enviado = await reply({
        audio,
        mimetype: "audio/mpeg",
        ptt: false,
        fileName
      });
      guardarMedioEnviado(claveCache, enviado);
    } catch (e) {
      await reply({ text: tarjetaError("No se pudo descargar el audio.", e.message) });
    }
  }
};
