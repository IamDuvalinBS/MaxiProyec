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

const uaOriginal = await navegador.userAgent();
await pagina.setUserAgent(uaOriginal.replace("HeadlessChrome", "Chrome"));
await pagina.evaluateOnNewDocument(() => {
  Object.defineProperty(navigator, "webdriver", { get: () => undefined });
});

try {
  console.log("Cargando es.akinator.com...");
  await pagina.goto("https://es.akinator.com", { waitUntil: "domcontentloaded", timeout: 45000 });
  console.log("DOM cargado. Esperando 6s más por si hay desafío de Cloudflare...");
  await new Promise((r) => setTimeout(r, 6000));
} catch (e) {
  console.log("⚠️ goto() falló o hizo timeout:", e.message);
  console.log("Sigo igual para ver qué se alcanzó a cargar...");
}

const titulo = await pagina.title().catch(() => "(no se pudo leer)");
const html = await pagina.content().catch(() => "");

console.log("TITULO:", titulo);
console.log("LARGO HTML:", html.length);
console.log("TIENE 'signature':", html.includes("signature"));
console.log("TIENE 'Just a moment' (Cloudflare):", html.includes("Just a moment"));

fs.writeFileSync("akinator_dump.html", html);
console.log("Guardado en akinator_dump.html");

await navegador.close();
