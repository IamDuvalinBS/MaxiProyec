import { ownerGacha } from "../../../motores/gacha-owners.js";
import { gachaListo } from "../../../motores/gacha-core.js";
import {
  sincronizarDragones,
  sincronizarDragonesArchivo,
  hayArchivoDragones,
  buscarCategoriasDragones
} from "../../../motores/gacha-catalogos.js";
import { contarPersonajes } from "../../../motores/gacha-db.js";
import { encabezado } from "../../../src/economia/estilo.js";

let enCurso = false;

const CATEGORIA_POR_DEFECTO = "Species";

const AYUDA = [
  "✦ *Importar* ›› .cargardragones",
  "✱ *Desde la wiki* ›› .cargardragones wiki [categoría]",
  "✿ *Buscar categorías* ›› .cargardragones buscar <texto>",
  "",
  "> Si existe el archivo *data/dragones.json* se importa desde ahí, sin conexión a la wiki.",
  `> Con *wiki* se consulta la wiki en línea (categoría por defecto: ${CATEGORIA_POR_DEFECTO}).`
].join("\n");

function textoResultado(r, categoria) {
  const origen = r.local ? `Origen: *${r.fuente}*.` : `Categoría de la wiki: *${categoria}* (${r.fuente.replace("https://", "")}).`;
  return [
    encabezado("🐉", "DRAGONES IMPORTADOS"),
    "",
    `> ${origen}`,
    "",
    ...(r.local ? [] : [`📂 *Categorías recorridas* ›› ${r.categorias}`, `🔎 *Encontrados por nombre* ›› ${r.porNombre}`]),
    `📚 *Encontrados* ›› ${r.total}`,
    `🆕 *Agregados* ›› ${r.nuevos}`,
    `🐉 *Dragones en el gacha* ›› ${contarPersonajes("dragon")}`,
    "",
    "> La rareza de cada dragón se asigna de forma estable a partir de su nombre, porque la wiki no la expone de forma uniforme."
  ].join("\n");
}

export default {
  names: [".cargardragones", ".importardragones"],
  desc: "Importa los dragones de Dragon Mania Legends desde un archivo local o desde su wiki (solo owners)",
  category: "Gacha",
  usage: ".cargardragones | .cargardragones wiki [categoría] | .cargardragones buscar <texto>",
  handler: ownerGacha(async ({ cleanText, reply }) => {
    await gachaListo;
    const argumentos = cleanText.split(/\s+/).slice(1).join(" ").trim();

    if (/^(ayuda|help)$/i.test(argumentos)) return reply({ text: [encabezado("🐉", "IMPORTAR DRAGONES"), "", AYUDA].join("\n") });

    if (/^buscar\s+/i.test(argumentos)) {
      const texto = argumentos.replace(/^buscar\s+/i, "");
      try {
        const { fuente, categorias } = await buscarCategoriasDragones(texto);
        if (!categorias.length) return reply({ text: `📭 No se encontraron categorías para *${texto}*.` });
        return reply({
          text: [
            encabezado("🔎", "CATEGORÍAS ENCONTRADAS"),
            "",
            `> Resultados de la wiki ${fuente.replace("https://", "")} para *${texto}*.`,
            "",
            ...categorias.map((c) => `✦ ${c}`),
            "",
            "> Para importar una usa *.cargardragones wiki <categoría>*."
          ].join("\n")
        });
      } catch (e) {
        return reply({ text: `❌ No se pudo consultar la wiki: ${e.message}` });
      }
    }

    if (enCurso) return reply({ text: "⏳ Ya hay una importación de dragones en curso. Espera a que termine." });

    const enLinea = /^wiki\b/i.test(argumentos);
    const categoriaIndicada = enLinea ? argumentos.replace(/^wiki\s*/i, "").trim() : argumentos;
    const usarArchivo = !enLinea && !categoriaIndicada && hayArchivoDragones();
    const categoria = categoriaIndicada || CATEGORIA_POR_DEFECTO;

    enCurso = true;
    try {
      if (usarArchivo) {
        await reply({ text: "⏳ Importando los dragones desde el archivo *data/dragones.json*." });
        const r = await sincronizarDragonesArchivo();
        return reply({ text: textoResultado(r, categoria) });
      }
      await reply({ text: `⏳ Importando los dragones de la categoría *${categoria}* desde la wiki. Puede tardar un minuto.` });
      const r = await sincronizarDragones(categoria);
      return reply({ text: textoResultado(r, categoria) });
    } catch (e) {
      console.log("[gacha] Importación de dragones:", e.message);
      return reply({ text: `❌ No se pudo importar los dragones: ${e.message}` });
    } finally {
      enCurso = false;
    }
  })
};
