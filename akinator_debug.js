// akinator_debug.js
// Script de UNA SOLA VEZ para diagnosticar. Corré: node akinator_debug.js
import puppeteer from "puppeteer-core";
import fs from "node:fs";

const RUTA_CHROMIUM = "/data/data/com.termux/files/usr/bin/headless_shell";

const navegador = await puppeteer.launch({
  executablePath: RUTA_CHROMIUM,
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  headless: true
});

const pagina = await navegador.newPage();

// Sacamos "Headless" del user-agent: Cloudflare lo detecta fácil si lo dejamos.
const uaOriginal = await navegador.userAgent();
await pagina.setUserAgent(uaOriginal.replace("HeadlessChrome", "Chrome"));

// Escondemos la bandera que delata que es un navegador automatizado.
await pagina.evaluateOnNewDocument(() => {
  Object.defineProperty(navigator, "webdriver", { get: () => undefined });
});

console.log("Cargando es.akinator.com...");
await pagina.goto("https://es.akinator.com", { waitUntil: "networkidle2", timeout: 30000 });

console.log("Esperando 5s por si hay que resolver un desafío de Cloudflare...");
await new Promise((r) => setTimeout(r, 5000));

const titulo = await pagina.title();
const html = await pagina.content();

console.log("TITULO:", titulo);
console.log("LARGO HTML:", html.length);
console.log("TIENE 'signature':", html.includes("signature"));
console.log("TIENE 'Just a moment' (Cloudflare):", html.includes("Just a moment"));

fs.writeFileSync("akinator_dump.html", html);
console.log("Guardado en akinator_dump.html");

await navegador.close();
