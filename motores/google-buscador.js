import axios from "axios";
import { limpiar } from "./google-rapido.js";

const CACHE_MS = 2 * 60 * 1000;
const CACHE_MAX = 40;
const UA = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";

const cache = new Map();

export const urlGoogle = (consulta) => "https://www.google.com/search?q=" + encodeURIComponent(consulta);

export const recortar = (s, n) => {
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
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

const textoXml = (s) => decodificar(decodificar(String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")));

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

function atributo(etiqueta, nombre) {
  const m = new RegExp(nombre + "\\s*=\\s*[\"']([^\"']*)[\"']", "i").exec(etiqueta);
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
  return { titulo: recortar(decodificar(titulo), 100), url, dominio: dominioDe(url), texto: recortar(decodificar(texto), 240) };
}

function juntar(lista, max = 8) {
  const vistos = new Set();
  const salida = [];
  for (const r of lista) {
    if (!r || vistos.has(r.url)) continue;
    vistos.add(r.url);
    salida.push(r);
    if (salida.length >= max) break;
  }
  return salida;
}

export function analizarDuckHtml(html) {
  const lista = [];
  for (const bloque of String(html).split(/class="[^"]*\bresult__body\b/).slice(1)) {
    const tags = bloque.match(/<a\b[^>]*>/g) || [];
    const tagA = tags.find((t) => /result__a/.test(t));
    if (!tagA) continue;
    const pos = bloque.indexOf(tagA) + tagA.length;
    const titulo = bloque.slice(pos, bloque.indexOf("</a>", pos));
    const snip = /<a\b[^>]*result__snippet[^>]*>([\s\S]*?)<\/a>/.exec(bloque);
    lista.push(armarResultado(resolverEnlace(atributo(tagA, "href")), titulo, snip ? snip[1] : ""));
  }
  return juntar(lista);
}

export function analizarDuckLite(html) {
  const lista = [];
  const re = /<a\b[^>]*result-link[^>]*>([\s\S]*?)<\/a>[\s\S]*?<td[^>]*result-snippet[^>]*>([\s\S]*?)<\/td>/g;
  const tags = String(html).match(/<a\b[^>]*result-link[^>]*>/g) || [];
  let m;
  let i = 0;
  while ((m = re.exec(html))) lista.push(armarResultado(resolverEnlace(atributo(tags[i++] || "", "href")), m[1], m[2]));
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

const itemsRss = (xml) => String(xml).match(/<item\b[\s\S]*?<\/item>/g) || [];

const campoRss = (item, nombre) => {
  const m = new RegExp("<" + nombre + "\\b[^>]*>([\\s\\S]*?)</" + nombre + ">", "i").exec(item);
  return m ? m[1] : "";
};

export function analizarRssWeb(xml) {
  return juntar(itemsRss(xml).map((it) => armarResultado(textoXml(campoRss(it, "link")), textoXml(campoRss(it, "title")), textoXml(campoRss(it, "description")))));
}

export function tiempoRelativo(ts) {
  if (!ts) return "";
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 90) return "hace un momento";
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  if (s < 86400 * 7) return `hace ${Math.round(s / 86400)} d`;
  return new Date(ts).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

export function analizarRssNoticias(xml) {
  const lista = itemsRss(xml).map((it) => {
    let url = textoXml(campoRss(it, "link"));
    const real = /bing\.com\/news\/apiclick[^\s]*[?&]url=([^&]+)/.exec(url);
    if (real) url = decodeURIComponent(real[1]);
    if (!/^https?:\/\//i.test(url)) return null;
    let titulo = textoXml(campoRss(it, "title"));
    const fuente = textoXml(campoRss(it, "source")) || textoXml(campoRss(it, "News:Source")) || dominioDe(url);
    if (titulo.endsWith(" - " + fuente)) titulo = titulo.slice(0, -(fuente.length + 3));
    let texto = textoXml(campoRss(it, "description"));
    if (!texto || texto.includes(titulo.slice(0, 28))) texto = "";
    const ts = Date.parse(campoRss(it, "pubDate")) || 0;
    return { titulo: recortar(titulo, 130), url, dominio: fuente, texto: recortar(texto, 200), ts, hace: tiempoRelativo(ts), nuevo: ts > 0 && Date.now() - ts < 6 * 3600 * 1000 };
  });
  return lista
    .filter(Boolean)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 10);
}

const UNIDADES = {
  s: ["segundo", "segundos"],
  m: ["minuto", "minutos"],
  h: ["hora", "horas"],
  d: ["día", "días"],
  w: ["semana", "semanas"],
  mo: ["mes", "meses"],
  y: ["año", "años"]
};

const ABREVIATURAS = { second: "s", sec: "s", minute: "m", min: "m", hour: "h", hr: "h", day: "d", week: "w", wk: "w", month: "mo", year: "y", yr: "y" };

export function traducirFecha(texto) {
  const t = String(texto || "");
  const m = /(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|weeks?|wks?|months?|years?|yrs?|mo|s|m|h|d|w|y)\s*ago/i.exec(t);
  if (!m) return { texto: t.replace(/^Streamed\s+/i, "transmitido "), nuevo: false };
  const n = Number(m[1]);
  const clave = m[2].toLowerCase().replace(/s$/, "");
  const unidad = clave === "mo" ? "mo" : ABREVIATURAS[clave] || (UNIDADES[clave] ? clave : "d");
  const u = UNIDADES[unidad];
  const nuevo = unidad === "s" || unidad === "m" || unidad === "h" || (unidad === "d" && n <= 2);
  return { texto: (/stream/i.test(t) ? "transmitido " : "") + `hace ${n} ${n === 1 ? u[0] : u[1]}`, nuevo };
}

const pedir = (url, extra = {}) =>
  axios.get(url, {
    timeout: 9000,
    responseType: "text",
    headers: { "User-Agent": UA, "Accept-Language": "es-MX,es;q=0.9,en;q=0.6", Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
    ...extra
  });

const pedirForm = (url, datos) =>
  axios.post(url, new URLSearchParams(datos).toString(), {
    timeout: 9000,
    responseType: "text",
    headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded", "Accept-Language": "es-MX,es;q=0.9" }
  });

const enc = encodeURIComponent;

const WEB_NIVEL_1 = [
  { nombre: "Bing", buscar: async (q) => analizarRssWeb((await pedir(`https://www.bing.com/search?format=rss&setlang=es&cc=MX&q=${enc(q)}`)).data) },
  { nombre: "DuckDuckGo", buscar: async (q) => analizarDuckHtml((await pedirForm("https://html.duckduckgo.com/html/", { q, kl: "mx-es" })).data) }
];

const WEB_NIVEL_2 = [
  { nombre: "Bing HTML", buscar: async (q) => analizarBing((await pedir(`https://www.bing.com/search?setlang=es&cc=MX&q=${enc(q)}`)).data) },
  { nombre: "Mojeek", buscar: async (q) => analizarMojeek((await pedir(`https://www.mojeek.com/search?q=${enc(q)}`)).data) },
  { nombre: "DuckDuckGo Lite", buscar: async (q) => analizarDuckLite((await pedirForm("https://lite.duckduckgo.com/lite/", { q, kl: "mx-es" })).data) }
];

const NOTICIAS = [
  { nombre: "Google Noticias", buscar: async (q) => analizarRssNoticias((await pedir(`https://news.google.com/rss/search?q=${enc(q)}&hl=es-419&gl=MX&ceid=MX:es-419`)).data) },
  { nombre: "Bing Noticias", buscar: async (q) => analizarRssNoticias((await pedir(`https://www.bing.com/news/search?format=rss&setlang=es&cc=MX&q=${enc(q)}`)).data) }
];

async function primerNivel(nivel, consulta, etiqueta) {
  const salidas = await Promise.all(
    nivel.map(async (p) => {
      try {
        const items = await p.buscar(consulta);
        console.log(`[GOOGLE] ${etiqueta} · ${p.nombre}: ${items.length} resultados`);
        return { p, items };
      } catch (e) {
        console.log(`[GOOGLE] ${etiqueta} · ${p.nombre} falló: ${e.message}`);
        return { p, items: [] };
      }
    })
  );
  const bueno = salidas.find((s) => s.items.length);
  return bueno ? { items: bueno.items, via: bueno.p.nombre.replace(/ HTML| Lite/, "") } : null;
}

async function wikiLista(consulta) {
  for (const idioma of ["es", "en"]) {
    try {
      const { data } = await axios.get(`https://${idioma}.wikipedia.org/w/api.php`, {
        params: { action: "query", list: "search", srsearch: consulta, srlimit: 6, format: "json", utf8: 1 },
        timeout: 8000,
        headers: { "User-Agent": "MaxiProyec/1.0 (bot de WhatsApp)" }
      });
      const items = (data?.query?.search || []).map((h) =>
        armarResultado(`https://${idioma}.wikipedia.org/wiki/${enc(h.title.replace(/ /g, "_"))}`, h.title, h.snippet)
      );
      const limpio = juntar(items, 6);
      if (limpio.length) return { items: limpio, via: "Wikipedia" };
    } catch (e) {
      console.log(`[GOOGLE] Wikipedia ${idioma} falló: ${e.message}`);
    }
  }
  return null;
}

async function buscarWeb(consulta) {
  const r = (await primerNivel(WEB_NIVEL_1, consulta, "web")) || (await primerNivel(WEB_NIVEL_2, consulta, "web")) || (await wikiLista(consulta));
  return r || { items: [], via: "" };
}

async function buscarNoticias(consulta) {
  const r = await primerNivel(NOTICIAS, consulta, "noticias");
  return r || { items: [], via: "" };
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

const PALABRAS_VACIAS = new Set(["que", "quien", "quienes", "como", "cual", "cuales", "donde", "cuando", "es", "son", "fue", "del", "los", "las", "una", "uno", "por", "para", "con", "sobre", "the"]);

function relevante(consulta, titulo) {
  const q = limpiar(consulta).split(" ").filter((w) => w.length > 2 && !PALABRAS_VACIAS.has(w));
  const t = limpiar(titulo).split(" ").filter((w) => w.length > 2);
  return q.some((a) => t.some((b) => a === b || (a.length > 4 && b.length > 4 && (a.startsWith(b) || b.startsWith(a)))));
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
    const r = await axios.get("https://es.wikipedia.org/api/rest_v1/page/summary/" + enc(golpe.title.replace(/ /g, "_")), { timeout: 8000, headers: cab });
    const d = r.data;
    if (!d?.extract || d.type === "disambiguation") return null;
    return {
      tipo: "wiki",
      titulo: d.title,
      texto: recortar(d.extract, 520),
      url: d.content_urls?.desktop?.page || "",
      img: d.thumbnail?.source ? await imagenDatos(d.thumbnail.source) : ""
    };
  } catch (e) {
    console.log("[GOOGLE] Wikipedia falló: " + e.message);
    return null;
  }
}

async function videosDe(consulta, limite, opciones) {
  try {
    const { buscarVideosYoutube } = await import("../src/descargas/youtube-engine.js");
    const lista = await buscarVideosYoutube(consulta, limite, opciones);
    return lista
      .filter((v) => v.url)
      .map((v) => {
        const f = traducirFecha(v.fecha);
        return {
          titulo: recortar(v.titulo, 110),
          url: v.url,
          canal: v.canal,
          duracion: v.duracion,
          fecha: f.texto,
          nuevo: f.nuevo,
          dominio: "youtube.com"
        };
      });
  } catch (e) {
    console.log("[GOOGLE] YouTube falló: " + e.message);
    return [];
  }
}

async function conMiniaturas(videos) {
  await Promise.all(
    videos.map(async (v) => {
      const id = /v=([\w-]{11})/.exec(v.url)?.[1];
      v.img = id ? await imagenDatos(`https://i.ytimg.com/vi/${id}/mqdefault.jpg`, 200000) : "";
    })
  );
  return videos;
}

async function buscarVideos(consulta, cuantos) {
  const [populares, recientes] = await Promise.all([videosDe(consulta, cuantos, {}), videosDe(consulta, cuantos, { sort_by: "upload_date" })]);
  const vistos = new Set(populares.map((v) => v.url));
  const nuevos = recientes.filter((v) => !vistos.has(v.url)).slice(0, cuantos);
  await conMiniaturas([...populares, ...nuevos]);
  return { populares, recientes: nuevos };
}

export function extraerPrecios(items) {
  const filas = [];
  const re = /(?:US\$|MX\$|MXN|USD|\$)\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?(?:\s?(?:MXN|USD|pesos|dólares))?/i;
  for (const r of items) {
    const m = re.exec(r.titulo + " " + r.texto);
    if (m) filas.push({ sitio: r.dominio, precio: m[0].trim(), url: r.url });
  }
  return filas;
}

const conTiempo = (promesa, ms, valor) =>
  Promise.race([promesa.catch((e) => (console.log("[GOOGLE] " + e.message), valor)), new Promise((r) => setTimeout(() => r(valor), ms))]);

const VACIO_LISTA = { items: [], via: "" };

export async function buscarTodo(consulta, modo) {
  const clave = `${modo}:${consulta.toLowerCase()}`;
  const previo = cache.get(clave);
  if (previo && Date.now() - previo.t < CACHE_MS) return previo.datos;

  const t0 = Date.now();
  const quiere = {
    web: modo === "info" || modo === "precio",
    noticias: modo === "info" || modo === "noticias",
    videos: modo === "info" || modo === "youtube",
    wiki: modo === "info"
  };
  const consultaWeb = modo === "precio" ? (/precio|costo|cuesta/i.test(consulta) ? consulta + " comprar" : consulta + " precio comprar") : consulta;

  const [web, noticias, videos, wiki] = await Promise.all([
    quiere.web ? conTiempo(buscarWeb(consultaWeb), 22000, VACIO_LISTA) : VACIO_LISTA,
    quiere.noticias ? conTiempo(buscarNoticias(consulta), 14000, VACIO_LISTA) : VACIO_LISTA,
    quiere.videos ? conTiempo(buscarVideos(consulta, modo === "youtube" ? 6 : 4), 25000, { populares: [], recientes: [] }) : { populares: [], recientes: [] },
    quiere.wiki ? conTiempo(buscarWikipedia(consulta), 14000, null) : null
  ]);

  const datos = {
    web: web.items,
    noticias: noticias.items,
    populares: videos.populares,
    recientes: videos.recientes,
    wiki,
    via: modo === "youtube" ? "YouTube" : modo === "noticias" ? noticias.via : web.via || noticias.via || (wiki ? "Wikipedia" : ""),
    precios: modo === "precio" ? extraerPrecios(web.items) : [],
    ms: Date.now() - t0
  };

  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(clave, { t: Date.now(), datos });
  return datos;
}
