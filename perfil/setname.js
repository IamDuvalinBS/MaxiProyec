import { getProfile, saveAccount } from "../core.js";

export default {
  names: [".setname"],
  desc: "Cambiar el nombre que aparece en tu perfil",
  category: "Perfil",
  usage: ".setname <nombre>",
  handler: async ({ sender, cleanText, reply }) => {
    const nombre = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!nombre) return reply({ text: "⚙️ Uso: .setname <nombre>" });
    const p = getProfile(sender);
    p.name = nombre;
    await saveAccount(sender);
    await reply({ text: `✅ Nombre de perfil cambiado a: *${nombre}*` });
  }
};
