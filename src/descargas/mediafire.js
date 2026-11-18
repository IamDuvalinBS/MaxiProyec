import axios from "axios";
import { buscarEnlacesWeb } from "./redes.js";

// MediaFire: no tiene búsqueda ni API pública, así que se busca en la web (DuckDuckGo/Bing) con "site:mediafire.com" y cada enlace
// se resuelve leyendo su página para sacar el enlace directo de descarga, el nombre y el peso real del archivo.
const HEADERS = { "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36", "Accept-Language": "es-MX,es;q=0.9" };
const RE_ARCHIVO = /^https?:\/\/(?:www\.)?mediafire\.com\/(?:file|view|download)\/([a-z0-9]+)(?:\/([^/?#]+))?/i;

export const esEnlaceMediafire = (t) => /mediafire\.com\/(file|view|download)\//i.test(t || "");

const normalizar = (url) => {
  const m = String(url).match(RE_ARCHIVO);
  return m ? `https://www.mediafire.com/file/${m[1]}/${m[2] || "file"}/file` : null;
};

const decodificar = (s) => String(s).replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');

function pesoATexto(txt) {
  const m = String(txt || "").match(/([\d.,]+)\s*(KB|MB|GB)/i);
  if (!m) return 0;
  const n = parseFloat(m[1].replace(",", "."));
  return Math.round(n * { KB: 1024, MB: 1048576, GB: 1073741824 }[m[2].toUpperCase()]);
}

// -> { url, nombre, tamano } o null si el archivo ya no existe / fue bloqueado.
export async function resolverMediafire(enlace) {
  const { data: html } = await axios.get(enlace, { headers: HEADERS, timeout: 20000, maxRedirects: 5 });
  const pagina = String(html);
  let url = null;
  const oculto = pagina.match(/data-scrambled-url="([^"]+)"/);
  if (oculto) { try { url = Buffer.from(oculto[1], "base64").toString("utf8"); } catch (e) {} }
  if (!url) {
    const boton = pagina.match(/<a[^>]+id="downloadButton"[^>]+href="(https?:\/\/[^"]+)"/i)
      || pagina.match(/href="(https?:\/\/download[^"]*mediafire\.com[^"]+)"/i);
    if (boton) url = decodificar(boton[1]);
  }
  if (!url || !/^https?:\/\//.test(url)) return null;

  const nombre = decodificar(
    (pagina.match(/<div class="filename"[^>]*>([^<]+)</i) || pagina.match(/<meta property="og:title" content="([^"]+)"/i) || [])[1]
    || decodeURIComponent(url.split("/").pop().split("?")[0])
  ).trim();
  const tamano = pesoATexto((pagina.match(/<li>\s*File size:?\s*<span>([^<]+)</i) || pagina.match(/class="details"[\s\S]{0,300}?<span>([\d.,]+\s*[KMG]B)</i) || [])[1]);
  return { url, nombre, tamano };
}

export async function buscarMediafire(consulta, maximo = 12) {
  return buscarEnlacesWeb(
    [`${consulta} apk site:mediafire.com`, `${consulta} apk mediafire última versión`, `${consulta} apk mod mediafire`],
    normalizar,
    maximo
  );
}
