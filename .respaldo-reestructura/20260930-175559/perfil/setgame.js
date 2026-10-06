import { getProfile, saveAccount } from "../core.js";

export default {
  names: [".setgame"],
  desc: "Poner tu juego favorito en el perfil",
  category: "Perfil",
  usage: ".setgame <nombre del juego>",
  handler: async ({ sender, cleanText, reply }) => {
    const texto = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!texto) return reply({ text: "⚙️ Uso: .setgame <nombre del juego>" });
    const p = getProfile(sender);
    p.favGame = texto;
    await saveAccount(sender);
    await reply({ text: `✅ Juego favorito actualizado: *${texto}*` });
  }
};
