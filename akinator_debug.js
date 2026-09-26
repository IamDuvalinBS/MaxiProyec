// akinator_debug.js
// Script de UNA SOLA VEZ para diagnosticar. Corré: node akinator_debug.js
import puppeteer from "puppeteer-core";
import fs from "node:fs";

const RUTA_CHROMIUM = "/data/data/com.termux/files/usr/bin/chromium-browser";

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function esperarQueResuelvaCloudflare(pagina, maxSegundos = 25) {
  for (let i = 0; i < maxSegundos; i++) {
    const titulo = await pagina.title().catch(() => "");
    if (!titulo.toLowerCase().includes("just a moment")) return titulo;
    await esperar(1000);
  }
  return await pagina.title().catch(() => "(timeout)");
}

const navegador = await puppeteer.launch({
  executablePath: RUTA_CHROMIUM,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
  headless: true
});

const pagina = await navegador.newPage();
const uaOriginal = await navegador.userAgent();
await pagina.setUserAgent(uaOriginal.replace("HeadlessChrome", "Chrome"));
await pagina.evaluateOnNewDocument(() => {
  Object.defineProperty(navigator, "webdriver", { get: () => undefined });
});

console.log("1) Cargando portada...");
await pagina.goto("https://es.akinator.com", { waitUntil: "domcontentloaded", timeout: 45000 });
let t = await esperarQueResuelvaCloudflare(pagina);
console.log("   Título portada:", t);

console.log("2) Haciendo clic en JUGAR...");
await pagina.click('a[onclick*="jouer"]').catch((e) => console.log("   (no se pudo clickear:", e.message, ")"));

console.log("   Esperando a que resuelva Cloudflare (hasta 25s)...");
t = await esperarQueResuelvaCloudflare(pagina, 25);
console.log("   Título final:", t);
console.log("   URL final:", pagina.url());

const html2 = await pagina.content().catch(() => "");
console.log("   LARGO HTML:", html2.length);
fs.writeFileSync("akinator_dump2.html", html2);
console.log("   Guardado en akinator_dump2.html");

await navegador.close();
