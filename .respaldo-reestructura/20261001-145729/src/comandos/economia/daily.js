import { addToWallet, getAccount, checkCooldown } from "../../../motores/db.js";
import { tarjeta, monto, elegir, textoEspera } from "../../economia/formato.js";
import { formatTime } from "../../../motores/ui.js";

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
        emoji: "🌻",
        titulo: "DIARIO RECLAMADO!",
        relato: elegir(RELATOS),
        lineas: [`🪙 *GANADO::* +${monto(PREMIO)}`, `⛁ *CARTERA::* ${monto(getAccount(sender).wallet)}`],
        tip: `Vuelve en *${formatTime(ESPERA_MS)}* para reclamarlo de nuevo.`
      })
    });
  }
};
