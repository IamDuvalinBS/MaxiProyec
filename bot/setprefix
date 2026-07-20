import { config, saveConfig } from "../core.js";

export default {
  names: [".setprefix"],
  desc: "Cambiar el prefijo de los comandos (ej: . ! # /)",
  category: "Utilidad",
  usage: ".setprefix <caracter>",
  handler: async ({ cleanText, reply }) => {
    const nuevo = cleanText.split(/\s+/)[1];
    if (!nuevo || nuevo.length !== 1) {
      return reply({ text: `⚙️ Uso: .setprefix <un solo caracter>\nEjemplo: .setprefix !\nPrefijo actual: "${config.prefix}"` });
    }
    config.prefix = nuevo;
    await saveConfig();
    await reply({ text: `✅ Prefijo cambiado a: "${nuevo}"\nAhora los comandos se usan así: ${nuevo}banco, ${nuevo}menu, etc.` });
  }
};
