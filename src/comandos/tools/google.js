import { config } from "../../../motores/db.js";
import { tarjetaUso, tarjetaAviso } from "../../descargas/tarjetas.js";
import { htmlGoogle } from "../../../motores/google-html.js";
import { enviarConBoton } from "../../../motores/botones.js";
import { respuestaInstantanea, limpiar, sinTildes } from "../../../motores/google-rapido.js";
import { buscarTodo, urlGoogle, recortar } from "../../../motores/google-buscador.js";

const ESPERA_MS = 8000;
const LIMITE_HTML = 1200000;

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
  news: "noticias"
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

function sinImagenes(datos) {
  const quitar = (v) => ({ ...v, img: "" });
  return { ...datos, populares: datos.populares.map(quitar), recientes: datos.recientes.map(quitar), ans: datos.ans?.img ? { ...datos.ans, img: "" } : datos.ans };
}

export default {
  names: [".google", ".buscar"],
  desc: "Busca en la web, noticias y YouTube con fuentes. Responde al instante hora, fecha y cálculos. Modos: info, precio, youtube, noticias",
  category: "Tools",
  usage: ".google <búsqueda>",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const texto = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!texto) {
      return reply({
        text: tarjetaUso({
          comando: ".google <búsqueda>",
          ejemplo: ".google qué hora es   |   .google precio iphone 15   |   .google youtube música para estudiar   |   .google noticias méxico",
          nota: "Modos: info, precio, youtube y noticias. También resuelve hora, fecha y operaciones como 25*4+10."
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

    let datos = { web: [], noticias: [], populares: [], recientes: [], wiki: null, via: "", precios: [], ms: 0 };
    if (!instantanea) {
      try {
        datos = await buscarTodo(consulta, modo);
      } catch (e) {
        console.log("[GOOGLE] ERROR: " + e.message);
      }
    }

    let paquete = { q: consulta, modo, firma, ans: instantanea || datos.wiki, ...datos };
    let html = "";
    try {
      html = htmlGoogle(paquete);
      if (Buffer.byteLength(html) > LIMITE_HTML) html = htmlGoogle(sinImagenes(paquete));
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
