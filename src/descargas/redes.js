import axios from "axios";
import { AsyncLocalStorage } from "async_hooks";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";
import {
  descargarBuffer,
  asegurarVideoCompatibleWhatsApp,
  asegurarImagenCompatibleWhatsApp,
  LIMITE_VIDEO_WHATSAPP_MB,
  AGENTES,
  esErrorTransitorio,
  errorAmigable
} from "./core.js";

export { descargarBuffer, asegurarVideoCompatibleWhatsApp, asegurarImagenCompatibleWhatsApp, LIMITE_VIDEO_WHATSAPP_MB };

const execFileAsync = promisify(execFile);

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
};

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Registro en consola: cuánto tardó cada descarga y con qué motor/API se logró ──
const contextoMotor = new AsyncLocalStorage();
const anotar = (motor) => { const c = contextoMotor.getStore(); if (c) c.motor = motor; };
function medido(red, fn) {
  return async (...args) => {
    const c = { motor: null };
    const t0 = Date.now();
    const seg = () => ((Date.now() - t0) / 1000).toFixed(1);
    try {
      const r = await contextoMotor.run(c, () => fn(...args));
      console.log(`[${red}] ✅ listo en ${seg()}s · motor: ${c.motor || "desconocido"} · ${r.length} archivo(s)`);
      return r;
    } catch (e) {
      console.log(`[${red}] ❌ falló tras ${seg()}s · ${String(e.message).split("\n")[0]}`);
      throw e;
    }
  };
}

// ───────────────────────── yt-dlp (motor principal para Instagram, Facebook y Reddit) ─────────────────────────
// Instalación: pip install -U "yt-dlp[default,curl-cffi]"   (curl-cffi lo exige Instagram)
// Cuida la RAM del teléfono: solo corre YTDLP_SIMULTANEAS procesos a la vez (los demás esperan turno) y todo va a disco.
// Opcional: si defines la variable de entorno YTDLP_COOKIES con la ruta de un cookies.txt, se usa para contenido que pide sesión.
const YTDLP_SIMULTANEAS = 1;
let ytdlpActivos = 0;
const ytdlpEspera = [];

function esperarTurno() {
  return new Promise((resolver) => {
    if (ytdlpActivos < YTDLP_SIMULTANEAS) { ytdlpActivos++; resolver(); }
    else ytdlpEspera.push(resolver);
  });
}
function liberarTurno() {
  const siguiente = ytdlpEspera.shift();
  if (siguiente) siguiente(); // el turno pasa directo al siguiente de la fila
  else ytdlpActivos--;
}

let ytdlpDisponible = null;
export async function hayYtdlp() {
  if (ytdlpDisponible !== null) return ytdlpDisponible;
  try {
    await execFileAsync("yt-dlp", ["--version"], { timeout: 15000 });
    ytdlpDisponible = true;
  } catch (e) {
    if (e.code === "ENOENT") {
      ytdlpDisponible = false;
      console.log('[redes] yt-dlp no está instalado (pip install -U "yt-dlp[default,curl-cffi]"); se usan los métodos de respaldo');
    }
    return false;
  }
  return ytdlpDisponible;
}

const EXT_VIDEO = new Set(["mp4", "mkv", "webm", "mov", "m4v"]);
const EXT_IMAGEN = new Set(["jpg", "jpeg", "png", "webp"]);

function explicarErrorYtdlp(texto, expirado) {
  if (expirado) return "La descarga tardó demasiado y se canceló.";
  if (/impersonat|curl.?cffi/i.test(texto)) {
    return 'A yt-dlp le falta "curl-cffi" (lo exige Instagram). Instálalo con: pip install -U "yt-dlp[default,curl-cffi]"';
  }
  if (/login|log in|cookies|rate-limit|sign in|empty media response/i.test(texto)) {
    return "La plataforma pidió iniciar sesión (contenido privado o bloqueo temporal). Intenta más tarde.";
  }
  if (/private|unavailable|removed|not available|does not exist|deleted/i.test(texto)) {
    return "Ese contenido es privado o ya no existe.";
  }
  if (/no video|no media|unsupported url/i.test(texto)) {
    return "Ese enlace no tiene un video descargable.";
  }
  return "No se pudo descargar ese contenido.";
}

function borrarPrefijo(base) {
  try {
    for (const n of fs.readdirSync(os.tmpdir())) {
      if (n.startsWith(base)) { try { fs.unlinkSync(path.join(os.tmpdir(), n)); } catch (err) {} }
    }
  } catch (err) {}
}

// Devuelve [{ type, ruta }] con los archivos descargados (quien los reciba debe borrarlos).
export async function descargarConYtdlp(link, { playlist = false, maxItems = 10 } = {}) {
  if (!(await hayYtdlp())) throw new Error("yt-dlp no está instalado");

  const base = `rs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const args = [
    "--quiet", "--no-warnings",
    playlist ? "--yes-playlist" : "--no-playlist",
    "-I", `1:${maxItems}`,
    "--socket-timeout", "30",
    "--retries", "5",
    "--fragment-retries", "5",
    "--http-chunk-size", "10M",
    "-N", "4",
    "--max-filesize", `${Number(process.env.YTDLP_MAX_MB) || 600}M`,
    "-S", "res:720,vcodec:h264",
    "-f", "bv*+ba/b",
    "--merge-output-format", "mp4"
  ];
  const cookies = process.env.YTDLP_COOKIES;
  if (cookies && fs.existsSync(cookies)) args.push("--cookies", cookies);
  args.push("-o", path.join(os.tmpdir(), `${base}_%(autonumber)02d.%(ext)s`), link);

  await esperarTurno();
  try {
    await execFileAsync("yt-dlp", args, { timeout: 300000, killSignal: "SIGKILL", maxBuffer: 1024 * 1024 });
  } catch (e) {
    borrarPrefijo(base);
    const crudo = String(e.stderr || e.message || "").trim().split("\n").filter(Boolean).pop() || "error desconocido";
    console.log(`[redes] yt-dlp falló: ${crudo}`);
    throw new Error(explicarErrorYtdlp(crudo, e.killed));
  } finally {
    liberarTurno();
  }

  const archivos = [];
  for (const nombre of fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith(base)).sort()) {
    const ruta = path.join(os.tmpdir(), nombre);
    const ext = nombre.split(".").pop().toLowerCase();
    if (EXT_VIDEO.has(ext)) archivos.push({ type: "video", ruta });
    else if (EXT_IMAGEN.has(ext)) archivos.push({ type: "image", ruta });
    else { try { fs.unlinkSync(ruta); } catch (err) {} } // restos (.part, .json, audio suelto…)
  }
  if (!archivos.length) throw new Error("No se encontró ningún archivo descargable en ese enlace.");
  return archivos;
}

const ytdlpMedias = async (link, opciones) => {
  const r = (await descargarConYtdlp(link, opciones)).map((a) => ({ type: a.type, ruta: a.ruta }));
  anotar("yt-dlp");
  return r;
};

// ───────────────────────── Utilidades ─────────────────────────
function recortar(texto, maximo) {
  const t = String(texto || "").replace(/[*_~`]/g, "").replace(/\s+/g, " ").trim();
  return t.length > maximo ? `${t.slice(0, maximo - 1)}…` : t;
}
const compacto = (n) => new Intl.NumberFormat("en", { notation: "compact" }).format(Number(n) || 0);

function decodificarEntidades(s) {
  return String(s).replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
}

// Búsqueda web para plataformas sin búsqueda pública (Instagram, Facebook): primero DuckDuckGo y, si no alcanza o lo bloquean, Bing.
// Cada motor devuelve la lista de URLs reales que encontró en la página.
async function motorDuckDuckGo(consulta) {
  const { data: html } = await axios.post(
    "https://html.duckduckgo.com/html/",
    new URLSearchParams({ q: consulta }).toString(),
    { headers: { ...HEADERS, "Content-Type": "application/x-www-form-urlencoded", "Accept-Language": "es-MX,es;q=0.9" }, timeout: 15000 }
  );
  const urls = [];
  for (const m of String(html).matchAll(/href="([^"]*uddg=[^"]+)"/g)) {
    const u = decodificarEntidades(m[1]).match(/[?&]uddg=([^&]+)/);
    if (!u) continue;
    try { urls.push(decodeURIComponent(u[1])); } catch (e) { /* enlace dañado */ }
  }
  return urls;
}

async function motorBing(consulta) {
  const { data: html } = await axios.get("https://www.bing.com/search", {
    params: { q: consulta, count: 30, setlang: "es" },
    headers: { ...HEADERS, "Accept-Language": "es-MX,es;q=0.9" },
    timeout: 15000
  });
  const urls = [];
  for (const m of String(html).matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    let url = decodificarEntidades(m[1]);
    // Bing esconde el destino real en el parámetro u=a1<base64>.
    const envuelto = url.match(/^https?:\/\/(?:www\.)?bing\.com\/ck\/a\?.*?[?&]u=a1([^&]+)/);
    if (envuelto) {
      try { url = Buffer.from(envuelto[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"); } catch (e) { continue; }
    }
    urls.push(url);
  }
  return urls;
}

const MOTORES_WEB = [["DuckDuckGo", motorDuckDuckGo], ["Bing", motorBing]];
const motorCaidoHasta = new Map(); // un motor que no trajo nada (captcha) o falló se salta 10 minutos
const ESPERA_MOTOR_CAIDO_MS = 10 * 60 * 1000;

// consultas: una búsqueda o una lista de variantes (se prueban en orden hasta juntar suficientes enlaces).
async function buscarEnlacesWeb(consultas, normalizar, maximo) {
  const lista = Array.isArray(consultas) ? consultas : [consultas];
  const errores = [];
  const vistos = new Set();
  const enlaces = [];
  let respondio = false;

  for (const consulta of lista) {
    for (const [nombre, motor] of MOTORES_WEB) {
      if ((motorCaidoHasta.get(nombre) || 0) > Date.now()) continue;
      try {
        const urls = await motor(consulta);
        let nuevos = 0;
        for (const url of urls) {
          const canonico = normalizar(url);
          if (canonico && !vistos.has(canonico)) { vistos.add(canonico); enlaces.push(canonico); nuevos++; }
        }
        console.log(`[redes] ${nombre}: ${urls.length} enlaces en la página, ${nuevos} útiles para "${consulta}"`);
        if (urls.length) respondio = true;
        else motorCaidoHasta.set(nombre, Date.now() + ESPERA_MOTOR_CAIDO_MS);
      } catch (e) {
        errores.push(`${nombre}: ${String(e.message).split("\n")[0]}`);
        motorCaidoHasta.set(nombre, Date.now() + ESPERA_MOTOR_CAIDO_MS);
        console.log(`[redes] ${nombre} falló: ${e.message}`);
      }
      if (enlaces.length >= maximo) break;
    }
    if (enlaces.length >= maximo) break;
  }

  if (!enlaces.length && !respondio) {
    throw new Error(
      errores.length
        ? `Los buscadores web no respondieron (${[...new Set(errores)].join("; ")}).`
        : "Los buscadores web no están respondiendo en este momento; intenta en unos minutos."
    );
  }
  return enlaces.slice(0, maximo);
}

const SIN_BUSQUEDA_PUBLICA =
  "No encontré videos para esa búsqueda. Instagram y Facebook no tienen búsqueda pública, así que funciona mucho mejor con un enlace directo.";

// ───────────────────────── X (Twitter) ─────────────────────────
function extraerTweetId(link) {
  const m = link.match(/(?:twitter|x)\.com\/[^/?#]+\/status(?:es)?\/(\d+)/i);
  return m ? m[1] : null;
}
const tokenTweet = (id) => ((Number(id) / 1e15) * Math.PI).toString(6 ** 2).replace(/(0+|\.)/g, "");

function mejorMp4(variantes) {
  return (variantes || [])
    .filter((v) => (v.type || v.content_type) === "video/mp4" && (v.src || v.url))
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
}

async function _obtenerMediaTwitter(link) {
  const id = extraerTweetId(link);
  if (!id) throw new Error("Ese link no parece ser de un tweet/post de X valido.");

  let data = null;
  try {
    ({ data } = await axios.get("https://cdn.syndication.twimg.com/tweet-result", {
      params: { id, lang: "es", token: tokenTweet(id) },
      headers: HEADERS,
      timeout: 15000
    }));
  } catch (e) {
    console.log(`[redes] Syndication de X falló: ${e.message}`);
  }

  const medias = [];
  for (const m of data?.mediaDetails || []) {
    if (m.type === "photo" && m.media_url_https) {
      medias.push({ type: "image", url: m.media_url_https });
    } else if (m.video_info) {
      const v = mejorMp4(m.video_info.variants);
      if (v) medias.push({ type: "video", url: v.url || v.src });
    }
  }
  if (!medias.length && data?.video) {
    const v = mejorMp4(data.video.variants);
    if (v) medias.push({ type: "video", url: v.src || v.url });
  }
  if (!medias.length && data?.photos) {
    for (const foto of data.photos) medias.push({ type: "image", url: foto.url });
  }
  if (medias.length) { anotar("syndication de X"); return medias.slice(0, 10); }

  if (await hayYtdlp()) {
    try { return await ytdlpMedias(link, { playlist: true }); } catch (e) { /* se informa abajo */ }
  }
  throw new Error("Ese tweet no tiene foto ni video, o es privado.");
}

// ───────────────────────── TikTok (tikwm; yt-dlp como respaldo) ─────────────────────────
const TIKWM = "https://www.tikwm.com";
// Los mismos encabezados que usa la propia página de tikwm: sin ellos puede responder 403.
const cabecerasTikwm = (base) => ({
  ...HEADERS,
  Accept: "application/json, text/javascript, */*; q=0.01",
  Origin: base,
  Referer: `${base}/`,
  "X-Requested-With": "XMLHttpRequest"
});
const absoluta = (u) => (!u ? null : String(u).startsWith("/") ? `${TIKWM}${u}` : u);

// Datos para la tarjeta (el comando los convierte al mismo estilo de texto que .play).
function segundosAReloj(n) {
  const t = Math.round(Number(n) || 0);
  return t > 0 ? `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}` : "";
}
function camposTikTok(v, enlace) {
  // El usuario se deja tal cual (los guiones bajos son parte del nombre); solo se limpia el espacio sobrante.
  const autor = String(v.author?.unique_id || v.author?.nickname || "").replace(/\s+/g, " ").trim().slice(0, 30);
  const fecha = v.create_time ? new Date(Number(v.create_time) * 1000).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "";
  return [
    ["💭", "Título", recortar(v.title, 120)],
    ["👤", "Autor", autor ? `@${autor}` : ""],
    ["⏳", "Duración", segundosAReloj(v.duration)],
    ["👁️", "Vistas", v.play_count ? compacto(v.play_count) : ""],
    ["❤️", "Likes", v.digg_count ? compacto(v.digg_count) : ""],
    ["📆", "Fecha - publicación", fecha],
    ["🔗", "Link del video", enlace]
  ];
}

// Pide algo a tikwm. Reintenta si responde 408/429/5xx, se corta la conexión o dice que va muy rápido (1 petición por segundo).
async function pedirTikwm(ruta, params, metodo = "GET", base = TIKWM) {
  let ultimo = null;
  for (let intento = 0; intento < 3; intento++) {
    try {
      const { data } = metodo === "POST"
        ? await axios.post(`${base}${ruta}`, new URLSearchParams(params).toString(), {
            ...AGENTES,
            headers: { ...cabecerasTikwm(base), "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
            timeout: 25000
          })
        : await axios.get(`${base}${ruta}`, { ...AGENTES, params, headers: cabecerasTikwm(base), timeout: 25000 });

      if (data?.code === 0 && data.data) return data.data;
      if (/limit/i.test(String(data?.msg))) { ultimo = new Error("TikTok limitó las peticiones, intenta de nuevo en unos segundos."); await pausa(1400); continue; }
      throw new Error(data?.msg || "TikTok no devolvió datos."); // video privado, borrado, etc.: no tiene caso reintentar
    } catch (e) {
      ultimo = e;
      if (!esErrorTransitorio(e)) throw e;
      console.log(`[redes] tikwm ${ruta} (${base.replace("https://", "")}) falló: ${String(e.response?.status ? `HTTP ${e.response.status}` : e.message).split("\n")[0]}; reintento ${intento + 1}/2`);
      await pausa(1200 * (intento + 1));
    }
  }
  throw errorAmigable(ultimo || new Error("TikTok no respondió."));
}

// Enlaces del video (sin marca de agua): "play" (H264) primero y "hdplay" de respaldo. Si el CDN de uno da 408/403, se usa el otro.
function enlacesVideoTikTok(v) {
  return [...new Set([v.play, v.hdplay].filter(Boolean).map(absoluta))];
}
const tituloTikTok = (v, id) => recortar(v.title, 50) || (v.author?.unique_id ? `tiktok-${v.author.unique_id}` : `tiktok-${id || Date.now()}`);
function videoTikTok(v, enlace) {
  const urls = enlacesVideoTikTok(v);
  return { type: "video", url: urls[0], urls, titulo: tituloTikTok(v, v.id || v.video_id), campos: camposTikTok(v, enlace) };
}

// Respaldo con btch-downloader (ya está en package.json). Tolera cambios en la forma de la respuesta.
function enlacesDe(valor, salida = []) {
  if (!valor) return salida;
  if (typeof valor === "string") { if (/^https?:\/\//i.test(valor)) salida.push(valor); }
  else if (Array.isArray(valor)) valor.forEach((x) => enlacesDe(x, salida));
  else if (typeof valor === "object") Object.values(valor).forEach((x) => enlacesDe(x, salida));
  return salida;
}
async function tiktokConBtch(link) {
  const modulo = await import("btch-downloader");
  const ttdl = modulo.ttdl || modulo.default?.ttdl;
  if (typeof ttdl !== "function") throw new Error("btch-downloader no incluye ttdl");
  const r = await Promise.race([ttdl(link), pausa(30000).then(() => { throw new Error("btch-downloader no respondió en 30s"); })]);
  const urls = enlacesDe(r?.video ?? r?.result?.video ?? r?.data?.video).filter((u) => !/\.(jpe?g|png|webp)(\?|$)/i.test(u));
  if (!urls.length) throw new Error("btch-downloader no devolvió video");
  return [{ type: "video", url: urls[0], urls: [...new Set(urls)].slice(0, 3), titulo: recortar(r?.title, 50) || "tiktok", campos: [["💭", "Título", recortar(r?.title, 120)], ["🔗", "Link del video", link]] }];
}

// Acepta videos, fotos (slideshows) e historias. Prefiere "play" (H264, más ligero) antes que "hdplay" (suele ser HEVC y pesa más).
async function _obtenerMediaTikTok(link) {
  let errorApi = null;

  // 1) tikwm (dos dominios). Es rápido y devuelve video, fotos e historias.
  for (const base of [TIKWM, "https://tikwm.com"]) {
    try {
      const info = await pedirTikwm("/api/", { url: link, hd: 1 }, "GET", base);
      anotar(`tikwm${base === TIKWM ? "" : " (dominio alterno)"}`);
      if (info.images?.length) {
        return info.images.slice(0, 10).map((u, i) => ({ type: "image", url: absoluta(u), campos: i === 0 ? camposTikTok(info, link) : undefined }));
      }
      if (!enlacesVideoTikTok(info).length) throw new Error("No se encontro el video de ese TikTok.");
      return [videoTikTok(info, link)];
    } catch (e) {
      errorApi = errorApi || e;
      console.log(`[redes] tikwm (${base.replace("https://", "")}) falló para ${link}: ${String(e.message).split("\n")[0]}`);
      if (/private|privado|not exist|removed|deleted|unavailable/i.test(String(e.message))) break; // no es culpa del servicio
    }
  }

  // 2) btch-downloader
  try {
    const r = await tiktokConBtch(link);
    anotar("btch-downloader");
    return r;
  } catch (e) {
    console.log(`[redes] btch-downloader falló: ${String(e.message).split("\n")[0]}`);
  }

  // 3) yt-dlp
  if (await hayYtdlp()) {
    try { return await ytdlpMedias(link); } catch (e) { /* se informa el error de la API */ }
  }
  throw errorApi || new Error("No se pudo obtener ese TikTok.");
}

// La búsqueda de tikwm a veces responde 403 según el método o el dominio: se prueban las 4 variantes y se recuerda la que sirve.
const VARIANTES_BUSQUEDA_TIKWM = [["POST", "https://www.tikwm.com"], ["GET", "https://www.tikwm.com"], ["POST", "https://tikwm.com"], ["GET", "https://tikwm.com"]];
let varianteTikwm = null;

async function buscarEnTikwm(consulta, cantidad, detalle) {
  const params = { keywords: consulta, count: Math.min(30, cantidad + 5), cursor: 0, web: 1, hd: 1 };
  const variantes = varianteTikwm ? [varianteTikwm] : VARIANTES_BUSQUEDA_TIKWM;
  const fallos = [];
  for (const [metodo, base] of variantes) {
    try {
      const data = await pedirTikwm("/api/feed/search", params, metodo, base);
      varianteTikwm = [metodo, base];
      detalle?.push(`${metodo} ${base.replace("https://", "")}: ok`);
      return data;
    } catch (e) {
      varianteTikwm = null;
      fallos.push(`${metodo} ${base.replace("https://", "")}: ${String(e.message).replace("Request failed with status code ", "HTTP ")}`);
    }
  }
  detalle?.push(...fallos);
  throw new Error(`tikwm bloqueó la búsqueda (${fallos.join("; ")})`);
}

const enlaceDeVideoTikTok = (v) => {
  const usuario = v.author?.unique_id || v.author?.id;
  const id = v.video_id || v.aweme_id || v.id;
  return usuario && id ? `https://www.tiktok.com/@${usuario}/video/${id}` : "";
};

// Últimos videos de una cuenta (usuario, @usuario o enlace del perfil). Primero tikwm; si lo bloquea, yt-dlp lista los enlaces.
export async function buscarCuentaTikTok(entrada, cantidad) {
  const usuario = String(entrada).trim().replace(/^https?:\/\/(?:www\.)?tiktok\.com\//i, "").replace(/^@/, "").split(/[/?#]/)[0].replace(/^@/, "");
  if (!/^[\w.\-]{2,40}$/.test(usuario)) throw new Error("Escribe el nombre de usuario de la cuenta, por ejemplo: .tt2 usuario");

  const fallos = [];
  for (const [metodo, base] of VARIANTES_BUSQUEDA_TIKWM) {
    try {
      const data = await pedirTikwm("/api/user/posts", { unique_id: usuario, count: Math.min(30, cantidad + 5), cursor: 0, web: 1, hd: 1 }, metodo, base);
      const lista = (data.videos || [])
        .filter((v) => v.play || v.hdplay)
        .slice(0, cantidad + 3)
        .map((v) => {
          const completo = { ...v, author: v.author || { unique_id: usuario } };
          return videoTikTok(completo, enlaceDeVideoTikTok(completo) || `https://www.tiktok.com/@${usuario}`);
        });
      if (lista.length) return lista;
      fallos.push(`${metodo} ${base.replace("https://", "")}: sin videos`);
      break; // respondió bien pero la cuenta no tiene videos públicos
    } catch (e) {
      fallos.push(`${metodo} ${base.replace("https://", "")}: ${String(e.message).replace("Request failed with status code ", "HTTP ")}`);
    }
  }
  console.log(`[redes] tikwm (cuenta @${usuario}) falló: ${fallos.join("; ")}`);

  // Respaldo: yt-dlp lista los enlaces del perfil y cada video se baja con tikwm (uno por segundo).
  if (await hayYtdlp()) {
    try {
      const enlaces = (await listarEnlacesYtdlp(`https://www.tiktok.com/@${usuario}`, cantidad + 3)).filter((u) => /tiktok\.com/i.test(u));
      if (enlaces.length) {
        return enlaces.map((link) => ({
          type: "video",
          resolver: async () => {
            await pausa(1200);
            return (await obtenerMediaTikTok(link)).filter((m) => m.type === "video").slice(0, 1);
          }
        }));
      }
    } catch (e) {
      console.log(`[redes] yt-dlp no pudo listar @${usuario}: ${String(e.stderr || e.message).trim().split("\n").pop()}`);
    }
  }
  throw new Error(`No pude leer los videos de @${usuario}. TikTok bloquea esa consulta desde esta conexión, o la cuenta es privada o no existe.`);
}

const normalizarTikTok = (url) => {
  const m = url.match(/tiktok\.com\/(@[\w.\-]+)\/video\/(\d+)/i);
  return m ? `https://www.tiktok.com/${m[1]}/video/${m[2]}` : null;
};

// APIs de terceros (las mismas que usan los comandos del otro bot). Se prueban una tras otra y se usa la primera que responda con videos.
const API_FAA = "https://api-faa.my.id";
// Claves de Fer (con su permiso). Si quieres cambiarlas sin tocar el código: STELLARWA_KEY y APICAUSAS_KEY.
const KEY_STELLAR = process.env.STELLARWA_KEY || "api-7dSKm";
const KEY_CAUSAS = process.env.APICAUSAS_KEY || "oboe";

async function buscarEnlacesTikTokApis(consulta, maximo) {
  const intentos = [
    ["FAA", async () => {
      const { data } = await axios.get(`${API_FAA}/faa/tiktok-search`, { params: { q: consulta }, headers: HEADERS, timeout: 20000 });
      return (data?.result || []).map((v) => (v.author?.username && v.id ? `https://www.tiktok.com/@${v.author.username}/video/${v.id}` : null));
    }]
  ];
  for (const [nombre, intento] of intentos) {
    try {
      const enlaces = (await intento()).filter((u) => typeof u === "string" && /tiktok\.com/i.test(u));
      if (enlaces.length) return enlaces.slice(0, maximo);
      console.log(`[redes] ${nombre} (búsqueda TikTok): sin resultados`);
    } catch (e) {
      console.log(`[redes] ${nombre} (búsqueda TikTok) falló: ${String(e.message).replace("Request failed with status code ", "HTTP ")}`);
    }
  }
  return [];
}

export async function buscarTikTok(consulta, cantidad) {
  let errorApi = null;
  try {
    const data = await buscarEnTikwm(consulta, cantidad);
    const lista = (data.videos || [])
      .filter((v) => v.play || v.hdplay)
      .slice(0, cantidad + 3) // unos extra por si alguno pesa demasiado
      .map((v) => videoTikTok(v, enlaceDeVideoTikTok(v)));
    if (lista.length) return lista;
  } catch (e) {
    errorApi = e;
    console.log(`[redes] La búsqueda de tikwm falló (${e.message}); se prueba con el buscador web`);
  }

  // Respaldo: buscar enlaces de TikTok (APIs de terceros, luego buscadores web) y bajar cada uno (tikwm, y yt-dlp si tikwm falla).
  let enlaces = await buscarEnlacesTikTokApis(consulta, cantidad * 2);
  if (!enlaces.length) enlaces = await buscarEnlacesWeb([`${consulta} site:tiktok.com/@ video`, `${consulta} tiktok site:tiktok.com`], normalizarTikTok, cantidad * 2).catch(() => []);
  if (!enlaces.length) {
    throw new Error(errorApi
      ? "TikTok bloqueó la búsqueda desde esta conexión (HTTP 403). Envía el enlace del video con .tt <enlace>."
      : "No encontré videos de TikTok para esa búsqueda.");
  }
  return enlaces.map((link) => ({
    type: "video",
    resolver: async () => {
      await pausa(1200); // la API gratuita de tikwm permite 1 petición por segundo
      return (await obtenerMediaTikTok(link)).filter((m) => m.type === "video").slice(0, 1);
    }
  }));
}

// ───────────────────────── Facebook ─────────────────────────
async function _obtenerMediaFacebook(link) {
  let errorYt = null;
  if (await hayYtdlp()) {
    try { return await ytdlpMedias(link); } catch (e) { errorYt = e; }
  }

  try {
    const { data: html } = await axios.get(link, { headers: HEADERS, timeout: 15000 });
    const hd = html.match(/"browser_native_hd_url":"([^"]+)"/);
    const sd = html.match(/"browser_native_sd_url":"([^"]+)"/);
    const crudo = (hd || sd)?.[1];
    if (!crudo) throw new Error("No se pudo encontrar el video (puede ser privado, o el link no es de un video).");
    anotar("HTML directo de Facebook");
    return [{ type: "video", url: crudo.replace(/\\u0025/g, "%").replace(/\\\//g, "/") }];
  } catch (e) {
    throw errorYt && !/no está instalado/.test(errorYt.message) ? errorYt : e;
  }
}

const normalizarFacebook = (url) => {
  const m = url.match(/^https?:\/\/(?:[\w-]+\.)?(?:facebook\.com\/(?:reel\/\d+|watch\/?\?v=\d+|[\w.\-]+\/videos\/(?:[\w.\-]+\/)?\d+)|fb\.watch\/[\w-]+)/i);
  return m ? m[0] : null;
};

export async function buscarFacebook(consulta, cantidad) {
  const enlaces = await buscarEnlacesWeb(
    [`${consulta} site:facebook.com/reel`, `${consulta} site:facebook.com/watch`, `${consulta} site:facebook.com videos`],
    normalizarFacebook,
    cantidad * 2
  );
  if (!enlaces.length) throw new Error(SIN_BUSQUEDA_PUBLICA);
  return enlaces.map((link) => ({
    type: "video",
    resolver: async () => (await obtenerMediaFacebook(link)).filter((m) => m.type === "video").slice(0, 1).map((m) => ({ ...m, campos: [["🔗", "Link del video", link]] }))
  }));
}

// ───────────────────────── Instagram (reels, posts, carruseles) ─────────────────────────
// Respaldo por API (ASTA). La clave es tuya; también se puede definir con la variable ASTA_API_KEY.
const ASTA_URL = process.env.ASTA_API_URL || "https://astabot.hidenplay.net/api/v1/dl/instagram";
const KEY_ASTA = process.env.ASTA_API_KEY || "ASTA-7C5O6EF95JIHVZTWNZ55";
const IGNORAR_CLAVES = /thumb|cover|avatar|profile|pic_url|preview|icon/i;

function enlacesDeJson(nodo, clave = "", salida = []) {
  if (!nodo) return salida;
  if (typeof nodo === "string") {
    if (/^https?:\/\//i.test(nodo) && !IGNORAR_CLAVES.test(clave) && !salida.some((x) => x.url === nodo)) {
      salida.push({ url: nodo, video: /\.mp4(\?|$)|\/video\/|video|reel/i.test(nodo + clave) });
    }
  } else if (Array.isArray(nodo)) {
    nodo.forEach((x) => enlacesDeJson(x, clave, salida));
  } else if (typeof nodo === "object") {
    for (const [k, v] of Object.entries(nodo)) if (!IGNORAR_CLAVES.test(k)) enlacesDeJson(v, k, salida);
  }
  return salida;
}

// La API responde con el archivo directo (se guarda en disco, nunca en memoria) o con un JSON con enlaces.
async function instagramConAsta(link) {
  const res = await axios.get(ASTA_URL, {
    params: { url: link, key: KEY_ASTA },
    responseType: "stream",
    timeout: 20000, // si la API no responde en 20 s, se pasa al siguiente motor
    validateStatus: () => true
  });
  const tipo = String(res.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
  // No se corta por duración total (un video largo tarda más): solo si la API deja de enviar datos 20 s, o pasa de 3 minutos.
  let inactividad = null;
  const armar = () => { clearTimeout(inactividad); inactividad = setTimeout(() => res.data.destroy(new Error("la API dejó de enviar datos")), 20000); };
  armar();
  res.data.on("data", armar);
  const limite = setTimeout(() => res.data.destroy(new Error("la API tardó demasiado")), 180000);

  try {
    if (res.status === 200 && (tipo.startsWith("video/") || tipo.startsWith("image/"))) {
      const esVideo = tipo.startsWith("video/");
      const ext = esVideo ? "mp4" : (tipo.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const ruta = path.join(os.tmpdir(), `asta-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`);
      try {
        await new Promise((ok, fallo) => {
          const w = fs.createWriteStream(ruta);
          res.data.on("error", fallo);
          w.on("error", fallo);
          w.on("finish", ok);
          res.data.pipe(w);
        });
      } catch (e) {
        try { fs.unlinkSync(ruta); } catch (err) {}
        throw e;
      }
      anotar("ASTA");
      return [{ type: esVideo ? "video" : "image", ruta }];
    }

    let texto = "";
    for await (const trozo of res.data) {
      texto += trozo;
      if (texto.length > 1024 * 1024) break;
    }
    let datos = null;
    try { datos = JSON.parse(texto); } catch (e) {}
    if (res.status !== 200 || datos?.status === false || datos?.success === false || datos?.error) {
      throw new Error(datos?.message || datos?.error || datos?.msg || `la API respondió HTTP ${res.status}`);
    }
    if (!datos) throw new Error("la API devolvió algo que no es un video ni una imagen");
    const medias = enlacesDeJson(datos?.result ?? datos?.data ?? datos).slice(0, 10);
    if (!medias.length) throw new Error("la API no encontró contenido en ese enlace");
    anotar("ASTA");
    return medias.map((m) => ({ type: m.video ? "video" : "image", url: m.url }));
  } finally {
    clearTimeout(limite);
    clearTimeout(inactividad);
  }
}

async function _obtenerMediaInstagram(link) {
  // Reels y videos: la API de ASTA es lo más rápido (una petición, sin procesos, poca RAM).
  // Publicaciones (/p/): pueden ser carruseles con varias fotos; yt-dlp las trae completas, así que va primero.
  const esReel = /instagram\.com\/(?:[\w.]+\/)?(?:reel|reels|tv)\//i.test(link);
  let errorAsta = null;
  let errorYt = null;

  const conAsta = async () => {
    try { return await instagramConAsta(link); } catch (e) {
      errorAsta = e;
      console.log(`[redes] ASTA (Instagram) falló: ${String(e.message).split("\n")[0]}`);
      return null;
    }
  };
  const conYtdlp = async () => {
    if (!(await hayYtdlp())) return null;
    try { return await ytdlpMedias(link, { playlist: true, maxItems: 10 }); } catch (e) { errorYt = e; return null; }
  };

  for (const motor of esReel ? [conAsta, conYtdlp] : [conYtdlp, conAsta]) {
    const r = await motor();
    if (r?.length) return r;
  }

  // Último respaldo: el motor anterior (descargas/instagram.js).
  try {
    const viejo = await import("./instagram.js");
    if (typeof viejo.obtenerMediaInstagram === "function") {
      const resultado = await Promise.race([
        viejo.obtenerMediaInstagram(link),
        pausa(20000).then(() => { throw new Error("el motor anterior tardó demasiado"); })
      ]);
      if (Array.isArray(resultado) && resultado.length) { anotar("motor anterior"); return resultado; }
    }
  } catch (e) {
    console.log(`[redes] Motor anterior de Instagram no disponible: ${String(e.message).split("\n")[0]}`);
  }

  throw errorYt || errorAsta || new Error("No se pudo obtener ese contenido de Instagram.");
}

const normalizarInstagram = (url) => {
  const m = url.match(/instagram\.com\/(?:[\w.]+\/)?(reel|reels|tv)\/([\w-]+)/i);
  return m ? `https://www.instagram.com/${m[1].toLowerCase() === "tv" ? "tv" : "reel"}/${m[2]}/` : null;
};

// Instagram no deja buscar sin sesión: aquí se usa la sesión (cookies.txt) que se define en YTDLP_COOKIES.
// Se busca por cuenta: ".ig usuario" (o texto, y se toma la cuenta que mejor coincida) y se mandan sus últimos reels.
const MENSAJE_SIN_COOKIES =
  "Para buscar en Instagram el bot necesita una sesión. Exporta las cookies de una cuenta de Instagram (de preferencia secundaria) a un cookies.txt y define YTDLP_COOKIES con su ruta.";

function leerCookiesInstagram() {
  const ruta = process.env.YTDLP_COOKIES;
  if (!ruta || !fs.existsSync(ruta)) return null;
  const cookies = {};
  for (const linea of fs.readFileSync(ruta, "utf8").split(/\r?\n/)) {
    const l = linea.replace(/^#HttpOnly_/, "");
    if (!l || l.startsWith("#")) continue;
    const c = l.split("\t");
    if (c.length >= 7 && /instagram\.com/i.test(c[0])) cookies[c[5]] = c[6];
  }
  return cookies.sessionid ? cookies : null;
}

async function usuarioDeInstagram(consulta, cookies) {
  const limpio = consulta.trim().replace(/^@/, "");
  if (/^[\w.]{2,30}$/.test(limpio)) return limpio; // ya es un nombre de usuario

  const { data } = await axios.get("https://www.instagram.com/web/search/topsearch/", {
    params: { query: consulta, context: "blended" },
    headers: {
      ...HEADERS,
      "X-IG-App-ID": "936619743392459",
      "X-CSRFToken": cookies.csrftoken || "",
      Cookie: Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ")
    },
    timeout: 15000
  });
  const usuario = (data?.users || []).map((u) => u.user).find((u) => u && !u.is_private);
  if (!usuario?.username) throw new Error("No encontré ninguna cuenta pública con ese nombre.");
  return usuario.username;
}

async function listarEnlacesYtdlp(url, maximo) {
  await esperarTurno();
  try {
    const args = ["--quiet", "--no-warnings", "--flat-playlist", "--print", "url", "-I", `1:${maximo}`, "--socket-timeout", "20"];
    if (process.env.YTDLP_COOKIES && fs.existsSync(process.env.YTDLP_COOKIES)) args.push("--cookies", process.env.YTDLP_COOKIES);
    args.push(url);
    const { stdout } = await execFileAsync("yt-dlp", args, { timeout: 90000, killSignal: "SIGKILL", maxBuffer: 1024 * 1024 });
    return stdout.split("\n").map((x) => x.trim()).filter((x) => /^https?:\/\//.test(x));
  } finally {
    liberarTurno();
  }
}

export async function buscarInstagram(consulta, cantidad) {
  const cookies = leerCookiesInstagram();
  if (!cookies) throw new Error(MENSAJE_SIN_COOKIES);
  if (!(await hayYtdlp())) throw new Error("yt-dlp no está instalado");

  let usuario;
  try {
    usuario = await usuarioDeInstagram(consulta, cookies);
  } catch (e) {
    const http = e.response?.status;
    console.log(`[redes] Búsqueda de cuenta en Instagram falló: ${http ? `HTTP ${http}` : e.message}`);
    throw new Error(http === 401 || http === 403 || http === 429
      ? "Instagram rechazó la sesión o limitó las peticiones. Revisa que el cookies.txt siga vigente, o prueba con el nombre exacto de la cuenta."
      : e.message);
  }

  let enlaces;
  try {
    enlaces = await listarEnlacesYtdlp(`https://www.instagram.com/${usuario}/`, cantidad * 2 + 2);
  } catch (e) {
    console.log(`[redes] No se pudo listar @${usuario}: ${String(e.stderr || e.message).trim().split("\n").pop()}`);
    throw new Error(`No se pudieron leer las publicaciones de @${usuario} (cuenta privada, sesión vencida o límite de Instagram).`);
  }
  if (!enlaces.length) throw new Error(`@${usuario} no tiene publicaciones visibles.`);

  return enlaces.map((link) => ({
    type: "video",
    resolver: async () => (await obtenerMediaInstagram(link)).filter((m) => m.type === "video").slice(0, 1).map((m) => ({ ...m, campos: [["👤", "Cuenta", `@${usuario}`], ["🔗", "Link", link]] }))
  }));
}

// ───────────────────────── Pinterest ─────────────────────────
// .pin saca IMÁGENES (y videos de pines que lo sean) con varias fuentes en cascada: si una está bloqueada desde tu conexión
// (Pinterest suele dar 403 a servidores), pasa a la siguiente. Cada línea de consola dice qué fuente funcionó.
//
// Pinterest responde 403 a las peticiones sin la cookie y el encabezado csrftoken: se obtienen visitando la portada.
let sesionPinterest = null;
async function obtenerSesionPinterest() {
  if (sesionPinterest && sesionPinterest.expira > Date.now()) return sesionPinterest;
  const r = await axios.get("https://www.pinterest.com/", { ...AGENTES, headers: CABECERAS_NAVEGADOR, timeout: 15000, validateStatus: () => true });
  const cookies = (r.headers?.["set-cookie"] || []).map((c) => c.split(";")[0]);
  const csrf = cookies.find((c) => c.startsWith("csrftoken="))?.split("=")[1] || null;
  sesionPinterest = { cookie: cookies.join("; "), csrf, expira: Date.now() + 20 * 60 * 1000 };
  return sesionPinterest;
}

async function pinterestApi(recurso, sourceUrl, datos, reintento = true) {
  const sesion = await obtenerSesionPinterest().catch(() => ({ cookie: "", csrf: null }));
  try {
    const { data } = await axios.get(`https://www.pinterest.com/resource/${recurso}/get/`, {
      ...AGENTES,
      params: { source_url: sourceUrl, data: JSON.stringify(datos) },
      headers: {
        ...HEADERS,
        Accept: "application/json, text/javascript, */*, q=0.01",
        "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
        "X-Requested-With": "XMLHttpRequest",
        "X-Pinterest-AppState": "active",
        "X-Pinterest-Source-Url": sourceUrl,
        Referer: `https://www.pinterest.com${sourceUrl}`,
        ...(sesion.cookie ? { Cookie: sesion.cookie } : {}),
        ...(sesion.csrf ? { "X-CSRFToken": sesion.csrf } : {})
      },
      timeout: 20000
    });
    const respuesta = data?.resource_response?.data;
    if (!respuesta) throw new Error("Pinterest respondió sin datos");
    return respuesta;
  } catch (e) {
    sesionPinterest = null; // la próxima vez se pide una sesión nueva
    if (reintento && esErrorTransitorio(e) || reintento && /403|401/.test(String(e.message))) return pinterestApi(recurso, sourceUrl, datos, false);
    throw e;
  }
}

// ── Utilidades de imágenes de Pinterest ──
// Una imagen de pinimg.com existe en varios tamaños con la misma ruta. Se intenta primero la de mayor calidad y se baja de
// escalón si esa no existe (así nunca se manda una miniatura si hay una grande disponible).
const TAMANOS_PIN = ["originals", "1200x", "736x", "564x", "474x"];
function variantesPinimg(url) {
  const m = String(url).match(/^(https:\/\/i\.pinimg\.com\/)(originals|\d+x\d*(?:_RS)?)(\/.+)$/i);
  if (!m) return [url];
  return [...new Set([...TAMANOS_PIN.map((t) => `${m[1]}${t}${m[3]}`), url])];
}
const idImagenPin = (url) => String(url).split("/").pop().split(".")[0].split("?")[0];
const esPinimg = (url) => /^https:\/\/i\.pinimg\.com\//i.test(String(url));
const imagenPin = (url) => ({ type: "image", url: variantesPinimg(url)[0], urls: variantesPinimg(url) });

function elegirVideoPinterest(videos) {
  const entradas = Object.values(videos?.video_list || {}).filter((v) => v?.url);
  const mp4 = entradas
    .filter((v) => /\.mp4(\?|$)/i.test(v.url))
    .sort((a, b) => (b.height || 0) - (a.height || 0));
  const elegido = mp4.find((v) => (v.height || 0) <= 720) || mp4[0];
  if (elegido) return elegido.url;
  return entradas.find((v) => /\.m3u8/i.test(v.url))?.url || null; // envio.js sabe bajar HLS con ffmpeg
}

function urlImagenDePin(pin) {
  return pin?.images?.orig?.url || pin?.images?.["1200x"]?.url || pin?.images?.["736x"]?.url || pin?.images?.["564x"]?.url || pin?.images?.["474x"]?.url || null;
}

function mediaDePin(pin, { soloImagen = false } = {}) {
  if (!soloImagen) {
    const video = elegirVideoPinterest(pin?.videos || pin?.story_pin_data?.pages?.[0]?.blocks?.[0]?.video?.video_list && { video_list: pin.story_pin_data.pages[0].blocks[0].video.video_list });
    if (video) return { type: "video", url: video };
  }
  const imagen = urlImagenDePin(pin);
  return imagen ? imagenPin(imagen) : null;
}

const CABECERAS_NAVEGADOR = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none"
};

// ── gallery-dl (opcional): herramienta local que lee Pinterest por su cuenta. Instalación: pip install -U gallery-dl ──
let galleryDlDisponible = null;
async function enlacesConGalleryDl(url, maximo) {
  if (galleryDlDisponible === false) return [];
  await esperarTurno(); // comparte la fila con yt-dlp: un proceso pesado a la vez
  try {
    const args = ["-g", "--range", `1-${maximo}`, url];
    if (process.env.YTDLP_COOKIES && fs.existsSync(process.env.YTDLP_COOKIES)) args.unshift("--cookies", process.env.YTDLP_COOKIES);
    const { stdout } = await execFileAsync("gallery-dl", args, { timeout: 60000, killSignal: "SIGKILL", maxBuffer: 1024 * 1024 });
    return stdout.split("\n").map((l) => l.trim().replace(/^\|\s*/, "")).filter((l) => /^https?:\/\//i.test(l));
  } catch (e) {
    if (e.code === "ENOENT") {
      galleryDlDisponible = false;
      console.log("[redes] gallery-dl no está instalado (pip install -U gallery-dl); se omite");
    } else {
      console.log(`[redes] gallery-dl (Pinterest) falló: ${String(e.stderr || e.message).trim().split("\n").pop()}`);
    }
    return [];
  } finally {
    liberarTurno();
  }
}

// ───────────── Un pin por enlace ─────────────
function sacarDeHtmlPin(html) {
  const texto = String(html).replace(/\\u002F/g, "/").replace(/\\\//g, "/");

  // Video: la página lista las calidades (V_720P, V_EXP7…) como archivos .mp4 en v1.pinimg.com
  const mp4 = [...new Set([...texto.matchAll(/https:\/\/v\d*\.pinimg\.com\/videos\/[^"'\\\s<>]+?\.mp4/gi)].map((m) => m[0]))];
  if (mp4.length) {
    const altura = (u) => Number(u.match(/\/(\d{3,4})p\//)?.[1] || 0);
    mp4.sort((a, b) => altura(b) - altura(a));
    return { type: "video", url: mp4.find((u) => altura(u) <= 720) || mp4[0] };
  }

  // Imagen: la del og:image es la del pin (la primera "originals" del HTML también suele serlo).
  const og =
    texto.match(/<meta[^>]+(?:property|name)="og:image"[^>]+content="([^"]+)"/i)?.[1] ||
    texto.match(/<meta[^>]+content="([^"]+)"[^>]+(?:property|name)="og:image"/i)?.[1];
  const original = texto.match(/https:\/\/i\.pinimg\.com\/originals\/[\w\/]+?\.(?:jpg|jpeg|png|webp|gif)/i)?.[0];
  const imagen = [og, original].find((u) => u && esPinimg(decodificarEntidades(u)));
  return imagen ? imagenPin(decodificarEntidades(imagen)) : null;
}

async function _obtenerMediaPinterest(link) {
  let destino = link;
  if (/pin\.it/i.test(link)) {
    try {
      const r = await axios.get(link, { ...AGENTES, headers: CABECERAS_NAVEGADOR, timeout: 15000, maxRedirects: 5 });
      destino = r.request?.res?.responseUrl || r.request?._redirectable?._currentUrl || link;
    } catch (e) { /* se intenta con el enlace original */ }
  }
  const id = destino.match(/\/pin\/(?:[\w-]+--)?(\d+)/)?.[1];

  // 1) API interna de Pinterest (da todos los tamaños y los videos).
  if (id) {
    try {
      const pin = await pinterestApi("PinResource", `/pin/${id}/`, { options: { id, field_set_key: "detailed" }, context: {} });
      const media = mediaDePin(pin);
      if (media) { anotar("API de Pinterest"); return [media]; }
    } catch (e) {
      console.log(`[redes] API de Pinterest falló: ${String(e.message).split("\n")[0]}`);
    }
  }

  // 2) La página del pin, leída como un navegador y, si no, como el robot de Pinterest.
  const identidades = [CABECERAS_NAVEGADOR, { ...CABECERAS_NAVEGADOR, "User-Agent": "Mozilla/5.0 (compatible; Pinterestbot/1.0; +http://www.pinterest.com/bot.html)" }];
  for (const cabeceras of identidades) {
    try {
      const { data: html } = await axios.get(destino, { ...AGENTES, headers: cabeceras, timeout: 20000, maxRedirects: 5 });
      const media = sacarDeHtmlPin(html);
      if (media) { anotar("página del pin"); return [media]; }
    } catch (e) {
      console.log(`[redes] Página del pin falló: ${String(e.message).replace("Request failed with status code ", "HTTP ")}`);
    }
  }

  // 3) yt-dlp (videos) y gallery-dl (imágenes), si están instalados.
  if (await hayYtdlp()) {
    try { return await ytdlpMedias(destino); } catch (e) { /* se prueba lo siguiente */ }
  }
  const enlaces = (await enlacesConGalleryDl(destino, 1)).filter((u) => /pinimg\.com/i.test(u));
  if (enlaces.length) {
    anotar("gallery-dl");
    return enlaces.slice(0, 1).map((u) => (/\.(mp4|m3u8)(\?|$)/i.test(u) ? { type: "video", url: u } : esPinimg(u) ? imagenPin(u) : { type: "image", url: u }));
  }
  throw new Error("No se pudo encontrar imagen ni video en ese pin (puede ser privado o Pinterest bloqueó esta conexión).");
}

// ───────────── Búsqueda de imágenes ─────────────
// Fuente 1: la API interna de Pinterest (la mejor: trae pines reales con todos los tamaños).
async function imagenesApiPinterest(consulta, maximo) {
  const r = await pinterestApi(
    "BaseSearchResource",
    `/search/pins/?q=${encodeURIComponent(consulta)}&rs=typed`,
    { options: { query: consulta, scope: "pins", rs: "typed", bookmarks: [] }, context: {} }
  );
  return (r?.results || [])
    .filter((pin) => !pin.videos && !pin.story_pin_data) // los pines de video se quedan fuera: aquí se buscan imágenes
    .map(urlImagenDePin)
    .filter(Boolean)
    .slice(0, maximo);
}

// Fuente 2: la página pública de búsqueda (lo mismo que ve un navegador sin sesión).
async function imagenesPinterestHtml(consulta, maximo) {
  const { data: html } = await axios.get("https://www.pinterest.com/search/pins/", {
    ...AGENTES,
    params: { q: consulta, rs: "typed" },
    headers: CABECERAS_NAVEGADOR,
    timeout: 20000,
    maxContentLength: 8 * 1024 * 1024
  });
  const texto = String(html).replace(/\\u002F/g, "/").replace(/\\\//g, "/");
  const urls = [];
  // Solo tamaños de pin (avatares y miniaturas diminutas como /75x75_RS/ no coinciden).
  for (const m of texto.matchAll(/https:\/\/i\.pinimg\.com\/(?:originals|1200x|736x|564x|474x|236x)\/[\w\/]+?\.(?:jpg|jpeg|png|webp)/gi)) urls.push(m[0]);
  return urls.slice(0, maximo * 3);
}

// Fuente 3: Bing Imágenes limitado a pinterest.com (devuelve las imágenes de i.pinimg.com sin necesidad de claves).
async function imagenesBing(consulta, maximo) {
  const { data: html } = await axios.get("https://www.bing.com/images/search", {
    ...AGENTES,
    params: { q: `site:pinterest.com ${consulta}`, form: "HDRSC2", first: 1, count: 35, setlang: "es" },
    headers: { ...CABECERAS_NAVEGADOR, "Sec-Fetch-Dest": "document" },
    timeout: 20000
  });
  const urls = [];
  for (const m of String(html).matchAll(/murl&quot;:&quot;(https?:[^&]+?)&quot;/g)) urls.push(decodificarEntidades(m[1]));
  return urls.filter(esPinimg).slice(0, maximo * 3);
}

// Fuente 4: DuckDuckGo Imágenes (pide primero un código "vqd" y luego la lista).
async function imagenesDuckDuckGo(consulta, maximo) {
  const q = `site:pinterest.com ${consulta}`;
  const { data: portada } = await axios.get("https://duckduckgo.com/", {
    ...AGENTES,
    params: { q, iax: "images", ia: "images" },
    headers: CABECERAS_NAVEGADOR,
    timeout: 15000
  });
  const vqd = String(portada).match(/vqd=["']?([\d-]+)["']?/)?.[1];
  if (!vqd) throw new Error("DuckDuckGo no entregó el código de búsqueda");
  const { data } = await axios.get("https://duckduckgo.com/i.js", {
    ...AGENTES,
    params: { l: "us-en", o: "json", q, vqd, f: ",,,,,", p: "1" },
    headers: { ...HEADERS, Referer: "https://duckduckgo.com/", Accept: "application/json, text/javascript, */*; q=0.01", "X-Requested-With": "XMLHttpRequest" },
    timeout: 15000
  });
  return (data?.results || []).map((r) => r.image).filter(esPinimg).slice(0, maximo * 3);
}

// Fuente 5: gallery-dl (si está instalado).
async function imagenesGalleryDl(consulta, maximo) {
  const urls = await enlacesConGalleryDl(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(consulta)}`, maximo + 3);
  return urls.filter((u) => /pinimg\.com/i.test(u));
}

// Fuente 6: APIs de terceros (las mismas del otro bot).
async function imagenesApisTerceros(consulta, maximo) {
  const q = encodeURIComponent(consulta);
  const apis = [
    ["StellarWA", `https://api.stellarwa.xyz/search/pinterest?query=${q}&key=${KEY_STELLAR}`, (r) => r.data?.data || r.data],
    ["Api Causas", `https://rest.apicausas.xyz/api/v1/buscadores/pinterest?apikey=${KEY_CAUSAS}&q=${q}`, (r) => r.data]
  ];
  for (const [nombre, url, sacar] of apis) {
    try {
      const { data } = await axios.get(url, { ...AGENTES, headers: HEADERS, timeout: 20000 });
      const urls = (sacar(data) || []).map((item) => item.hd || item.image || item.image_small || (typeof item === "string" ? item : null)).filter(Boolean);
      if (urls.length) return urls.slice(0, maximo * 3);
      console.log(`[redes] ${nombre} (búsqueda Pinterest): sin resultados`);
    } catch (e) {
      console.log(`[redes] ${nombre} (búsqueda Pinterest) falló: ${String(e.message).replace("Request failed with status code ", "HTTP ")}`);
    }
  }
  return [];
}

const FUENTES_PINTEREST = [
  ["API de Pinterest", imagenesApiPinterest],
  ["página de búsqueda", imagenesPinterestHtml],
  ["Bing Imágenes", imagenesBing],
  ["DuckDuckGo Imágenes", imagenesDuckDuckGo],
  ["gallery-dl", imagenesGalleryDl],
  ["APIs de terceros", imagenesApisTerceros]
];

// Devuelve imágenes (hasta cantidad + 3, por si alguna no se puede bajar). Se recorren las fuentes en orden hasta juntar suficientes.
export async function buscarPinterest(consulta, cantidad) {
  const meta = cantidad + 3;
  const vistos = new Set();
  const medias = [];
  const usadas = [];
  const fallos = [];

  for (const [nombre, fuente] of FUENTES_PINTEREST) {
    if (medias.length >= meta) break;
    try {
      const urls = await fuente(consulta, meta);
      let nuevas = 0;
      for (const url of urls) {
        const clave = idImagenPin(url);
        if (!clave || vistos.has(clave) || medias.length >= meta) continue;
        vistos.add(clave);
        medias.push(esPinimg(url) ? imagenPin(url) : { type: "image", url });
        nuevas++;
      }
      console.log(`[redes] Pinterest · ${nombre}: ${urls.length} imágenes, ${nuevas} nuevas para "${consulta}"`);
      if (nuevas) usadas.push(nombre);
    } catch (e) {
      const motivo = String(e.response?.status ? `HTTP ${e.response.status}` : e.message).split("\n")[0];
      fallos.push(`${nombre}: ${motivo}`);
      console.log(`[redes] Pinterest · ${nombre} falló: ${motivo}`);
    }
  }

  if (usadas.length) anotar(usadas.join(" + "));
  if (!medias.length) {
    throw new Error(fallos.length
      ? `No pude sacar imágenes de Pinterest (${fallos.slice(0, 3).join("; ")}). Prueba con otras palabras o con el enlace del pin: .pin <enlace>.`
      : "No encontré imágenes en Pinterest para esa búsqueda. Prueba con otras palabras.");
  }
  return medias;
}

// ───────────────────────── Reddit ─────────────────────────
async function _obtenerMediaReddit(link) {
  let errorYt = null;
  if (await hayYtdlp()) {
    try { return await ytdlpMedias(link); } catch (e) { errorYt = e; } // yt-dlp junta el audio y el video por sí solo
  }

  let real = link;
  if (/redd\.it|\/s\//i.test(link)) {
    try {
      const r = await axios.get(link, { headers: HEADERS, timeout: 15000, maxRedirects: 5, validateStatus: () => true });
      real = r.request?.res?.responseUrl || link;
    } catch (e) { /* se intenta con el enlace original */ }
  }

  let post;
  try {
    const { data } = await axios.get(real.split("?")[0].replace(/\/?$/, ".json"), {
      params: { raw_json: 1 },
      headers: HEADERS,
      timeout: 15000
    });
    post = data?.[0]?.data?.children?.[0]?.data;
  } catch (e) {
    throw errorYt || e;
  }
  if (!post) throw errorYt || new Error("No se pudo leer ese post de Reddit.");

  const medias = [];
  if (post.is_gallery && post.gallery_data?.items) {
    for (const it of post.gallery_data.items.slice(0, 10)) {
      const url = post.media_metadata?.[it.media_id]?.s?.u;
      if (url) medias.push({ type: "image", url });
    }
  } else if (post.secure_media?.reddit_video?.fallback_url) {
    medias.push({ type: "video", url: post.secure_media.reddit_video.fallback_url }); // sin audio: último recurso
  } else if (post.url && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(post.url)) {
    medias.push({ type: "image", url: post.url });
  }

  if (!medias.length) {
    throw errorYt || new Error("Ese post no tiene un video o imagen descargable directamente (puede ser un link externo o solo texto).");
  }
  anotar("Reddit .json");
  return medias;
}

// Compatibilidad con el código anterior (devolvía un Buffer). Ya no se usa en los comandos.
export async function obtenerVideoReddit(link) {
  const [m] = await obtenerMediaReddit(link);
  let buffer;
  if (m.ruta) {
    buffer = fs.readFileSync(m.ruta);
    try { fs.unlinkSync(m.ruta); } catch (e) {}
  } else {
    buffer = await descargarBuffer(m.url);
  }
  return { type: m.type, buffer };
}

// ───────────────────────── Diagnóstico (.diagred) ─────────────────────────
// Prueba cada servicio y devuelve una línea por prueba, para saber exactamente qué falla desde tu red.
const dominiosFrecuentes = (urls) => {
  const cuenta = {};
  for (const u of urls) {
    try { const h = new URL(u).hostname.replace(/^www\./, ""); cuenta[h] = (cuenta[h] || 0) + 1; } catch (e) { /* url inválida */ }
  }
  return Object.entries(cuenta).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([h, n]) => `${h}×${n}`).join(", ") || "ninguno";
};

export async function diagnosticarRedes() {
  const lineas = [];
  const probar = async (nombre, fn) => {
    const t0 = Date.now();
    try {
      const resultado = await fn();
      lineas.push(`✅ ${nombre}: ${resultado} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    } catch (e) {
      lineas.push(`❌ ${nombre}: ${String(e.message).split("\n")[0].slice(0, 200)}`);
    }
  };

  const TIKTOK_PRUEBA = "https://www.tiktok.com/@scout2015/video/6718335390845095173";

  await probar("yt-dlp", async () => {
    const { stdout } = await execFileAsync("yt-dlp", ["--version"], { timeout: 15000 });
    return `versión ${stdout.trim()}`;
  });
  await probar("TikTok enlace (tikwm)", async () => {
    const info = await pedirTikwm("/api/", { url: TIKTOK_PRUEBA, hd: 1 });
    return info.play || info.hdplay ? "devolvió el video" : "respondió sin video";
  });

  // Búsqueda de tikwm: cada variante por separado
  const detalle = [];
  await probar("TikTok búsqueda (tikwm)", async () => {
    const data = await buscarEnTikwm("mambo", 3, detalle);
    return `${(data.videos || []).length} videos [${detalle.join(" | ")}]`;
  });
  if (detalle.length) lineas.push(`   variantes: ${detalle.join(" | ")}`);

  // Buscadores web: cuántos enlaces útiles dan para cada red
  const pruebas = [
    ["TikTok", "mambo site:tiktok.com/@ video", normalizarTikTok],
    ["Instagram", "mambo site:instagram.com/reel", normalizarInstagram],
    ["Facebook", "mambo site:facebook.com/reel", normalizarFacebook]
  ];
  for (const [nombreMotor, motor] of MOTORES_WEB) {
    for (const [red, consulta, normalizar] of pruebas) {
      await probar(`${nombreMotor} → ${red}`, async () => {
        const urls = await motor(consulta);
        if (!urls.length) throw new Error("la página no trajo enlaces (captcha o bloqueo)");
        const utiles = urls.filter((u) => normalizar(u)).length;
        return `${utiles} útiles de ${urls.length} [${dominiosFrecuentes(urls)}]`;
      });
    }
  }

  await probar("Pinterest sesión", async () => {
    sesionPinterest = null;
    const ses = await obtenerSesionPinterest();
    return ses.csrf ? "csrftoken obtenido" : "sin csrftoken";
  });
  await probar("Pinterest búsqueda", async () => {
    const r = await pinterestApi(
      "BaseSearchResource",
      "/search/videos/?q=gatos&rs=typed",
      { options: { query: "gatos", scope: "videos", rs: "typed", bookmarks: [] }, context: {} }
    );
    return `${(r?.results || []).length} resultados`;
  });

  for (const [nombre, fuente] of FUENTES_PINTEREST) {
    await probar(`Pinterest imágenes · ${nombre}`, async () => `${(await fuente("gatos", 5)).length} imágenes`);
  }

  await probar("Búsqueda completa de TikTok (.tt mambo)", async () => {
    const medias = await buscarTikTok("mambo", 2);
    return `${medias.length} candidatos, vía ${medias[0]?.resolver ? "buscador web" : "tikwm"}`;
  });

  return lineas;
}

// Versiones con registro de tiempo y motor (las que usan los comandos).
export const obtenerMediaTwitter = medido("X", _obtenerMediaTwitter);
export const obtenerMediaTikTok = medido("TikTok", _obtenerMediaTikTok);
export const obtenerMediaFacebook = medido("Facebook", _obtenerMediaFacebook);
export const obtenerMediaInstagram = medido("Instagram", _obtenerMediaInstagram);
export const obtenerMediaPinterest = medido("Pinterest", _obtenerMediaPinterest);
export const obtenerMediaReddit = medido("Reddit", _obtenerMediaReddit);
