import { gachaListo, CAT } from "../../../motores/gacha-core.js";
import { categoriaPorAlias } from "../../../motores/gacha-categorias.js";
import { mejorDe } from "../../../motores/gacha-db.js";
import { NIVEL_MAX, estrellasTexto } from "../../../motores/gacha-niveles.js";
import { poderesActivos } from "../../../motores/gacha-poderes.js";
import { TAMANO_EQUIPO, equipoDe, guardarEquipo } from "../../../motores/gacha-equipos.js";
import { encabezado } from "../../../src/economia/estilo.js";

const identificador = (texto) => (/^#?\d+$/.test(texto || "") ? parseInt(String(texto).replace("#", ""), 10) : null);

function ayuda() {
  return [
    encabezado("🛡️", "EQUIPO"),
    "",
    `> Arma un equipo de hasta ${TAMANO_EQUIPO} personajes por gacha para las batallas por equipos. Si no guardas uno se usan tus ${TAMANO_EQUIPO} personajes de mayor nivel.`,
    "",
    "✱ *Ver equipo* ›› .equipo <categoría>",
    "✿ *Guardar equipo* ›› .equipo <categoría> <ID> <ID> <ID>",
    "✦ *Quitar equipo* ›› .equipo <categoría> quitar",
    "",
    `> Categorías: ${Object.keys(CAT).join(", ")}.`,
    "> Para pelear usa el comando de PvP de esa categoría con la palabra *equipo*. Ejemplo: *.pokemonpvp @usuario 500 equipo*."
  ].join("\n");
}

function tarjeta(categoria, personajes, automatico) {
  const cat = CAT[categoria];
  const lineas = [encabezado("🛡️", `EQUIPO ${cat.titulo}`), ""];
  if (!personajes.length) {
    lineas.push(`> Todavía no tienes ${cat.unidades}. Consigue uno con *${cat.rollCmd}*.`);
    return lineas.join("\n");
  }
  lineas.push(automatico ? "> Equipo automático: tus personajes de mayor nivel." : "> Equipo guardado.", "");
  personajes.forEach((p, i) => {
    const estrellas = estrellasTexto(p.estrellas);
    lineas.push(`${i + 1}. *${p.nombre}* (#${p.id}) ›› Nv. ${p.nivel}/${NIVEL_MAX[categoria]}${estrellas ? ` ${estrellas}` : ""}`);
    const poderes = Object.values(poderesActivos(p, p.nivel, NIVEL_MAX[categoria], p.estrellas || 0)).map((x) => x.nombre);
    lineas.push(`> ✦ ${poderes.length ? poderes.join(" · ") : "Sin poderes desbloqueados todavía"}`);
  });
  lineas.push("", "> Pelea ordenado de arriba hacia abajo: cuando un personaje cae entra el siguiente.");
  return lineas.join("\n");
}

export default {
  names: [".equipo", ".team", ".miequipo"],
  desc: "Arma o muestra tu equipo de batalla: .equipo <categoría> [ID ID ID]",
  category: "Gacha",
  usage: ".equipo <categoría> [ID ID ID]",
  handler: async ({ sender, cleanText, reply }) => {
    await gachaListo;
    const partes = cleanText.split(/\s+/).slice(1);
    const categoria = categoriaPorAlias(partes[0]);
    if (!categoria) return reply({ text: ayuda() });

    const resto = partes.slice(1);
    if (resto.some((x) => /^(quitar|borrar|reset|limpiar)$/i.test(x))) {
      guardarEquipo(sender, categoria, []);
      return reply({ text: `✅ Se quitó tu equipo de ${CAT[categoria].unidades}. Se usarán tus personajes de mayor nivel.` });
    }

    const ids = resto.map(identificador).filter(Boolean);
    if (ids.length) {
      if (new Set(ids).size !== ids.length) return reply({ text: "❌ No repitas el mismo ID en tu equipo." });
      if (ids.length > TAMANO_EQUIPO) return reply({ text: `❌ Un equipo puede tener como máximo ${TAMANO_EQUIPO} personajes.` });
      for (const id of ids) {
        if (!mejorDe(sender, categoria, id)) return reply({ text: `❌ No tienes ${CAT[categoria].indef} con el ID #${id}.` });
      }
      guardarEquipo(sender, categoria, ids);
    }

    const { personajes, automatico } = equipoDe(sender, categoria);
    return reply({ text: tarjeta(categoria, personajes, automatico) });
  }
};
