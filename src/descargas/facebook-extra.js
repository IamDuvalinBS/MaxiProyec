/**
 * Facebook más robusto. Lo usa el comando .fb en lugar de llamar directo a obtenerMediaFacebook.
 *
 * Qué arregla:
 *  1) Los enlaces cortos (facebook.com/share/v/…, /share/r/…, fb.watch/…) se resuelven al enlace real del video
 *     antes de pasárselos a yt-dlp (muchas versiones de yt-dlp fallan con los enlaces "share").
 *  2) Se prueban varias formas del mismo enlace (reel / watch) con yt-dlp.
 *  3) Si yt-dlp falla, se lee la página con la "firma" de Facebook (facebookexternalhit), que sí entrega el
 *     video público en las etiquetas og:video, y luego con navegador móvil y de PC.
 *
 * Cada paso deja una línea en la consola ([facebook] …) para saber dónde falló.
 */

const UA = {
  bot: "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  movil: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  pc: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
};

const PATRONES_VIDEO = [
  /<meta[^>]+property=["']og:video:secure_url["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:video:secure_url["']/i,
  /<meta[^>]+property=["']og:video(?::url)?["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:video(?::url)?["']/i,
  /"browser_native_hd_url":"([^"]+)"/,
  /"browser_native_sd_url":"([^"]+)"/,
  /"playable_url_quality_hd":"([^"]+)"/,
  /"playable_url":"([^"]+)"/,
  /\bhd_src:"([^"]+)"/,
  /\bsd_src:"([^"]+)"/
];

const log = (...a) => console.log("[facebook]", ...a);

function decodificar(crudo) {
  let u = String(crudo);
  try { u = JSON.parse(`"${u.replace(/"/g, '\\"')}"`); } catch { u = u.replace(/\\u0025/g, "%").replace(/\\u0026/g, "&").replace(/\\\//g, "/"); }
  return u
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;|&#47;/g, "/")
    .replace(/&#x3D;|&#61;/g, "=")
    .replace(/&quot;/g, '"')
    .trim();
}

// Saca la URL directa del video de una página, o null.
export function extraerVideo(html) {
  const texto = String(html || "");
  for (const re of PATRONES_VIDEO) {
    const m = texto.match(re);
    if (!m) continue;
    const url = decodificar(m[1]);
    if (!/^https?:\/\//i.test(url)) continue;
    if (/\.(jpe?g|png|webp|gif)(\?|$)/i.test(url) || /safe_image|\/rsrc\.php/i.test(url)) continue;
    return url;
  }
  return null;
}

// ID numérico del video a partir de una URL o del HTML.
export function idDeVideo(textoUrl, html = "") {
  const u = String(textoUrl || "");
  let m = u.match(/\/reel\/(\d{6,})/) || u.match(/[?&]v=(\d{6,})/) || u.match(/\/videos\/(?:[\w.\-%]+\/)?(\d{6,})/) || u.match(/\/watch\/?\?.*?\bv=(\d{6,})/);
  if (m) return m[1];
  const h = String(html || "");
  m = h.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i) || h.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  if (m) {
    const id = idDeVideo(decodificar(m[1]));
    if (id) return id;
  }
  m = h.match(/"video_id":"(\d{6,})"/) || h.match(/"videoId":"(\d{6,})"/);
  return m ? m[1] : null;
}

function normalizarEntrada(link) {
  let u = String(link || "").trim().replace(/[)\].,;]+$/, "");
  if (!/^https?:\/\//i.test(u)) u = "https://" + u.replace(/^\/+/, "");
  return u;
}

const esEnlaceCorto = (u) => /facebook\.com\/share\/|fb\.watch\/|fb\.com\/|\/l\.php\?|m\.facebook\.com\/story/i.test(u);

// Si Facebook manda al login, el enlace real viene en ?next=
function sinLogin(urlFinal) {
  if (!/\/login/i.test(urlFinal)) return urlFinal;
  try {
    const next = new URL(urlFinal).searchParams.get("next");
    if (next) return decodeURIComponent(next);
  } catch {}
  return urlFinal;
}

async function pedirPagina(url, ua, axios) {
  const res = await axios.get(url, {
    headers: { "User-Agent": ua, "Accept-Language": "es-ES,es;q=0.9,en;q=0.8", Accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
    timeout: 15000,
    maxRedirects: 6,
    responseType: "text",
    transformResponse: [(d) => d],
    validateStatus: () => true
  });
  return { html: String(res.data || ""), urlFinal: sinLogin(res.request?.res?.responseUrl || url), status: res.status };
}

async function cargarDependencias() {
  const axios = (await import("axios")).default;
  const { obtenerMediaFacebook } = await import("./redes.js");
  return { http: (url, ua) => pedirPagina(url, ua, axios), ytdlp: obtenerMediaFacebook };
}

/**
 * Misma firma que obtenerMediaFacebook: recibe el enlace y devuelve [{ type: "video", url | ruta }].
 * deps (solo para pruebas): { http(url, ua) -> { html, urlFinal }, ytdlp(url) -> medias }
 */
export async function obtenerMediaFacebookMejorado(link, deps = null) {
  const { http, ytdlp } = deps || (await cargarDependencias());
  const original = normalizarEntrada(link);

  // 1) Resolver enlaces cortos / share al enlace real.
  let final = original;
  let id = idDeVideo(original);
  let paginaBot = null;
  if (esEnlaceCorto(original) || !id) {
    try {
      paginaBot = await http(original, UA.bot);
      final = sinLogin(paginaBot.urlFinal || original);
      id = id || idDeVideo(final, paginaBot.html);
      log(`enlace resuelto: ${original} → ${final}${id ? ` (video ${id})` : ""}`);
    } catch (e) {
      log(`no se pudo resolver el enlace: ${e.message}`);
    }
  }

  // 2) yt-dlp con varias formas del mismo enlace.
  const candidatos = [];
  const poner = (u, tal = false) => { if (u && !tal) u = u.replace(/\/+$/, ""); if (u && !candidatos.includes(u) && candidatos.length < 4) candidatos.push(u); };
  if (final !== original && !/\/login|\/share\//i.test(final)) poner(final);
  if (id) {
    poner(`https://www.facebook.com/reel/${id}`);
    poner(`https://www.facebook.com/watch/?v=${id}`);
  }
  poner(original, true);

  let ultimoError = null;
  for (const url of candidatos) {
    try {
      const medias = await ytdlp(url);
      if (medias?.length) {
        log(`descargado con yt-dlp usando ${url}`);
        return medias;
      }
    } catch (e) {
      ultimoError = e;
      log(`yt-dlp no pudo con ${url}: ${String(e.message).split("\n")[0]}`);
    }
  }

  // 3) Leer la página directamente (og:video / playable_url).
  const paginas = [];
  if (paginaBot) paginas.push(["firma Facebook", paginaBot.html]);
  const destinos = [id ? `https://www.facebook.com/reel/${id}` : null, final, original].filter((u, i, a) => u && a.indexOf(u) === i);
  for (const [nombre, ua] of [["firma Facebook", UA.bot], ["móvil", UA.movil], ["PC", UA.pc]]) {
    for (const destino of destinos) {
      if (nombre === "firma Facebook" && paginaBot && destino === final) continue; // ya se leyó arriba
      try {
        const p = await http(destino, ua);
        paginas.push([`${nombre} · ${destino}`, p.html]);
      } catch (e) {
        log(`no se pudo leer ${destino} (${nombre}): ${e.message}`);
      }
    }
  }
  for (const [origen, html] of paginas) {
    const url = extraerVideo(html);
    if (url) {
      log(`video encontrado en la página (${origen})`);
      return [{ type: "video", url }];
    }
  }

  log("sin resultado con ningún método");
  const detalle = ultimoError && !/no está instalado/i.test(ultimoError.message) ? ` ${ultimoError.message}` : "";
  throw new Error(`No pude descargar ese video. Puede ser privado, estar restringido por edad o país, o Facebook bloqueó la descarga.${detalle}`.replace(/\s+/g, " ").trim());
}
