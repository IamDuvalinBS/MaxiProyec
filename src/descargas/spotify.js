import axios from "axios";

const TIEMPO_ESPERA_MS = 15000;

function normalizarDeezer(pista) {
  return {
    id: `deezer-${pista.id}`,
    titulo: pista.title,
    artistas: pista.artist?.name || "Desconocido",
    album: pista.album?.title || "Sin álbum",
    duracionSeg: Number(pista.duration || 0),
    portada: pista.album?.cover_xl || pista.album?.cover_big || pista.album?.cover_medium || null,
    previewUrl: pista.preview || null,
    enlace: pista.link || null,
    fuente: "Deezer"
  };
}

function normalizarItunes(pista) {
  return {
    id: `itunes-${pista.trackId}`,
    titulo: pista.trackName,
    artistas: pista.artistName || "Desconocido",
    album: pista.collectionName || "Sin álbum",
    duracionSeg: Math.round(Number(pista.trackTimeMillis || 0) / 1000),
    portada: pista.artworkUrl100 ? pista.artworkUrl100.replace("100x100bb", "600x600bb") : null,
    previewUrl: pista.previewUrl || null,
    enlace: pista.trackViewUrl || null,
    fuente: "Apple Music"
  };
}

async function buscarEnDeezer(consulta) {
  const { data } = await axios.get("https://api.deezer.com/search", {
    params: { q: consulta, limit: 1 },
    timeout: TIEMPO_ESPERA_MS
  });
  const pista = data?.data?.[0];
  if (!pista) throw new Error("Deezer no devolvió resultados.");
  return normalizarDeezer(pista);
}

async function buscarEnItunes(consulta) {
  const { data } = await axios.get("https://itunes.apple.com/search", {
    params: { term: consulta, media: "music", entity: "song", limit: 1 },
    timeout: TIEMPO_ESPERA_MS
  });
  const pista = data?.results?.[0];
  if (!pista) throw new Error("Apple Music no devolvió resultados.");
  return normalizarItunes(pista);
}

async function tituloDeEnlaceSpotify(enlace) {
  const { data } = await axios.get("https://open.spotify.com/oembed", {
    params: { url: enlace },
    timeout: TIEMPO_ESPERA_MS
  });
  if (!data?.title) throw new Error("No se pudo leer el título del enlace de Spotify.");
  return data.title;
}

export async function buscarCancion(entrada) {
  let consulta = entrada.trim();
  if (/open\.spotify\.com\/(intl-[a-z]+\/)?track\//i.test(consulta)) {
    consulta = await tituloDeEnlaceSpotify(consulta);
  }

  try {
    return await buscarEnDeezer(consulta);
  } catch (errorDeezer) {
    try {
      return await buscarEnItunes(consulta);
    } catch (errorItunes) {
      throw new Error("No se encontró ninguna canción con ese nombre.");
    }
  }
}
