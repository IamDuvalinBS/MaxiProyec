import axios from "axios";
import { resolverLinkYoutube, descargarAudioConProveedores } from "../../descargas/youtube-engine.js";

const API_SPOTIFY = "https://api.stellarwa.xyz/dl/spotify";
const API_SPOTIFY_RESPALDO = "https://api.delirius.store/download/spotify";
const API_DEEZER = "https://api.deezer.com/search/track";
const KEY_SPOTIFY = process.env.STELLARWA_KEY || "api-7dSKm";

const motivo = (e) => String(e?.response?.status ? `HTTP ${e.response.status}` : e?.message || e).split("\n")[0];

// Descarga el audio de un enlace de canción de Spotify. Prueba StellarWA y, si falla, Delirius.
async function descargarSpotify(enlace) {
  const proveedores = [
    ["StellarWA", API_SPOTIFY, { url: enlace, key: KEY_SPOTIFY }],
    ["Delirius", API_SPOTIFY_RESPALDO, { url: enlace }]
  ];
  let ultimo = null;
  for (const [nombre, api, params] of proveedores) {
    try {
      const { data } = await axios.get(api, { params, timeout: 30000 });
      const r = data?.data || data?.result || data;
      const audioUrl = r?.dl || r?.download || r?.downloadUrl || r?.url;
      if (!audioUrl || !/^https?:\/\//i.test(audioUrl)) throw new Error("no devolvió el enlace del audio");
      const respuesta = await axios.get(audioUrl, { responseType: "arraybuffer", timeout: 60000 });
      const audio = Buffer.from(respuesta.data);
      if (!audio.length) throw new Error("audio vacío");
      return { audio, titulo: r.title || r.name || "cancion" };
    } catch (e) {
      ultimo = e;
      console.log(`[Spotify] ${nombre} falló: ${motivo(e)}`);
    }
  }
  throw ultimo || new Error("No se pudo descargar de Spotify.");
}

// Busca el enlace de Spotify de una canción por nombre. Las respuestas se revisan completas buscando el primer open.spotify.com/track/<id>.
async function buscarEnlaceSpotify(texto) {
  const q = encodeURIComponent(texto);
  const buscadores = [
    ["StellarWA", `https://api.stellarwa.xyz/search/spotify?query=${q}&key=${KEY_SPOTIFY}`],
    ["Delirius", `https://api.delirius.online/search/spotify?q=${q}&limit=5`]
  ];
  for (const [nombre, url] of buscadores) {
    try {
      const { data } = await axios.get(url, { timeout: 20000 });
      const id = JSON.stringify(data).replace(/\\\//g, "/").match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?track\/([A-Za-z0-9]{22})/i)?.[1];
      if (id) return `https://open.spotify.com/track/${id}`;
      console.log(`[Spotify] búsqueda ${nombre}: sin enlace de canción`);
    } catch (e) {
      console.log(`[Spotify] búsqueda ${nombre} falló: ${motivo(e)}`);
    }
  }
  return null;
}

// Respaldo por nombre: se identifica la canción en Deezer (título + artista) y el audio se baja con el mismo motor que .play.
async function descargarPorNombre(texto) {
  let consulta = texto;
  let titulo = texto;
  try {
    const { data } = await axios.get(API_DEEZER, { params: { q: texto, limit: 5 }, timeout: 20000 });
    const cancion = (data?.data || []).find((t) => t.title && t.artist?.name);
    if (cancion) {
      titulo = `${cancion.artist.name} - ${cancion.title}`;
      consulta = `${cancion.artist.name} ${cancion.title} audio`;
    }
  } catch (e) {
    console.log(`[Spotify] Deezer falló: ${motivo(e)}; se busca con el texto tal cual`);
  }
  const link = await resolverLinkYoutube(consulta);
  const audio = await descargarAudioConProveedores(link);
  return { audio, titulo };
}

export default {
  names: [".spotify", ".sp", ".spdl"],
  usage: ".spotify <nombre o enlace de Spotify>",
  desc: "Descargar una canción por nombre o enlace de Spotify",
  category: "Descargas",

  handler: async ({ sock, from, msg, cleanText }) => {
    const texto = String(cleanText || "").trim().split(/\s+/).slice(1).join(" ").trim();

    if (!texto) {
      return sock.sendMessage(from, {
        text: "🎵 *SPOTIFY*\n\n> .spotify nombre de la canción\n> .spotify enlace de Spotify"
      }, { quoted: msg });
    }

    try {
      await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } }).catch(() => {});

      const id = texto.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:embed\/)?track\/([A-Za-z0-9]+)/i)?.[1]
        || texto.match(/spotify:track:([A-Za-z0-9]+)/i)?.[1];

      let resultado;
      if (id) {
        resultado = await descargarSpotify(`https://open.spotify.com/track/${id}`);
      } else if (/^https?:\/\//i.test(texto)) {
        throw new Error("Usa un enlace de una canción de Spotify o escribe el nombre.");
      } else {
        const enlace = await buscarEnlaceSpotify(texto);
        if (enlace) {
          try { resultado = await descargarSpotify(enlace); }
          catch (e) { console.log(`[Spotify] ${enlace} no se pudo bajar (${motivo(e)}); se usa YouTube`); }
        }
        if (!resultado) resultado = await descargarPorNombre(texto);
      }

      const nombre = String(resultado.titulo || "cancion").replace(/[\\/:*?"<>|]/g, "").slice(0, 100);

      await sock.sendMessage(from, {
        audio: resultado.audio,
        mimetype: "audio/mpeg",
        fileName: `${nombre || "cancion"}.mp3`,
        ptt: false
      }, { quoted: msg });

      await sock.sendMessage(from, { react: { text: "✅", key: msg.key } }).catch(() => {});
    } catch (error) {
      console.error("[Spotify]", error);
      await sock.sendMessage(from, { react: { text: "❌", key: msg.key } }).catch(() => {});
      await sock.sendMessage(from, {
        text: `> ✘ ${error instanceof Error ? error.message : "Error al descargar la canción."}`
      }, { quoted: msg });
    }
  }
};
