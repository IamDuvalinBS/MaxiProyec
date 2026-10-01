import { getProfile } from "../../../motores/profile.js";
import { saveAccount } from "../../../motores/db.js";

export default {
  names: [".setbio", ".setbiografia"],
  desc: "Establecer tu biografía en el perfil",
  category: "Perfil",
  usage: ".setbio <texto>",
  handler: async ({ sender, cleanText, reply }) => {
    const texto = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!texto) return reply({ text: "⚙️ Uso: *.setbio <texto>*" });
    const p = getProfile(sender);
    p.bio = texto;
    await saveAccount(sender);
    await reply({ text: `✅ Biografía actualizada: *${texto}*` });
  }
};
