import { getProfile } from "../../../motores/profile.js";
import { saveAccount } from "../../../motores/db.js";

export default {
  names: [".setname", ".setnombreperfil"],
  desc: "Cambiar el nombre que aparece en tu perfil",
  category: "Perfil",
  usage: ".setname <nombre>",
  handler: async ({ sender, cleanText, reply }) => {
    const nombre = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!nombre) return reply({ text: "⚙️ Uso: *.setname <nombre>*" });
    const p = getProfile(sender);
    p.name = nombre;
    await saveAccount(sender);
    await reply({ text: `✅ Nombre de perfil actualizado a: *${nombre}*` });
  }
};
