import { config, saveConfig } from "../core.js";

export default {
  names: [".setowner"],
  desc: "Cambiar el nombre del dueño que muestra el menú",
  category: "Utilidad",
  usage: ".setowner <nombre>",
  handler: async ({ cleanText, reply }) => {
    const nuevo = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!nuevo) return reply({ text: "⚙️ Uso: .setowner <nombre>" });
    config.ownerName = nuevo;
    await saveConfig();
    await reply({ text: `✅ Owner cambiado a: *${nuevo}*` });
  }
};
