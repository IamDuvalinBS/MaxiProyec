import { getProfile } from "../../../motores/profile.js";
import { saveAccount } from "../../../motores/db.js";

export default {
  names: [".setgame", ".setjuego"],
  desc: "Establecer tu juego favorito en el perfil",
  category: "Perfil",
  usage: ".setgame <nombre del juego>",
  handler: async ({ sender, cleanText, reply }) => {
    const texto = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!texto) return reply({ text: "⚙️ Uso: *.setgame <nombre del juego>*" });
    const p = getProfile(sender);
    p.favGame = texto;
    await saveAccount(sender);
    await reply({ text: `✅ Juego favorito actualizado: *${texto}*` });
  }
};
