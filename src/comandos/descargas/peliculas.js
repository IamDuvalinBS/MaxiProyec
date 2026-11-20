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

const REQUEST_TIMEOUT = 20_000;
const CREATE_TIMEOUT = 30_000;
const POLL_TIMEOUT = 25_000;
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

const PELIS182_LINK_RE = /https?:\/\/(?:[a-z0-9-]+\.)*pelis182\.net[^\s"'<>)]*/gi;
const PELIS182_TEST_RE = /https?:\/\/(?:[a-z0-9-]+\.)*pelis182\.net/i;

const TMP_DIR = process.env.PELIS_TMP || join(process.cwd(), ".tmp", "pelis");
const lastSearches = new Map();
const inFlight = new Set();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log("[peli]", ...a);
const stripPelis182Links = (t) => String(t).replace(PELIS182_LINK_RE, "[enlace oculto]");

/* ───────────── capMap OPCIONAL ───────────── */
let _capMap = null;
async function capMap(map, max) {
  if (_capMap === null) {
    try {
      const m = await import("../../core/memGuard.js");
      _capMap = typeof m.capMap === "function" ? m.capMap : false;
    } catch {
      log("memGuard.js no encontrado, uso recorte local");
      _capMap = false;
    }
  }
  if (_capMap) return _capMap(map, max);
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
    this.source = data.source ||
