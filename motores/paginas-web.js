import fs from "fs";
import path from "path";
import crypto from "crypto";
import { urlPublica } from "./juegos-api.js";

const DIR = path.resolve("./data/paginas");
const VIGENCIA_DIAS = 14;
const MAX_PAGINAS = 80;
export const MAX_BYTES = 600 * 1024;
const ID = /^[A-Za-z0-9_-]{6,16}$/;
const memoria = new Map();

export const vigenciaDias = VIGENCIA_DIAS;

// La página corre aislada (sandbox, sin red, sin formularios), así que aunque la IA genere algo raro
// no puede tocar la API del bot ni enviar datos a otro sitio.
const CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline' https://cdnjs.cloudflare.com",
  "style-src 'unsafe-inline'",
  "img-src data: blob:",
  "media-src data: blob:",
  "font-src data:",
  "worker-src blob:",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "sandbox allow-scripts allow-modals allow-pointer-lock"
].join("; ");

const SHIM =
  '<script>(function(){try{window.localStorage.getItem("x")}catch(e){var m={},s={getItem:function(k){return k in m?m[k]:null},setItem:function(k,v){m[k]=String(v)},removeItem:function(k){delete m[k]},clear:function(){m={}},key:function(i){return Object.keys(m)[i]||null}};try{Object.defineProperty(window,"localStorage",{value:s});Object.defineProperty(window,"sessionStorage",{value:s})}catch(_){}}})()</script>';

const MARCA =
  '<div style="position:fixed;right:6px;bottom:3px;font:10px system-ui,sans-serif;opacity:.55;color:#888;pointer-events:none;z-index:2147483647">ⓘ Página creada con IA · MaxiProyec</div>';

export function extraerHtml(texto) {
  let t = String(texto || "").trim();
  const cerca = t.match(/```(?:html)?\s*\n([\s\S]*?)```/i);
  if (cerca) t = cerca[1];
  const ini = t.search(/<!doctype html|<html[\s>]/i);
  if (ini > 0) t = t.slice(ini);
  const fin = t.toLowerCase().lastIndexOf("</html>");
  if (fin >= 0) t = t.slice(0, fin + 7);
  return t.trim();
}

export function htmlCompleto(t) {
  return /<html[\s>]/i.test(t) && /<\/html>\s*$/i.test(t) && /<\/body>/i.test(t);
}

export function prepararHtml(html) {
  let h = String(html);
  if (!/<meta[^>]+charset/i.test(h)) h = h.replace(/<head[^>]*>/i, (m) => m + '<meta charset="utf-8">');
  if (!/<meta[^>]+viewport/i.test(h)) {
    h = h.replace(/<head[^>]*>/i, (m) => m + '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">');
  }
  h = /<head[^>]*>/i.test(h) ? h.replace(/<head[^>]*>/i, (m) => m + SHIM) : SHIM + h;
  h = /<\/body>/i.test(h) ? h.replace(/<\/body>/i, () => MARCA + "</body>") : h + MARCA;
  return h;
}

function limpiar() {
  try {
    const limite = Date.now() - VIGENCIA_DIAS * 86400000;
    const archivos = fs
      .readdirSync(DIR)
      .filter((f) => f.endsWith(".html"))
      .map((f) => ({ f, t: fs.statSync(path.join(DIR, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    archivos.forEach((x, i) => {
      if (x.t < limite || i >= MAX_PAGINAS) {
        for (const ext of [".html", ".json"]) fs.rmSync(path.join(DIR, x.f.replace(/\.html$/, ext)), { force: true });
        memoria.delete(x.f.replace(/\.html$/, ""));
      }
    });
  } catch {}
}
try {
  fs.mkdirSync(DIR, { recursive: true });
  limpiar();
  setInterval(limpiar, 6 * 3600 * 1000).unref();
} catch {}

export function guardarPagina(html, meta = {}) {
  const lista = prepararHtml(html);
  if (Buffer.byteLength(lista) > MAX_BYTES) throw new Error("la página quedó demasiado pesada");
  fs.mkdirSync(DIR, { recursive: true });
  const id = crypto.randomBytes(6).toString("base64url");
  fs.writeFileSync(path.join(DIR, id + ".html"), lista);
  fs.writeFileSync(path.join(DIR, id + ".json"), JSON.stringify({ ...meta, t: Date.now() }));
  memoria.set(id, lista);
  if (memoria.size > 8) memoria.delete(memoria.keys().next().value);
  limpiar();
  return id;
}

export function leerPagina(id) {
  if (!ID.test(String(id))) return null;
  if (memoria.has(id)) return memoria.get(id);
  try {
    const h = fs.readFileSync(path.join(DIR, id + ".html"), "utf8");
    memoria.set(id, h);
    if (memoria.size > 8) memoria.delete(memoria.keys().next().value);
    return h;
  } catch {
    return null;
  }
}

export function leerOriginal(id) {
  const h = leerPagina(id);
  if (!h) return null;
  return h.replace(SHIM, "").replace(MARCA, "");
}

export function borrarPagina(id) {
  if (!ID.test(String(id))) return false;
  let hubo = false;
  for (const ext of [".html", ".json"]) {
    const ruta = path.join(DIR, id + ext);
    if (fs.existsSync(ruta)) {
      fs.rmSync(ruta, { force: true });
      hubo = true;
    }
  }
  memoria.delete(id);
  return hubo;
}

export function idDeTexto(t) {
  const m = String(t || "").match(/\/h\/([A-Za-z0-9_-]{6,16})/);
  return m ? m[1] : null;
}

export function urlPagina(id) {
  const base = urlPublica();
  return base ? base + "/h/" + id : "";
}

export function manejarPaginas(req, res) {
  let url;
  try {
    url = new URL(req.url, "http://local");
  } catch {
    return false;
  }
  if (!url.pathname.startsWith("/h/")) return false;
  const id = url.pathname.slice(3).replace(/\/+$/, "");
  const html = req.method === "GET" || req.method === "HEAD" ? leerPagina(id) : null;
  if (!html) {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;text-align:center;margin-top:20vh"><h2>Esta página ya no existe</h2><p>Las páginas duran ' + VIGENCIA_DIAS + " días.</p>");
    return true;
  }
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": CSP,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow",
    "Cache-Control": "public, max-age=300"
  });
  res.end(req.method === "HEAD" ? undefined : html);
  return true;
}
