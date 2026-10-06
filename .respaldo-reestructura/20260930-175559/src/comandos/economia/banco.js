import { getAccount } from "../../../motores/db.js";
import { getProfile } from "../../../motores/profile.js";
import { tarjeta, monto, fmt, jidMencionado } from "../../economia/formato.js";

export default {
  names: [".banco", ".bal", ".bank"],
  usage: ".banco [@usuario]",
  desc: "Consultar tu saldo o el de otro usuario",
  category: "Economía",
  handler: async ({ sender, msg, reply }) => {
    const objetivo = jidMencionado(msg) || sender;
    const cuenta = getAccount(objetivo);
    const perfil = getProfile(objetivo);
    const requerida = perfil.level * 100;

    await reply({
      text: tarjeta({
        emoji: "🏦",
        titulo: `CUENTA DE @${objetivo.split("@")[0]}`,
        lineas: [
          `💰 *En mano* ›› ${monto(cuenta.wallet)}`,
          `🏛️ *En el banco* ›› ${monto(cuenta.bank)}`,
          `📊 *Patrimonio total* ›› ${monto(cuenta.wallet + cuenta.bank)}`,
          `🎖️ *Nivel* ›› ${perfil.level} (${fmt(perfil.xp)}/${fmt(requerida)} XP)`
        ]
      }),
      mentions: [objetivo]
    });
  }
};
