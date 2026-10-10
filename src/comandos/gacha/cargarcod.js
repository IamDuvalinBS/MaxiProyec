import { ownerGacha } from "../../../motores/gacha-owners.js";
import { gachaListo } from "../../../motores/gacha-core.js";
import { sincronizarCod, buscarCategoriasCod, WIKI_COD } from "../../../motores/gacha-catalogos.js";
import { contarPersonajes } from "../../../motores/gacha-db.js";
import { encabezado } from "../../../src/economia/estilo.js";

let enCurso = false;

const AYUDA = [
  encabezado("🔫", "IMPORTAR CALL OF DUTY"),
  "",
  "> Importa operadores, skins o armas desde la wiki de Call of Duty, una categoría a la vez.",
  "",
  "✱ *Buscar categorías* ›› .cargarcod buscar <texto>",
  "✿ *Importar* ›› .cargarcod <categoría> | <tipo>",
  "",
  "> Ejemplo: *.cargarcod buscar operators* y luego *.cargarcod Call of Duty: Mobile Operators | Operador*.",
  "> El tipo puede ser Operador, Skin o Arma. Si no lo indicas se usa Operador."
].join("\n");

export default {
  names: [".cargarcod", ".importarcod"],
  desc: "Importa personajes, skins o armas de Call of Duty desde su wiki (solo owners)",
  category: "Gacha",
  usage: ".cargarcod buscar <texto> | .cargarcod <categoría> | <tipo>",
  handler: ownerGacha(async ({ cleanText, reply }) => {
    await gachaListo;
    const argumentos = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!argumentos) return reply({ text: AYUDA });

    if (/^buscar\s+/i.test(argumentos)) {
      const texto = argumentos.replace(/^buscar\s+/i, "");
      try {
        const categorias = await buscarCategoriasCod(texto);
        if (!categorias.length) return reply({ text: `📭 No se encontraron categorías para *${texto}*.` });
        return reply({
          text: [
            encabezado("🔎", "CATEGORÍAS ENCONTRADAS"),
            "",
            `> Resultados de la wiki ${WIKI_COD.replace("https://", "")} para *${texto}*.`,
            "",
            ...categorias.map((c) => `✦ ${c}`),
            "",
            "> Para importar una usa *.cargarcod <categoría> | <tipo>*."
          ].join("\n")
        });
      } catch (e) {
        return reply({ text: `❌ No se pudo consultar la wiki: ${e.message}` });
      }
    }

    if (enCurso) return reply({ text: "⏳ Ya hay una importación de Call of Duty en curso. Espera a que termine." });
    const [categoria, tipoIndicado] = argumentos.split("|").map((x) => x.trim());
    const tipo = tipoIndicado || "Operador";
    enCurso = true;
    try {
      await reply({ text: `⏳ Importando la categoría *${categoria}* como *${tipo}*. Puede tardar unos segundos.` });
      const r = await sincronizarCod(categoria, tipo);
      if (!r.total) return reply({ text: `📭 La categoría *${categoria}* no tiene páginas. Usa *.cargarcod buscar <texto>* para ver los nombres exactos.` });
      return reply({
        text: [
          encabezado("🔫", "COD IMPORTADO"),
          "",
          `> Categoría de la wiki: *${categoria}* (${tipo}).`,
          "",
          `📚 *Encontrados* ›› ${r.total}`,
          `🆕 *Agregados* ›› ${r.nuevos}`,
          `🔫 *Ítems de COD en el gacha* ›› ${contarPersonajes("cod")}`
        ].join("\n")
      });
    } catch (e) {
      console.log("[gacha] Importación de COD:", e.message);
      return reply({ text: `❌ No se pudo importar desde la wiki: ${e.message}` });
    } finally {
      enCurso = false;
    }
  })
};
