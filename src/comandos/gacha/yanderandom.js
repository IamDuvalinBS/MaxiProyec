import { ownerCommand } from "../../../motores/owner.js";
import { agregarAleatorias } from "../../../motores/gacha-yandere.js";
import { gachaListo, tarjeta } from "../../../motores/gacha-core.js";
import { contarPersonajes } from "../../../motores/gacha-db.js";

const POR_DEFECTO = 5;
const MAXIMO = 10;
let ocupado = false;

export default {
  names: [".yanderandom"],
  desc: "Agrega waifus nuevas desde yande.re, sin duplicados (solo owners)",
  category: "Gacha",
  usage: ".yanderandom [cantidad]",
  handler: ownerCommand(async ({ cleanText, reply }) => {
    await gachaListo;
    if (ocupado) return reply({ text: "⏳ Ya hay una carga en curso, esperá a que termine." });
    const n = Math.min(MAXIMO, Math.max(1, parseInt(cleanText.split(/\s+/)[1], 10) || POR_DEFECTO));

    ocupado = true;
    try {
      await reply({ text: `🔎 Buscando *${n}* waifus nuevas en yande.re... (la primera vez tarda más porque aprende los tipos de tags).` });
      const { agregadas, rechazos } = await agregarAleatorias(n);

      const lineas = [];
      if (agregadas.length) lineas.push(...agregadas.map((p, i) => `${i + 1}. *${p.nombre}* — ${p.serie} · ${p.rareza}`));
      else lineas.push("No se encontró ningún personaje nuevo en esta tanda.");
      const motivos = Object.entries(rechazos).sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (motivos.length) lineas.push("", "🚫 *Descartados*", ...motivos.map(([m, c]) => `• ${m}: ${c}`));
      lineas.push("", `📚 *Waifus en la base* ›› ${contarPersonajes("waifu")}`);

      await reply({ text: tarjeta({ emoji: "📥", titulo: `AGREGADAS ${agregadas.length}/${n}`, lineas }) });
    } catch (e) {
      await reply({ text: `❌ Error consultando yande.re: ${e.message}` });
    } finally {
      ocupado = false;
    }
  })
};
