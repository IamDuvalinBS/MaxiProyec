import { ownerGacha } from "../../../motores/gacha-owners.js";
import { encabezado } from "../../../src/economia/estilo.js";
import { gachaListo } from "../../../motores/gacha-core.js";
import { analizarWaifusAnteriores, limpiarWaifusAnteriores, guardarGachaPendiente } from "../../../motores/gacha-db.js";

const NIVEL_POR_DEFECTO = 10;

export default {
  names: [".limpiarwaifus", ".borrarwaifus"],
  desc: "Borra los waifus anteriores (no Danbooru) salvo los que algún usuario tenga por encima de cierto nivel (solo owners)",
  category: "Owner",
  usage: ".limpiarwaifus [nivel] | .limpiarwaifus confirmar [nivel]",
  handler: ownerGacha(async ({ cleanText, reply }) => {
    await gachaListo;
    const partes = cleanText.split(/\s+/).slice(1).map((p) => p.toLowerCase());
    const confirmar = partes.includes("confirmar");
    const numero = partes.map((p) => parseInt(p, 10)).find((n) => Number.isFinite(n));
    const nivel = numero ?? NIVEL_POR_DEFECTO;

    const a = analizarWaifusAnteriores(nivel);
    if (!confirmar) {
      const series = [...new Set(a.conservar.map((f) => f.serie).filter(Boolean))];
      return reply({
        text: [
          encabezado("🧹", "LIMPIAR WAIFUS ANTERIORES"),
          "",
          `> Se conservan los waifus que alguien tenga por encima del *nivel ${nivel}* y todos los cargados desde Danbooru.`,
          "",
          `🗑️ *Se borrarán* ›› ${a.borrar.length} personajes (quitados a ${a.propiedades} propietarios)`,
          `🛡️ *Se conservan* ›› ${a.conservar.length} personajes de ${series.length} series`,
          "",
          `> Para ejecutarlo usa *.limpiarwaifus confirmar${numero !== undefined ? ` ${nivel}` : ""}*. No se puede deshacer.`
        ].join("\n")
      });
    }

    const r = limpiarWaifusAnteriores(nivel);
    await guardarGachaPendiente();
    return reply({
      text: [
        encabezado("🧹", "LIMPIEZA COMPLETADA"),
        "",
        `🗑️ *Borrados* ›› ${r.borradas} personajes (${r.propiedades} propiedades quitadas)`,
        `🛡️ *Conservados* ›› ${r.conservadas} personajes de ${r.series.length} series`,
        `🔎 *Registros de posts liberados* ›› ${r.postsQuitados}`,
        "",
        "> Ya puedes usar *.yanderandom* para cargar series nuevas desde Danbooru. Las series de los personajes conservados se completarán con el resto de su reparto."
      ].join("\n")
    });
  })
};
