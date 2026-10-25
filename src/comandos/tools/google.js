import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { config } from "../../../motores/db.js";
import { tarjetaUso, tarjetaAviso } from "../../descargas/tarjetas.js";
import { htmlGoogle } from "../../../motores/google-html.js";
import { enviarConBoton } from "../../../motores/botones.js";
import { respuestaInstantanea, limpiar, sinTildes } from "../../../motores/google-rapido.js";
import { buscarTodo, urlGoogle, recortar } from "../../../motores/google-buscador.js";

const execFileAsync = promisify(execFile);

const ESPERA_MS = 8000;
const LIMITE_HTML = 1200000;
const ALTURA_FIJA = true;
const SEGUNDOS_CLIP = 45;
const DURACION_MAX_CLIP_SEG = 12 * 60;
const MAX_CLIP_BYTES = 5 * 1024 * 1024;
const TIEMPO_MAX_CLIP_MS = 60000;

const esperas = new Map();

const MODOS = {
  info: "info",
  precio: "precio",
  youtube: "youtube",
  yt: "youtube",
  video: "youtube",
  videos: "youtube",
  noticias: "noticias",
  noticia: "noticias",
  news: "noticias",
  fotos: "fotos",
  foto: "fotos",
  imagenes: "fotos",
  imagen: "fotos"
};

function detectarModo(texto) {
  const palabras = texto.trim().split(/\s+/);
  const primera = sinTildes(palabras[0] || "").toLowerCase();
  if (palabras.length > 1 && MODOS[primera]) return { modo: MODOS[primera], consulta: palabras.slice(1).join(" ") };
  if (/^(precio|cuanto cuesta|cuanto vale|costo)\b/.test(limpiar(texto))) return { modo: "precio", consulta: texto };
  return { modo: "info", consulta: texto };
}

function botonesDe({ consulta, modo, instantanea, datos }) {
  const google = { texto: "🔎 Ver en Google", url: urlGoogle(consulta) };
  if (instantanea) return [google];
  const videos = [...datos.recientes, ...datos.populares];
  if (modo === "youtube") {
    const lista = [{ texto: "▶️ Ver en YouTube", url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(consulta) }];
    videos.slice(0, 4).forEach((v, i) => lista.push({ texto: `${i + 1}. ${recortar(v.titulo, 24)}`, url: v.url }));
    return lista;
  }
  if (modo === "noticias") {
    const lista = [{ texto: "📰 Más en Google Noticias", url: "https://news.google.com/search?q=" + encodeURIComponent(consulta) + "&hl=es-419&gl=MX&ceid=MX:es-419" }];
    datos.noticias.slice(0, 4).forEach((n) => lista.push({ texto: "📰 " + recortar(n.titulo, 24), url: n.url }));
    return lista;
  }
  const lista = [google];
  if (datos.noticias[0]) lista.push({ texto: "📰 " + recortar(datos.noticias[0].titulo, 24), url: datos.noticias[0].url });
  if (videos[0]) lista.push({ texto: "▶️ " + recortar(videos[0].titulo, 24), url: videos[0].url });
  if (datos.web[0]) lista.push({ texto: "🌐 " + recortar(datos.web[0].dominio, 24), url: datos.web[0].url });
  if (datos.wiki?.url) lista.push({ texto: "📚 Wikipedia", url: datos.wiki.url });
  return lista.slice(0, 5);
}

function textoRespaldo({ consulta, instantanea, datos }) {
  const partes = ["🔎 *GOOGLE*", `> ${consulta}`];
  if (instantanea) partes.push("", `*${instantanea.titulo}::*`, `> ${instantanea.grande} · ${instantanea.detalle}`);
  const items = [...datos.web.slice(0, 3), ...datos.noticias.slice(0, 3), ...datos.populares.slice(0, 2)];
  if (items.length) partes.push("", ...items.map((r) => `✿ *${r.titulo}*\n> ${r.url}`));
  partes.push("", `> Ver en Google: ${urlGoogle(consulta)}`);
  return partes.join("\n");
}

function segundosDe(duracion) {
  const m = /^(?:(\d+):)?(\d{1,2}):(\d{2})$/.exec(String(duracion || "").trim());
  return m ? Number(m[1] || 0) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
}

async function clipDe(url) {
  const { descargarVideoYoutube } = await import("../../descargas/youtube-engine.js");
  const original = await descargarVideoYoutube(url);
  if (!Buffer.isBuffer(original)) {
    try {
      if (original?.ruta) fs.unlinkSync(original.ruta);
    } catch {}
    return null;
  }
  const base = path.join(os.tmpdir(), `gclip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const entrada = base + "-in.mp4";
  const salida = base + "-out.mp4";
  try {
    fs.writeFileSync(entrada, original);
    try {
      await execFileAsync("ffmpeg", ["-y", "-loglevel", "error", "-i", entrada, "-t", String(SEGUNDOS_CLIP), "-c", "copy", "-movflags", "+faststart", salida], { timeout: 40000 });
    } catch {
      await execFileAsync(
        "ffmpeg",
        ["-y", "-loglevel", "error", "-i", entrada, "-t", String(SEGUNDOS_CLIP), "-vf", "scale=-2:360", "-c:v", "libx264", "-preset", "veryfast", "-crf", "30", "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", salida],
        { timeout: 60000 }
      );
    }
    const clip = fs.readFileSync(salida);
    return clip.length <= MAX_CLIP_BYTES ? clip.toString("base64") : null;
  } finally {
    for (const f of [entrada, salida]) {
      try {
        fs.unlinkSync(f);
      } catch {}
    }
  }
}

async function prepararClip(datos) {
  const candidato = [...datos.populares, ...datos.recientes].find((v) => v.id && segundosDe(v.duracion) > 0 && segundosDe(v.duracion) <= DURACION_MAX_CLIP_SEG);
  if (!candidato) return null;
  try {
    const b64 = await Promise.race([clipDe(candidato.url), new Promise((r) => setTimeout(() => r(null), TIEMPO_MAX_CLIP_MS))]);
    return b64 ? { id: candidato.id, b64, seg: SEGUNDOS_CLIP } : null;
  } catch (e) {
    console.log("[GOOGLE] clip falló: " + String(e.message).split("\n")[0]);
    return null;
  }
}

function sinImagenes(paquete) {
  const quitar = (v) => ({ ...v, img: "" });
  return {
    ...paquete,
    populares: paquete.populares.map(quitar),
    recientes: paquete.recientes.map(quitar),
    noticias: paquete.noticias.map(quitar),
    fotos: [],
    ans: paquete.ans?.img ? { ...paquete.ans, img: "" } : paquete.ans
  };
}

export default {
  names: [".google", ".buscar"],
  desc: "Busca información, noticias, fotos y videos con texto legible dentro del mensaje. Responde hora, fecha y cálculos. Modos: info, precio, youtube, noticias, fotos",
  category: "Tools",
  usage: ".google <búsqueda>",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const texto = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!texto) {
      return reply({
        text: tarjetaUso({
          comando: ".google <búsqueda>",
          ejemplo: ".google fotosíntesis   |   .google noticias méxico   |   .google youtube música para estudiar   |   .google precio iphone 15",
          nota: "Modos: info, precio, youtube, noticias y fotos. También resuelve hora, fecha y operaciones como 25*4+10."
        })
      });
    }

    const ahora = Date.now();
    const ultima = esperas.get(sender) || 0;
    if (ahora - ultima < ESPERA_MS) {
      const falta = Math.ceil((ESPERA_MS - (ahora - ultima)) / 1000);
      return reply({ text: tarjetaAviso("GOOGLE", `Espera ${falta}s antes de buscar de nuevo.`) });
    }
    esperas.set(sender, ahora);
    if (esperas.size > 500) esperas.delete(esperas.keys().next().value);

    const { modo, consulta } = detectarModo(texto);
    const instantanea = modo === "info" ? respuestaInstantanea(consulta) : null;
    const firma = config.botNameShort || "MaxiProyec";

    try {
      await sock.sendMessage(from, { react: { text: "🔎", key: msg.key } });
    } catch {}

    let datos = { web: [], noticias: [], populares: [], recientes: [], wiki: null, fotos: [], via: "", precios: [], ms: 0, sinFecha: false };
    if (!instantanea) {
      try {
        datos = await buscarTodo(consulta, modo);
      } catch (e) {
        console.log("[GOOGLE] ERROR: " + e.message);
      }
    }

    const { wiki, ...resto } = datos;
    const paquete = { q: consulta, modo, firma, fijo: ALTURA_FIJA, ans: instantanea || wiki, ...resto };
    if (modo === "youtube" && !instantanea) {
      const clip = await prepararClip(datos);
      if (clip) paquete.clip = clip;
    }
    const limite = LIMITE_HTML + (paquete.clip ? paquete.clip.b64.length : 0);
    let html = "";
    try {
      html = htmlGoogle(paquete);
      if (Buffer.byteLength(html) > limite) html = htmlGoogle({ ...paquete, fotos: [] });
      if (Buffer.byteLength(html) > limite) html = htmlGoogle(sinImagenes(paquete));
      if (typeof sock.sendHtml !== "function") throw new Error("sin sendHtml");
      await sock.sendHtml(from, html, [], undefined, {});
    } catch (e) {
      console.log("[GOOGLE] HTML falló: " + e.message);
      return sock.sendMessage(from, { text: textoRespaldo({ consulta, instantanea, datos }) }, { quoted: msg });
    }

    const lista = botonesDe({ consulta, modo, instantanea, datos });
    const enviado = await enviarConBoton({
      sock,
      from,
      msg,
      texto: instantanea ? "> 🔎 ¿Quieres ver más?" : `> 🔗 Abre lo que encontré de *${recortar(consulta, 40)}*`,
      footer: "Powered by " + firma,
      lista
    });
    if (!enviado) {
      await sock.sendMessage(from, { text: lista.map((b) => `${b.texto}\n> ${b.url}`).join("\n\n") }, { quoted: msg });
    }
  }
};
