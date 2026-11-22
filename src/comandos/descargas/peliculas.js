import axios from "axios";
import { execFile } from "child_process";
import * as dns from "dns";
import { createWriteStream, existsSync } from "fs";
import { mkdir, stat, unlink } from "fs/promises";
import { createRequire } from "module";
import { join } from "path";
import { pipeline } from "stream/promises";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

try {
  dns.setDefaultResultOrder("ipv4first");
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1", "1.0.0.1", "9.9.9.9"]);
  console.log("[peli] DNS públicos configurados");
} catch (e) {
  console.warn("[peli] No se pudieron configurar DNS públicos:", e);
}

/* ───────────── CONFIG ───────────── */
const BASE_URL = "https://pelis182.net";
const API_BASE = `${BASE_URL}/wp-json/wp/v2`;
const STV_API = "https://api.v02.savethevideo.com";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const DEFAULT_HEADERS = { "User-Agent": UA, Accept: "application/json" };
const HTML_HEADERS = { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" };

const REQUEST_TIMEOUT = 20_000;
const CREATE_TIMEOUT = 30_000;
const POLL_TIMEOUT = 25_000;
const RESOLVE_TIMEOUT = 12_000;
const TRANSCODE_TIMEOUT = 30 * 60 * 1000;
const STV_MAX_WAIT = 25 * 60 * 1000;
const STV_POLL = 5_000;
const PROGRESS_EVERY = 120_000;

const PER_PAGE = 100;
const MAX_RESULTS = 8;

const MAX_VIDEO_MB = 14;
const MAX_DOC_MB = 64;

const IFRAME_RE = /<iframe[^>]+(?:src|data-src)=["']([^"']+)["']/i;
const YEAR_RE = /\((\d{4})\)/;
const IMG_RE = /<img[^>]+src=["']([^"']+)["']/i;
const PLAYER_URL_RE = /https?:\/\/[^"'\s<>]+\/(?:player|embed)\/[a-zA-Z0-9_-]+\/?/i;

const OG_TITLE_A = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i;
const OG_TITLE_B = /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i;
const TITLE_TAG_RE = /<title[^>]*>([^<]+)<\/title>/i;
const OG_IMAGE_RE = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i;

const PELIS182_LINK_RE = /https?:\/\/(?:[a-z0-9-]+\.)*pelis182\.net[^\s"'<>)]*/gi;
const PELIS182_TEST_RE = /https?:\/\/(?:[a-z0-9-]+\.)*pelis182\.net/i;
const PELIS182_HOST_RE = /(?:^|\.)pelis182\.net$/i;

const TMP_DIR = process.env.PELIS_TMP || join(process.cwd(), ".tmp", "pelis");
const lastSearches = new Map();
const inFlight = new Set();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log("[peli]", ...a);
const stripPelis182Links = (t) => String(t).replace(PELIS182_LINK_RE, "[enlace oculto]");

const decodeEntities = (s = "") => String(s)
  .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
  .replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&nbsp;/g, " ");

const cleanTitle = (s = "") => decodeEntities(s)
  .replace(/\s+/g, " ")
  .replace(/\s*[|·•–—]\s*(?:paulinito|pelis\w*|ver\s+online|pel[ií]cula\s+completa|online|gratis|hd|4k)\b.*$/i, "")
  .replace(/^\s*ver\s+/i, "")
  .trim();

/* ───────────── límite de tamaño de caché ───────────── */
async function capMap(map, max) {
  while (map.size > max) map.delete(map.keys().next().value);
  return map;
}

/* ───────────── FFMPEG ───────────── */
let _ffmpeg;
function ffmpegBin() {
  if (_ffmpeg !== undefined) return _ffmpeg;

  const candidates = [
    process.env.FFMPEG_PATH,
    process.env.PREFIX && join(process.env.PREFIX, "bin", "ffmpeg"),
    "/usr/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/opt/homebrew/bin/ffmpeg",
    "/snap/bin/ffmpeg",
  ].filter(Boolean);

  for (const p of candidates) if (existsSync(p)) return (_ffmpeg = p);

  try {
    const req = createRequire(import.meta.url);
    const bin = req("ffmpeg-static");
    if (bin && existsSync(bin)) return (_ffmpeg = bin);
  } catch { /* noop */ }

  throw new Error("ffmpeg no disponible. En Termux: pkg install ffmpeg");
}

const DUR_RE = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/;

async function probeDurationSec(file) {
  const parse = (txt) => {
    const m = DUR_RE.exec(txt || "");
    return m ? (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]) : null;
  };
  try {
    const { stderr } = await execFileAsync(ffmpegBin(), ["-hide_banner", "-i", file]);
    return parse(stderr);
  } catch (e) {
    return parse(e?.stderr);
  }
}

/* ───────────── UTILIDADES ───────────── */
function box(emoji, title, body = "", extra = []) {
  const lines = [`${emoji} *${title}*`];
  if (body) lines.push(body);
  for (const e of extra) lines.push(e);
  return lines.join("\n");
}

async function react(ctx, emoji) {
  try {
    if (ctx.sock?.sendMessage && ctx.msg?.key) {
      await ctx.sock.sendMessage(ctx.sender, { react: { text: emoji, key: ctx.msg.key } });
    }
  } catch { /* noop */ }
}

/* ───────────── MODELO ───────────── */
class Movie {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.year = data.year;
    this.slug = data.slug;
    this.url = data.url;
    this.playerUrl = data.playerUrl;
    this.image = data.image;
    this.categories = data.categories || [];
    this.source = data.source || "pelis182";
  }

  get hasPlayer() {
    return Boolean(this.playerUrl);
  }

  async download(outputPath, onProgress) {
    if (!this.playerUrl) throw new Error("La película no tiene reproductor");

    const stvHeaders = {
      "User-Agent": UA,
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: "https://www.savethevideo.com",
      Referer: "https://www.savethevideo.com/",
    };

    onProgress?.("🔄 Enviando a procesar...");
    log("creando task:", this.playerUrl);

    const createRes = await axios.post(
      `${STV_API}/tasks`,
      { url: this.playerUrl, type: "download" },
      { headers: stvHeaders, timeout: CREATE_TIMEOUT }
    );

    let task = createRes.data;
    if (!task?.id || !task?.href) {
      throw new Error(`Respuesta inesperada de savethevideo: ${JSON.stringify(task).slice(0, 200)}`);
    }
    log("task creada:", task.id, task.state);

    const start = Date.now();
    let last = "";

    while (task.state === "pending" || task.state === "progress") {
      if (Date.now() - start > STV_MAX_WAIT) throw new Error("Timeout esperando a savethevideo (25 min)");
      await sleep(STV_POLL);

      const poll = await axios.get(`${STV_API}${task.href}`, { headers: stvHeaders, timeout: POLL_TIMEOUT });
      task = poll.data;

      const p = task.result?.progress;
      if (p) {
        const line = `⏳ ${p.percent} | ETA ${p.eta}`;
        if (line !== last) { log(line); onProgress?.(line); last = line; }
      }
    }

    if (task.state !== "completed") throw new Error(`savethevideo terminó en: ${task.state}`);

    const files = (task.result?.files || []).filter((f) => f?.url);
    if (!files.length) throw new Error("savethevideo no devolvió archivos");

    for (const f of files) log(`  - ${f.filename} (${f.ext}, ${f.quality})`);

    const chosen = files.find((f) => f.ext?.toLowerCase() === "mp4")
      || files.find((f) => f.ext?.toLowerCase() === "mkv")
      || files[0];

    const ext = (chosen.ext || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
    let outPath = outputPath;
    if (!/\.(mp4|mkv)$/i.test(outPath)) outPath = `${outPath}.${ext}`;

    onProgress?.(`⬇️ Descargando ${ext.toUpperCase()}...`);
    log("descargando:", chosen.filename);

    const res = await axios.get(chosen.url, {
      responseType: "stream",
      timeout: 0,
      headers: { "User-Agent": UA },
    });

    const writer = createWriteStream(outPath);
    let bytes = 0;
    let lastLog = 0;
    res.data.on("data", (c) => {
      bytes += c.length;
      if (Date.now() - lastLog > 5000) {
        const mb = (bytes / 1048576).toFixed(1);
        log("descargado:", mb, "MB");
        onProgress?.(`⬇️ ${mb} MB...`);
        lastLog = Date.now();
      }
    });

    await pipeline(res.data, writer);
    const st = await stat(outPath);
    log("archivo:", outPath, (st.size / 1048576).toFixed(1), "MB");
    return outPath;
  }
}

/* ───────────── URL EXTERNA → PELÍCULA ───────────── */
function slugFromUrl(url) {
  try {
    const parts = new URL(url).pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    return decodeURIComponent(last).replace(/\.(mp4|mkv|html?)$/i, "");
  } catch {
    return "";
  }
}

async function resolveExternal(url) {
  const fallback = slugFromUrl(url).replace(/[-_]+/g, " ").trim() || "video";
  let title = fallback;
  let year = null;
  let image = null;
  let playerUrl = url;

  try {
    const r = await axios.get(url, {
      timeout: RESOLVE_TIMEOUT,
      responseType: "text",
      validateStatus: () => true,
      headers: HTML_HEADERS,
    });

    if (r.status === 200 && typeof r.data === "string") {
      const html = String(r.data).slice(0, 250_000);

      const og = OG_TITLE_A.exec(html) || OG_TITLE_B.exec(html);
      const tag = og ? og[1] : TITLE_TAG_RE.exec(html)?.[1];
      if (tag) {
        const t = cleanTitle(tag);
        if (t) title = t;
      }

      const ogi = OG_IMAGE_RE.exec(html);
      if (ogi) image = ogi[1];

      const iframe = IFRAME_RE.exec(html);
      if (iframe) {
        try { playerUrl = new URL(decodeEntities(iframe[1]), url).toString(); } catch { /* noop */ }
      }
    }
  } catch (e) {
    log("no se pudo leer la página, uso la URL tal cual:", e?.message);
  }

  const ym = YEAR_RE.exec(title);
  if (ym) { year = ym[1]; title = title.replace(YEAR_RE, "").trim(); }

  return new Movie({
    title: title || fallback,
    year,
    slug: slugFromUrl(url) || "video",
    url,
    playerUrl,
    image,
    categories: [],
    source: "directo",
  });
}

/* ───────────── PELIS182 (WordPress REST) ───────────── */
class Pelis182 {
  constructor() {
    this.axios = axios.create({ headers: DEFAULT_HEADERS, timeout: REQUEST_TIMEOUT });
    this._cats = null;
  }

  async _json(url, params) {
    try {
      const r = await this.axios.get(url, {
        params,
        timeout: REQUEST_TIMEOUT,
        transformResponse: (d) => { try { return JSON.parse(d); } catch { return d; } },
      });
      if (r.status === 404) return [];
      if (r.status !== 200) throw new Error(`HTTP ${r.status} en ${url}`);
      return Array.isArray(r.data) ? r.data : [r.data];
    } catch (e) {
      if (e?.response?.status === 404) return [];
      throw new Error(`Fallo de red en ${url}: ${e?.message ?? String(e)}`);
    }
  }

  async _one(url, params) {
    const a = await this._json(url, params);
    return a.length ? a[0] : null;
  }

  async _catMap() {
    if (this._cats) return this._cats;
    const data = await this._json(`${API_BASE}/categories`, { per_page: 100 });
    const map = new Map();
    for (const d of data) map.set(d.id, d.name);
    this._cats = map;
    return map;
  }

  async _toMovie(p) {
    const raw = p?.title?.rendered ?? "";
    const ym = YEAR_RE.exec(raw);
    const title = raw.replace(YEAR_RE, "").trim();
    const catMap = await this._catMap();
    const categories = (p?.categories || []).map((id) => catMap.get(id)).filter(Boolean);

    const html = p?.content?.rendered ?? "";
    let playerUrl = null;
    const iframe = IFRAME_RE.exec(html);
    if (iframe) playerUrl = iframe[1];
    if (!playerUrl) {
      const direct = PLAYER_URL_RE.exec(html);
      if (direct) playerUrl = direct[0];
    }

    let image = null;
    const fm = p?._embedded?.["wp:featuredmedia"];
    if (Array.isArray(fm) && fm[0]?.source_url) image = fm[0].source_url;
    if (!image) {
      const m = IMG_RE.exec(html);
      if (m) image = m[1];
    }

    return new Movie({
      id: p?.id, title, year: ym ? ym[1] : null, slug: p?.slug ?? "",
      url: p?.link ?? "", playerUrl, image, categories, source: "pelis182",
    });
  }

  async search(query, limit = MAX_RESULTS) {
    const data = await this._json(`${API_BASE}/posts`, {
      search: query, per_page: Math.min(limit, PER_PAGE), _embed: "true",
    });
    const out = [];
    for (const p of data.slice(0, limit)) out.push(await this._toMovie(p));
    return out;
  }

  async getMovie(slugOrUrl) {
    const isUrl = /^https?:\/\//i.test(slugOrUrl);

    if (isUrl) {
      let host = "";
      try { host = new URL(slugOrUrl).hostname; } catch { /* noop */ }

      if (PELIS182_HOST_RE.test(host)) {
        const slug = slugFromUrl(slugOrUrl);
        if (slug) {
          const post = await this._one(`${API_BASE}/posts`, { slug, _embed: "true" }).catch(() => null);
          if (post) return this._toMovie(post);
        }
        log("sin coincidencia en la API, uso la URL directa:", slugOrUrl);
      }

      return resolveExternal(slugOrUrl);
    }

    const slug = slugOrUrl.replace(/^\/+|\/+$/g, "").split("/").pop() ?? "";
    if (!slug) throw new Error(`No se pudo extraer slug de: ${slugOrUrl}`);

    const post = await this._one(`${API_BASE}/posts`, { slug, _embed: "true" });
    if (!post) throw new Error(`Película no encontrada: ${slug}`);
    return this._toMovie(post);
  }
}

/* ───────────── RESPALDO 123FLMSFREE ───────────── */
const FLIX_HOSTS = (process.env.FLIX_HOSTS || "ww1,ww2,ww3")
  .split(",").map((h) => h.trim()).filter(Boolean)
  .map((h) => `https://${h.replace(/^https?:\/\//, "")}.123flmsfree.com`);

const PROXIES = [
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
];

const DETAIL_RE = /\/([a-z]{2})\/detail\/(movie|serie|tv)\/([A-Za-z0-9]{8,32})-([^"'\s?#<>/)]+)/g;

async function flixFetch(url) {
  try {
    const d = await axios.get(url, {
      timeout: 6000, validateStatus: () => true, responseType: "text",
      headers: {
        "User-Agent": UA,
        "Accept-Language": "es-MX,es;q=0.9",
        Referer: `${FLIX_HOSTS[0]}/`,
      },
    });
    if (d.status === 200 && d.data?.length > 300) return { ok: true, body: String(d.data) };
  } catch { /* noop */ }

  for (const p of PROXIES) {
    try {
      const r = await axios.get(p(url), { timeout: 12000, validateStatus: () => true, responseType: "text" });
      if (r.status === 200 && typeof r.data === "string" && r.data.length > 300) return { ok: true, body: r.data };
    } catch { /* noop */ }
  }
  return { ok: false, body: "" };
}

const flixNorm = (s = "") => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

function flixScore(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const ta = new Set(a.split(" ")), tb = new Set(b.split(" "));
  let i = 0;
  for (const t of ta) if (tb.has(t)) i++;
  const jac = i / new Set([...ta, ...tb]).size;
  const inc = a.includes(b) || b.includes(a) ? 0.2 : 0;
  return jac + inc;
}

async function searchFlix(query) {
  const q = flixNorm(query);
  if (!q) return [];
  const paths = [
    (x) => `/es/search?keyword=${encodeURIComponent(x)}`,
    (x) => `/es/search?q=${encodeURIComponent(x)}`,
    (x) => `/es/buscar?q=${encodeURIComponent(x)}`,
  ];

  for (const build of paths) {
    for (const host of FLIX_HOSTS) {
      const r = await flixFetch(host + build(query));
      if (!r.ok) continue;

      const seen = new Map();
      for (const m of r.body.matchAll(DETAIL_RE)) {
        if (seen.has(m[3])) continue;
        seen.set(m[3], {
          id: m[3],
          slug: decodeURIComponent(m[4]).replace(/[).,;]+$/, ""),
          seg: m[2],
        });
      }
      if (!seen.size) continue;

      return [...seen.values()]
        .map((e) => ({ e, s: flixScore(q, flixNorm(e.slug.replace(/-/g, " "))) }))
        .filter((x) => x.s >= 0.5)
        .sort((a, b) => b.s - a.s)
        .slice(0, 4)
        .map(({ e }) => new Movie({
          title: e.slug.replace(/-/g, " "),
          slug: e.slug,
          url: `${host}/es/detail/${e.seg}/${e.id}-${e.slug}`,
          playerUrl: `${host}/es/detail/${e.seg}/${e.id}-${e.slug}/0`,
          categories: [],
          source: "flix",
        }));
    }
  }
  return [];
}

/* ───────────── DESCARGA + TRANSCODE ───────────── */
async function prepareForWhatsapp(src, onProgress) {
  const sizeMb = (await stat(src)).size / 1048576;
  if (sizeMb <= MAX_VIDEO_MB) return { path: src, sizeMb, mode: "video" };

  const dur = (await probeDurationSec(src)) || 6000;
  const budget = MAX_VIDEO_MB * 1048576 * 8 * 0.92;
  let vK = Math.floor(budget / dur / 1000) - 48;
  vK = Math.max(40, Math.min(vK, 2500));

  const scale = vK < 120 ? "480:-2" : vK < 400 ? "640:-2" : "854:-2";
  const fps = vK < 120 ? "15" : "24";
  const out = src.replace(/\.[^.]+$/, "") + "-wa.mp4";

  log(`transcodificando ${sizeMb.toFixed(0)}MB -> ${vK}k (dur ${Math.round(dur)}s, escala ${scale})`);
  onProgress?.(`📦 Comprimiendo a ~${MAX_VIDEO_MB}MB (${vK}k)...`);

  try {
    await execFileAsync(ffmpegBin(), [
      "-y", "-i", src,
      "-vf", `scale=${scale}`,
      "-r", fps,
      "-c:v", "libx264",
      "-b:v", `${vK}k`, "-maxrate", `${vK}k`, "-bufsize", `${vK * 2}k`,
      "-preset", "veryfast",
      "-c:a", "aac", "-b:a", "48k", "-ac", "2",
      "-movflags", "+faststart",
      out,
    ], { timeout: TRANSCODE_TIMEOUT, maxBuffer: 1024 * 1024 * 16 });
  } catch (e) {
    log("transcode falló:", e?.message);
    return { path: src, sizeMb, mode: sizeMb <= MAX_DOC_MB ? "document" : "toolarge" };
  }

  const finalMb = (await stat(out)).size / 1048576;
  await unlink(src).catch(() => {});
  log("resultado:", finalMb.toFixed(1), "MB");

  if (finalMb > MAX_DOC_MB) return { path: out, sizeMb: finalMb, mode: "toolarge" };
  return { path: out, sizeMb: finalMb, mode: finalMb <= MAX_VIDEO_MB ? "video" : "document" };
}

async function sendMedia(ctx, file, caption) {
  const name = `pelicula-${Date.now()}.mp4`;
  try {
    if (!ctx.sock?.sendMessage) return false;
    if (file.mode === "video") {
      await ctx.sock.sendMessage(ctx.sender, {
        video: { url: file.path }, caption, mimetype: "video/mp4",
      });
      return true;
    }
    await ctx.sock.sendMessage(ctx.sender, {
      document: { url: file.path }, caption, mimetype: "video/mp4", fileName: name,
    });
    return true;
  } catch (e) {
    log("envío falló:", e?.message);
    return false;
  }
}

/* ───────────── FORMATO ───────────── */
function formatMenu(results) {
  const lines = ["🎬 *Resultados*", ""];
  results.forEach((m, i) => {
    const year = m.year ? ` (${m.year})` : "";
    const cats = m.categories.slice(0, 3).join(", ");
    const tag = m.source === "flix" ? " · _flix_" : m.source === "directo" ? " · _directo_" : "";
    lines.push(`${i + 1}. *${m.title}*${year}${tag}`);
    if (cats) lines.push(`   🎭 ${cats}`);
    if (m.hasPlayer && !PELIS182_TEST_RE.test(m.playerUrl)) lines.push(`   🎥 ${m.playerUrl}`);
    lines.push("");
  });
  lines.push("📥 `.peli dl <n>` para que te la mande");
  lines.push("🔗 `.peli <n>` solo el enlace");
  return lines.join("\n");
}

async function sendLink(ctx, movie) {
  const hidden = !movie.playerUrl || PELIS182_TEST_RE.test(movie.playerUrl);
  if (hidden) {
    await ctx.say(box("⚠️", "SIN ENLACE", `No hay reproductor para *${movie.title}*.`));
    return react(ctx, "❌");
  }
  const extra = [];
  if (movie.year) extra.push(`📅 ${movie.year}`);
  if (movie.categories.length) extra.push(`🎭 ${movie.categories.join(" | ")}`);
  extra.push("", "🎥 *Míralo aquí:*", movie.playerUrl, "", "📥 `.peli dl <n>` para descargarla");
  await ctx.say(box("🎬", movie.title, "", extra));
  return react(ctx, "✅");
}

async function downloadAndSend(ctx, movie, index) {
  if (inFlight.has(ctx.sender)) {
    return ctx.say("⏳ Ya hay una descarga en curso en este chat.");
  }
  if (!movie.hasPlayer) {
    return ctx.say(box("❌", "SIN REPRODUCTOR", `*${movie.title}* no tiene fuente descargable.`));
  }

  inFlight.add(ctx.sender);

  const safe = (movie.slug || `peli-${Date.now()}`)
    .replace(/[^a-z0-9-]/gi, "")
    .slice(0, 60) || `peli-${Date.now()}`;
  const raw = join(TMP_DIR, safe);
  const produced = [];

  let lastNotice = 0;
  const onProgress = (line) => {
    const now = Date.now();
    if (now - lastNotice < PROGRESS_EVERY) return;
    lastNotice = now;
    ctx.say(line).catch(() => {});
  };

  try {
    await mkdir(TMP_DIR, { recursive: true });
    await ctx.say(box("📥", "DESCARGANDO",
      `*${movie.title}*${index ? ` (#${index})` : ""}\n\nEsto puede tardar varios minutos.`));
    await react(ctx, "⏳");

    const downloaded = await movie.download(raw, onProgress);
    produced.push(downloaded);

    const prepared = await prepareForWhatsapp(downloaded, onProgress);
    if (prepared.path !== downloaded) produced.push(prepared.path);

    if (prepared.mode === "toolarge") {
      await ctx.say(box("⚠️", "ARCHIVO MUY GRANDE",
        `Pesa ${prepared.sizeMb.toFixed(1)} MB y no baja de ${MAX_DOC_MB} MB.\nRuta: \`${prepared.path}\``));
      await react(ctx, "⚠️");
      return;
    }

    const caption = box("🎬", movie.title, movie.year ? `📅 ${movie.year}` : "",
      [`📦 ${prepared.sizeMb.toFixed(1)} MB`, "", "🎥 *Míralo aquí:*", movie.playerUrl]);

    const sent = await sendMedia(ctx, prepared, caption);
    if (!sent) {
      await ctx.say(box("⚠️", "SIN CANAL DE ENVÍO",
        `Listo en \`${prepared.path}\` (${prepared.sizeMb.toFixed(1)} MB), pero el bot no expone \`sock\`.`));
      await react(ctx, "⚠️");
      return;
    }
    await react(ctx, "✅");
  } catch (e) {
    log("error de descarga:", e?.message);
    await ctx.say(box("❌", "FALLÓ LA DESCARGA", stripPelis182Links(e?.message || "error").slice(0, 400)));
    await react(ctx, "❌");
  } finally {
    inFlight.delete(ctx.sender);
    setTimeout(() => {
      for (const p of produced) unlink(p).catch(() => {});
    }, 5 * 60 * 1000).unref?.();
  }
}

/* ───────────── COMANDO ───────────── */
const pelis = new Pelis182();

export default {
  names: [".peli", ".pelicula", ".peliculas", ".pelis", ".cine", ".movie"],
  usage: ".peli <título>",
  desc: "Busca películas y te da el enlace o la descarga",
  category: "Descargas",

  handler: async (raw) => {
    const { sender, cleanText, reply } = raw;

    const say = async (text) => {
      try {
        await reply({ text, mentions: [sender] });
      } catch {
        await reply(text);
      }
    };

    const ctx = { ...raw, say };

    const args = cleanText.trim().split(/\s+/).slice(1);

    const sub = args[0]?.toLowerCase();
    const isDl = ["dl", "d", "descargar", "bajar"].includes(sub);
    if (isDl) args.shift();

    const flag = args[0]?.startsWith("--") ? args.shift().toLowerCase() : null;
    const arg = args.join(" ").trim();

    if (flag === "--stats") {
      return say(box("📊", "ESTADO",
        `Chats en memoria: ${lastSearches.size}`,
        [`Hosts flix: ${FLIX_HOSTS.length}`, `Descargas activas: ${inFlight.size}`]));
    }

    if (flag === "--clear") {
      lastSearches.clear();
      return say("🧹 Memoria de búsquedas borrada.");
    }

    if (!arg) {
      return say(box("🎬", "PELÍCULAS",
        "📌 Uso:",
        [
          "• `.peli <nombre>` → buscar",
          "• `.peli <n>` → enlace del resultado N",
          "• `.peli dl <n>` → descargar y enviar el N",
          "• `.peli dl <url>` → descargar desde un enlace directo",
          "• `.peli <url|slug>` → enlace directo",
          "",
          "Ejemplos: `.peli moana` · `.peli dl 1` · `.peli dl https://...`",
        ]));
    }

    await react(ctx, "⏳");

    try {
      const n = parseInt(arg, 10);

      if (!isNaN(n) && String(n) === arg) {
        const last = lastSearches.get(sender);
        if (!last?.length) return say("❌ No hay búsqueda previa. Usa `.peli <nombre>`.");
        const movie = last[n - 1];
        if (!movie) return say(`❌ Solo hay ${last.length} resultados.`);
        if (isDl) return downloadAndSend(ctx, movie, n);
        return sendLink(ctx, movie);
      }

      if (/^https?:\/\//i.test(arg) || /pelis182\.net/i.test(arg)) {
        const target = /^https?:\/\//i.test(arg) ? arg : `https://${arg.replace(/^\/+/, "")}`;
        await say("🔍 Obteniendo...");
        const movie = await pelis.getMovie(target);
        if (isDl) return downloadAndSend(ctx, movie);
        return sendLink(ctx, movie);
      }

      await say(`🔍 Buscando: "${arg}"...`);

      let results = [];
      try {
        results = await pelis.search(arg, MAX_RESULTS);
      } catch (e) {
        log("pelis182 falló:", e?.message);
      }

      if (!results.length) results = await searchFlix(arg);

      if (!results.length) {
        await react(ctx, "❌");
        return say("❌ No encontré nada con ese nombre.");
      }

      lastSearches.set(sender, results);
      await capMap(lastSearches, 200);

      if (isDl) return downloadAndSend(ctx, results[0], 1);

      await say(formatMenu(results));
      await react(ctx, "✅");
    } catch (e) {
      await react(ctx, "❌");
      await say(box("❌", "ERROR", stripPelis182Links(e?.message || "desconocido").slice(0, 400)));
    }
  },
};
