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

console.log("1) Portada...");
await pagina.goto("https://es.akinator.com", { waitUntil: "domcontentloaded", timeout: 45000 });
await esperarQueResuelvaCloudflare(pagina);

console.log("2) Clic en JUGAR...");
await pagina.click('a[onclick*="jouer"]').catch(() => {});
await esperarQueResuelvaCloudflare(pagina, 25);

console.log("3) Clic en Personaje...");
await pagina.click('li[onclick*="chooseTheme"]').catch((e) => console.log("   no se pudo clickear:", e.message));
await esperarQueResuelvaCloudflare(pagina, 25);
await esperar(2000); // margen extra para que la pregunta 1 termine de pintarse

console.log("   Título:", await pagina.title().catch(() => ""));
console.log("   URL:", pagina.url());

const html3 = await pagina.content().catch(() => "");
console.log("   LARGO HTML:", html3.length);
fs.writeFileSync("akinator_dump3.html", html3);
console.log("   Guardado en akinator_dump3.html");

await navegador.close();
