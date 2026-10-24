import axios from "axios";
import { config } from "../../../motores/db.js";
import { tarjetaUso, tarjetaAviso } from "../../descargas/tarjetas.js";
import { htmlGoogle } from "../../../motores/google-html.js";
import { enviarConBoton } from "../../../motores/botones.js";

const ESPERA_MS = 8000;
const CACHE_MS = 5 * 60 * 1000;
const CACHE_MAX = 60;
const MAX_RESULTADOS = 6;
const UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";

const esperas = new Map();
const cache = new Map();

const ZONAS = {
  mexico: ["America/Mexico_City", "México"],
  cdmx: ["America/Mexico_City", "Ciudad de México"],
  chiapas: ["America/Mexico_City", "Chiapas"],
  cancun: ["America/Cancun", "Cancún"],
  tijuana: ["America/Tijuana", "Tijuana"],
  monterrey: ["America/Monterrey", "Monterrey"],
  bogota: ["America/Bogota", "Bogotá"],
  colombia: ["America/Bogota", "Colombia"],
  lima: ["America/Lima", "Lima"],
  peru: ["America/Lima", "Perú"],
  quito: ["America/Guayaquil", "Quito"],
  ecuador: ["America/Guayaquil", "Ecuador"],
  caracas: ["America/Caracas", "Caracas"],
  venezuela: ["America/Caracas", "Venezuela"],
  santiago: ["America/Santiago", "Santiago"],
  chile: ["America/Santiago", "Chile"],
  "buenos aires": ["America/Argentina/Buenos_Aires", "Buenos Aires"],
  argentina: ["America/Argentina/Buenos_Aires", "Argentina"],
  brasil: ["America/Sao_Paulo", "Brasil"],
  "sao paulo": ["America/Sao_Paulo", "São Paulo"],
  "nueva york": ["America/New_York", "Nueva York"],
  "new york": ["America/New_York", "Nueva York"],
  miami: ["America/New_York", "Miami"],
  chicago: ["America/Chicago", "Chicago"],
  "los angeles": ["America/Los_Angeles", "Los Ángeles"],
  madrid: ["Europe/Madrid", "Madrid"],
  espana: ["Europe/Madrid", "España"],
  londres: ["Europe/London", "Londres"],
  paris: ["Europe/Paris", "París"],
  berlin: ["Europe/Berlin", "Berlín"],
  roma: ["Europe/Rome", "Roma"],
  moscu: ["Europe/Moscow", "Moscú"],
  dubai: ["Asia/Dubai", "Dubái"],
  india: ["Asia/Kolkata", "India"],
  pekin: ["Asia/Shanghai", "Pekín"],
  china: ["Asia/Shanghai", "China"],
  tokio: ["Asia/Tokyo", "Tokio"],
  japon: ["Asia/Tokyo", "Japón"],
  seul: ["Asia/Seoul", "Seúl"],
  sidney: ["Australia/Sydney", "Sídney"]
};

const ZONA_POR_DEFECTO = ["America/Mexico_City", "Ciudad de México"];

const MODOS = { info: 1, precio: 1, youtube: 1 };

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const sinTildes = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const limpiar = (s) => sinTildes(s).toLowerCase().replace(/[¿?¡!.,;:]/g, " ").replace(/\s+/g, " ").trim();

const recortar = (s, n) => {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
};

function decodificar(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function dominioDe(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function resolverEnlace(href) {
  let url = decodificar(href);
  if (url.startsWith("//")) url = "https:" + url;
  try {
    const u = new URL(url);
    const real = u.searchParams.get("uddg");
    if (real) return decodeURIComponent(real);
  } catch {
    return null;
  }
  return /^https?:\/\//i.test(url) ? url : null;
}

function evaluarMatematica(texto) {
  const src = texto.replace(/×|x(?=\s*\d)/gi, "*").replace(/÷/g, "/").replace(/\^/g, "**").replace(/,/g, ".").replace(/\s+/g, "");
  let i = 0;
  const peek = () => src[i];
  function numero() {
    const m = /^\d+(?:\.\d+)?/.exec(src.slice(i));
    if (!m) throw new Error("num");
    i += m[0].length;
    return parseFloat(m[0]);
  }
  function primario() {
    if (peek() === "-") {
      i++;
      return -primario();
    }
    if (peek() === "+") {
      i++;
      return primario();
    }
    if (peek() === "(") {
      i++;
      const v = suma();
      if (peek() !== ")") throw new Error("par");
      i++;
      return v;
    }
    return numero();
  }
  function potencia() {
    let v = primario();
    while (src.startsWith("**", i)) {
      i += 2;
      v = Math.pow(v, primario());
    }
    while (peek() === "%") {
      i++;
      v /= 100;
    }
    return v;
  }
  function producto() {
    let v = potencia();
    while (peek() === "*" || peek() === "/") {
      const op = src[i++];
      const d = potencia();
      v = op === "*" ? v * d : v / d;
    }
    return v;
  }
  function suma() {
    let v = producto();
    while (peek() === "+" || peek() === "-") {
      const op = src[i++];
      const d = producto();
      v = op === "+" ? v + d : v - d;
    }
    return v;
  }
  const r = suma();
  if (i !== src.length || !Number.isFinite(r)) throw new Error("fin");
  return r;
}

function respuestaCalculo(q) {
  const t = q.replace(/^cuanto es\s+/i, "").replace(/=\s*$/, "").trim();
  if (!/^[\d\s+\-*/().,%^x×÷]+$/i.test(t) || !/[+\-*/%^x×÷]/.test(t.replace(/^-/, "")) || !/\d/.test(t)) return null;
  try {
    const r = evaluarMatematica(t);
    const texto = Number.isInteger(r) ? String(r) : String(Number(r.toFixed(8)));
    return { tipo: "calculo", titulo: "Calculadora", grande: texto, detalle: t.replace(/\s+/g, " ") + " =" };
  } catch {
    return null;
  }
}

function buscarZona(q) {
  const t = limpiar(q);
  const claves = Object.keys(ZONAS).sort((a, b) => b.length - a.length);
  for (const k of claves) {
    if (new RegExp("(^|\\s)" + k + "(\\s|$)").test(t)) return ZONAS[k];
  }
  return null;
}

function respuestaHora(q) {
  const t = limpiar(q);
  if (!/(^|\s)hora(\s|$)/.test(t) || t.split(" ").length > 8) return null;
  const [zona, nombre] = buscarZona(q) || ZONA_POR_DEFECTO;
  const ahora = new Date();
  const hora = new Intl.DateTimeFormat("es-MX", { timeZone: zona, hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }).format(ahora);
  const fecha = new Intl.DateTimeFormat("es-MX", { timeZone: zona, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(ahora);
  const gmt = new Intl.DateTimeFormat("en-US", { timeZone: zona, timeZoneName: "shortOffset" }).formatToParts(ahora).find((p) => p.type === "timeZoneName")?.value || "";
  return {
    tipo: "hora",
    titulo: "Hora actual",
    grande: hora.replace(/\s?([ap])\.?\s?m\.?/i, (_, l) => " " + l.toLowerCase() + ".m."),
    detalle: `${fecha} (${gmt})`,
    lugar: nombre,
    zona
  };
}

function respuestaFecha(q) {
  const t = limpiar(q);
  if (!/(^|\s)(fecha|que dia es|dia es hoy|que fecha)(\s|$)/.test(t) || t.split(" ").length > 7) return null;
  const [zona, nombre] = buscarZona(q) || ZONA_POR_DEFECTO;
  const ahora = new Date();
  const dia = new Intl.DateTimeFormat("es-MX", { timeZone: zona, weekday: "long" }).format(ahora);
  const resto = new Intl.DateTimeFormat("es-MX", { timeZone: zona, day: "numeric", month: "long", year: "numeric" }).format(ahora);
  return { tipo: "fecha", titulo: "Fecha de hoy", grande: dia.charAt(0).toUpperCase() + dia.slice(1), detalle: resto, lugar: nombre };
}

function respuestaInstantanea(q) {
  return respuestaCalculo(q) || respuestaHora(q) || respuestaFecha(q);
}

function detectarModo(texto) {
  const palabras = texto.trim().split(/\s+/);
  const primera = sinTildes(palabras[0] || "").toLowerCase();
  const alias = { yt: "youtube", video: "youtube", videos: "youtube" };
  const modo = MODOS[primera] ? primera : alias[primera];
  if (modo && palabras.length > 1) return { modo, consulta: palabras.slice(1).join(" ") };
  if (/^(precio|cuanto cuesta|cuanto vale|costo)\b/.test(limpiar(texto))) return { modo: "precio", consulta: texto };
  return { modo: "info", consulta: texto };
}

function consultaParaBuscar(modo, consulta) {
  if (modo === "precio") return /precio|costo|cuesta/i.test(consulta) ? consulta + " comprar" : consulta + " precio comprar";
  return consulta;
}

const peticion = (url, opciones = {}) =>
  axios.get(url, {
    timeout: 10000,
    responseType: "text",
    headers: { "User-Agent": UA, "Accept-Language": "es-MX,es;q=0.9", Accept: "text/html,application/xhtml+xml" },
    ...opciones
  });

function atributo(etiqueta, nombre) {
  const m = new RegExp(nombre + '\\s*=\\s*["\']([^"\']*)["\']', "i").exec(etiqueta);
  return m ? m[1] : "";
}

function desenvolverBing(href) {
  try {
    const u = new URL(decodificar(href));
    if (/bing\.com$/.test(u.hostname) && u.pathname.startsWith("/ck/")) {
      const p = u.searchParams.get("u") || "";
      if (p.startsWith("a1")) return Buffer.from(p.slice(2).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    }
    return u.href;
  } catch {
    return null;
  }
}

function armarResultado(url, titulo, texto) {
  if (!url || !/^https?:\/\//i.test(url) || !titulo) return null;
  return { titulo: recortar(decodificar(titulo), 90), url, dominio: dominioDe(url), texto: recortar(decodificar(texto), 230) };
}

function juntar(lista) {
  const vistos = new Set();
  const salida = [];
  for (const r of lista) {
    if (!r || vistos.has(r.url)) continue;
    vistos.add(r.url);
    salida.push(r);
    if (salida.length >= MAX_RESULTADOS) break;
  }
  return salida;
}

export function analizarDuckHtml(html) {
  const lista = [];
  for (const bloque of String(html).split(/class="[^"]*\bresult__body\b/).slice(1)) {
    const tags = bloque.match(/<a\b[^>]*>/g) || [];
    const tagA = tags.find((t) => /result__a/.test(t));
    if (!tagA) continue;
    const titulo = new RegExp(tagA.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([\\s\\S]*?)</a>").exec(bloque);
    const snip = /<a\b[^>]*result__snippet[^>]*>([\s\S]*?)<\/a>/.exec(bloque);
    lista.push(armarResultado(resolverEnlace(atributo(tagA, "href")), titulo ? titulo[1] : "", snip ? snip[1] : ""));
  }
  return juntar(lista);
}

export function analizarDuckLite(html) {
  const lista = [];
  const re = /<a\b[^>]*result-link[^>]*>([\s\S]*?)<\/a>[\s\S]*?<td[^>]*result-snippet[^>]*>([\s\S]*?)<\/td>/g;
  const tags = String(html).match(/<a\b[^>]*result-link[^>]*>/g) || [];
  let m;
  let i = 0;
  while ((m = re.exec(html))) {
    lista.push(armarResultado(resolverEnlace(atributo(tags[i++] || "", "href")), m[1], m[2]));
  }
  return juntar(lista);
}

export function analizarBing(html) {
  const lista = [];
  for (const bloque of String(html).split(/<li[^>]+class="[^"]*\bb_algo\b[^"]*"/).slice(1)) {
    const h2 = /<h2[^>]*>\s*(<a\b[^>]*>)([\s\S]*?)<\/a>/.exec(bloque);
    if (!h2) continue;
    const snip = /<p[^>]*>([\s\S]*?)<\/p>/.exec(bloque);
    lista.push(armarResultado(desenvolverBing(atributo(h2[1], "href")), h2[2], snip ? snip[1] : ""));
  }
  return juntar(lista);
}

export function analizarMojeek(html) {
  const lista = [];
  for (const bloque of String(html).split(/<li[^>]*>/).slice(1)) {
    const tag = (bloque.match(/<a\b[^>]*class="[^"]*\btitle\b[^"]*"[^>]*>/) || [])[0];
    if (!tag) continue;
    const titulo = /class="[^"]*\btitle\b[^"]*"[^>]*>([\s\S]*?)<\/a>/.exec(bloque);
    const snip = /<p[^>]*class="[^"]*\bs\b[^"]*"[^>]*>([\s\S]*?)<\/p>/.exec(bloque);
    lista.push(armarResultado(atributo(tag, "href"), titulo ? titulo[1] : "", snip ? snip[1] : ""));
  }
  return juntar(lista);
}

const PROVEEDORES = [
  {
    nombre: "DuckDuckGo",
    buscar: async (q) =>
      analizarDuckHtml(
        (
          await axios.post("https://html.duckduckgo.com/html/", new URLSearchParams({ q, kl: "mx-es" }).toString(), {
            timeout: 10000,
            responseType: "text",
            headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded", "Accept-Language": "es-MX,es;q=0.9" }
          })
        ).data
      )
  },
  {
    nombre: "Bing",
    buscar: async (q) =>
      analizarBing((await peticion("https://www.bing.com/search?setlang=es&cc=MX&q=" + encodeURIComponent(q))).data)
  },
  {
    nombre: "Mojeek",
    buscar: async (q) => analizarMojeek((await peticion("https://www.mojeek.com/search?q=" + encodeURIComponent(q))).data)
  },
  {
    nombre: "DuckDuckGo Lite",
    buscar: async (q) =>
      analizarDuckLite(
        (
          await axios.post("https://lite.duckduckgo.com/lite/", new URLSearchParams({ q, kl: "mx-es" }).toString(), {
            timeout: 10000,
            responseType: "text",
            headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" }
          })
        ).data
      )
  }
];

async function buscarWeb(consulta) {
  const clave = "web:" + consulta.toLowerCase();
  const previo = cache.get(clave);
  if (previo && Date.now() - previo.t < CACHE_MS) return previo.datos;

  for (const p of PROVEEDORES) {
    try {
      const resultados = await p.buscar(consulta);
      console.log(`[GOOGLE] ${p.nombre}: ${resultados.length} resultados`);
      if (resultados.length) {
        const datos = { resultados, via: p.nombre };
        if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
        cache.set(clave, { t: Date.now(), datos });
        return datos;
      }
    } catch (e) {
      console.log(`[GOOGLE] ${p.nombre} falló: ${e.message}`);
    }
  }
  return { resultados: [], via: "" };
}

const PALABRAS_VACIAS = new Set(["que", "quien", "quienes", "como", "cual", "cuales", "donde", "cuando", "es", "son", "fue", "del", "los", "las", "una", "uno", "por", "para", "con", "sobre", "the"]);

function relevante(consulta, titulo) {
  const q = limpiar(consulta).split(" ").filter((w) => w.length > 2 && !PALABRAS_VACIAS.has(w));
  const t = limpiar(titulo).split(" ").filter((w) => w.length > 2);
  return q.some((a) => t.some((b) => a === b || (a.length > 4 && b.length > 4 && (a.startsWith(b) || b.startsWith(a)))));
}

async function imagenDatos(url, max = 400000) {
  try {
    const { data, headers } = await axios.get(url, { responseType: "arraybuffer", timeout: 7000, headers: { "User-Agent": UA }, maxContentLength: max });
    const tipo = String(headers["content-type"] || "image/jpeg").split(";")[0];
    return `data:${tipo};base64,` + Buffer.from(data).toString("base64");
  } catch {
    return "";
  }
}

async function buscarWikipedia(consulta) {
  if (/\d/.test(consulta) || consulta.split(/\s+/).length > 7) return null;
  try {
    const cab = { "User-Agent": "MaxiProyec/1.0 (bot de WhatsApp)", "Api-User-Agent": "MaxiProyec/1.0" };
    const { data } = await axios.get("https://es.wikipedia.org/w/api.php", {
      params: { action: "query", list: "search", srsearch: consulta, srlimit: 1, format: "json", utf8: 1 },
      timeout: 8000,
      headers: cab
    });
    const golpe = data?.query?.search?.[0];
    if (!golpe || !relevante(consulta, golpe.title)) return null;
    const r = await axios.get("https://es.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(golpe.title.replace(/ /g, "_")), { timeout: 8000, headers: cab });
    const d = r.data;
    if (!d?.extract || d.type === "disambiguation") return null;
    return {
      tipo: "wiki",
      titulo: d.title,
      texto: recortar(d.extract, 420),
      url: d.content_urls?.desktop?.page || "",
      img: d.thumbnail?.source ? await imagenDatos(d.thumbnail.source) : ""
    };
  } catch (e) {
    console.log("[GOOGLE] Wikipedia falló: " + e.message);
    return null;
  }
}

async function buscarVideos(consulta) {
  const clave = "yt:" + consulta.toLowerCase();
  const previo = cache.get(clave);
  if (previo && Date.now() - previo.t < CACHE_MS) return previo.datos;
  const { buscarVideosYoutube } = await import("../../descargas/youtube-engine.js");
  const videos = (await buscarVideosYoutube(consulta, 5)).filter((v) => v.url);
  const items = await Promise.all(
    videos.map(async (v) => {
      const id = /v=([\w-]{11})/.exec(v.url)?.[1];
      return {
        titulo: recortar(v.titulo, 100),
        url: v.url,
        canal: v.canal,
        duracion: v.duracion,
        fecha: v.fecha,
        dominio: "youtube.com",
        img: id ? await imagenDatos(`https://i.ytimg.com/vi/${id}/mqdefault.jpg`, 200000) : ""
      };
    })
  );
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(clave, { t: Date.now(), datos: items });
  return items;
}

function extraerPrecios(resultados) {
  const filas = [];
  const re = /(?:US\$|MX\$|MXN|USD|\$)\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?(?:\s?(?:MXN|USD|pesos|dólares))?/i;
  for (const r of resultados) {
    const m = re.exec(r.titulo + " " + r.texto);
    if (m) filas.push({ sitio: r.dominio, precio: m[0].trim(), url: r.url });
  }
  return filas;
}

function urlGoogle(consulta) {
  return "https://www.google.com/search?q=" + encodeURIComponent(consulta);
}

function botonesDe({ consulta, modo, instantanea, wiki, items }) {
  const lista = [];
  if (modo === "youtube") {
    lista.push({ texto: "▶️ Ver en YouTube", url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(consulta) });
    items.slice(0, 3).forEach((v, i) => lista.push({ texto: `${i + 1}. ${recortar(v.titulo, 24)}`, url: v.url }));
    return lista;
  }
  lista.push({ texto: "🔎 Ver en Google", url: urlGoogle(consulta) });
  if (instantanea) return lista;
  if (wiki?.url) lista.push({ texto: "📚 Wikipedia", url: wiki.url });
  items.slice(0, 3).forEach((r) => lista.push({ texto: "🌐 " + recortar(r.dominio, 22), url: r.url }));
  return lista;
}

function textoRespaldo({ consulta, instantanea, items }) {
  const partes = ["🔎 *GOOGLE*", `> ${consulta}`];
  if (instantanea) partes.push("", `*${instantanea.titulo}::*`, `> ${instantanea.grande} · ${instantanea.detalle}`);
  if (items.length) partes.push("", ...items.slice(0, 5).map((r) => `✿ *${r.titulo}*\n> ${r.url}`));
  partes.push("", `> Ver en Google: ${urlGoogle(consulta)}`);
  return partes.join("\n");
}

export default {
  names: [".google", ".buscar"],
  desc: "Busca en internet o YouTube con fuentes. Responde al instante hora, fecha y cálculos. Modos: info, precio, youtube",
  category: "Tools",
  usage: ".google <búsqueda>",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const texto = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!texto) {
      return reply({
        text: tarjetaUso({
          comando: ".google <búsqueda>",
          ejemplo: ".google qué hora es   |   .google precio iphone 15   |   .google youtube música para estudiar",
          nota: "Modos: info, precio y youtube. También resuelve hora, fecha y operaciones como 25*4+10."
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

    let items = [];
    let via = "";
    let wiki = null;
    let ans = instantanea;

    try {
      if (modo === "youtube") {
        items = await buscarVideos(consulta);
        via = "YouTube";
      } else if (!instantanea) {
        const [web, w] = await Promise.all([buscarWeb(consultaParaBuscar(modo, consulta)), modo === "info" ? buscarWikipedia(consulta) : null]);
        items = web.resultados;
        via = web.via || (w ? "Wikipedia" : "");
        wiki = w;
        ans = w;
      }
    } catch (e) {
      console.log("[GOOGLE] ERROR: " + e.message);
    }

    const datos = {
      q: consulta,
      modo,
      via,
      firma,
      ans,
      items,
      precios: modo === "precio" ? extraerPrecios(items) : []
    };

    try {
      if (typeof sock.sendHtml !== "function") throw new Error("sin sendHtml");
      await sock.sendHtml(from, htmlGoogle(datos), [], undefined, {});
    } catch (e) {
      console.log("[GOOGLE] HTML falló: " + e.message);
      return sock.sendMessage(from, { text: textoRespaldo({ consulta, instantanea, items }) }, { quoted: msg });
    }

    const lista = botonesDe({ consulta, modo, instantanea, wiki, items });
    const enviado = await enviarConBoton({
      sock,
      from,
      msg,
      texto: instantanea ? "> 🔎 ¿Quieres ver más?" : `> 🔗 Abre las ${modo === "youtube" ? "videos" : "fuentes"} de *${recortar(consulta, 40)}*`,
      footer: "Powered by " + firma,
      lista
    });
    if (!enviado) {
      await sock.sendMessage(from, { text: lista.map((b) => `${b.texto}\n> ${b.url}`).join("\n\n") }, { quoted: msg });
    }
  }
};
