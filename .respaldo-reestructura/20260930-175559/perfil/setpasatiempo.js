import { getProfile, saveAccount } from "../core.js";

export default {
  names: [".setpasatiempo", ".sethobby"],
  desc: "Poner tu pasatiempo en el perfil",
  category: "Perfil",
  usage: ".setpasatiempo <texto>",
  handler: async ({ sender, cleanText, reply }) => {
    const texto = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!texto) return reply({ text: "⚙️ Uso: .setpasatiempo <texto>" });
    const p = getProfile(sender);
    p.hobby = texto;
    await saveAccount(sender);
    await reply({ text: `✅ Pasatiempo actualizado: *${texto}*` });
  }
};
