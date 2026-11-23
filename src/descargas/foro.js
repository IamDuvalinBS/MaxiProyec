// Fuente "foro": abre publicaciones del foro (listado por páginas, cada publicación en /t/nombre-ID) y saca sus fotos y videos.
// Cambiable con variables de entorno: FORO_LISTADO="https://forogore.net/c/hentai"  FORO_PAGINAS_MAX=10
import axios from "axios";
import { descargarATemporal } from "./core.js";

const LISTADO = (process.env.FORO_LISTADO || "https://forogore.net/c/hentai").replace(/\/$/, "");
const ORIGEN = new URL(LISTADO).origin;
const PAGINAS_MAX = Math.max(1, Number(process.env.FORO_PAGINAS_MAX) || 10); // lo nuevo está en las primeras páginas
const MAX_PUBLICACIONES = 8;   // cuántas publicaciones se abren como máximo por comando
const MAX_VIDEOS = 2;

const http = axios.create({
  timeout: 20000, maxRedirects: 5,
  headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36", "Accept-Language": "es-MX,es;q=0.9" }
});
const mezclar = (l) => [...l].sort(() => Math.random() - 0.5);
const limpiar = (s) => String(s).replace(/&amp;/g, "&").replace(/&#x2F;/g, "/").trim();
const pagina = async (url) => String((await http.get(url, { responseType: "text", transformResponse: (d) => d })).data || "");

// Elementos que se repiten en todas las páginas del sitio (logo, íconos, avatares…) no son contenido de la publicación.
const BASURA = /logo|favi|icon|avatar|emoji|emoticon|sprite|og-default|placeholder|gravatar|banner|googletagmanager|pixel/i;
const vistoEnPublicaciones = new Map(); // url → en cuántas publicaciones distintas apareció; si salen en 2+ es parte del diseño del sitio

export async function enlacesPublicaciones() {
  const n = 1 + Math.floor(Math.random() * PAGINAS_MAX);
  const html = await pagina(n === 1 ? LISTADO : `${LISTADO}?page=${n}`);
  const enlaces = [...html.matchAll(/href=["']((?:https?:\/\/[^"']*)?\/t\/[^"'#?]+)["']/g)]
    .map((m) => new URL(limpiar(m[1]), ORIGEN).href);
  return [...new Set(enlaces)];
}

export function extraerMedios(html, urlPublicacion) {
  const fotos = new Set(), videos = new Set();
  const agregar = (crudo, tipoForzado) => {
    if (!crudo || /^(data:|blob:|javascript:)/i.test(crudo)) return;
    let u;
    try { u = new URL(limpiar(crudo), urlPublicacion).href; } catch (e) { return; }
    if (BASURA.test(u.split("?")[0].split("/").pop() || "")) return;
    const ext = (u.split("?")[0].match(/\.(\w{2,5})$/) || [])[1]?.toLowerCase();
    if (tipoForzado === "video" || ["mp4", "webm", "mov", "m4v"].includes(ext)) videos.add(u);
    else if (tipoForzado === "foto" || ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) fotos.add(u);
  };
  for (const m of html.matchAll(/<(?:img|source|video)\b[^>]*?\b(?:src|data-src|data-original|data-lazy-src)=["']([^"']+)["']/gi)) {
    agregar(m[1], /^<(?:video|source)/i.test(m[0]) ? "video" : undefined);
  }
  for (const m of html.matchAll(/<meta[^>]+property=["']og:video(?::url)?["'][^>]+content=["']([^"']+)/gi)) agregar(m[1], "video");
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"']+\.(?:jpe?g|png|webp|gif|mp4|webm)(?:\?[^"']*)?)["']/gi)) agregar(m[1]);
  return { fotos: [...fotos], videos: [...videos] };
}

// Devuelve { fotos: [{type:"image", ruta}], videos: [{type:"video", ruta}] } ya descargados a disco.
export async function medioForo(cantidadFotos = 5) {
  const enlaces = mezclar(await enlacesPublicaciones()).slice(0, MAX_PUBLICACIONES);
  if (!enlaces.length) throw new Error("No encontré publicaciones en el foro (puede haber cambiado su diseño).");

  const fotosUrl = [], videosUrl = [];
  for (const enlace of enlaces) {
    if (fotosUrl.length >= cantidadFotos && videosUrl.length >= 1) break;
    let medios;
    try { medios = extraerMedios(await pagina(enlace), enlace); } catch (e) { continue; }
    for (const u of [...medios.fotos, ...medios.videos]) vistoEnPublicaciones.set(u, (vistoEnPublicaciones.get(u) || 0) + 1);
    const propio = (u) => vistoEnPublicaciones.get(u) < 2;
    for (const u of medios.fotos.filter(propio)) if (fotosUrl.length < cantidadFotos && !fotosUrl.some((x) => x.url === u)) fotosUrl.push({ url: u, ref: enlace });
    for (const u of medios.videos.filter(propio)) if (videosUrl.length < MAX_VIDEOS && !videosUrl.some((x) => x.url === u)) videosUrl.push({ url: u, ref: enlace });
  }
  if (!fotosUrl.length && !videosUrl.length) throw new Error("Abrí publicaciones pero no encontré fotos ni videos en ellas.");

  const bajar = async (lista, type, ext) => {
    const salida = [];
    for (const { url, ref } of lista) {
      try { salida.push({ type, ruta: await descargarATemporal(url, ext, { headers: { Referer: ref } }) }); }
      catch (e) { console.log(`[foro] No se pudo bajar ${url.slice(0, 80)}: ${String(e.message).split("\n")[0]}`); }
    }
    return salida;
  };
  const [fotos, videos] = [await bajar(fotosUrl, "image", "img"), await bajar(videosUrl, "video", "mp4")];
  if (!fotos.length && !videos.length) throw new Error("Encontré archivos pero no pude descargarlos.");
  return { fotos, videos };
}
