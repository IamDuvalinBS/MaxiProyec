import { addToWallet, getAccount, checkCooldown } from "../../../motores/db.js";
import { tarjeta, monto, elegir, textoEspera } from "../../economia/formato.js";

const PREMIO = 70000;
const ESPERA_MS = 7 * 24 * 60 * 60 * 1000;

const RELATOS = [
  "Se liberó tu bonificación correspondiente a la semana completa.",
  "La administración aprobó tu pago semanal por trayectoria.",
  "Tu constancia durante la semana fue reconocida con este incentivo.",
  "Se procesó tu compensación semanal de forma satisfactoria.",
  "El banco acreditó el beneficio semanal en tu cuenta."
];

export default {
  names: [".semanal", ".weekly"],
  desc: "Reclamar la recompensa semanal",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const espera = checkCooldown(sender, "semanal", ESPERA_MS);
    if (espera > 0) return reply({ text: textoEspera(espera) });

    addToWallet(sender, PREMIO);

    await reply({
      text: tarjeta({
        emoji: "🎊",
        titulo: "RECOMPENSA SEMANAL",
        relato: elegir(RELATOS),
        lineas: [
          `🪙 *Ganancia* ›› +${monto(PREMIO)}`,
          `💰 *En mano* ›› ${monto(getAccount(sender).wallet)}`
        ]
      })
    });
  }
};
