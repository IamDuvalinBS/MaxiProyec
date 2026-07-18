import { config, saveConfig } from "../core.js";

export default {
  names: [".setnombre"],
  desc: "Cambiar el nombre del bot (corto para BOT NAME, largo para el saludo)",
  category: "Utilidad",
  usage: ".setnombre <corto> | <largo>",
  handler: async ({ cleanText, reply }) => {
    const resto = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!resto) return reply({ text: "⚙️ Uso: .setnombre <nombre corto> | <nombre largo>\nEjemplo: .setnombre Asta | Asta Bot Oficial" });
    const [corto, largo] = resto.split("|").map(s => s && s.trim());
    config.botNameShort = corto || config.botNameShort;
    config.botNameLong = largo || corto || config.botNameLong;
    await saveConfig();
    await reply({ text: `✅ Nombre corto: *${config.botNameShort}*\n✅ Nombre largo: *${config.botNameLong}*` });
  }
};
