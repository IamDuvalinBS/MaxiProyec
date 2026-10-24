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
  const m = new RegExp(nombre + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')", "i").exec(etiqueta);
  return m ? (m[1] ?? m[2] ?? "") : "";
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

function urlDeGoogleNoticias(url) {
  try {
    const u = new URL(url);
    if (u.hostname !== "news.google.com") return url;
    const id = u.pathname.split("/").pop();
    const crudo = Buffer.from(id.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("latin1");
    const m = /https?:\/\/[\x21-\x7e]+/.exec(crudo);
    return m ? m[0] : url;
  } catch {
    return url;
  }
}

export function analizarRssNoticias(xml) {
  const lista = itemsRss(xml).map((it) => {
    let url = urlDeGoogleNoticias(textoXml(campoRss(it, "link")));
    const real = /bing\.com\/news\/apiclick[^\s]*[?&]url=([^&]+)/.exec(url);
    if (real) url = decodeURIComponent(real[1]);
    if (!/^https?:\/\//i.test(url)) return null;
    let titulo = textoXml(campoRss(it, "title"));
    const fuente = textoXml(campoRss(it, "source")) || textoXml(campoRss(it, "News:Source")) || dominioDe(url);
    if (titulo.endsWith(" - " + fuente)) titulo = titulo.slice(0, -(fuente.length + 3));
    let texto = textoXml(campoRss(it, "description"));
    if (!texto || texto.includes(titulo.slice(0, 28))) texto = "";
    const ts = Date.parse(campoRss(it, "pubDate")) || 0;
    const imgUrl = textoXml(campoRss(it, "News:Image"));
    return {
      titulo: recortar(titulo, 130),
      url,
      dominio: fuente,
      texto: recortar(texto, 220),
      ts,
      hace: tiempoRelativo(ts),
      nuevo: ts > 0 && Date.now() - ts < 6 * 3600 * 1000,
      imgUrl: /^https?:\/\//i.test(imgUrl) ? imgUrl : ""
    };
  });
  return lista
    .filter(Boolean)
    .sort((a, b) => b.ts - a.ts);
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
  const con = salidas.filter((x) => x.items.length);
  if (!con.length) return null;
  const items = juntar(con.flatMap((x) => x.items), 14);
  return { items, via: con.map((x) => x.p.nombre.replace(/ HTML| Lite/, "")).join(" + ") };
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

const SIN_TEXTO = /(^|\.)(youtube\.com|youtu\.be|facebook\.com|instagram\.com|tiktok\.com|twitter\.com|x\.com|pinterest\.[a-z.]+|reddit\.com|news\.google\.com|bing\.com)$/;

async function descargar(url, { max = 1500000, ms = 7000 } = {}) {
  const r = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: ms,
    maxContentLength: max,
    maxRedirects: 4,
    headers: { "User-Agent": UA, "Accept-Language": "es-MX,es;q=0.9,en;q=0.5", Accept: "text/html,application/xhtml+xml,*/*;q=0.8" }
  });
  return { buffer: Buffer.from(r.data), tipo: String(r.headers["content-type"] || "") };
}

function textoDe(buffer, tipo) {
  let charset = /charset=([\w-]+)/i.exec(tipo)?.[1];
  if (!charset) charset = /<meta[^>]+charset=["']?([\w-]+)/i.exec(buffer.subarray(0, 4096).toString("latin1"))?.[1];
  try {
    return new TextDecoder((charset || "utf-8").toLowerCase()).decode(buffer);
  } catch {
    return buffer.toString("utf8");
  }
}

const BASURA = /cookies?|suscr[ií]b|newsletter|derechos reservados|aviso de privacidad|pol[ií]tica de|inicia sesi[oó]n|javascript|compartir en|publicidad|todos los derechos|copyright|©|whatsapp|telegram/i;

export function extraerArticulo(html, base, maxChars = 1800) {
  const sinComentarios = String(html).replace(/<!--[\s\S]*?-->/g, "");
  const metaImg = (sinComentarios.match(/<meta\b[^>]*(?:og:image|twitter:image)[^>]*>/gi) || []).map((t) => atributo(t, "content")).find(Boolean);
  const metaDesc = (sinComentarios.match(/<meta\b[^>]*(?:og:description|name=["']description["'])[^>]*>/i) || [])[0];
  let img = "";
  try {
    img = metaImg ? new URL(decodificar(metaImg), base).href : "";
  } catch {
    img = "";
  }
  const desc = metaDesc ? decodificar(atributo(metaDesc, "content")) : "";
  const limpio = sinComentarios.replace(/<(script|style|noscript|svg|nav|header|footer|aside|form|iframe|figure|button|select)\b[\s\S]*?<\/\1>/gi, " ");
  const cont = (/<article\b[\s\S]*?<\/article>/i.exec(limpio) || /<main\b[\s\S]*?<\/main>/i.exec(limpio) || [limpio])[0];
  const bloques = [];
  const vistos = new Set();
  let total = 0;
  const re = /<(p|h2|h3|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(cont)) && total < maxChars) {
    const t = decodificar(m[2]);
    const tag = m[1].toLowerCase();
    if (tag === "h2" || tag === "h3") {
      if (t.length >= 4 && t.length <= 90 && !BASURA.test(t)) bloques.push("## " + t);
      continue;
    }
    if (t.length < (tag === "li" ? 50 : 70) || BASURA.test(t) || vistos.has(t)) continue;
    vistos.add(t);
    const corto = recortar(t, 700);
    bloques.push(corto);
    total += corto.length;
  }
  while (bloques.length && bloques[bloques.length - 1].startsWith("## ")) bloques.pop();
  return { img, desc: recortar(desc, 260), cuerpo: bloques };
}

const paginas = new Map();

async function articuloDe(url, maxChars) {
  const clave = url + "|" + maxChars;
  const previo = paginas.get(clave);
  if (previo && Date.now() - previo.t < CACHE_MS * 2) return previo.art;
  const { buffer, tipo } = await descargar(url, { ms: 6000 });
  if (!/html|xml|text/i.test(tipo)) return null;
  const art = extraerArticulo(textoDe(buffer, tipo), url, maxChars);
  if (paginas.size >= 60) paginas.delete(paginas.keys().next().value);
  paginas.set(clave, { t: Date.now(), art });
  return art;
}

async function enriquecer(items, { maxChars = 1800, conImagen = false } = {}) {
  await Promise.all(
    items.map(async (it) => {
      if (SIN_TEXTO.test(it.dominio) || SIN_TEXTO.test(dominioDe(it.url))) return;
      try {
        const art = await articuloDe(it.url, maxChars);
        if (!art) return;
        if (art.cuerpo.length) it.cuerpo = art.cuerpo;
        if (!it.texto && art.desc) it.texto = art.desc;
        if (conImagen && !it.imgUrl && art.img) it.imgUrl = art.img;
      } catch (e) {
        console.log(`[GOOGLE] página ${dominioDe(it.url)}: ${e.message}`);
      }
    })
  );
}

async function buscarWeb(consulta) {
  const r = (await primerNivel(WEB_NIVEL_1, consulta, "web")) || (await primerNivel(WEB_NIVEL_2, consulta, "web")) || (await wikiLista(consulta));
  if (!r) return { items: [], via: "" };
  const ordenados = ordenarPorRelevancia(r.items, consulta, 8);
  const elegibles = ordenados.filter((it) => !SIN_TEXTO.test(dominioDe(it.url))).slice(0, 3);
  await enriquecer(elegibles, { maxChars: 1800 });
  return { items: ordenados, via: r.via };
}

async function buscarNoticias(consulta) {
  const salidas = await Promise.all(
    NOTICIAS.map(async (p) => {
      try {
        const items = await p.buscar(consulta);
        console.log(`[GOOGLE] noticias · ${p.nombre}: ${items.length} resultados`);
        return { p, items };
      } catch (e) {
        console.log(`[GOOGLE] noticias · ${p.nombre} falló: ${e.message}`);
        return { p, items: [] };
      }
    })
  );
  const vistos = new Set();
  const lista = [];
  for (const r of salidas.flatMap((x) => x.items)) {
    const k = limpiar(r.titulo).slice(0, 40);
    if (vistos.has(k)) continue;
    vistos.add(k);
    lista.push(r);
  }
  const tokensN = tokensClave(consulta);
  const afines = lista.filter((n) => cobertura(tokensN, n.titulo + " " + n.texto) >= 0.6);
  const candidatas = tokensN.length && afines.length >= 3 ? afines : lista;
  candidatas.sort((a, b) => b.ts - a.ts);
  const items = candidatas.slice(0, 10);
  if (!items.length) return { items: [], via: "" };

  await enriquecer(items.filter((n) => !SIN_TEXTO.test(dominioDe(n.url))).slice(0, 4), { maxChars: 2200, conImagen: true });
  await Promise.all(
    items.slice(0, 5).map(async (n) => {
      if (n.imgUrl) n.img = await imagenDatos(n.imgUrl, 120000);
    })
  );
  items.forEach((n) => delete n.imgUrl);
  return { items, via: salidas.filter((x) => x.items.length).map((x) => x.p.nombre.replace(" Noticias", "")).join(" + ") };
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

const PALABRAS_VACIAS = new Set([
  "que", "quien", "quienes", "como", "cual", "cuales", "donde", "cuando", "cuanto", "cuantos", "es", "son", "fue", "era", "del", "los", "las", "una", "uno", "por", "para", "con", "sobre",
  "the", "and", "para", "sus", "mas", "muy", "tiene", "hay", "hacer", "puedo", "dime", "busca", "buscar", "quiero", "saber", "algo", "este", "esta", "esto", "ese", "esa"
]);

const PALABRAS_INTENCION = new Set(["sale", "salir", "salio", "estreno", "estrena", "estrenara", "fecha", "lanzamiento", "lanza", "dia", "hora", "significa", "significado"]);

const raiz = (w) => w.replace(/s$/, "");

export function tokensClave(consulta) {
  const t = limpiar(consulta).split(" ").filter((w) => w.length > 2 && !PALABRAS_VACIAS.has(w) && !PALABRAS_INTENCION.has(w));
  return [...new Set(t)];
}

export function cobertura(tokens, texto) {
  if (!tokens.length) return 0;
  const t = limpiar(texto).split(" ").filter((w) => w.length > 1);
  const hay = tokens.filter((a) =>
    t.some((b) => {
      if (a === b) return true;
      const x = raiz(a);
      const y = raiz(b);
      return x.length >= 4 && y.length >= 4 && (x === y || x.startsWith(y) || y.startsWith(x));
    })
  );
  return hay.length / tokens.length;
}

function relevante(consulta, titulo) {
  return cobertura(tokensClave(consulta), titulo) >= 0.6;
}

export function ordenarPorRelevancia(items, consulta, max = 8) {
  const tokens = tokensClave(consulta);
  if (!tokens.length) return items.slice(0, max);
  const medidos = items.map((it, i) => ({
    it,
    i,
    cov: Math.max(cobertura(tokens, it.titulo + " " + it.texto), cobertura(tokens, it.titulo + " " + dominioDe(it.url) + " " + it.url.replace(/[-_/.]/g, " ")))
  }));
  const buenos = medidos.filter((m) => m.cov >= 0.6);
  const base = buenos.length >= 3 ? buenos : medidos;
  base.sort((a, b) => (b.cov >= 0.6) - (a.cov >= 0.6) || b.cov - a.cov || a.i - b.i);
  return base.slice(0, max).map((m) => m.it);
}

const FECHA_RE = /\b(20\d\d|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|estren\w*|lanz\w*|disponible)\b/i;

export function mejorRespuesta(consulta, { noticias = [], web = [], wiki = null } = {}) {
  const tokens = tokensClave(consulta);
  if (!tokens.length) return null;
  const piden = /(^|\s)(cuando|fecha|estreno|sale|salida|lanzamiento)(\s|$)/.test(limpiar(consulta));
  const minimo = tokens.length <= 2 ? 1 : 0.6;
  const candidatos = [];
  const agregar = (bloques, fuente, url, base) => {
    for (const b of bloques) {
      if (!b || b.startsWith("## ") || b.length < 60) continue;
      const cov = cobertura(tokens, b);
      if (cov < minimo) continue;
      candidatos.push({ texto: recortar(b, 520), fuente, url, score: cov * 3 + base + (piden && FECHA_RE.test(b) ? 1.5 : 0) });
    }
  };
  noticias.slice(0, 6).forEach((n, i) => agregar([n.texto, ...(n.cuerpo || [])], n.dominio, n.url, 0.6 - i * 0.05));
  web.slice(0, 5).forEach((w, i) => agregar([w.texto, ...(w.cuerpo || [])], w.dominio, w.url, 0.3 - i * 0.03));
  if (wiki) agregar([wiki.texto, ...(wiki.largo || [])], "Wikipedia", wiki.url, 0.4);
  candidatos.sort((a, b) => b.score - a.score);
  const mejor = candidatos[0];
  if (!mejor || mejor.score < 1.8) return null;
  const otra = candidatos.find((c) => c.fuente !== mejor.fuente && c.score >= 1.8);
  return [mejor, otra].filter(Boolean).map(({ texto, fuente, url }) => ({ texto, fuente, url }));
}

const CABECERA_WIKI = { "User-Agent": "MaxiProyec/1.0 (bot de WhatsApp)", "Api-User-Agent": "MaxiProyec/1.0" };

const SECCIONES_FINALES = /^(véase también|referencias|enlaces externos|notas|bibliografía|notas y referencias|fuentes|galería|further reading|references|external links|see also)$/i;

export function formatearWiki(texto, maxChars = 4200) {
  const bloques = [];
  let total = 0;
  for (const linea of String(texto || "").split("\n")) {
    const t = linea.trim();
    if (!t) continue;
    const h = /^=+\s*(.+?)\s*=+$/.exec(t);
    if (h) {
      if (SECCIONES_FINALES.test(h[1])) break;
      bloques.push("## " + h[1]);
      continue;
    }
    if (t.length < 40) continue;
    const corto = recortar(t, 900);
    bloques.push(corto);
    total += corto.length;
    if (total >= maxChars) break;
  }
  while (bloques.length && bloques[bloques.length - 1].startsWith("## ")) bloques.pop();
  return bloques;
}

const ARCHIVO_BASURA = /(logo|icon|flag|bandera|escudo|wikimedia|commons-|symbol|ambox|edit-|pictogram|question|folder|portal|stub|disambig|nuvola|crystal|oojs|increase|decrease|steady|loudspeaker|wiktionary|wikiquote|wikisource)/i;

async function imagenesWiki(titulo, consulta, max = 8, idioma = "es") {
  const encontrados = [];
  const agregar = (data, exigirRelevancia) => {
    for (const pag of Object.values(data?.query?.pages || {})) {
      const info = pag.imageinfo?.[0];
      if (!info?.thumburl || !/^image\/(jpeg|png)$/.test(info.mime || "")) continue;
      const nombre = String(pag.title || "").replace(/^(File|Archivo):/i, "").replace(/\.[a-z]+$/i, "").replace(/_/g, " ");
      if (ARCHIVO_BASURA.test(nombre) || (info.width && info.width < 200)) continue;
      if (exigirRelevancia && !relevante(consulta, nombre)) continue;
      encontrados.push({ url: info.thumburl, titulo: recortar(nombre, 70), pagina: info.descriptionurl || "" });
    }
  };
  const base = { action: "query", prop: "imageinfo", iiprop: "url|mime|size", iiurlwidth: 360, format: "json", redirects: 1 };
  try {
    if (titulo) {
      const { data } = await axios.get(`https://${idioma}.wikipedia.org/w/api.php`, { params: { ...base, generator: "images", titles: titulo, gimlimit: 20 }, timeout: 8000, headers: CABECERA_WIKI });
      agregar(data, false);
    }
  } catch (e) {
    console.log("[GOOGLE] imágenes de Wikipedia fallaron: " + e.message);
  }
  if (encontrados.length < max) {
    try {
      const { data } = await axios.get("https://commons.wikimedia.org/w/api.php", {
        params: { ...base, generator: "search", gsrsearch: consulta, gsrnamespace: 6, gsrlimit: 10 },
        timeout: 8000,
        headers: CABECERA_WIKI
      });
      agregar(data, true);
    } catch (e) {
      console.log("[GOOGLE] imágenes de Commons fallaron: " + e.message);
    }
  }
  const vistos = new Set();
  const unicos = encontrados.filter((f) => !vistos.has(f.url) && vistos.add(f.url)).slice(0, max);
  const listas = await Promise.all(unicos.map(async (f) => ({ img: await imagenDatos(f.url, 90000), titulo: f.titulo, url: f.pagina || f.url })));
  return listas.filter((f) => f.img);
}

async function buscarWikipedia(consulta, { maxFotos = 8 } = {}) {
  let wiki = null;
  const entidad = tokensClave(consulta).join(" ");
  if (entidad && consulta.split(/\s+/).length <= 8) {
    try {
      const { data } = await axios.get("https://es.wikipedia.org/w/api.php", {
        params: { action: "query", list: "search", srsearch: entidad, srlimit: 1, format: "json", utf8: 1 },
        timeout: 8000,
        headers: CABECERA_WIKI
      });
      const golpe = data?.query?.search?.[0];
      if (golpe && relevante(consulta, golpe.title)) {
        const [resumen, completo] = await Promise.all([
          axios.get("https://es.wikipedia.org/api/rest_v1/page/summary/" + enc(golpe.title.replace(/ /g, "_")), { timeout: 8000, headers: CABECERA_WIKI }),
          axios
            .get("https://es.wikipedia.org/w/api.php", {
              params: { action: "query", prop: "extracts", explaintext: 1, exsectionformat: "wiki", titles: golpe.title, redirects: 1, format: "json", utf8: 1 },
              timeout: 9000,
              headers: CABECERA_WIKI
            })
            .catch(() => null)
        ]);
        const d = resumen.data;
        if (d?.extract && d.type !== "disambiguation") {
          const pagina = Object.values(completo?.data?.query?.pages || {})[0];
          wiki = {
            tipo: "wiki",
            titulo: d.title,
            texto: recortar(d.extract, 360),
            largo: formatearWiki(pagina?.extract || d.extract),
            url: d.content_urls?.desktop?.page || "",
            img: d.thumbnail?.source ? await imagenDatos(d.thumbnail.source) : ""
          };
        }
      }
    } catch (e) {
      console.log("[GOOGLE] Wikipedia falló: " + e.message);
    }
  }
  const fotos = await imagenesWiki(wiki?.titulo || null, consulta, maxFotos);
  return { wiki, fotos };
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
          id: /v=([\w-]{11})/.exec(v.url)?.[1] || "",
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
    wiki: modo === "info" || modo === "fotos"
  };
  const consultaWeb = modo === "precio" ? (/precio|costo|cuesta/i.test(consulta) ? consulta + " comprar" : consulta + " precio comprar") : consulta;
  const SIN_VIDEOS = { populares: [], recientes: [] };
  const SIN_WIKI = { wiki: null, fotos: [] };

  const [web, noticias, videos, enciclopedia] = await Promise.all([
    quiere.web ? conTiempo(buscarWeb(consultaWeb), 30000, VACIO_LISTA) : VACIO_LISTA,
    quiere.noticias ? conTiempo(buscarNoticias(consulta), 28000, VACIO_LISTA) : VACIO_LISTA,
    quiere.videos ? conTiempo(buscarVideos(consulta, modo === "youtube" ? 6 : 4), 25000, SIN_VIDEOS) : SIN_VIDEOS,
    quiere.wiki ? conTiempo(buscarWikipedia(consulta, { maxFotos: modo === "fotos" ? 14 : 8 }), 26000, SIN_WIKI) : SIN_WIKI
  ]);

  const respuesta = mejorRespuesta(consulta, { noticias: noticias.items, web: web.items, wiki: enciclopedia.wiki });
  const datos = {
    respuesta,
    web: web.items,
    noticias: noticias.items,
    populares: videos.populares,
    recientes: videos.recientes,
    wiki: enciclopedia.wiki,
    fotos: enciclopedia.fotos,
    via: modo === "youtube" ? "YouTube" : modo === "noticias" ? noticias.via : web.via || noticias.via || (enciclopedia.wiki ? "Wikipedia" : ""),
    precios: modo === "precio" ? extraerPrecios(web.items) : [],
    ms: Date.now() - t0
  };

  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(clave, { t: Date.now(), datos });
  return datos;
}
