import { addToWallet, getAccount, checkCooldown } from "../../../motores/db.js";
import { tarjeta, monto, textoEspera } from "../../economia/formato.js";

const PREMIO = 70000;
const ESPERA_MS = 7 * 24 * 60 * 60 * 1000;

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
        emoji: "🌺",
        titulo: "SEMANAL HECHA!",
        relato: `Reclamaste tu recompensa semanal. Vuelve en *7 días* para reclamar nuevamente tu recompensa.`,
        lineas: [`🪙 *GANADO::* +${monto(PREMIO)}`, `⛁ *CARTERA::* ${monto(getAccount(sender).wallet)}`],
        tip: "Usa *.dep* para guardar tu dinero."
      })
    });
  }
};
