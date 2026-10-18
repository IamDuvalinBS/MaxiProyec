import { gachaListo, CAT } from "../../../motores/gacha-core.js";
import { categoriaPorAlias } from "../../../motores/gacha-categorias.js";
import { mejorDe, personajePorId } from "../../../motores/gacha-db.js";
import { NIVEL_MAX, estrellasTexto } from "../../../motores/gacha-niveles.js";
import { poderesDe } from "../../../motores/gacha-poderes.js";
import { encabezado } from "../../../src/economia/estilo.js";
import { T } from "../../../motores/gacha-tema.js";

const identificador = (texto) => (/^#?\d+$/.test(texto || "") ? parseInt(String(texto).replace("#", ""), 10) : null);

function ayuda() {
  return [
    encabezado("⚡", T("PODERES", "PODERES OSCUROS")),
    "",
    "> Cada personaje tiene 4 poderes: una habilidad, un poder estelar, una mejora y una hipercarga. Se desbloquean al subir de nivel y se vuelven más fuertes con el nivel y las estrellas.",
    "",
    "✱ *Uso* ›› .poderes <categoría> [ID]",
    "✿ *Ejemplo* ›› .poderes pokemon 25",
    "",
    `> Categorías: ${Object.keys(CAT).join(", ")}.`,
    "> Si no indicas el ID se muestran los poderes de tu personaje de mayor nivel."
  ].join("\n");
}

export default {
  names: [".poderes", ".powers", ".habilidades"],
  desc: "Muestra los poderes de un personaje: .poderes <categoría> [ID]",
  category: "Gacha",
  usage: ".poderes <categoría> [ID]",
  handler: async ({ sender, cleanText, reply }) => {
    await gachaListo;
    const partes = cleanText.split(/\s+/).slice(1);
    const categoria = categoriaPorAlias(partes[0]);
    if (!categoria) return reply({ text: ayuda() });

    const charId = identificador(partes[1]);
    let personaje = mejorDe(sender, categoria, charId);
    let propio = Boolean(personaje);

    if (!personaje && charId) {
      const base = personajePorId(charId);
      if (!base || base.categoria !== categoria) return reply({ text: `❌ No existe ${CAT[categoria].indef} con el ID #${charId}.` });
      personaje = { ...base, nivel: 1, estrellas: 0 };
    }
    if (!personaje) return reply({ text: `❌ Todavía no tienes ${CAT[categoria].indef}. Consíguelo con *${CAT[categoria].rollCmd}*.` });

    const nivel = personaje.nivel || 1;
    const estrellas = personaje.estrellas || 0;
    const lista = poderesDe(personaje, nivel, NIVEL_MAX[categoria], estrellas);

    const lineas = [
      encabezado("⚡", T("PODERES", "PODERES OSCUROS")),
      "",
      `> Poderes de *${personaje.nombre}* (#${personaje.id}).`,
      `📊 *Nivel* ›› ${nivel}/${NIVEL_MAX[categoria]}${estrellas ? ` ${estrellasTexto(estrellas)}` : ""}`,
      ""
    ];
    for (const poder of lista) {
      lineas.push(`${poder.emoji} *${poder.etiqueta}* ›› ${poder.nombre} ${poder.activo ? "✅" : "🔒"}`);
      lineas.push(`> ${poder.descripcion}`);
      if (!poder.activo) lineas.push(`> Se desbloquea en el nivel ${poder.requiere}.`);
    }
    lineas.push("", T("> Los poderes se activan solos durante los combates PvP y las batallas por equipos.", "> Los poderes se activan solos durante los duelos PvP y las batallas macabras por equipos."));
    if (!propio) lineas.push("> No tienes este personaje, por eso se muestra al nivel 1.");
    return reply({ text: lineas.join("\n") });
  }
};
