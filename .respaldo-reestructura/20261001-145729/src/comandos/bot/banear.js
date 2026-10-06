import {
  banearComando,
  desbanearComando,
  banearCategoria,
  desbanearCategoria,
  listarBaneos,
  commandRegistry
} from "../../../core.js";
import { ownerCommand } from "../../../motores/owner.js";

function categoriasConocidas() {
  const set = new Set();
  for (const info of commandRegistry.values()) set.add(info.category);
  return [...set];
}

function esCategoria(valor) {
  return categoriasConocidas().some((c) => c.toLowerCase() === valor.toLowerCase());
}

// Un comando puede tener varios alias (.ping / .p). Bannear uno solo de los
// alias dejaria los demas sin banear, asi que se busca el grupo completo.
function todosLosAliasDe(alias) {
  for (const info of commandRegistry.values()) {
    if (info.names.map((n) => n.toLowerCase()).includes(alias.toLowerCase())) return info.names;
  }
  return null;
}

export default {
  names: [".banear", ".desbanear", ".baneos"],
  usage: ".banear <comando o categoría> | .desbanear <comando o categoría> | .baneos",
  desc: "Desactivar o reactivar un comando o una categoría entera (solo owner)",
  category: "Utilidad",
  handler: ownerCommand(async ({ cleanText, reply }) => {
    const partes = cleanText.trim().split(/\s+/);
    const accion = partes[0].toLowerCase();
    const valor = partes.slice(1).join(" ").trim();

    if (accion === ".baneos") {
      const { comandos, categorias } = listarBaneos();
      if (!comandos.length && !categorias.length) return reply({ text: "✅ No hay nada baneado ahora mismo." });
      const texto =
        "🚫 *BANEADO ACTUALMENTE*\n\n" +
        (categorias.length ? `*Categorías::* ${categorias.join(", ")}\n` : "") +
        (comandos.length ? `*Comandos::* ${comandos.join(", ")}` : "");
      return reply({ text: texto.trim() });
    }

    if (!valor) {
      return reply({ text: "⚙️ Uso: *.banear <comando o categoría>*\nEjemplo: *.banear Descargas* o *.banear .play*" });
    }

    const alias = valor.toLowerCase().startsWith(".") ? valor.toLowerCase() : null;
    const grupoAlias = alias ? todosLosAliasDe(alias) : null;
    const categoria = !grupoAlias && esCategoria(valor) ? valor : null;

    if (!grupoAlias && !categoria) {
      return reply({ text: `⚠️ No encontré ningún comando ni categoría llamada *${valor}*.\nSi es un comando, escribilo con el punto: *.play*` });
    }

    if (accion === ".banear") {
      if (grupoAlias) grupoAlias.forEach(banearComando);
      else banearCategoria(categoria);
      const etiqueta = grupoAlias ? grupoAlias.join(" / ") : categoria;
      return reply({ text: `🚫 *${etiqueta}* quedó desactivado para todos. Usa *.desbanear ${valor}* para reactivarlo.` });
    }

    if (grupoAlias) grupoAlias.forEach(desbanearComando);
    else desbanearCategoria(categoria);
    const etiqueta = grupoAlias ? grupoAlias.join(" / ") : categoria;
    return reply({ text: `✅ *${etiqueta}* quedó reactivado.` });
  })
};
