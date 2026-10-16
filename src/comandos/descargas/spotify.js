import axios from "axios";
import fs from "node:fs";
import { cleanTmp, downloadToTmp, spotifyDownload } from "../../core/mediaTools.js";
import { searchTrack, downloadTrackAudio, safeName } from "./_music.js";

export default {
  names: [".spotify", ".sp", ".spdl"],
  desc: "Descargar una canción por URL o nombre",
  category: "Descargas",

  handler: async ({ sock, from, msg, args }) => {
    const texto = args.join(" ").trim();

    if (!texto) {
      return sock.sendMessage(from, {
        text: "🎵 *SPOTIFY*\n\n> Escribe el nombre de una canción o pega su enlace."
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        react: { text: "⏳", key: msg.key }
      });

      let cancion;
      let audio;

      const match = texto.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:embed\/)?track\/([A-Za-z0-9]+)/i);

      if (match || /^spotify:track:/i.test(texto)) {
        const id = match
          ? match[1]
          : texto.match(/^spotify:track:([A-Za-z0-9]+)/i)?.[1];

        if (!id) throw new Error("Enlace de Spotify inválido.");

        const url = `https://open.spotify.com/track/${id}`;
        const descarga = await spotifyDownload(url);

        if (descarga?.download) {
          const tmp = await downloadToTmp(descarga.download, "mp3", "spotify");
          try {
            audio = fs.readFileSync(tmp);
          } finally {
            cleanTmp(tmp);
          }

          cancion = { title: descarga.title || "Canción", artist: descarga.artist || "" };
        } else {
          cancion = await searchTrack(texto);
          if (!cancion) throw new Error("No encontré la canción.");
          audio = await downloadTrackAudio(cancion);
        }
      } else {
        if (/^https?:\/\//i.test(texto)) {
          throw new Error("Envía un enlace de una canción de Spotify.");
        }

        cancion = await searchTrack(texto);
        if (!cancion) throw new Error("No encontré esa canción.");

        audio = await downloadTrackAudio(cancion);
      }

      if (!audio?.length) throw new Error("La descarga llegó vacía.");

      await sock.sendMessage(from, {
        audio,
        mimetype: "audio/mpeg",
        ptt: false,
        fileName: `${safeName(cancion.title)}.mp3`
      }, { quoted: msg });

      await sock.sendMessage(from, {
        react: { text: "✅", key: msg.key }
      });
    } catch (error) {
      console.error("[Spotify]", error);

      await sock.sendMessage(from, {
        react: { text: "❌", key: msg.key }
      });

      await sock.sendMessage(from, {
        text: `> ✘ ${error instanceof Error ? error.message : "No se pudo descargar la canción."}`
      }, { quoted: msg });
    }
  }
};
