import { addToWallet, getAccount, checkCooldown } from "../../../motores/db.js";
import { tarjeta, monto, elegir, textoEspera } from "../../economia/formato.js";

const PREMIO = 20000;
const ESPERA_MS = 24 * 60 * 60 * 1000;

const RELATOS = [
  "Se acreditó tu bonificación correspondiente a la jornada de hoy.",
  "El banco depositó tu asignación diaria por constancia.",
  "Tu asistencia fue registrada y se liberó el pago diario.",
  "Se procesó tu incentivo diario sin ningún inconveniente.",
  "La tesorería aprobó tu compensación del día."
];

export default {
  names: [".daily", ".diario"],
  desc: "Reclamar la recompensa diaria",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const espera = checkCooldown(sender, "daily", ESPERA_MS);
    if (espera > 0) return reply({ text: textoEspera(espera) });

    addToWallet(sender, PREMIO);

    await reply({
      text: tarjeta({
        emoji: "🎁",
        titulo: "RECOMPENSA DIARIA",
        relato: elegir(RELATOS),
        lineas: [
          `🪙 *Ganancia* ›› +${monto(PREMIO)}`,
          `💰 *En mano* ›› ${monto(getAccount(sender).wallet)}`
        ]
      })
    });
  }
};
