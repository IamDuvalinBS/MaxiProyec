import { config, saveConfig } from "../../../motores/db.js";
import { ownerCommand } from "../../../motores/owner.js";

export default {
  names: [".setowner"],
  usage: ".setowner <nombre>",
  desc: "Cambiar el nombre del dueño que muestra el menú",
  category: "Utilidad",
  handler: ownerCommand(async ({ cleanText, reply }) => {
    const nuevo = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!nuevo) return reply({ text: "⚙️ Uso: *.setowner <nombre>*" });
    config.ownerName = nuevo;
    await saveConfig();
    await reply({ text: `✅ Owner cambiado a: *${nuevo}*` });
  })
};
