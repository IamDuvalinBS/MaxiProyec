import { addToWallet, getAccount, checkCooldown } from "../../../motores/db.js";
import { tarjeta, monto, elegir, entre, textoEspera } from "../../economia/formato.js";

const ESPERA_MS = 4 * 60 * 60 * 1000;
const PROB_BONUS = 0.15;

const RELATOS = [
  "Encontraste un cofre sellado en un almacén abandonado.",
  "Un mensajero dejó un cofre a tu nombre en la entrada.",
  "Descubriste un cofre enterrado cerca de un antiguo muelle.",
  "Recibiste un cofre como obsequio de un comerciante agradecido.",
  "Un cofre apareció entre las pertenencias de una subasta."
];

export default {
  names: [".cofre", ".chest"],
  desc: "Abrir un cofre misterioso (cada 4 horas)",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const espera = checkCooldown(sender, "cofre", ESPERA_MS);
    if (espera > 0) return reply({ text: textoEspera(espera) });

    const base = entre(500, 5000);
    const conBonus = Math.random() < PROB_BONUS;
    const extra = conBonus ? entre(500, 2500) : 0;
    addToWallet(sender, base + extra);

    const lineas = [`🪙 *CONTENIDO::* +${monto(base)}`];
    if (conBonus) lineas.push(`🌟 *BONUS ESPECIAL::* +${monto(extra)}`);
    lineas.push(`⛁ *CARTERA::* ${monto(getAccount(sender).wallet)}`);

    await reply({
      text: tarjeta({
        emoji: "🧰",
        titulo: conBonus ? "COFRE CON BONIFICACIÓN!" : "COFRE ABIERTO",
        relato: elegir(RELATOS),
        lineas,
        tip: "Usa *.cofre* de nuevo en 4 horas."
      })
    });
  }
};
