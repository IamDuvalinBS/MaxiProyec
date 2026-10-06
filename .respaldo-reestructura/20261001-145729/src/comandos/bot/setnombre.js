import { config, saveConfig } from "../../../motores/db.js";
import { ownerCommand } from "../../../motores/owner.js";

export default {
  names: [".setnombre"],
  usage: ".setnombre <corto> | <largo>",
  desc: "Cambiar el nombre del bot (corto para BOT NAME, largo para el saludo)",
  category: "Utilidad",
  handler: ownerCommand(async ({ cleanText, reply }) => {
    const resto = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!resto) {
      return reply({ text: "⚙️ Uso: *.setnombre <nombre corto> | <nombre largo>*\nEjemplo: *.setnombre Mambo | Matikanetannhauser*" });
    }
    const [corto, largo] = resto.split("|").map((s) => s && s.trim());
    config.botNameShort = corto || config.botNameShort;
    config.botNameLong = largo || corto || config.botNameLong;
    await saveConfig();
    await reply({ text: `✅ Nombre corto: *${config.botNameShort}*\n✅ Nombre largo: *${config.botNameLong}*` });
  })
};
