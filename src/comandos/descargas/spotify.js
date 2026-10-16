import axios from "axios";

export default {
  names: [".spotify", ".sp", ".spdl"],
  desc: "Descargar una canción por URL o nombre",
  category: "Descargas",

  handler: async ({ sock, from, msg, args }) => {
    const texto = args.join(" ").trim();

    if (!texto) {
      return sock.sendMessage(from, {
        text: "🎵 *SPOTIFY*\n\n> Usa:\n> .spotify nombre de la canción\n> .spotify enlace de Spotify"
      }, { quoted: msg });
    }

    await sock.sendMessage(from, {
      react: { text: "⏳", key: msg.key }
    });

    try {
      let url = texto;

      if (!/open\.spotify\.com\/track\//i.test(texto)) {
        if (/^https?:\/\//i.test(texto)) {
          throw new Error("Envía un enlace de una canción de Spotify.");
        }

        const busqueda = await axios.get(
          "https://api.deezer.com/search/track",
          { params: { q: texto, limit: 1 }, timeout: 20000 }
        );

        const cancion = busqueda.data?.data?.[0];

        if (!cancion) {
          throw new Error("No encontré esa canción.");
        }

        url = `https://open.spotify.com/track/${cancion.id}`;
      }

      const { data } = await axios.get(
        "https://api.stellarwa.xyz/dl/spotify",
        {
          params: {
            url,
            key: "api-7dSKm"
          },
          timeout: 30000
        }
      );

      const cancion = data?.data || data;
      const urlAudio = cancion?.dl || cancion?.download;

      if (!urlAudio) {
        throw new Error("La API no devolvió el audio.");
      }

      const respuesta = await axios.get(urlAudio, {
        responseType: "arraybuffer",
        timeout: 60000
      });

      await sock.sendMessage(from, {
        audio: Buffer.from(respuesta.data),
        mimetype: "audio/mpeg",
        fileName: `${cancion.title || "cancion"}.mp3`,
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
