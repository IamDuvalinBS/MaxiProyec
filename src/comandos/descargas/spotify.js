import axios from "axios";

const API_SPOTIFY = "https://api.stellarwa.xyz/dl/spotify";
const API_DEEZER = "https://api.deezer.com/search/track";

export default {
  names: [".spotify", ".sp", ".spdl"],
  desc: "Descargar una canción por nombre o URL",
  category: "Descargas",

  handler: async ({ sock, from, msg, args }) => {
    const texto = args.join(" ").trim();

    if (!texto) {
      return sock.sendMessage(from, {
        text: "🎵 *SPOTIFY*\n\n> .spotify nombre de la canción\n> .spotify enlace de Spotify"
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, {
        react: { text: "⏳", key: msg.key }
      });

      let url = texto;
      let titulo = "Cancion";

      const match = texto.match(
        /open\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:embed\/)?track\/([A-Za-z0-9]+)/i
      );

      const uri = texto.match(/spotify:track:([A-Za-z0-9]+)/i);
      const id = match?.[1] || uri?.[1];

      if (id) {
        url = `https://open.spotify.com/track/${id}`;
      } else if (!/^https?:\/\//i.test(texto)) {
        const { data } = await axios.get(API_DEEZER, {
          params: { q: texto, limit: 5 },
          timeout: 20000
        });

        const resultados = data?.data || [];
        const cancion = resultados.find(t =>
          t.title && t.artist?.name
        );

        if (!cancion) throw new Error("No encontré esa canción.");

        titulo = cancion.title;
        url = `https://www.deezer.com/track/${cancion.id}`;
      } else {
        throw new Error("Usa un enlace de una canción de Spotify.");
      }

      const descargar = async enlace => {
        const { data } = await axios.get(API_SPOTIFY, {
          params: {
            url: enlace,
            key: "api-7dSKm"
          },
          timeout: 30000
        });

        const resultado = data?.data || data;
        const audioUrl = resultado?.dl || resultado?.download;

        if (!audioUrl) {
          throw new Error("La API no devolvió el enlace del audio.");
        }

        const respuesta = await axios.get(audioUrl, {
          responseType: "arraybuffer",
          timeout: 60000
        });

        return {
          audio: Buffer.from(respuesta.data),
          titulo: resultado.title || titulo
        };
      };

      let resultado;

      if (url.includes("open.spotify.com/track/")) {
        resultado = await descargar(url);
      } else {
        throw new Error(
          "Encontré la canción, pero la API de Spotify necesita un enlace válido de Spotify para descargarla."
        );
      }

      if (!resultado.audio.length) {
        throw new Error("El archivo de audio está vacío.");
      }

      const nombre = resultado.titulo
        .replace(/[\\/:*?"<>|]/g, "")
        .slice(0, 100);

      await sock.sendMessage(from, {
        audio: resultado.audio,
        mimetype: "audio/mpeg",
        fileName: `${nombre || "cancion"}.mp3`,
        ptt: false
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
        text: `> ✘ ${error instanceof Error ? error.message : "Error al descargar la canción."}`
      }, { quoted: msg });
    }
  }
};
