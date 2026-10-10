import { ownerGacha } from "../../../motores/gacha-owners.js";
import { gachaListo } from "../../../motores/gacha-core.js";
import { sincronizarDragones, WIKI_DRAGONES } from "../../../motores/gacha-catalogos.js";
import { contarPersonajes } from "../../../motores/gacha-db.js";
import { encabezado } from "../../../src/economia/estilo.js";

let enCurso = false;

export default {
  names: [".cargardragones", ".importardragones"],
  desc: "Importa los dragones de Dragon Mania Legends desde su wiki (solo owners)",
  category: "Gacha",
  usage: ".cargardragones [categoría de la wiki]",
  handler: ownerGacha(async ({ cleanText, reply }) => {
    await gachaListo;
    if (enCurso) return reply({ text: "⏳ Ya hay una importación de dragones en curso. Espera a que termine." });

    const categoria = cleanText.split(/\s+/).slice(1).join(" ").trim() || "Dragons";
    enCurso = true;
    try {
      await reply({ text: `⏳ Importando los dragones de la categoría *${categoria}* desde ${WIKI_DRAGONES.replace("https://", "")}. Puede tardar un minuto.` });
      const r = await sincronizarDragones(categoria);
      return reply({
        text: [
          encabezado("🐉", "DRAGONES IMPORTADOS"),
          "",
          `> Categoría de la wiki: *${categoria}*.`,
          "",
          `📚 *Encontrados* ›› ${r.total}`,
          `🆕 *Agregados* ›› ${r.nuevos}`,
          `🐉 *Dragones en el gacha* ›› ${contarPersonajes("dragon")}`,
          "",
          "> La rareza de cada dragón se asigna de forma estable a partir de su nombre, porque la wiki no la expone de forma uniforme."
        ].join("\n")
      });
    } catch (e) {
      console.log("[gacha] Importación de dragones:", e.message);
      return reply({ text: `❌ No se pudo importar desde la wiki: ${e.message}` });
    } finally {
      enCurso = false;
    }
  })
};
