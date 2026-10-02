import { addToWallet, getAccount, checkCooldown } from "../../../motores/db.js";
import { tarjeta, monto, textoEspera } from "../../economia/formato.js";

const PREMIO = 20000;
const ESPERA_MS = 24 * 60 * 60 * 1000;

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
        relato: `Reclamaste tu recompensa diaria. Vuelve en *24 horas* para reclamar nuevamente tu recompensa.`,
        lineas: [`🪙 *GANADO::* +${monto(PREMIO)}`, `⛁ *CARTERA::* ${monto(getAccount(sender).wallet)}`],
        tip: "Usa *.dep* para guardar tu dinero."
      })
    });
  }
};
