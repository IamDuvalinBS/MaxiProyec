// Diagnóstico del foro: npm run foro  (o: node scripts/probar-foro.mjs [URL_LISTADO])
// Imprime un resumen corto de cómo está armada la página, para poder escribir el descargador exacto.
import axios from "axios";

const LISTADO = process.argv[2] || "https://forogore.net/c/hentai";
const origen = new URL(LISTADO).origin;
const http = axios.create({
  timeout: 20000, maxRedirects: 5, validateStatus: () => true,
  headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36", "Accept-Language": "es-MX,es;q=0.9" }
});
const corto = (s, n = 110) => String(s).replace(/\s+/g, " ").slice(0, n);
const unicos = (a) => [...new Set(a)];

async function pedir(url) {
  const r = await http.get(url, { responseType: "text", transformResponse: (d) => d });
  return { status: r.status, html: String(r.data || ""), tipo: r.headers["content-type"] || "" };
}

function resumen(nombre, { status, html, tipo }) {
  console.log(`\n=== ${nombre} ===`);
  console.log(`estado: ${status} · tipo: ${corto(tipo, 40)} · tamaño: ${html.length}`);
  if (status >= 400) { console.log("inicio:", corto(html, 200)); return null; }
  const hrefs = unicos([...html.matchAll(/href=["']([^"'#]+)["']/g)].map((m) => m[1])).filter((h) => h.startsWith("/") || h.startsWith(origen));
  const grupos = {};
  for (const h of hrefs) { const p = h.replace(origen, "").split("?")[0].split("/").slice(0, 2).join("/") || "/"; (grupos[p] ||= []).push(h); }
  console.log("enlaces por prefijo (prefijo → cuántos, ejemplo):");
  for (const [p, l] of Object.entries(grupos).sort((a, b) => b[1].length - a[1].length).slice(0, 8)) console.log(`  ${p} → ${l.length}  ej: ${corto(l[0], 90)}`);
  const imgs = unicos([...html.matchAll(/(?:src|data-src|content)=["']([^"']+\.(?:jpe?g|png|webp|gif|mp4|webm)[^"']*)["']/gi)].map((m) => m[1]));
  console.log(`medios en el HTML: ${imgs.length}`, imgs.slice(0, 3).map((u) => corto(u, 100)));
  console.log("og:image:", corto((html.match(/property=["']og:image["'][^>]*content=["']([^"']+)/i) || [])[1] || "no", 100));
  console.log("etiquetas <video>:", (html.match(/<video/gi) || []).length, "· <img>:", (html.match(/<img/gi) || []).length);
  console.log("JSON incrustado:", /__NEXT_DATA__|__NUXT__|window\.__INITIAL_STATE__|application\/json/.test(html) ? "SÍ" : "no", "· parece app JS vacía:", html.length < 8000 && /<div id=["'](root|app|__next)/.test(html) ? "SÍ" : "no");
  const scripts = unicos([...html.matchAll(/<script[^>]+src=["']([^"']+)/g)].map((m) => m[1])).slice(0, 4);
  console.log("scripts:", scripts.map((s) => corto(s, 70)));
  return hrefs;
}

const lista = await pedir(LISTADO);
const hrefs = resumen("LISTADO", lista);
if (hrefs) {
  const candidatos = hrefs.filter((h) => !/^\/(c|u|user|login|register|terms|privacy|contact)\b/.test(h.replace(origen, "")) && h.replace(origen, "").split("/").filter(Boolean).length >= 2);
  console.log("\nenlaces que parecen publicaciones:", candidatos.slice(0, 5).map((h) => corto(h, 80)));
  if (candidatos[0]) resumen("PUBLICACIÓN", await pedir(candidatos[0].startsWith("http") ? candidatos[0] : origen + candidatos[0]));
  for (const v of ["?page=2", "?pagina=2", "/page/2", "/2"]) {
    const r = await http.get(LISTADO.replace(/\/$/, "") + v, { responseType: "text", transformResponse: (d) => d });
    console.log(`paginación ${v}: estado ${r.status}, tamaño ${String(r.data).length}`);
  }
}
console.log("\n(listo: copia todo este texto y mándaselo a Claude)");
