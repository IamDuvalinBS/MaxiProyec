import {
  banearComando,
  desbanearComando,
  banearCategoria,
  desbanearCategoria,
  listarBaneos,
  commandRegistry
} from "../../../core.js";
import { cambiarBaneoBot, listarBaneosBot } from "../../../motores/ajustes-bot.js";
import { comandoDeBot } from "../../subbots/permisos.js";

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
  desc: "Desactivar o reactivar un comando o una categoría entera. El owner lo aplica a todos los bots; el dueño de un subbot, solo a su subbot",
  category: "Subbots",
  handler: comandoDeBot(async ({ cleanText, reply, objetivo }) => {
    // Owner → baneo global (todos los bots). Dueño de subbot → baneo solo en su subbot.
    const global = objetivo.via === "owner";
    const alcance = global ? "para todos, incluido el owner" : `en tu subbot (${objetivo.botId})`;
    const partes = cleanText.trim().split(/\s+/);
    const accion = partes[0].toLowerCase();
    const valor = partes.slice(1).join(" ").trim();

    if (accion === ".baneos") {
      const { comandos, categorias } = listarBaneos();
      const propios = objetivo.esPrincipal ? { comandos: [], categorias: [] } : listarBaneosBot(objetivo.botId);
      const hay = (b) => b.comandos.length || b.categorias.length;
      if (!hay({ comandos, categorias }) && !hay(propios)) return reply({ text: "✅ No hay nada baneado ahora mismo." });
      const bloque = (titulo, b) =>
        hay(b)
          ? `*${titulo}*\n` + (b.categorias.length ? `*Categorías::* ${b.categorias.join(", ")}\n` : "") + (b.comandos.length ? `*Comandos::* ${b.comandos.join(", ")}\n` : "")
          : "";
      const texto = "🚫 *BANEADO ACTUALMENTE*\n\n" + bloque(objetivo.esPrincipal ? "Todos los bots" : "Globales (los puso el owner)", { comandos, categorias }) + (objetivo.esPrincipal ? "" : `\n${bloque("En este subbot", propios)}`);
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

    const etiqueta = grupoAlias ? grupoAlias.join(" / ") : categoria;

    if (accion === ".banear") {
      if (global) {
        if (grupoAlias) grupoAlias.forEach(banearComando);
        else banearCategoria(categoria);
      } else {
        await cambiarBaneoBot(objetivo.botId, grupoAlias ? "comando" : "categoria", grupoAlias || categoria, true);
      }
      return reply({ text: `🚫 *${etiqueta}* quedó desactivado ${alcance}. Usa *.desbanear ${valor}* para reactivarlo.` });
    }

    if (global) {
      if (grupoAlias) grupoAlias.forEach(desbanearComando);
      else desbanearCategoria(categoria);
      // Si el owner está en un subbot, también se levanta el baneo propio de ese subbot.
      if (!objetivo.esPrincipal) await cambiarBaneoBot(objetivo.botId, grupoAlias ? "comando" : "categoria", grupoAlias || categoria, false);
    } else {
      await cambiarBaneoBot(objetivo.botId, grupoAlias ? "comando" : "categoria", grupoAlias || categoria, false);
    }
    return reply({ text: `✅ *${etiqueta}* quedó reactivado ${global ? "en todos los bots" : "en tu subbot"}.` });
  })
};
