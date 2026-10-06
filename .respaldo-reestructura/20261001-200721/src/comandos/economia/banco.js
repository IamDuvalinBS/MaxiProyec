import { getAccount } from "../../../motores/db.js";
import { getProfile } from "../../../motores/profile.js";
import { tarjeta, monto, fmt, jidObjetivo } from "../../economia/formato.js";

export default {
  names: [".banco", ".bal", ".bank"],
  usage: ".banco [@usuario | responder a un mensaje]",
  desc: "Consultar tu saldo o el de otro usuario (etiquetándolo o respondiendo a su mensaje)",
  category: "Economía",
  handler: async ({ sender, msg, reply }) => {
    const objetivo = jidObjetivo(msg) || sender;
    const cuenta = getAccount(objetivo);
    const perfil = getProfile(objetivo);
    const requerida = perfil.level * 100;

    await reply({
      text: tarjeta({
        emoji: "🪎",
        titulo: "BANCO DE::",
        subtitulo: `@${objetivo.split("@")[0]}`,
        lineas: [
          `⛁ *CARTERA::* ${monto(cuenta.wallet)}`,
          `✦ *BANCO::* ${monto(cuenta.bank)}`,
          `≛ *TOTAL::* ${monto(cuenta.wallet + cuenta.bank)}`,
          `🎖️ *NIVEL::* ${perfil.level} (${fmt(perfil.xp)}/${fmt(requerida)} XP)`
        ],
        tip: "Usa *.dep* para guardar tu dinero y mantenerlo a salvo de las pérdidas por operaciones fallidas."
      }),
      mentions: [objetivo]
    });
  }
};
