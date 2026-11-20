

import axios from "axios";
import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { promisify } from "node:util";
import { tarjetaDescarga, tarjetaUso, tarjetaError, campo } from "../../descargas/tarjetas.js";

const gunzip = promisify(zlib.gunzip);

/* ───────────────────────── CONFIG ───────────────────────── */
const BASE        = process.env.FLIX_BASE  || "https://ww1.123flmsfree.com";
const LOCALE      = process.env.FLIX_LOCALE || "es";
const CACHE_DIR   = process.env.FLIX_CACHE || path.join(process.cwd(), ".cache", "flix");
const CACHE_FILE  = path.join(CACHE_DIR, "resolver.json");
const INDEX_FILE  = path.join(CACHE_DIR, "index.json");
const FLARESOLVERR = process.env.FLARESOLVERR_URL || "";   // http://127.0.0.1:8191/v1
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const TTL_HIT   = 7 * 24 * 60 * 60 * 1000;   // 7 días para un link ya resuelto
const TTL_INDEX = 24 * 60 * 60 * 1000;       // 24 h para el índice
const MIN_SCORE = 0.62;
const MAX_INDEX = 80_000;

/* ───────────────────────── HTTP CON ESCUDO ───────────────────────── */
const jar = new Map();
const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
function absorb(res) {
  for (const c of res.headers?.["set-cookie"] || []) {
    const kv = c.split(";")[0]; const i = kv.indexOf("=");
    if (i > 0) jar.set(kv.slice(0, i), kv.slice(i + 1));
  }
}

const CF_MARKS = ["just a moment", "attention required", "cf-browser-verification", "challenge-platform", "cf_chl_opt"];
const isChallenge = (html = "") => {
  const h = html.slice(0, 4000).toLowerCase();
  return CF_MARKS.some(m => h.includes(m));
};

const baseHeaders = (url) => ({
  "User-Agent": UA,
  "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-MX,es;q=0.9,en;q=0.6",
  "Referer": BASE + "/",
  "Sec-Fetch-Dest": "document", "Sec-Fetch-Mode": "navigate", "Sec-Fetch-Site": "same-origin",
  ...(jar.size ? { Cookie: cookieHeader() } : {}),
});

async function tryDirect(url) {
  try {
    const res = await axios.get(url, { timeout: 12000, validateStatus: () => true, headers: baseHeaders(url) });
    absorb(res);
    const body = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
    if (res.status === 200 && !isChallenge(body)) return { ok: true, status: 200, body, via: "direct" };
    return { ok: false, status: res.status, body };
  } catch (e) {
    return { ok: false, status: 0, body: e.message };
  }
}

async function tryFlare(url) {
  if (!FLARESOLVERR) return { ok: false, status: 0, body: "no-flaresolverr" };
  try {
    const { data } = await axios.post(FLARESOLVERR, { cmd: "request.get", url, maxTimeout: 45000 }, { timeout: 60000 });
    const sol = data?.solution;
    if (!sol?.response) return { ok: false, status: 0, body: "flare-fail" };
    for (const c of sol.cookies || []) jar.set(c.name, c.value);
    return { ok: true, status: sol.status || 200, body: sol.response, via: "flare" };
  } catch (e) {
    return { ok: false, status: 0, body: e.message };
  }
}

let puppeteerReady = null;
async function tryPuppeteer(url) {
  try {
    if (puppeteerReady === null) {
      const mod = await import("puppeteer-extra");
      const stealth = (await import("puppeteer-extra-plugin-stealth")).default;
      mod.default.use(stealth());
      puppeteerReady = mod.default;
    }
    const browser = await puppeteerReady.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
    });
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.setExtraHTTPHeaders({ "Accept-Language": "es-MX,es;q=0.9" });
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout?.(1500) ?? new Promise(r => setTimeout(r, 1500));
    const html = await page.content();
    for (const c of await page.cookies()) jar.set(c.name, c.value);
    await browser.close();
    if (isChallenge(html)) return { ok: false, status: 403, body: "challenge" };
    return { ok: true, status: resp?.status() || 200, body: html, via: "puppeteer" };
  } catch (e) {
    return { ok: false, status: 0, body: e.message };
  }
}

const PROXIES = [
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  u => `https://r.jina.ai/${u}`,
];
async function tryProxy(fn, url) {
  try {
    const res = await axios.get(fn(url), { timeout: 20000, validateStatus: () => true, headers: { "User-Agent": UA } });
    const body = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
    if (res.status === 200 && body.length > 500 && !isChallenge(body)) return { ok: true, status: 200, body, via: "proxy" };
    return { ok: false, status: res.status, body };
  } catch (e) {
    return { ok: false, status: 0, body: e.message };
  }
}

async function fetchSmart(url, { allowHeavy = true } = {}) {
  const direct = await tryDirect(url);
  if (direct.ok || direct.status === 404) return direct;
  if (!allowHeavy) return direct;
  const flare = await tryFlare(url);
  if (flare.ok) return flare;
  const pup = await tryPuppeteer(url);
  if (pup.ok) return pup;
  for (const p of PROXIES) {
    const r = await tryProxy(p, url);
    if (r.ok) return r;
  }
  return direct;
}

/* ───────────────────────── TEXTO / SCORING ───────────────────────── */
const norm = (s = "") =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
   .toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m || !n) return Math.max(m, n);
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++)
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

function score(q, cand) {
  const A = norm(q), B = norm(cand);
  if (!A || !B) return 0;
  if (A === B) return 1;
  const ta = new Set(A.split(" ")), tb = new Set(B.split(" "));
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const jaccard = inter / new Set([...ta, ...tb]).size;
  const dice = 1 - lev(A, B) / Math.max(A.length, B.length);
  const contained = A.includes(B) || B.includes(A) ? 0.15 : 0;
  return Math.min(1, jaccard * 0.55 + dice * 0.45 + contained);
}

/* ───────────────────────── CACHÉ ───────────────────────── */
async function ensureDir() { await fs.mkdir(CACHE_DIR, { recursive: true }).catch(() => {}); }

async function readJson(file, def) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return def; }
}
async function writeJson(file, obj) {
  await ensureDir();
  const tmp = file + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(obj));
  await fs.rename(tmp, file).catch(async () => { await fs.writeFile(file, JSON.stringify(obj)); });
}

const hits = new Map();   // memoria
let endpoint = null;      // endpoint de búsqueda que funcionó

async function loadHits() {
  if (hits.size) return;
  const raw = await readJson(CACHE_FILE, {});
  const now = Date.now();
  for (const [k, v] of Object.entries(raw)) if (now - v.ts < TTL_HIT) hits.set(k, v);
}
async function saveHits() {
  const obj = {};
  for (const [k, v] of hits) obj[k] = v;
  await writeJson(CACHE_FILE, obj).catch(() => {});
}

/* ───────────────────────── ÍNDICE (sitemap) ───────────────────────── */
let index = null;   // [{ u, id, type, slug }]

const DETAIL_RE = /\/([a-z]{2})\/detail\/(movie|serie|tv)\/([A-Za-z0-9]{8,32})-([^"'\s?#<>]+)/g;

function extractLinks(html) {
  const out = [];
  for (const m of html.matchAll(DETAIL_RE)) {
    out.push({ type: m[2] === "tv" ? "serie" : m[2], id: m[3], slug: decodeURIComponent(m[4]) });
  }
  return out;
}

async function fetchSitemapRaw(url) {
  const r = await fetchSmart(url, { allowHeavy: false });
  if (!r.ok) return null;
  const body = r.body.trim();
  if (body.startsWith("<")) return body;
  try { return (await gunzip(Buffer.from(body, "binary"))).toString("utf8"); } catch { return body; }
}

async function warmIndex(force = false) {
  const cached = await readJson(INDEX_FILE, null);
  if (!force && cached && Date.now() - cached.ts < TTL_INDEX && cached.entries?.length) {
    index = cached.entries;
    return index.length;
  }
  const seeds = [`${BASE}/sitemap.xml`, `${BASE}/${LOCALE}/sitemap.xml`, `${BASE}/sitemap_index.xml`, `${BASE}/sitemap-movies.xml`];
  const found = new Map();

  for (const seed of seeds) {
    const xml = await fetchSitemapRaw(seed);
    if (!xml) continue;

    if (/<sitemapindex/i.test(xml)) {
      const children = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1]).slice(0, 40);
      for (const child of children) {
        const sub = await fetchSitemapRaw(child);
        if (!sub) continue;
        for (const l of extractLinks(sub)) if (!found.has(l.id)) found.set(l.id, l);
        if (found.size >= MAX_INDEX) break;
      }
    } else {
      for (const l of extractLinks(xml)) if (!found.has(l.id)) found.set(l.id, l);
    }
    if (found.size) break;
  }

  if (!found.size) return 0;
  index = [...found.values()];
  await writeJson(INDEX_FILE, { ts: Date.now(), entries: index }).catch(() => {});
  return index.length;
}

function searchIndex(query) {
  if (!index?.length) return [];
  const q = norm(query);
  return index
    .map(e => ({ ...e, s: score(q, e.slug.replace(/-/g, " ")) }))
    .filter(e => e.s >= MIN_SCORE)
    .sort((a, b) => b.s - a.s)
    .slice(0, 6);
}

/* ───────────────────────── BÚSQUEDA EN EL SITIO ───────────────────────── */
const SEARCH_PATHS = [
  q => `/${LOCALE}/search?q=${encodeURIComponent(q)}`,
  q => `/${LOCALE}/buscar?q=${encodeURIComponent(q)}`,
  q => `/${LOCALE}/search/${encodeURIComponent(q)}`,
  q => `/${LOCALE}/ajax/search?keyword=${encodeURIComponent(q)}`,
  q => `/${LOCALE}/api/search?q=${encodeURIComponent(q)}`,
];

async function searchSite(query) {
  const ordered = endpoint
    ? [endpoint, ...SEARCH_PATHS.filter(p => p !== endpoint)]
    : SEARCH_PATHS;

  for (const build of ordered) {
    const url = BASE + build(query);
    const r = await fetchSmart(url);
    if (!r.ok) continue;

    let links = [];
    if (r.body.trim().startsWith("{") || r.body.trim().startsWith("[")) {
      try { links = extractLinks(JSON.stringify(JSON.parse(r.body))); } catch {}
    }
    if (!links.length) {
      const $ = cheerio.load(r.body);
      const hrefs = [];
      $('a[href*="/detail/"]').each((_, el) => hrefs.push($(el).attr("href")));
      links = extractLinks(hrefs.map(h => `https://x/es/detail/${h.includes("/detail/") ? h.split("/detail/")[1] : h}`).join(" "));
      if (!links.length) links = extractLinks(hrefs.join(" "));
    }
    if (!links.length) continue;

    endpoint = build;   // memorizamos el que sirve
    const q = norm(query);
    return links
      .map(e => ({ ...e, s: score(q, e.slug.replace(/-/g, " ")) }))
      .filter(e => e.s >= MIN_SCORE)
      .sort((a, b) => b.s - a.s);
  }
  return [];
}

/* ───────────────────────── RESOLUCIÓN ───────────────────────── */
const link = (e) => `${BASE}/${LOCALE}/detail/${e.type}/${e.id}-${e.slug}`;

async function resolve(query) {
  await loadHits();
  const key = norm(query);
  if (!key) return { hit: null, alt: [] };

  const c = hits.get(key);
  if (c && Date.now() - c.ts < TTL_HIT) return { hit: c, alt: [], from: "cache" };

  // 1) índice local (gratis, sin red)
  if (index === null) {
    const cached = await readJson(INDEX_FILE, null);
    if (cached && Date.now() - cached.ts < TTL_INDEX) index = cached.entries || [];
  }
  let best = searchIndex(query)[0];
  if (best && best.s >= 0.75) return commit(key, best, [], "indice");

  // 2) buscador del sitio
  const res = await searchSite(query);
  if (res.length) return commit(key, res[0], res.slice(1, 4), "buscador");
  if (best) return commit(key, best, [], "indice-parcial");

  // 3) levantar índice y reintentar
  if (!index?.length) {
    const n = await warmIndex();
    if (n) {
      best = searchIndex(query)[0];
      if (best) return commit(key, best, [], "indice-nuevo");
    }
  }
  return { hit: null, alt: [], from: "none" };
}

async function commit(key, e, alt, from) {
  const rec = { ts: Date.now(), type: e.type, id: e.id, slug: e.slug, url: link(e) };
  hits.set(key, rec);
  await saveHits();
  return { hit: rec, alt: alt.map(link), from };
}

/* ───────────────────────── COMANDO ───────────────────────── */
export default {
  names: [".pelicula", ".peli", ".cine", ".movie", ".serie"],
  usage: ".pelicula <título>",
  desc: "Resuelve el link directo de la película o serie, sin pasar por buscadores.",
  category: "Descargas",

  handler: async ({ sender, cleanText, reply }) => {
    const args = cleanText.trim().split(/\s+/).slice(1);
    const flag = args[0]?.startsWith("--") ? args.shift().toLowerCase() : null;
    const consulta = args.join(" ").trim();

    if (flag === "--index" || flag === "--stats") {
      if (flag === "--stats") {
        await loadHits();
        return reply({
          text: tarjetaDescarga({
            emoji: "📊", titulo: "ÍNDICE DE PELÍCULAS", sender,
            campos: [
              campo("🎯", "Links cacheados", String(hits.size)),
              campo("🗂️", "Índice local", index?.length ? String(index.length) : "sin cargar"),
              campo("🔌", "Endpoint", endpoint ? "detectado" : "sin detectar"),
            ],
            nota: "Usa .pelicula --index para reconstruir el índice.",
          }),
          mentions: [sender],
        });
      }
      await reply({ text: "🗂️ Reconstruyendo índice...", mentions: [sender] });
      const n = await warmIndex(true);
      return reply({
        text: tarjetaDescarga({
          emoji: "🗂️", titulo: "ÍNDICE ACTUALIZADO", sender,
          campos: [campo("🎯", "Títulos indexados", String(n))],
          nota: n ? "Ahora las búsquedas se resuelven sin red." : "El sitio bloqueó la descarga del sitemap.",
        }),
        mentions: [sender],
      });
    }

    if (flag === "--clear") {
      hits.clear(); index = null;
      await fs.rm(CACHE_FILE, { force: true }).catch(() => {});
      await fs.rm(INDEX_FILE, { force: true }).catch(() => {});
      return reply({ text: "🧹 Caché e índice borrados.", mentions: [sender] });
    }

    if (!consulta) {
      return reply({
        text: tarjetaUso({
          comando: ".pelicula <título>",
          ejemplo: ".pelicula La Venganza del Charro Negro\n.pelicula --index\n.pelicula --stats",
          nota: "Devuelvo el link directo a la ficha. Sin buscadores de por medio.",
        }),
        mentions: [sender],
      });
    }

    try {
      await reply({ text: `🎬 Resolviendo "${consulta}"...`, mentions: [sender] });

      const { hit, alt, from } = await resolve(consulta);

      if (!hit) {
        return reply({
          text: tarjetaError(`No encontré "${consulta}" en el catálogo.`),
          mentions: [sender],
        });
      }

      const campos = [campo("▶️", hit.type === "serie" ? "Serie" : "Película", hit.url)];
      if (alt?.length) alt.forEach((u, i) => campos.push(campo("🔁", `Alternativa ${i + 1}`, u)));

      return reply({
        text: tarjetaDescarga({
          emoji: "🎬",
          titulo: consulta.toUpperCase(),
          sender,
          campos,
          nota: `Link directo a la ficha (fuente: ${from}).`,
        }),
        mentions: [sender],
      });

    } catch (e) {
      console.error("[pelicula] Error:", e.message);
      return reply({ text: tarjetaError("Ocurrió un error al resolver el link."), mentions: [sender] });
    }
  },
};
