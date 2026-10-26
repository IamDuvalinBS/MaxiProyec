import { validarYGuardar } from "./juegos-records.js";

// ─────────────────────────────────────────────────────────────
//  API HTTP para que el juego (HTML) guarde el récord SOLO, sin que la persona
//  tenga que enviar ningún mensaje.  Se engancha al servidor web de index.js:
//     POST /juegos/record   cuerpo JSON {j,p,s,f,n}
//     GET  /juegos/r?j=&p=&s=&f=&n=   (devuelve un GIF 1x1 si se guardó)
//     GET  /juegos/ping
// ─────────────────────────────────────────────────────────────

const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
const ultimos = new Map();

// URL pública del bot (donde el juego puede llamar). Ponla en .env como JUEGOS_URL
export function urlPublica() {
  const e = process.env;
  let u = e.JUEGOS_URL || e.PUBLIC_URL || e.RENDER_EXTERNAL_URL || "";
  if (!u && e.RAILWAY_PUBLIC_DOMAIN) u = "https://" + e.RAILWAY_PUBLIC_DOMAIN;
  if (!u && e.KOYEB_PUBLIC_DOMAIN) u = "https://" + e.KOYEB_PUBLIC_DOMAIN;
  if (!u && e.FLY_APP_NAME) u = "https://" + e.FLY_APP_NAME + ".fly.dev";
  return String(u).trim().replace(/\/+$/, "");
}

function cabeceras(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

function seguidos(token) {
  const k = String(token).slice(0, 24);
  const ahora = Date.now();
  if (ahora - (ultimos.get(k) || 0) < 1200) return true;
  ultimos.set(k, ahora);
  if (ultimos.size > 4000) ultimos.clear();
  return false;
}

async function guardar(d) {
  const juego = String(d.j || "").slice(0, 20);
  const token = String(d.f || "").slice(0, 200);
  if (!juego || !token) return { ok: false, texto: "datos incompletos" };
  if (seguidos(token + juego)) return { ok: false, texto: "demasiado rápido" };
  return validarYGuardar({ juego, token, nombre: d.n, score: d.p, secs: d.s });
}

export function manejarApiJuegos(req, res) {
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
      } catch (e) {
        json(400, { ok: false, texto: "solicitud inválida" });
      }
    });
    return true;
  }
  if (url.pathname === "/juegos/r" && req.method === "GET") {
    const q = url.searchParams;
    guardar({ j: q.get("j"), p: q.get("p"), s: q.get("s"), f: q.get("f"), n: q.get("n") })
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
  json(404, { ok: false });
  return true;
}
