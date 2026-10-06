// test_chromium_completo.js
import puppeteer from "puppeteer-core";

const RUTA = "/data/data/com.termux/files/usr/bin/chromium-browser";

try {
  const navegador = await puppeteer.launch({
    executablePath: RUTA,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
  });
  const version = await navegador.version();
  console.log("✅ Arrancó bien:", version);
  await navegador.close();
} catch (e) {
  console.log("❌ Falló al arrancar:", e.message);
}
