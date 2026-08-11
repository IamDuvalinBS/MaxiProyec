// Motor de Spotify. IMPORTANTE: esto NO descarga canciones completas.
// Spotify no ofrece, en ningun lado (ni pagando Premium), una forma
// oficial de exportar el audio completo de una cancion - solo se puede
// reproducir dentro de su app. Lo que si permite su API publica es buscar
// info de una cancion y, para algunas, un clip de preview oficial de 30
// segundos (el mismo que se escucha en la app antes de loguearte).
import axios from "axios";

let tokenCache = { token: null, exp: 0 };

async function obtenerTokenSpotify() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Faltan configurar SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET (se sacan gratis creando una app en developer.spotify.com)."
    );
  }

  if (tokenCache.token && Date.now() < tokenCache.exp) return tokenCache.token;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const { data } = await axios.post(
    "https://accounts.spotify.com/api/token",
    "grant_type=client_credentials",
    {
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 15000
    }
  );

  tokenCache = { token: data.access_token, exp: Date.now() + (data.expires_in - 60) * 1000 };
  return tokenCache.token;
}

export async function buscarCancionSpotify(consulta) {
  const token = await obtenerTokenSpotify();
  const { data } = await axios.get("https://api.spotify.com/v1/search", {
    params: { q: consulta, type: "track", limit: 1 },
    headers: { Authorization: `Bearer ${token}` },
    timeout: 15000
  });

  const track = data?.tracks?.items?.[0];
  if (!track) throw new Error("No encontre ninguna cancion con ese nombre.");

  return {
    titulo: track.name,
    artistas: track.artists.map((a) => a.name).join(", "),
    album: track.album?.name || "",
    portada: track.album?.images?.[0]?.url || null,
    previewUrl: track.preview_url, // OJO: puede venir null, no todas las canciones tienen preview publico
    spotifyUrl: track.external_urls?.spotify
  };
}

