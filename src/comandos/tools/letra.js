import { tarjetaUso, tarjetaAviso } from "../../descargas/tarjetas.js";
import { encabezado } from "../../economia/estilo.js";
import { pedirJson } from "../../../motores/herramientas-red.js";
import { limitarEspera, textoCitado } from "../../../motores/herramientas-ui.js";
import { enviarLista } from "../../../motores/lista.js";
import { registrarEspera } from "../../nucleo/espera.js";

const LRCLIB = "https://lrclib.net/api";
const LYRICS_OVH = "https://api.lyrics.ovh/v1";
const ESPERA_MS = 4000;
const DURACION_ESPERA_MS = 5 * 60 * 1000;
const OPCIONES = 7;
const MAX_MENSAJE = 3800;
const esperas = new Map();

const PIE = "Pᴏᴡᴇʀᴇᴅ Bʏ • ItsDuva";
const recortar = (t, max) => {
  const s = String(t || "").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};
const tiempo = (seg) => `${Math.floor(seg / 60)}:${String(Math.round(seg % 60)).padStart(2, "0")}`;

// Busca canciones que tengan letra (LRCLIB: gratis y sin clave).
async function buscar(consulta) {
  const datos = await pedirJson(`${LRCLIB}/search?q=${encodeURIComponent(consulta)}`);
  const vistos = new Set();
  return (Array.isArray(datos) ? datos : [])
    .filter((c) => c?.id && c.trackName && c.artistName && String(c.plainLyrics || "").trim())
    .filter((c) => {
      const k = `${c.trackName}|${c.artistName}`.toLowerCase();
      if (vistos.has(k)) return false;
      vistos.add(k);
      return true;
    })
    .slice(0, OPCIONES);
}

async function letraPorId(id) {
  const c = await pedirJson(`${LRCLIB}/get/${id}`);
  const letra = String(c?.plainLyrics || "").trim();
  if (!letra) throw new Error("esa canción no tiene letra disponible");
  return { titulo: c.trackName, artista: c.artistName, album: c.albumName, letra };
}

// Respaldo si LRCLIB no encuentra nada y el usuario escribió "artista - canción".
async function letraRespaldo(consulta) {
  const partes = consulta.split(/\s+[-–—]\s+/);
  if (partes.length < 2) return null;
  const [artista, ...resto] = partes;
  const titulo = resto.join(" - ");
  try {
    const d = await pedirJson(`${LYRICS_OVH}/${encodeURIComponent(artista)}/${encodeURIComponent(titulo)}`);
    const letra = String(d?.lyrics || "").trim();
    return letra ? { titulo, artista, album: "", letra } : null;
  } catch {
    return null;
  }
}

// Parte la letra en mensajes sin cortar estrofas por la mitad.
function trozos(letra) {
  const estrofas = letra.replace(/\r/g, "").split(/\n{2,}/);
  const salida = [];
  let actual = "";
  for (const e of estrofas) {
    if (actual && actual.length + e.length + 2 > MAX_MENSAJE) {
      salida.push(actual);
      actual = "";
    }
    actual = actual ? `${actual}\n\n${e}` : e;
  }
  if (actual) salida.push(actual);
  return salida;
}

async function enviarLetra(sock, from, msg, c) {
  const partes = trozos(c.letra);
  const cabecera = [
    encabezado("🎤", "LETRA"),
    "",
    `🎧 *Canción::*\n> ${c.titulo}`,
    `👤 *Artista::*\n> ${c.artista}`,
    ...(c.album ? [`💿 *Álbum::*\n> ${c.album}`] : []),
    ""
  ].join("\n");
  for (let i = 0; i < partes.length; i++) {
    const texto = i === 0 ? `${cabecera}\n${partes[i]}` : partes[i];
    await sock.sendMessage(from, { text: texto }, { quoted: i === 0 ? msg : undefined });
  }
}

async function procesar(sock, from, msg, obtener) {
  try {
    await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } }).catch(() => {});
    await enviarLetra(sock, from, msg, await obtener());
    await sock.sendMessage(from, { react: { text: "✅", key: msg.key } }).catch(() => {});
  } catch (e) {
    console.log(`[LETRA] ${e.message}`);
    await sock.sendMessage(from, { react: { text: "❌", key: msg.key } }).catch(() => {});
    await sock.sendMessage(from, { text: tarjetaAviso("LETRA", `No pude obtener la letra: ${e.message}.`) }, { quoted: msg });
  }
}

export default {
  names: [".letra", ".letras", ".lyrics"],
  usage: ".letra <canción o artista - canción>",
  desc: "Busca la letra de una canción (lista con botones, como .spotify). También funciona respondiendo a un mensaje",
  category: "Tools",
  handler: async ({ sock, from, sender, msg, cleanText }) => {
    const texto = cleanText.split(/\s+/).slice(1).join(" ").trim() || textoCitado(msg).trim();

    if (!texto) {
      return sock.sendMessage(from, {
        text: tarjetaUso({ comando: ".letra <canción>", ejemplo: ".letra bohemian rhapsody   |   .letra Fuerza Regida - Bella" })
      }, { quoted: msg });
    }

    // Elección desde la lista: ".letra #<id>"
    const eleccion = texto.match(/^#(\d+)$/);
    if (eleccion) return procesar(sock, from, msg, () => letraPorId(eleccion[1]));

    const falta = limitarEspera(esperas, sender, ESPERA_MS);
    if (falta) return sock.sendMessage(from, { text: tarjetaAviso("LETRA", `Espera ${falta}s antes de buscar de nuevo.`) }, { quoted: msg });

    await sock.sendMessage(from, { react: { text: "🔎", key: msg.key } }).catch(() => {});

    let canciones = [];
    try {
      canciones = await buscar(texto);
    } catch (e) {
      console.log(`[LETRA] búsqueda falló: ${e.message}`);
    }

    if (!canciones.length) {
      return procesar(sock, from, msg, async () => {
        const r = await letraRespaldo(texto);
        if (!r) throw new Error("no encontré resultados. Prueba con \"artista - canción\"");
        return r;
      });
    }

    if (canciones.length === 1) return procesar(sock, from, msg, () => letraPorId(canciones[0].id));

    const cuerpo = [
      encabezado("🎤", "LETRAS"),
      "",
      "🐋˒ ˙ ˓ *Búsqueda / search:*",
      `> ${texto}`,
      "",
      `📚˒ ˙ ˓ *Resultados:*`,
      `> ${canciones.length} canciones con letra`
    ].join("\n");

    const enviada = await enviarLista({
      sock,
      from,
      msg,
      texto: `${cuerpo}\n\n> Toca el botón de *📋 Lista* para ver la letra.`,
      footer: PIE,
      boton: "📋 Lista",
      secciones: [{
        titulo: "Canciones",
        filas: canciones.map((c) => ({
          titulo: recortar(c.trackName, 24),
          descripcion: recortar(`${c.artistName} • ${c.albumName || "Sencillo"} • ${tiempo(c.duration || 0)}`, 72),
          id: `.letra #${c.id}`
        }))
      }]
    });
    if (enviada) return;

    registrarEspera(`${from}:${sender}`, {
      duracionMs: DURACION_ESPERA_MS,
      alResponder: async (respuesta, ctx) => {
        const n = parseInt(String(respuesta).trim(), 10);
        if (!/^\d+$/.test(String(respuesta).trim()) || n < 1 || n > canciones.length) return false;
        await procesar(ctx.sock, ctx.from, ctx.msg, () => letraPorId(canciones[n - 1].id));
        return true;
      }
    });
    await sock.sendMessage(from, {
      text: [cuerpo, "", ...canciones.map((c, i) => `${i + 1}. ${c.trackName} — ${c.artistName}`), "", "> Responde con el número de la canción."].join("\n")
    }, { quoted: msg });
  }
};
