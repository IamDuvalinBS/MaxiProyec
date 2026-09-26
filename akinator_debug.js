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

console.log("1) Cargando portada...");
await pagina.goto("https://es.akinator.com", { waitUntil: "domcontentloaded", timeout: 45000 });
await new Promise((r) => setTimeout(r, 4000));
console.log("   Título portada:", await pagina.title());

console.log("2) Haciendo clic en JUGAR...");
try {
  await Promise.all([
    pagina.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }),
    pagina.click('a[onclick*="jouer"]')
  ]);
} catch (e) {
  console.log("⚠️ No hubo navegación clásica (puede que haya cambiado el DOM sin recargar la página):", e.message);
}
await new Promise((r) => setTimeout(r, 3000));

const titulo2 = await pagina.title().catch(() => "(no se pudo leer)");
const url2 = pagina.url();
const html2 = await pagina.content().catch(() => "");

console.log("   Título después de JUGAR:", titulo2);
console.log("   URL después de JUGAR:", url2);
console.log("   LARGO HTML:", html2.length);

fs.writeFileSync("akinator_dump2.html", html2);
console.log("   Guardado en akinator_dump2.html");

await navegador.close();
