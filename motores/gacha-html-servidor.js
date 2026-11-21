import http from "node:http";
import crypto from "node:crypto";

const paginas = new Map();
const VIDA_MS = 30 * 60 * 1000;
const BASE = (process.env.HTML_BASE_URL || "").replace(/\/+$/, "");
const PUERTO = Number(process.env.HTML_PORT || 8787);

export const hayServidorHtml = () => Boolean(BASE);

export function publicarHtml(html) {
  if (!BASE) return null;
  const token = crypto.randomBytes(12).toString("hex");
  paginas.set(token, { html, vence: Date.now() + VIDA_MS });
  return `${BASE}/col/${token}`;
}

setInterval(() => {
  const ahora = Date.now();
  for (const [token, p] of paginas) if (p.vence < ahora) paginas.delete(token);
}, 5 * 60 * 1000).unref();

export function crearServidorHtml() {
  const srv = http.createServer((req, res) => {
    const ruta = (req.url || "").split("?")[0];
    const m = /^\/col\/([a-f0-9]{24})$/.exec(ruta);
    if (!m) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      return res.end("No encontrado");
    }
    const p = paginas.get(m[1]);
    if (!p || p.vence < Date.now()) {
      res.writeHead(410, { "content-type": "text/plain; charset=utf-8" });
      return res.end("Enlace expirado, vuelve a pedir tu colección");
    }
    res.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, max-age=600",
      "access-control-allow-origin": "*"
    });
    res.end(p.html);
  });
  srv.listen(PUERTO, () => console.log(`[gacha] Colecciones servidas en el puerto ${PUERTO} (base: ${BASE})`));
  return srv;
}
