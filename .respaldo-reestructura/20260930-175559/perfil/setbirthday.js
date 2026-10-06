import { getProfile, saveAccount } from "../core.js";

export default {
  names: [".setbirthday", ".setbirth"],
  desc: "Poner tu fecha de cumpleaños en el perfil",
  category: "Perfil",
  usage: ".setbirthday <DD/MM/AAAA>",
  handler: async ({ sender, cleanText, reply }) => {
    const fecha = cleanText.split(/\s+/)[1];
    if (!fecha || !/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
      return reply({ text: "⚙️ Uso: .setbirthday <DD/MM/AAAA>\nEjemplo: .setbirthday 15/07/2000" });
    }
    const p = getProfile(sender);
    p.birthday = fecha;
    await saveAccount(sender);
    await reply({ text: `✅ Cumpleaños actualizado: *${fecha}*` });
  }
};
