import { gachaListo, textoStats } from "../../../motores/gacha-core.js";
import { encabezado } from "../../../src/economia/estilo.js";
import { subirBrawler, NIVEL_MAX } from "../../../motores/gacha-niveles.js";

export default {
  names: [".subirbrawler", ".levelupbrawler"],
  desc: "Gasta cubitos de fuerza para subir de nivel a un Brawler: .subirbrawler [ID] [cantidad|max]",
  category: "Gacha",
  usage: ".subirbrawler [ID] [cantidad|max]",
  handler: async ({ sender, cleanText, reply }) => {
    await gachaListo;
    const partes = cleanText.split(/\s+/).slice(1);
    const numeros = partes.filter((x) => /^#?\d+$/.test(x));
    const conGato = numeros.find((x) => x.startsWith("#"));
    let idTok = null;
    let cantidadTok = null;
    if (conGato) {
      idTok = conGato;
      cantidadTok = numeros.find((x) => !x.startsWith("#"));
    } else if (numeros.length >= 2) {
      [idTok, cantidadTok] = numeros;
    } else if (numeros.length === 1) {
      [cantidadTok] = numeros;
    }
    const veces = partes.includes("max") ? Infinity : Math.max(1, parseInt(cantidadTok || "1", 10));
    const charId = idTok ? parseInt(idTok.replace("#", ""), 10) : null;

    const r = subirBrawler({ sender, charId, veces });
    if (r.error === "sinpersonajes") return reply({ text: "❌ Todavía no tienes ningún brawler. Consigue uno con *.brawlstars* y reclámalo con *.drop*." });
    if (r.error === "ajeno") return reply({ text: `❌ No tienes ningún brawler con el ID #${charId}.` });
    if (r.error === "maximo") return reply({ text: `🏆 *${r.p.nombre}* ya está en el nivel máximo (${NIVEL_MAX.brawler}).` });
    if (r.error === "cubitos") {
      return reply({
        text: `❌ Para subir a *${r.p.nombre}* al nivel ${r.p.nivel + 1} necesitas ${r.necesarios} cubitos y tienes ${r.tiene}. Compra los que faltan con *.comprarcubitos ${r.faltan}*.`
      });
    }

    return reply({
      text: [
        encabezado("⭐", "BRAWLER MEJORADO"),
        "",
        `✍🏻 *Nombre* ›› ${r.p.nombre} (#${r.p.id})`,
        `📊 *Nivel* ›› ${r.antes} → *${r.despues}* / ${NIVEL_MAX.brawler}`,
        textoStats(r.stats),
        `🟪 *Gastaste* ›› ${r.gastados} cubitos (te quedan ${r.restantes})`
      ].join("\n")
    });
  }
};
