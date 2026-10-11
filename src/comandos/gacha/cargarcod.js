import { ownerGacha } from "../../../motores/gacha-owners.js";
import { gachaListo } from "../../../motores/gacha-core.js";
import { sincronizarCod, buscarCategoriasCod, WIKI_COD } from "../../../motores/gacha-catalogos.js";
import { contarPersonajes } from "../../../motores/gacha-db.js";
import { encabezado } from "../../../src/economia/estilo.js";

let enCurso = false;

const PLAN_AUTOMATICO = [
  { busqueda: "operators", tipo: "Operador" },
  { busqueda: "skins", tipo: "Skin" },
  { busqueda: "weapons", tipo: "Arma" }
];

const MAXIMO_CATEGORIAS_POR_BUSQUEDA = 25;
const PAUSA_ENTRE_CATEGORIAS_MS = 400;
const CATEGORIAS_EXCLUIDAS = /(stub|disambiguation|template|trivia|unreleased|cut content|navigation|images?|files?|pages? needing|redirect)/i;

const AYUDA = [
  encabezado("🔫", "IMPORTAR CALL OF DUTY"),
  "",
  "> Importa operadores, skins y armas desde la wiki de Call of Duty.",
  "",
  "✦ *Importar todo* ›› .cargarcod todo",
  "✱ *Buscar categorías* ›› .cargarcod buscar <texto>",
  "✿ *Importar una sola* ›› .cargarcod <categoría> | <tipo>",
  "",
  "> *.cargarcod todo* busca las categorías de operadores, skins y armas por sí solo y las importa una por una.",
  "> El tipo de una importación manual puede ser Operador, Skin o Arma. Si no lo indicas se usa Operador."
].join("\n");

const pausa = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

async function importarTodo(reply) {
  const resumen = [];
  const vistas = new Set();
  let totalEncontrados = 0;
  let totalNuevos = 0;
  let fallidas = 0;

  for (const { busqueda, tipo } of PLAN_AUTOMATICO) {
    let categorias = [];
    try {
      categorias = await buscarCategoriasCod(busqueda);
    } catch (e) {
      console.log(`[gacha] Búsqueda de COD (${busqueda}):`, e.message);
      resumen.push(`❌ *${tipo}* ›› no se pudo buscar categorías: ${e.message}`);
      fallidas++;
      continue;
    }

    const elegidas = categorias
      .filter((c) => !CATEGORIAS_EXCLUIDAS.test(c))
      .filter((c) => {
        const clave = c.toLowerCase();
        if (vistas.has(clave)) return false;
        vistas.add(clave);
        return true;
      })
      .slice(0, MAXIMO_CATEGORIAS_POR_BUSQUEDA);

    if (!elegidas.length) {
      resumen.push(`📭 *${tipo}* ›› sin categorías para *${busqueda}*`);
      continue;
    }

    await reply({ text: `⏳ ${tipo}: se importarán ${elegidas.length} categorías.` });

    for (const categoria of elegidas) {
      try {
        const r = await sincronizarCod(categoria, tipo);
        totalEncontrados += r.total || 0;
        totalNuevos += r.nuevos || 0;
        if (r.total) resumen.push(`✦ ${categoria} (${tipo}) ›› ${r.total} encontrados, ${r.nuevos} nuevos`);
      } catch (e) {
        console.log(`[gacha] Importación de COD (${categoria}):`, e.message);
        resumen.push(`⚠️ ${categoria} (${tipo}) ›› ${e.message}`);
        fallidas++;
      }
      await pausa(PAUSA_ENTRE_CATEGORIAS_MS);
    }
  }

  return { resumen, totalEncontrados, totalNuevos, fallidas };
}

export default {
  names: [".cargarcod", ".importarcod"],
  desc: "Importa personajes, skins o armas de Call of Duty desde su wiki (solo owners)",
  category: "Gacha",
  usage: ".cargarcod todo | .cargarcod buscar <texto> | .cargarcod <categoría> | <tipo>",
  handler: ownerGacha(async ({ cleanText, reply }) => {
    await gachaListo;
    const argumentos = cleanText.split(/\s+/).slice(1).join(" ").trim();

    if (/^(ayuda|help)$/i.test(argumentos)) return reply({ text: AYUDA });

    if (!argumentos || /^(todo|todos|auto|automatico|automático)$/i.test(argumentos)) {
      if (enCurso) return reply({ text: "⏳ Ya hay una importación de Call of Duty en curso. Espera a que termine." });
      enCurso = true;
      try {
        await reply({ text: "⏳ Buscando e importando operadores, skins y armas de Call of Duty. Puede tardar varios minutos." });
        const r = await importarTodo(reply);
        return reply({
          text: [
            encabezado("🔫", "COD IMPORTADO"),
            "",
            `> Importación automática desde ${WIKI_COD.replace("https://", "")}.`,
            "",
            ...(r.resumen.length ? r.resumen.slice(0, 40) : ["📭 No se importó ninguna categoría."]),
            "",
            `📚 *Encontrados* ›› ${r.totalEncontrados}`,
            `🆕 *Agregados* ›› ${r.totalNuevos}`,
            `⚠️ *Categorías con error* ›› ${r.fallidas}`,
            `🔫 *Ítems de COD en el gacha* ›› ${contarPersonajes("cod")}`
          ].join("\n")
        });
      } catch (e) {
        console.log("[gacha] Importación automática de COD:", e.message);
        return reply({ text: `❌ No se pudo completar la importación: ${e.message}` });
      } finally {
        enCurso = false;
      }
    }

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
                                 
