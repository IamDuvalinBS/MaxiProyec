import { validarYGuardar, leerConfig, guardarConfig } from "./juegos-records.js";

// ─────────────────────────────────────────────────────────────
//  API HTTP para que el juego (HTML) guarde el récord SOLO, sin que nadie envíe mensajes.
//  Se engancha al servidor web de index.js:
//     POST /juegos/record   cuerpo JSON {j,p,s,f,n}
//     GET  /juegos/r?j=&p=&s=&f=&n=          → GIF 1x1 si se guardó
//     GET  /juegos/j?cb=&j=&p=&s=&f=&n=      → JSONP (por si el visor bloquea fetch)
//     GET  /juegos/ping
//  Solo se guarda el MEJOR resultado por persona y juego/modo (nunca historial de partidas).
// ─────────────────────────────────────────────────────────────

const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
const enCurso = new Map();

// ── URL pública del bot (donde el juego puede llamar) ──
let urlConfig = ""; // fijada con .gurl (se guarda en Mongo)
let urlTunel = ""; // túnel automático (cloudflared)
let urlVista = ""; // última dirección con la que alguien abrió la web del bot
let cargada = 0;

const limpiar = (u) => {
  u = String(u || "").trim().replace(/\/+$/, "");
  return /^https?:\/\/[^\s]+$/i.test(u) ? u : "";
};

export function ponerUrlTunel(u) {
  urlTunel = limpiar(u);
}

export async function cargarUrl() {
  if (Date.now() - cargada < 60000) return;
  cargada = Date.now();
  urlConfig = limpiar(await leerConfig("url"));
}

export async function fijarUrl(u) {
  const n = limpiar(u);
  if (u && !n) return false;
  await guardarConfig("url", n || null);
  urlConfig = n;
  cargada = Date.now();
  return true;
}

export function urlPublica() {
  const e = process.env;
  let env = e.JUEGOS_URL || e.PUBLIC_URL || e.RENDER_EXTERNAL_URL || "";
  if (!env && e.RAILWAY_PUBLIC_DOMAIN) env = "https://" + e.RAILWAY_PUBLIC_DOMAIN;
  if (!env && e.KOYEB_PUBLIC_DOMAIN) env = "https://" + e.KOYEB_PUBLIC_DOMAIN;
  if (!env && e.FLY_APP_NAME) env = "https://" + e.FLY_APP_NAME + ".fly.dev";
  if (!env && e.HEROKU_APP_NAME) env = "https://" + e.HEROKU_APP_NAME + ".herokuapp.com";
  if (!env && e.SPACE_HOST) env = "https://" + e.SPACE_HOST;
  if (!env && e.REPLIT_DEV_DOMAIN) env = "https://" + e.REPLIT_DEV_DOMAIN;
  return urlConfig || limpiar(env) || urlTunel || urlVista;
}

export function origenUrl() {
  if (urlConfig) return ".gurl";
  if (process.env.JUEGOS_URL || process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || process.env.RAILWAY_PUBLIC_DOMAIN || process.env.KOYEB_PUBLIC_DOMAIN || process.env.FLY_APP_NAME || process.env.HEROKU_APP_NAME) return "variable de entorno";
  if (urlTunel) return "túnel automático";
  if (urlVista) return "dirección con la que abriste la web del bot";
  return "ninguna";
}

function recordarHost(req) {
  try {
    const h = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
    if (!h || /^(localhost|127\.|0\.0\.0\.0|\[::1\]|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(h)) return;
    const proto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() || (/^[\d.]+(:\d+)?$/.test(h) ? "http" : "https");
    urlVista = proto + "://" + h;
  } catch {}
}

// Guardado idempotente: varias peticiones iguales (el juego prueba varios canales) = un solo guardado
function guardar(d) {
  const juego = String(d.j || "").slice(0, 20);
  const token = String(d.f || "").slice(0, 200);
  if (!juego || !token) return Promise.resolve({ ok: false, texto: "datos incompletos" });
  const clave = `${juego}|${token}|${d.p}|${d.s}`;
  let pr = enCurso.get(clave);
  if (!pr) {
    pr = validarYGuardar({ juego, token, nombre: d.n, score: d.p, secs: d.s });
    enCurso.set(clave, pr);
    setTimeout(() => enCurso.delete(clave), 60000);
    if (enCurso.size > 2000) enCurso.clear();
  }
  return pr;
}

function cabeceras(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

export function manejarApiJuegos(req, res) {
  recordarHost(req);
  let url;
  try {
    url = new URL(req.url, "http://local");
  } catch {
    return false;
  }
  if (!url.pathname.startsWith("/juegos/")) return false;
  cabeceras(res);

  const json = (code, obj) => {
    res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(obj));
  };
  const q = url.searchParams;
  const dePeticion = () => ({ j: q.get("j"), p: q.get("p"), s: q.get("s"), f: q.get("f"), n: q.get("n") });

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return true;
  }
  if (url.pathname === "/juegos/ping") {
    json(200, { ok: true });
    return true;
  }
  if (url.pathname === "/juegos/record" && req.method === "POST") {
    let cuerpo = "";
    req.on("data", (c) => {
      cuerpo += c;
      if (cuerpo.length > 4000) req.destroy();
    });
    req.on("end", async () => {
      try {
        const r = await guardar(JSON.parse(cuerpo || "{}"));
        json(r.ok ? 200 : 400, { ok: r.ok, nuevo: !!r.nuevo, rec: r.rec || 0, texto: r.texto });
      } catch {
        json(400, { ok: false, texto: "solicitud inválida" });
      }
    });
    return true;
  }
  if (url.pathname === "/juegos/r" && req.method === "GET") {
    guardar(dePeticion())
      .then((r) => {
        if (r.ok) {
          res.writeHead(200, { "Content-Type": "image/gif" });
          res.end(GIF);
        } else {
          res.writeHead(400);
          res.end();
        }
      })
      .catch(() => {
        res.writeHead(500);
        res.end();
      });
    return true;
  }
  if (url.pathname === "/juegos/j" && req.method === "GET") {
    const cb = String(q.get("cb") || "");
    guardar(dePeticion())
      .then((r) => {
        const cuerpo = /^[A-Za-z0-9_]{1,40}$/.test(cb) ? `${cb}(${JSON.stringify({ ok: r.ok, nuevo: !!r.nuevo, texto: r.texto })})` : "";
        res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8" });
        res.end(cuerpo);
      })
      .catch(() => {
        res.writeHead(500);
        res.end();
      });
    return true;
  }
  json(404, { ok: false });
  return true;
}
