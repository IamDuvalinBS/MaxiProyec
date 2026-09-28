import { config, saveConfig } from "../../../motores/db.js";
import { ownerCommand } from "../../../motores/owner.js";

const VALIDO = /^[^\sA-Za-z0-9]{1,3}$/u;

function actuales() {
  return config.prefixes && config.prefixes.length ? config.prefixes : [config.prefix || "."];
}

function lista(prefijos) {
  return prefijos.map((p) => `*${p}*`).join("  ");
}

export default {
  names: [".prefijos", ".setprefix", ".addprefix", ".delprefix"],
  usage: ".prefijos | .setprefix <p> | .addprefix <p> | .delprefix <p>",
  desc: "Ver o modificar los prefijos de los comandos (ej: . ! # /)",
  category: "Utilidad",
  handler: ownerCommand(async ({ cleanText, reply }) => {
    const [comando, valor] = cleanText.split(/\s+/);
    const accion = comando.toLowerCase();
    const prefijos = [...actuales()];

    if (accion === ".prefijos" || !valor) {
      return reply({
        text: `⚙️ Prefijos activos:: ${lista(prefijos)}\n\nUso:: *.setprefix <p>* (reemplaza todos), *.addprefix <p>*, *.delprefix <p>*`
      });
    }

    if (!VALIDO.test(valor)) {
      return reply({ text: "⚠️ El prefijo debe tener de 1 a 3 caracteres y no puede ser una letra ni un número." });
    }

    if (accion === ".setprefix") {
      config.prefixes = [valor];
    } else if (accion === ".addprefix") {
      if (prefijos.includes(valor)) return reply({ text: `⚠️ El prefijo *${valor}* ya está activo.` });
      config.prefixes = [...prefijos, valor];
    } else {
      if (!prefijos.includes(valor)) return reply({ text: `⚠️ El prefijo *${valor}* no está activo.` });
      if (prefijos.length === 1) return reply({ text: "⚠️ Debe existir al menos un prefijo activo." });
      config.prefixes = prefijos.filter((p) => p !== valor);
    }

    config.prefix = config.prefixes[0];
    await saveConfig();
    await reply({ text: `✅ Prefijos activos:: ${lista(config.prefixes)}` });
  })
};
