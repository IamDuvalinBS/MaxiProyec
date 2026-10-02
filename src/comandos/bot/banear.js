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

    if (grupoAlias && grupoAlias.some((n) => ["banear", "desbanear", "baneos"].includes(n.replace(".", "").toLowerCase()))) {
      return reply({ text: "⚠️ Los comandos *.banear*, *.desbanear* y *.baneos* no se pueden desactivar." });
    }

    if (!grupoAlias && !categoria) {
      return reply({ text: `⚠️ No se encontró ningún comando ni categoría llamada *${valor}*.\nSi es un comando, escríbelo con el punto: *.play*` });
    }

    if (accion === ".banear") {
      if (grupoAlias) grupoAlias.forEach(banearComando);
      else banearCategoria(categoria);
      const etiqueta = grupoAlias ? grupoAlias.join(" / ") : categoria;
      return reply({ text: `🚫 *${etiqueta}* quedó desactivado para todos, incluido el owner. Usa *.desbanear ${valor}* para reactivarlo.` });
    }

    if (grupoAlias) grupoAlias.forEach(desbanearComando);
    else desbanearCategoria(categoria);
    const etiqueta = grupoAlias ? grupoAlias.join(" / ") : categoria;
    return reply({ text: `✅ *${etiqueta}* quedó reactivado.` });
  })
};
