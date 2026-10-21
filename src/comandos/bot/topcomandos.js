import { config } from "../../../core.js";
import { topComandos } from "../../../motores/estadisticas.js";

const MEDALLAS = ["🥇", "🥈", "🥉", "✨", "🌟", "💫", "🔥", "⚡", "💎", "🎯"];

const compacto = (n) => {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + " mill.";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + " mil";
  return String(n);
};

const construirHtml = ({ top, total }) => {
  const maximo = top[0].usos;
  const filas = top.map((c, i) => {
    const pct = Math.round((c.usos / total) * 100);
    const ancho = Math.max(2, Math.round((c.usos / maximo) * 100));
    return `<div class="fila"><div class="datos"><span>${MEDALLAS[i]} ${c._id} — ${pct}%</span><span class="num">${compacto(c.usos)}</span></div><div class="pista"><div class="barra" style="width:${ancho}%"></div></div></div>`;
  }).join("");

  return String.raw`<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;background:#1f1f1f;font-family:sans-serif;color:#fff}
.tarjeta{padding:20px}
h1{font-size:22px;margin:0 0 18px}
.fila{margin-bottom:16px}
.datos{display:flex;justify-content:space-between;font-size:18px;margin-bottom:7px}
.num{font-size:15px;color:#cfcfcf}
.pista{background:#3a3a3a;height:9px;border-radius:6px}
.barra{background:#1e7bff;height:9px;border-radius:6px}
.firma{text-align:right;font-size:12px;color:#8a8a8a;margin-top:6px}
</style></head><body>
<div class="tarjeta"><h1>📊 Top 10 Comandos Más Usados</h1>${filas}<div class="firma">${config.botNameShort || "Mambo"}</div></div>
</body></html>`;
};

const construirTexto = ({ top, total }) => {
  const maximo = top[0].usos;
  const lineas = top.map((c, i) => {
    const pct = Math.round((c.usos / total) * 100);
    const llenos = Math.max(1, Math.round((c.usos / maximo) * 10));
    return `${MEDALLAS[i]} *${c._id}* — ${pct}% ››  ${compacto(c.usos)}\n${"█".repeat(llenos)}${"░".repeat(10 - llenos)}`;
  });
  return `📊 *Top 10 Comandos Más Usados*\n\n${lineas.join("\n\n")}`;
};

export default {
  names: [".topcomandos", ".topcmd"],
  desc: "Ver los 10 comandos más usados del bot",
  category: "General",
  handler: async ({ sock, from, reply }) => {
    const datos = await topComandos(10);
    if (!datos || !datos.top.length) return reply({ text: "⚠️ Todavía no hay comandos registrados." });

    try {
      if (typeof sock.sendHtml !== "function") throw new Error("sin sendHtml");
      await sock.sendHtml(from, construirHtml(datos), [], undefined, {});
    } catch {
      await reply({ text: construirTexto(datos) });
    }
  }
};
