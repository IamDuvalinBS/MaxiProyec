import axios from "axios";
import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { promisify } from "node:util";
import { tarjetaDescarga, tarjetaUso, tarjetaError, campo } from "../../descargas/tarjetas.js";

const gunzip = promisify(zlib.gunzip);

/* ───────────────────────── CONFIG ───────────────────────── */
const HOSTS = (process.env.FLIX_HOSTS || "ww1,ww2,ww3")
  .split(",").map(h => h.trim()).filter(Boolean)
  .map(h => `https://${h.replace(/^https?:\/\//, "").replace(/\.123flmsfree\.com$/, "")}.123flmsfree.com`);

const LOCALE     = process.env.FLIX_LOCALE || "es";
const CACHE_DIR  = process.env.FLIX_CACHE || path.join(process.cwd(), ".data", "flix");
const CACHE_FILE = path.join(CACHE_DIR, "resolver.json");
const INDEX_FILE = path.join(CACHE_DIR, "index.json");
const SEED_FILE  = path.join(CACHE_DIR, "seeds.json");
const FLARESOLVERR = process.env.FLARESOLVERR_URL || "";
const INDEX_VERSION = 2;

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const TTL_HIT   = 7 * 24 * 60 * 60 * 1000;
const TTL_WEAK  = 60 * 60 * 1000;
const TTL_INDEX = 24 * 60 * 60 * 1000;
const MIN_SCORE = 0.62;
const STRONG    = 0.85;
const MAX_INDEX = Number(process.env.FLIX_MAX_INDEX || 120_000);
const BUDGET    = Number(process.env.FLIX_CRAWL_BUDGET || 400);
const CONCURRENCY = Number(process.env.FLIX_CONCURRENCY || 2);

/* ───────────────────────── HOST ACTIVO ───────────────────────── */
let activeBase = null;
const base = () => activeBase || HOSTS[0];

async function getBase() {
  if (activeBase) return activeBase;
  if (process.env.FLIX_BASE) return (activeBase = process.env.FLIX_BASE.replace(/\/$/, ""));
  for (const h of HOSTS) {
    const r = await tryDirect(`${h}/robots.txt`);
    if (r.ok) return (activeBase = h);
  }
  return (activeBase = HOSTS[0]);
}

/* ───────────────────────── HTTP ───────────────────────── */
const jar = new Map();
const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const jitter = (a = 400, b = 1100) => sleep(a + Math.random() * (b - a));

function absorb(res) {
  for (const c of res.headers?.["set-cookie"] || []) {
    const kv = c.split(";")[0]; const i = kv.indexOf("=");
    if (i > 0) jar.set(kv.slice(0, i), kv.slice(i + 1));
  }
}

const CF_MARKS = ["just a moment", "attention required", "cf-browser-verification", "challenge-platform", "cf_chl_opt", "why have i been blocked"];
const isChallenge = (html = "") => {
  const h = String(html).slice(0, 4000).toLowerCase();
  return CF_MARKS.some(m => h.includes(m));
};

const baseHeaders = (url) => ({
  "User-Agent": UA,
  "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-MX,es;q=0.9,en;q=0.6",
  "Referer": base() + "/",
  "Sec-Fetch-Dest": "document", "Sec-Fetch-Mode": "navigate", "Sec-Fetch-Site": "same-origin",
  ...(jar.size ? { Cookie: cookieHeader() } : {}),
});

async function tryDirect(url, { binary = false } = {}) {
  try {
    const res = await axios.get(url, {
      timeout: 12000, validateStatus: () => true, headers: baseHeaders(url),
      responseType: binary ? "arraybuffer" : "text", decompress: true,
    });
    absorb(res);
    const raw = res.data;
    const body = binary
      ? (Buffer.isBuffer(raw) ? raw : Buffer.from(raw))
      : (typeof raw === "string" ? raw : JSON.stringify(raw));
    const head = binary ? body.subarray(0, 4000).toString("utf8") : body;
    if (res.status === 200 && !isChallenge(head)) return { ok: true, status: 200, body, via: "direct" };
    return { ok: false, status: res.status, body };
  } catch (e) {
    return { ok: false, status: 0, body: e.message };
  }
}

async function tryFlare(url) {
  if (!FLARESOLVERR) return { ok: false, status: 0, body: "no-flaresolverr" };
  try {
    const { data } = await axios.post(
      FLARESOLVERR,
      { cmd: "request.get", url, maxTimeout: 45000 },
      { timeout: 60000 }
    );
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
  let browser = null;
  try {
    if (puppeteerReady === null) {
      const mod = await import("puppeteer-extra");
      const stealth = (await import("puppeteer-extra-plugin-stealth")).default;
      mod.default.use(stealth());
      puppeteerReady = mod.default;
    }
    browser = await puppeteerReady.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
    });
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.setExtraHTTPHeaders({ "Accept-Language": "es-MX,es;q=0.9" });

    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await sleep(1200 + Math.random() * 800);

    const html = await page.content();
    const cookies = (await page.cookies?.()) ?? (await browser.cookies());
    for (const c of cookies) jar.set(c.name, c.value);

    if (isChallenge(html)) return { ok: false, status: 403, body: "challenge" };
    return { ok: true, status: resp?.status() || 200, body: html, via: "puppeteer" };
  } catch (e) {
    return { ok: false, status: 0, body: e.message };
  } finally {
    await browser?.close().catch(() => {});
  }
}

const PROXIES = [
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  u => `https://r.jina.ai/${u}`,
];

async function tryProxy(fn, url) {
  try {
    const res = await axios.get(fn(url), {
      timeout: 22000, validateStatus: () => true,
      headers: { "User-Agent": UA }, responseType: "text",
    });
    const body = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
    if (res.status === 200 && body.length > 400 && !isChallenge(body)) {
      return { ok: true, status: 200, body, via: "proxy" };
    }
    return { ok: false, status: res.status, body };
  } catch (e) {
    return { ok: false, status: 0, body: e.message };
  }
}

async function fetchSmart(url, { allowHeavy = true } = {}) {
  const direct = await tryDirect(url);
  if (direct.ok || direct.status === 404) return direct;

  for (const p of PROXIES) {
    const r = await tryProxy(p, url);
    if (r.ok) return r;
  }
  if (!allowHeavy) return direct;

  const flare = await tryFlare(url);
  if (flare.ok) return flare;

  const pup = await tryPuppeteer(url);
  if (pup.ok) return pup;

  return direct;
}

/* ───────────────────────── TEXTO / SCORING ───────────────────────── */
const NOISE = /\[(doblaje|castellano|latino|subtitulad[oa]|hd|4k|1080p|720p|cam|ts)[^\]]*\]/gi;

const norm = (s = "") =>
  String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const slugToTitle = (slug = "") => norm(String(slug).replace(/-/g, " ").replace(/\s\d{4}$/, ""));
const cleanTitle = (t = "") => slugToTitle(String(t).replace(NOISE, " "));

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

function score(qNorm, candNorm) {
  const A = qNorm, B = candNorm;
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
const hits = new Map();
let endpoint = null;
let saveTimer = null;

async function ensureDir() { await fs.mkdir(CACHE_DIR, { recursive: true }).catch(() => {}); }
async function readJson(file, def) { try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return def; } }

async function writeJson(file, obj) {
  await ensureDir();
  const tmp = file + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(obj));
  await fs.rename(tmp, file).catch(() => fs.writeFile(file, JSON.stringify(obj)).catch(() => {}));
}

async function loadHits() {
  if (hits.size) return;
  const raw = await readJson(CACHE_FILE, {});
  const now = Date.now();
  for (const [k, v] of Object.entries(raw)) {
    if (now - v.ts < (v.weak ? TTL_WEAK : TTL_HIT)) hits.set(k, v);
  }
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const obj = Object.fromEntries(hits);
    writeJson(CACHE_FILE, obj).catch(() => {});
  }, 2000);
  saveTimer.unref?.();
}

/* ───────────────────────── ÍNDICE ───────────────────────── */
let index = null;
let building = null;

const DETAIL_RE = /\/([a-z]{2})\/detail\/(movie|serie|tv|anime|dorama|novela)\/([A-Za-z0-9]{8,32})-([^"'\s?#<>/)]+)/g;
const LISTING_RE = /\/(pelicula|peliculas|movie|movies|serie|series|tv|estrenos|genero|generos|genre|categoria|categorias|explorar|browse|ver|page|pagina)(\/|$|\?)/i;

function extractLinks(text = "") {
  const out = new Map();
  for (const m of String(text).matchAll(DETAIL_RE)) {
    const id = m[3];
    if (out.has(id)) continue;
    out.set(id, {
      seg: m[2],
      tipo: m[2] === "movie" ? "pelicula" : "serie",
      id,
      slug: decodeURIComponent(m[4]).replace(/[).,;]+$/, ""),
    });
  }
  return [...out.values()];
}

const link = (e) => `${base()}/${LOCALE}/detail/${e.seg}/${e.id}-${e.slug}`;

function absorbLinks(list) {
  if (!index) index = [];
  const seen = new Set(index.map(e => e.id));
  let added = 0;
  for (const l of list) {
    if (seen.has(l.id) || index.length >= MAX_INDEX) continue;
    seen.add(l.id);
    index.push({ ...l, n: slugToTitle(l.slug) });
    added++;
  }
  return added;
}

async function loadIndex() {
  if (index) return index;
  const cached = await readJson(INDEX_FILE, null);
  if (cached?.v === INDEX_VERSION && Date.now() - cached.ts < TTL_INDEX && Array.isArray(cached.entries)) {
    index = cached.entries;
  } else {
    index = [];
  }
  return index;
}

async function saveIndex() {
  await writeJson(INDEX_FILE, { v: INDEX_VERSION, ts: Date.now(), entries: index || [] });
}

async function fetchXml(url) {
  const r = await tryDirect(url, { binary: true });
  if (r.ok && Buffer.isBuffer(r.body)) {
    const buf = r.body;
    if (buf[0] === 0x1f && buf[1] === 0x8b) {
      try { return (await gunzip(buf)).toString("utf8"); } catch { /* noop */ }
    }
    return buf.toString("utf8");
  }
  const txt = await fetchSmart(url, { allowHeavy: false });
  if (!txt.ok) return null;
  const body = String(txt.body).trim();
  if (body.startsWith("<")) return body;
  return body;
}

async function trySitemaps() {
  const seeds = [
    `${base()}/sitemap.xml`, `${base()}/sitemap_index.xml`,
    `${base()}/sitemap-movies.xml`, `${base()}/${LOCALE}/sitemap.xml`,
  ];
  for (const seed of seeds) {
    const xml = await fetchXml(seed);
    if (!xml || !xml.includes("<loc>")) continue;

    if (/<sitemapindex/i.test(xml)) {
      const kids = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1]);
      for (const kid of kids) {
        const sub = await fetchXml(kid);
        if (!sub) continue;
        absorbLinks(extractLinks(sub));
        if (index.length >= MAX_INDEX) break;
      }
    } else {
      absorbLinks(extractLinks(xml));
    }
    if (index.length) return index.length;
  }
  return 0;
}

async function readSeeds() {
  const raw = await readJson(SEED_FILE, []);
  const list = Array.isArray(raw) ? raw : [];
  const fromHits = [...hits.values()].map(h => h.id);
  return [...new Set([...list, ...fromHits])].filter(Boolean);
}

async function crawlFrom(seeds) {
  const queue = [`${base()}/${LOCALE}/`, `${base()}/${LOCALE}`];
  for (const s of seeds) {
    if (/^https?:/.test(s)) queue.push(s);
    else if (s.includes("-")) queue.push(`${base()}/${LOCALE}/detail/movie/${s}`);
  }

  const seen = new Set(queue);
  let done = 0;

  while (queue.length && done < BUDGET) {
    const batch = queue.splice(0, CONCURRENCY);
    await Promise.all(batch.map(async (url) => {
      done++;
      const r = await fetchSmart(url, { allowHeavy: false });
      if (!r.ok || typeof r.body !== "string") return;

      absorbLinks(extractLinks(r.body));

      if (!url.includes("/detail/")) {
        const $ = cheerio.load(r.body);
        $("a[href]").each((_, el) => {
          const href = $(el).attr("href");
          if (!href) return;
          let p;
          try { p = new URL(href, base()).pathname; } catch { return; }
          if (!LISTING_RE.test(p)) return;
          const full = base() + p;
          if (seen.has(full) || seen.size > BUDGET * 4) return;
          seen.add(full);
          queue.push(full);
        });
      }
      await jitter(200, 600);
    }));
  }
  return done;
}

async function warmIndex(force = false) {
  if (building) return building;

  building = (async () => {
    await ensureDir();
    await loadHits();
    await loadIndex();

    if (force) index = [];

    const before = index.length;
    const fromSitemap = await trySitemaps();
    const pages = await crawlFrom(await readSeeds());

    if (index.length > before || force) await saveIndex();
    return { total: index.length, added: index.length - before, pages, sitemap: fromSitemap };
  })().finally(() => { building = null; });

  return building;
}

function searchIndex(query, tipo) {
  if (!index?.length) return [];
  const q = cleanTitle(query);
  if (!q) return [];
  const toks = q.split(" ").filter(t => t.length > 2);

  const pool = index.filter(e => {
    if (tipo && e.tipo !== tipo) return false;
    return toks.length ? toks.some(t => e.n.includes(t)) : true;
  });

  return (pool.length ? pool : index.filter(e => !tipo || e.tipo === tipo))
    .slice(0, 400)
    .map(e => ({ ...e, s: score(q, e.n) }))
    .filter(e => e.s >= MIN_SCORE)
    .sort((a, b) => b.s - a.s)
    .slice(0, 6);
}

/* ───────────────────────── BÚSQUEDA EN EL SITIO ───────────────────────── */
const SEARCH_PATHS = [
  q => `/${LOCALE}/search?keyword=${encodeURIComponent(q)}`,
  q => `/${LOCALE}/search?q=${encodeURIComponent(q)}`,
  q => `/${LOCALE}/buscar?q=${encodeURIComponent(q)}`,
  q => `/${LOCALE}/buscar?keyword=${encodeURIComponent(q)}`,
  q => `/${LOCALE}/search/${encodeURIComponent(q)}`,
  q => `/${LOCALE}/ajax/search?keyword=${encodeURIComponent(q)}`,
  q => `/${LOCALE}/api/search?q=${encodeURIComponent(q)}`,
];

function linksFromBody(body, contentType = "") {
  const text = String(body);
  if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
    try { return extractLinks(JSON.stringify(JSON.parse(text))); } catch { /* noop */ }
  }
  const direct = extractLinks(text);
  if (direct.length) return direct;
  if (/markdown/i.test(contentType)) return direct;

  const $ = cheerio.load(text);
  const hrefs = [];
  $('a[href*="/detail/"]').each((_, el) => {
    const h = $(el).attr("href");
    if (!h) return;
    try { hrefs.push(new URL(h, base()).pathname); } catch { /* noop */ }
  });
  return extractLinks(hrefs.join(" "));
}

async function searchSite(query, tipo) {
  const ordered = endpoint ? [endpoint, ...SEARCH_PATHS.filter(p => p !== endpoint)] : SEARCH_PATHS;
  const q = cleanTitle(query);

  for (const build of ordered) {
    const r = await fetchSmart(base() + build(query));
    if (!r.ok) continue;

    const found = linksFromBody(r.body)
      .filter(e => !tipo || e.tipo === tipo)
      .map(e => ({ ...e, n: slugToTitle(e.slug) }))
      .map(e => ({ ...e, s: score(q, e.n) }))
      .filter(e => e.s >= MIN_SCORE)
      .sort((a, b) => b.s - a.s);

    if (found.length) {
      endpoint = build;
      return found;
    }
  }
  return [];
}

/* ───────────────────────── RESOLUCIÓN ───────────────────────── */
async function resolve(query, tipo) {
  await loadHits();
  const key = (tipo ? tipo + ":" : "") + cleanTitle(query);
  if (!key.trim()) return { hit: null, alt: [], from: "none" };

  const c = hits.get(key);
  if (c) return { hit: c, alt: [], from: "cache" };

  await loadIndex();
  let best = searchIndex(query, tipo)[0];
  if (best && best.s >= STRONG) return commit(key, best, [], "indice", false);

  const res = await searchSite(query, tipo);
  if (res.length) return commit(key, res[0], res.slice(1, 4), "buscador", false);
  if (best) return commit(key, best, [], "indice-parcial", true);

  const { added } = await warmIndex();
  if (added) {
    best = searchIndex(query, tipo)[0];
    if (best) return commit(key, best, [], "indice-nuevo", best.s < STRONG);
  }
  return { hit: null, alt: [], from: "none" };
}

async function commit(key, e, alt, from, weak) {
  const rec = { ts: Date.now(), seg: e.seg, id: e.id, slug: e.slug, tipo: e.tipo, weak: !!weak };
  hits.set(key, rec);
  scheduleSave();
  return { hit: rec, alt: alt.map(link), from };
}

/* ───────────────────────── COMANDO ───────────────────────── */
export default {
  names: [".pelicula", ".peli", ".cine", ".movie", ".serie"],
  usage: ".pelicula <título>",
  desc: "Resuelve el link directo de la ficha, sin pasar por buscadores.",
  category: "Descargas",

  handler: async ({ sender, cleanText, reply }) => {
    const args = cleanText.trim().split(/\s+/).slice(1);
    const flag = args[0]?.startsWith("--") ? args.shift().toLowerCase() : null;
    const tipo = cleanText.trim().split(/\s+/)[0] === ".serie" ? "serie" : null;
    const consulta = args.join(" ").trim();

    if (flag === "--stats") {
      await loadHits();
      await loadIndex();
      return reply({
        text: tarjetaDescarga({
          emoji: "📊", titulo: "ÍNDICE DE FICHAS", sender,
          campos: [
            campo("🎯", "Links cacheados", String(hits.size)),
            campo("🗂️", "Índice local", String(index?.length || 0)),
            campo("🌐", "Host activo", base()),
            campo("🔌", "Endpoint", endpoint ? "detectado" : "sin detectar"),
          ],
          nota: "Usa .pelicula --index para reconstruir el índice.",
        }),
        mentions: [sender],
      });
    }

    if (flag === "--clear") {
      hits.clear(); index = null; endpoint = null; jar.clear(); activeBase = null;
      await fs.rm(CACHE_FILE, { force: true }).catch(() => {});
      await fs.rm(INDEX_FILE, { force: true }).catch(() => {});
      return reply({ text: "🧹 Caché, índice y cookies borrados.", mentions: [sender] });
    }

    if (flag === "--add") {
      const raw = consulta;
      if (!raw) return reply({ text: "Uso: .pelicula --add <url o id-slug>", mentions: [sender] });
      await ensureDir();
      const seeds = await readJson(SEED_FILE, []);
      const list = Array.isArray(seeds) ? seeds : [];
      const id = raw.includes("/detail/") ? raw.split("/detail/")[1] : raw;
      if (id && !list.includes(id)) list.push(id);
      await writeJson(SEED_FILE, list);
      return reply({ text: `🌱 Semilla guardada (${list.length} en total).`, mentions: [sender] });
    }

    if (flag === "--index") {
      await reply({ text: "🗂️ Construyendo índice... esto tarda, no lo repitas.", mentions: [sender] });
      const { total, added, pages } = await warmIndex(true);
      return reply({
        text: tarjetaDescarga({
          emoji: "🗂️", titulo: "ÍNDICE ACTUALIZADO", sender,
          campos: [
            campo("🎯", "Fichas indexadas", String(total)),
            campo("➕", "Nuevas", String(added)),
            campo("📄", "Páginas leídas", String(pages)),
          ],
          nota: total ? "Las búsquedas ya se resuelven sin red." : "No se pudo leer nada. Revisa FLIX_HOSTS o levanta FlareSolverr.",
        }),
        mentions: [sender],
      });
    }

    if (!consulta) {
      return reply({
        text: tarjetaUso({
          comando: ".pelicula <título>",
          ejemplo: ".peli La Venganza del Charro Negro\n.serie La Leyenda de los Chaneques\n.pelicula --index\n.pelicula --stats",
          nota: "Devuelvo el link directo a la ficha. Sin buscadores de por medio.",
        }),
        mentions: [sender],
      });
    }

    try {
      await getBase();
      const { hit, alt, from } = await resolve(consulta, tipo);

      if (!hit) {
        return reply({
          text: tarjetaError(`No encontré "${consulta}" en el catálogo.`),
          mentions: [sender],
        });
      }

      const campos = [campo("▶️", hit.tipo === "serie" ? "Serie" : "Película", link(hit))];
      if (alt?.length) alt.forEach((u, i) => campos.push(campo("🔁", `Alternativa ${i + 1}`, u)));

      return reply({
        text: tarjetaDescarga({
          emoji: "🎬", titulo: consulta.toUpperCase(), sender,
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
