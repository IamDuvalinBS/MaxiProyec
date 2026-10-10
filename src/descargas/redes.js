import axios from "axios";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";
import {
  descargarBuffer,
  asegurarVideoCompatibleWhatsApp,
  asegurarImagenCompatibleWhatsApp,
  LIMITE_VIDEO_WHATSAPP_MB
} from "./core.js";

export { descargarBuffer, asegurarVideoCompatibleWhatsApp, asegurarImagenCompatibleWhatsApp, LIMITE_VIDEO_WHATSAPP_MB };

const execFileAsync = promisify(execFile);

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
};

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

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
    "--socket-timeout", "20",
    "--retries", "3",
    "-N", "4",
    "--max-filesize", "80M",
    "-S", "res:720,vcodec:h264",
    "-f", "bv*+ba/b",
    "--merge-output-format", "mp4"
  ];
  const cookies = process.env.YTDLP_COOKIES;
  if (cookies && fs.existsSync(cookies)) args.push("--cookies", cookies);
  args.push("-o", path.join(os.tmpdir(), `${base}_%(autonumber)02d.%(ext)s`), link);

  await esperarTurno();
  try {
    await execFileAsync("yt-dlp", args, { timeout: 150000, killSignal: "SIGKILL", maxBuffer: 1024 * 1024 });
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

const ytdlpMedias = async (link, opciones) =>
  (await descargarConYtdlp(link, opciones)).map((a) => ({ type: a.type, ruta: a.ruta }));

// ───────────────────────── Utilidades ─────────────────────────
function recortar(texto, maximo) {
  const t = String(texto || "").replace(/[*_~`]/g, "").replace(/\s+/g, " ").trim();
  return t.length > maximo ? `${t.slice(0, maximo - 1)}…` : t;
}
const compacto = (n) => new Intl.NumberFormat("en", { notation: "compact" }).format(Number(n) || 0);

function decodificarEntidades(s) {
  return String(s).replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
}

// Búsqueda web (DuckDuckGo) para plataformas sin búsqueda pública (Instagram, Facebook).
async function buscarEnlacesWeb(consulta, normalizar, maximo) {
  const { data: html } = await axios.post(
    "https://html.duckduckgo.com/html/",
    new URLSearchParams({ q: consulta }).toString(),
    { headers: { ...HEADERS, "Content-Type": "application/x-www-form-urlencoded" }, timeout: 15000 }
  );
  const vistos = new Set();
  const enlaces = [];
  for (const m of String(html).matchAll(/href="([^"]*uddg=[^"]+)"/g)) {
    const u = decodificarEntidades(m[1]).match(/[?&]uddg=([^&]+)/);
    if (!u) continue;
    let real;
    try { real = decodeURIComponent(u[1]); } catch (e) { continue; }
    const canonico = normalizar(real);
    if (!canonico || vistos.has(canonico)) continue;
    vistos.add(canonico);
    enlaces.push(canonico);
    if (enlaces.length >= maximo) break;
  }
  return enlaces;
}

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

export async function obtenerMediaTwitter(link) {
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
  if (medias.length) return medias.slice(0, 10);

  if (await hayYtdlp()) {
    try { return await ytdlpMedias(link, { playlist: true }); } catch (e) { /* se informa abajo */ }
  }
  throw new Error("Ese tweet no tiene foto ni video, o es privado.");
}

// ───────────────────────── TikTok (tikwm; yt-dlp como respaldo) ─────────────────────────
const absoluta = (u) => (!u ? null : String(u).startsWith("/") ? `https://tikwm.com${u}` : u);

function pieTikTok(v) {
  // El usuario se deja tal cual (los guiones bajos son parte del nombre); solo se limpia el espacio sobrante.
  const autor = String(v.author?.unique_id || v.author?.nickname || "").replace(/\s+/g, " ").trim().slice(0, 30);
  const linea = [
    autor ? `👤 @${autor}` : null,
    v.play_count ? `👁️ ${compacto(v.play_count)}` : null,
    v.digg_count ? `❤️ ${compacto(v.digg_count)}` : null
  ].filter(Boolean).join(" · ");
  const titulo = recortar(v.title, 120);
  return [titulo ? `🎬 *${titulo}*` : "🎬", linea].filter(Boolean).join("\n");
}

async function pedirTikwm(ruta, params, metodo = "GET") {
  for (let intento = 0; intento < 3; intento++) {
    const { data } = metodo === "POST"
      ? await axios.post(`https://tikwm.com${ruta}`, new URLSearchParams(params).toString(), {
          headers: { ...HEADERS, "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 20000
        })
      : await axios.get(`https://tikwm.com${ruta}`, { params, headers: HEADERS, timeout: 20000 });

    if (data?.code === 0 && data.data) return data.data;
    if (/limit/i.test(String(data?.msg))) { await pausa(1300); continue; } // la API gratuita permite 1 petición por segundo
    throw new Error(data?.msg || "TikTok no devolvió datos.");
  }
  throw new Error("TikTok limitó las peticiones, intenta de nuevo en unos segundos.");
}

// Acepta videos, fotos (slideshows) e historias. Prefiere "play" (H264, más ligero) antes que "hdplay" (suele ser HEVC y pesa más).
export async function obtenerMediaTikTok(link) {
  let errorApi = null;
  try {
    const info = await pedirTikwm("/api/", { url: link, hd: 1 });
    if (info.images?.length) {
      return info.images.slice(0, 10).map((u, i) => ({ type: "image", url: absoluta(u), caption: i === 0 ? pieTikTok(info) : undefined }));
    }
    const url = absoluta(info.play || info.hdplay);
    if (!url) throw new Error("No se encontro el video de ese TikTok.");
    return [{ type: "video", url, caption: pieTikTok(info) }];
  } catch (e) {
    errorApi = e;
    console.log(`[redes] tikwm falló para ${link}: ${e.message}`);
  }

  if (await hayYtdlp()) {
    try { return await ytdlpMedias(link); } catch (e) { /* se informa el error de la API */ }
  }
  throw errorApi;
}

export async function buscarTikTok(consulta, cantidad) {
  const data = await pedirTikwm(
    "/api/feed/search",
    { keywords: consulta, count: Math.min(30, cantidad + 5), cursor: 0, web: 1, hd: 1 },
    "POST"
  );
  return (data.videos || [])
    .filter((v) => v.play || v.hdplay)
    .slice(0, cantidad + 3) // unos extra por si alguno pesa demasiado
    .map((v) => ({ type: "video", url: absoluta(v.play || v.hdplay), caption: pieTikTok(v) }));
}

// ───────────────────────── Facebook ─────────────────────────
export async function obtenerMediaFacebook(link) {
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
  let enlaces = await buscarEnlacesWeb(`${consulta} site:facebook.com/reel`, normalizarFacebook, cantidad * 2);
  if (enlaces.length < cantidad) {
    const mas = await buscarEnlacesWeb(`${consulta} site:facebook.com/watch`, normalizarFacebook, cantidad * 2).catch(() => []);
    enlaces = [...new Set([...enlaces, ...mas])].slice(0, cantidad * 2);
  }
  return enlaces.map((link) => ({
    type: "video",
    resolver: async () => (await obtenerMediaFacebook(link)).filter((m) => m.type === "video").slice(0, 1).map((m) => ({ ...m, caption: `🔗 ${link}` }))
  }));
}

// ───────────────────────── Instagram (reels, posts, carruseles) ─────────────────────────
export async function obtenerMediaInstagram(link) {
  let errorYt = null;
  if (await hayYtdlp()) {
    try { return await ytdlpMedias(link, { playlist: true, maxItems: 10 }); } catch (e) { errorYt = e; }
  }

  // Respaldo: el motor anterior (descargas/instagram.js), por si todavía sirve para fotos.
  try {
    const viejo = await import("./instagram.js");
    if (typeof viejo.obtenerMediaInstagram === "function") {
      const resultado = await Promise.race([
        viejo.obtenerMediaInstagram(link),
        pausa(20000).then(() => { throw new Error("el motor anterior tardó demasiado"); })
      ]);
      if (Array.isArray(resultado) && resultado.length) return resultado;
    }
  } catch (e) {
    console.log(`[redes] Motor anterior de Instagram no disponible: ${String(e.message).split("\n")[0]}`);
  }

  throw errorYt || new Error("No se pudo obtener ese contenido de Instagram.");
}

const normalizarInstagram = (url) => {
  const m = url.match(/instagram\.com\/(?:[\w.]+\/)?(reel|reels|tv)\/([\w-]+)/i);
  return m ? `https://www.instagram.com/${m[1].toLowerCase() === "tv" ? "tv" : "reel"}/${m[2]}/` : null;
};

export async function buscarInstagram(consulta, cantidad) {
  const enlaces = await buscarEnlacesWeb(`${consulta} site:instagram.com/reel`, normalizarInstagram, cantidad * 2);
  return enlaces.map((link) => ({
    type: "video",
    resolver: async () => (await obtenerMediaInstagram(link)).filter((m) => m.type === "video").slice(0, 1).map((m) => ({ ...m, caption: `🔗 ${link}` }))
  }));
}

// ───────────────────────── Pinterest ─────────────────────────
async function pinterestApi(recurso, sourceUrl, datos) {
  const { data } = await axios.get(`https://www.pinterest.com/resource/${recurso}/get/`, {
    params: { source_url: sourceUrl, data: JSON.stringify(datos) },
    headers: {
      ...HEADERS,
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
      "X-Pinterest-AppState": "active"
    },
    timeout: 20000
  });
  return data?.resource_response?.data;
}

function elegirVideoPinterest(videos) {
  const entradas = Object.values(videos?.video_list || {}).filter((v) => v?.url);
  const mp4 = entradas
    .filter((v) => /\.mp4(\?|$)/i.test(v.url))
    .sort((a, b) => (b.height || 0) - (a.height || 0));
  const elegido = mp4.find((v) => (v.height || 0) <= 720) || mp4[0];
  if (elegido) return elegido.url;
  return entradas.find((v) => /\.m3u8/i.test(v.url))?.url || null; // envio.js sabe bajar HLS con ffmpeg
}

function mediaDePin(pin) {
  const video = elegirVideoPinterest(pin?.videos);
  if (video) return { type: "video", url: video };
  const imagen = pin?.images?.orig?.url || pin?.images?.["736x"]?.url || pin?.images?.["474x"]?.url;
  return imagen ? { type: "image", url: imagen } : null;
}

export async function obtenerMediaPinterest(link) {
  let destino = link;
  if (/pin\.it/i.test(link)) {
    try {
      const r = await axios.get(link, { headers: HEADERS, timeout: 15000, maxRedirects: 5 });
      destino = r.request?.res?.responseUrl || link;
    } catch (e) { /* se intenta con el enlace original */ }
  }

  const id = destino.match(/\/pin\/(?:[\w-]+--)?(\d+)/)?.[1];
  if (id) {
    try {
      const pin = await pinterestApi("PinResource", `/pin/${id}/`, { options: { id, field_set_key: "detailed" }, context: {} });
      const media = mediaDePin(pin);
      if (media) return [media];
    } catch (e) {
      console.log(`[redes] API de Pinterest falló: ${e.message}`);
    }
  }

  // Respaldo: leer las etiquetas og: de la página.
  const { data: html } = await axios.get(destino, { headers: HEADERS, timeout: 15000 });
  const video = html.match(/<meta property="og:video" content="([^"]+)"/);
  const imagen = html.match(/<meta property="og:image" content="([^"]+)"/);
  if (video) return [{ type: "video", url: video[1] }];
  if (imagen) return [{ type: "image", url: imagen[1] }];
  throw new Error("No se pudo encontrar imagen ni video en ese pin.");
}

// Videos primero; si no alcanzan, se completa con imágenes.
export async function buscarPinterest(consulta, cantidad) {
  const buscar = async (scope) => {
    const r = await pinterestApi(
      "BaseSearchResource",
      `/search/${scope}/?q=${encodeURIComponent(consulta)}&rs=typed`,
      { options: { query: consulta, scope, rs: "typed", bookmarks: [] }, context: {} }
    ).catch((e) => { console.log(`[redes] Búsqueda de Pinterest (${scope}) falló: ${e.message}`); return null; });
    return (r?.results || []).map((pin) => ({ id: pin.id, media: mediaDePin(pin) })).filter((x) => x.media);
  };

  const medias = [];
  const vistos = new Set();
  const agregar = (lista, tipo) => {
    for (const x of lista) {
      if (medias.length >= cantidad + 3) break;
      if (x.media.type !== tipo || vistos.has(x.id)) continue;
      vistos.add(x.id);
      medias.push(x.media);
    }
  };

  const videos = await buscar("videos");
  agregar(videos, "video");
  if (medias.length < cantidad) {
    const pines = await buscar("pins");
    agregar(pines, "video");
    agregar(pines, "image");
  }
  return medias;
}

// ───────────────────────── Reddit ─────────────────────────
export async function obtenerMediaReddit(link) {
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
