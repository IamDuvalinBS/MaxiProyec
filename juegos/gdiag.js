import { baseLista, pruebaBase } from "../motores/juegos-records.js";
import { cargarUrl, urlPublica, origenUrl } from "../motores/juegos-api.js";

export default {
  names: [".gdiag"],
  desc: "Diagnóstico del guardado automático de récords de los juegos",
  category: "Juegos",
  usage: ".gdiag",
  handler: async ({ reply }) => {
    await cargarUrl();
    const prueba = await pruebaBase();
    const url = urlPublica();
    const lineas = [
      "🩺 *Diagnóstico de récords*",
      `🗄️ Mongo conectado: ${baseLista() ? "✅" : "❌"}`,
      `✍️ Prueba de escritura: ${prueba.ok ? "✅" : "❌"} (${prueba.motivo})`,
      `🌐 URL pública: ${url ? "✅ " + url : "❌ ninguna"}  (origen: ${origenUrl()})`,
      `🔑 JUEGOS_SECRET: ${process.env.JUEGOS_SECRET ? "✅" : "⚠️ no definido"}`,
      "",
      url
        ? `📱 Prueba desde tu celular: abre ${url}/juegos/ping → debe decir {"ok":true}. Si no abre, el juego no podrá guardar solo.`
        : "ℹ️ Sin URL pública los juegos no pueden guardar solos. Pon una con *.gurl https://tu-url* (o instala cloudflared para un túnel automático)."
    ];
    await reply({ text: lineas.join("\n") });
  }
};
