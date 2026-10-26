import { baseLista, pruebaBase } from "../motores/juegos-records.js";
import { urlPublica } from "../motores/juegos-api.js";

export default {
  names: [".gdiag"],
  desc: "Diagnóstico del guardado de récords de los juegos",
  category: "Juegos",
  usage: ".gdiag",
  handler: async ({ reply }) => {
    const prueba = await pruebaBase();
    const url = urlPublica();
    let host = "no configurada";
    try { if (url) host = new URL(url).host; } catch { host = "inválida"; }
    const lineas = [
      "🩺 *Diagnóstico de récords*",
      `🗄️ Mongo conectado: ${baseLista() ? "✅" : "❌"}`,
      `✍️ Prueba de escritura: ${prueba.ok ? "✅" : "❌"} (${prueba.motivo})`,
      `🌐 URL pública (JUEGOS_URL): ${url ? "✅ " + host : "❌ no configurada"}`,
      `🔑 JUEGOS_SECRET: ${process.env.JUEGOS_SECRET ? "✅" : "⚠️ no definido"}`,
      url ? "" : "ℹ️ Sin URL pública el juego guarda con el botón 📨 (envía el mensaje al bot)."
    ].filter(Boolean);
    await reply({ text: lineas.join("\n") });
  }
};
