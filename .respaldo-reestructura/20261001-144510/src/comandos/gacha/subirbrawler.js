import { gachaListo, tarjeta, textoStats } from "../../../motores/gacha-core.js";
import { subirBrawler, NIVEL_MAX } from "../../../motores/gacha-niveles.js";

export default {
  names: [".subirbrawler", ".levelupbrawler"],
  desc: "Gasta cubitos de fuerza para subir de nivel a un Brawler (máximo 30)",
  category: "Gacha",
  usage: ".subirbrawler [#id] [cantidad|max]",
  handler: async ({ sender, cleanText, reply }) => {
    await gachaListo;
    const partes = cleanText.split(/\s+/).slice(1);
    const idTok = partes.find((x) => /^#\d+$/.test(x));
    const veces = partes.includes("max") ? Infinity : Math.max(1, parseInt(partes.find((x) => /^\d+$/.test(x)) || "1", 10));

    const r = subirBrawler({ sender, charId: idTok ? parseInt(idTok.slice(1), 10) : null, veces });
    if (r.error === "sinpersonajes") return reply({ text: "❌ Todavía no tenés ningún brawler. Conseguí uno con *.brawlstars* y *.drop*." });
    if (r.error === "ajeno") return reply({ text: `❌ No tenés ningún brawler con ID ${idTok}.` });
    if (r.error === "maximo") return reply({ text: `🏆 *${r.p.nombre}* ya está en el nivel máximo (${NIVEL_MAX.brawler}).` });
    if (r.error === "cubitos") {
      return reply({ text: `❌ Para subir a *${r.p.nombre}* al nivel ${r.p.nivel + 1} necesitás ${r.necesarios} cubitos y tenés ${r.tiene}. Comprá con *.cubitos comprar ${r.faltan}*.` });
    }

    return reply({
      text: tarjeta({
        emoji: "⭐", titulo: "BRAWLER MEJORADO",
        lineas: [
          `👤 *Nombre* ›› ${r.p.nombre} (#${r.p.id})`,
          `📊 *Nivel* ›› ${r.antes} → *${r.despues}* / ${NIVEL_MAX.brawler}`,
          textoStats(r.stats),
          `🟪 *Gastaste* ›› ${r.gastados} cubitos (te quedan ${r.restantes})`
        ]
      })
    });
  }
};
