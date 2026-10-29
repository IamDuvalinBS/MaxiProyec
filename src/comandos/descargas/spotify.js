import axios from "axios";
import { resolverLinkYoutube, descargarAudioConProveedores, buscarAlbumesYoutube } from "../../descargas/youtube-engine.js";
import { descargarBuffer } from "../../descargas/core.js";
import { registrarEspera } from "../../nucleo/espera.js";
import { enviarLista } from "../../../motores/lista.js";
import { enviarAlbum } from "./youtube_album.js";

const API_SPOTIFY = "https://api.stellarwa.xyz/dl/spotify";
const API_SPOTIFY_RESPALDO = "https://api.delirius.store/download/spotify";
const API_DEEZER = "https://api.deezer.com/search/track";
const API_DEEZER_ALBUM = "https://api.deezer.com/search/album";
const API_DEEZER_PISTA = "https://api.deezer.com/track";
const API_DEEZER_ALBUM_ID = "https://api.deezer.com/album";
const KEY_SPOTIFY = process.env.STELLARWA_KEY || "api-7dSKm";
const PIE_DE_PAGINA = "Pᴏᴡᴇʀᴇᴅ Bʏ • ItsDuva";
const DURACION_ESPERA_MS = 5 * 60 * 1000;
const PISTAS_A_MOSTRAR = 7;
const ALBUMES_A_MOSTRAR = 3;

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

const recortar = (t, max) => {
  const s = String(t || "").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

const tiempo = (seg) => `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, "0")}`;

async function buscarOpciones(texto) {
  const [pistas, albumes] = await Promise.all([
    axios.get(API_DEEZER, { params: { q: texto, limit: PISTAS_A_MOSTRAR }, timeout: 20000 }).then((r) => r.data?.data || []).catch(() => []),
    axios.get(API_DEEZER_ALBUM, { params: { q: texto, limit: ALBUMES_A_MOSTRAR }, timeout: 20000 }).then((r) => r.data?.data || []).catch(() => [])
  ]);
  return {
    pistas: pistas.filter((p) => p?.id && p.title && p.artist?.name).slice(0, PISTAS_A_MOSTRAR),
    albumes: albumes.filter((a) => a?.id && a.title && a.artist?.name).slice(0, ALBUMES_A_MOSTRAR)
  };
}

function tarjetaResultados(consulta, pistas, albumes) {
  const top = pistas[0] ? `${pistas[0].title} - ${pistas[0].artist.name}` : `${albumes[0].title} - ${albumes[0].artist.name}`;
  return [
    "🎃 *SPOTIFY* 🕸️",
    "",
    `> 「🎃」 ${consulta}`,
    "",
    `🕸️ *CANCIONES:* ${pistas.length}`,
    `🕸️ *ÁLBUMES:* ${albumes.length}`,
    `🕸️ *TOP:* ${top}`,
    "",
    "🦇 Toca 📋 *Lista* y elige una canción o un álbum 🎃"
  ].join("\n");
}

function seccionesDeLista(pistas, albumes) {
  const secciones = [];
  if (pistas.length) {
    secciones.push({
      titulo: "Canciones",
      filas: pistas.map((p) => ({
        titulo: recortar(p.title_short || p.title, 24),
        descripcion: recortar(`${p.artist.name} • ${p.album?.title || "Sencillo"} • ${tiempo(p.duration || 0)}`, 72),
        id: `.spotify #t${p.id}`
      }))
    });
  }
  if (albumes.length) {
    secciones.push({
      titulo: "Álbumes",
      filas: albumes.map((a) => ({
        titulo: `💿 ${recortar(a.title, 21)}`,
        descripcion: recortar(`${a.artist.name} • ${a.nb_tracks ?? "?"} canciones`, 72),
        id: `.spotify #a${a.id}`
      }))
    });
  }
  return secciones;
}

function textoDeRespaldo(consulta, pistas, albumes) {
  const lineas = [tarjetaResultados(consulta, pistas, albumes).split("\n").slice(0, 7).join("\n"), ""];
  let n = 1;
  if (pistas.length) {
    lineas.push("*Canciones*");
    pistas.forEach((p) => lineas.push(`${n++}. ${p.title} — ${p.artist.name} • ${tiempo(p.duration || 0)}`));
    lineas.push("");
  }
  if (albumes.length) {
    lineas.push("*Álbumes*");
    albumes.forEach((a) => lineas.push(`${n++}. 💿 ${a.title} — ${a.artist.name} • ${a.nb_tracks ?? "?"} canciones`));
    lineas.push("");
  }
  lineas.push("> Responde con el número de la opción que deseas.");
  return lineas.join("\n");
}

async function enviarCancion(sock, from, msg, resultado) {
  const nombre = String(resultado.titulo || "cancion").replace(/[\\/:*?"<>|]/g, "").slice(0, 100);
  await sock.sendMessage(from, {
    audio: resultado.audio,
    mimetype: "audio/mpeg",
    fileName: `${nombre || "cancion"}.mp3`,
    ptt: false
  }, { quoted: msg });
}

async function descargarPorId(id) {
  const { data } = await axios.get(`${API_DEEZER_PISTA}/${id}`, { timeout: 20000 });
  if (!data?.title || !data?.artist?.name) throw new Error("No encontré esa canción. Vuelve a buscarla.");
  const consulta = `${data.artist.name} ${data.title}`;
  let resultado;
  const enlace = await buscarEnlaceSpotify(consulta);
  if (enlace) {
    try { resultado = await descargarSpotify(enlace); }
    catch (e) { console.log(`[Spotify] ${enlace} no se pudo bajar (${motivo(e)}); se usa YouTube`); }
  }
  if (!resultado) resultado = await descargarPorNombre(consulta);
  return { audio: resultado.audio, titulo: `${data.artist.name} - ${data.title}` };
}

async function elegirAlbum(sock, from, msg, id) {
  const { data } = await axios.get(`${API_DEEZER_ALBUM_ID}/${id}`, { timeout: 20000 });
  if (!data?.title || !data?.artist?.name) throw new Error("No encontré ese álbum. Vuelve a buscarlo.");
  const albumes = await buscarAlbumesYoutube(`${data.title} ${data.artist.name}`, 1);
  if (!albumes.length) throw new Error("No pude encontrar ese álbum para descargarlo.");
  await enviarAlbum({ sock, from, msg, album: albumes[0] });
}

async function procesarEleccion(sock, from, msg, tipo, id) {
  try {
    await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } }).catch(() => {});
    if (tipo === "a") {
      await elegirAlbum(sock, from, msg, id);
    } else {
      await enviarCancion(sock, from, msg, await descargarPorId(id));
    }
    await sock.sendMessage(from, { react: { text: "✅", key: msg.key } }).catch(() => {});
  } catch (error) {
    console.error("[Spotify]", error);
    await sock.sendMessage(from, { react: { text: "❌", key: msg.key } }).catch(() => {});
    await sock.sendMessage(from, {
      text: `> ✘ ${error instanceof Error ? error.message : "Error al descargar."}`
    }, { quoted: msg });
  }
}

export default {
  names: [".spotify", ".sp", ".spdl"],
  usage: ".spotify <nombre o enlace de Spotify>",
  desc: "Buscar una canción o álbum por nombre (lista con botones) o descargar por enlace de Spotify",
  category: "Descargas",

  handler: async ({ sock, from, sender, msg, cleanText }) => {
    const texto = String(cleanText || "").trim().split(/\s+/).slice(1).join(" ").trim();

    if (!texto) {
      return sock.sendMessage(from, {
        text: "🎵 *SPOTIFY*\n\n> .spotify nombre de la canción\n> .spotify enlace de Spotify"
      }, { quoted: msg });
    }

    const eleccion = texto.match(/^#([ta])(\d+)$/i);
    if (eleccion) return procesarEleccion(sock, from, msg, eleccion[1].toLowerCase(), eleccion[2]);

    const id = texto.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:embed\/)?track\/([A-Za-z0-9]+)/i)?.[1]
      || texto.match(/spotify:track:([A-Za-z0-9]+)/i)?.[1];

    if (id) {
      try {
        await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } }).catch(() => {});
        const resultado = await descargarSpotify(`https://open.spotify.com/track/${id}`);
        await enviarCancion(sock, from, msg, resultado);
        await sock.sendMessage(from, { react: { text: "✅", key: msg.key } }).catch(() => {});
      } catch (error) {
        console.error("[Spotify]", error);
        await sock.sendMessage(from, { react: { text: "❌", key: msg.key } }).catch(() => {});
        await sock.sendMessage(from, {
          text: `> ✘ ${error instanceof Error ? error.message : "Error al descargar la canción."}`
        }, { quoted: msg });
      }
      return;
    }

    if (/^https?:\/\//i.test(texto)) {
      return sock.sendMessage(from, {
        text: "> ✘ Usa un enlace de una canción de Spotify o escribe el nombre."
      }, { quoted: msg });
    }

    await sock.sendMessage(from, { react: { text: "🔎", key: msg.key } }).catch(() => {});

    const { pistas, albumes } = await buscarOpciones(texto);

    if (!pistas.length && !albumes.length) {
      await sock.sendMessage(from, { react: { text: "❌", key: msg.key } }).catch(() => {});
      return sock.sendMessage(from, {
        text: "> ✘ No se encontraron resultados para esa búsqueda."
      }, { quoted: msg });
    }

    let portada;
    try {
      const url = pistas[0]?.album?.cover_xl || albumes[0]?.cover_xl;
      if (url) portada = await descargarBuffer(url);
    } catch (e) {
      portada = undefined;
    }

    const enviada = await enviarLista({
      sock,
      from,
      msg,
      texto: tarjetaResultados(texto, pistas, albumes),
      footer: PIE_DE_PAGINA,
      imagen: portada,
      boton: "📋 Lista",
      secciones: seccionesDeLista(pistas, albumes)
    });

    if (enviada) return;

    const opciones = [
      ...pistas.map((p) => ({ tipo: "t", id: p.id })),
      ...albumes.map((a) => ({ tipo: "a", id: a.id }))
    ];

    registrarEspera(`${from}:${sender}`, {
      duracionMs: DURACION_ESPERA_MS,
      alResponder: async (respuesta, ctx) => {
        const numero = parseInt(String(respuesta).trim(), 10);
        if (!/^\d+$/.test(String(respuesta).trim()) || numero < 1 || numero > opciones.length) return false;
        const op = opciones[numero - 1];
        await procesarEleccion(ctx.sock, ctx.from, ctx.msg, op.tipo, op.id);
        return true;
      }
    });

    const textoRespaldo = textoDeRespaldo(texto, pistas, albumes);
    if (portada) {
      await sock.sendMessage(from, { image: portada, caption: textoRespaldo }, { quoted: msg });
    } else {
      await sock.sendMessage(from, { text: textoRespaldo }, { quoted: msg });
    }
  }
};
