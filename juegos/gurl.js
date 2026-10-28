import { ownerCommand } from "../motores/owner.js";
import { fijarUrl, urlPublica, origenUrl } from "../motores/juegos-api.js";

export default {
  names: [".gurl"],
  desc: "(Owner) Fija la URL pública del bot para que los juegos guarden los récords solos",
  category: "Juegos",
  usage: ".gurl https://tu-url-publica   |   .gurl borrar",
  handler: ownerCommand(async ({ cleanText, reply }) => {
    const arg = String(cleanText || "").trim().split(/\s+/)[1];
    if (!arg) {
      const u = urlPublica();
      return reply({
        text: `🌐 *URL pública para los juegos*\nActual: ${u || "ninguna"}\nOrigen: ${origenUrl()}\n\nUso: *.gurl https://tu-url-publica* (sin "/" al final) o *.gurl borrar*`
      });
    }
    if (/^(borrar|quitar|off)$/i.test(arg)) {
      await fijarUrl("");
      return reply({ text: "🗑️ URL manual borrada." });
    }
    const ok = await fijarUrl(arg);
    return reply({
      text: ok
        ? `✅ URL guardada: ${arg}\n\nPrueba desde tu celular: abre *${arg.replace(/\/+$/, "")}/juegos/ping* → debe mostrar {"ok":true}.\nLos juegos nuevos que abras ya guardarán solos.`
        : '❌ URL inválida. Ejemplo: https://mi-bot.onrender.com'
    });
  })
};
