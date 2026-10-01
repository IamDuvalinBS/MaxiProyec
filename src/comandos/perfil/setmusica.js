import { getProfile } from "../../../motores/profile.js";
import { saveAccount } from "../../../motores/db.js";

export default {
  names: [".setmusica", ".setcancion", ".setmusic"],
  desc: "Establecer tu música o canción favorita en el perfil",
  category: "Perfil",
  usage: ".setmusica <nombre de la canción o artista>",
  handler: async ({ sender, cleanText, reply }) => {
    const texto = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!texto) return reply({ text: "⚙️ Uso: *.setmusica <nombre de la canción o artista>*" });
    const p = getProfile(sender);
    p.favMusic = texto;
    await saveAccount(sender);
    await reply({ text: `✅ Música favorita actualizada: *${texto}*` });
  }
};
