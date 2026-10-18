import { addToWallet, getAccount, checkCooldown } from "../../../motores/db.js";
import { tarjeta, monto, textoEspera } from "../../economia/formato-evento.js";
import { estilo } from "../../economia/temas.js";

const PREMIO = 70000;
const ESPERA_MS = 7 * 24 * 60 * 60 * 1000;

const ESTILOS = {
  normal: {
    emoji: "🌺",
    titulo: "SEMANAL HECHA!",
    relato: "Reclamaste tu recompensa semanal. Vuelve en *7 días* para reclamar nuevamente tu recompensa.",
    ganado: (n) => `🪙 *GANADO::* +${monto(n)}`,
    cartera: (n) => `⛁ *CARTERA::* ${monto(n)}`,
    tip: "Usa *.dep* para guardar tu dinero."
  },
  halloween: {
    emoji: "🦇",
    titulo: "BANQUETE SEMANAL!",
    relato: "Los murciélagos te trajeron el *tesoro semanal* desde el campanario. Vuelve en *7 noches* para otro banquete macabro. 🕸️",
    ganado: (n) => `🎃 *TESORO MALDITO::* +${monto(n)}`,
    cartera: (n) => `🧙‍♀️ *CALDERO::* ${monto(n)}`,
    tip: "Usa *.dep* para esconder tus calabazas en la cripta. ⚰️"
  }
};

export default {
  names: [".semanal", ".weekly"],
  desc: "Reclamar la recompensa semanal",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const E = estilo(ESTILOS);
    const espera = checkCooldown(sender, "semanal", ESPERA_MS);
    if (espera > 0) return reply({ text: textoEspera(espera) });

    addToWallet(sender, PREMIO);

    await reply({
      text: tarjeta({
        emoji: E.emoji,
        titulo: E.titulo,
        relato: E.relato,
        lineas: [E.ganado(PREMIO), E.cartera(getAccount(sender).wallet)],
        tip: E.tip
      })
    });
  }
};
