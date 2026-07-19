import { workCommand, CURRENCY } from "../core.js";

const EMOJI = "🧱";
const TITULO = "SUPERALBAÑIL";

function renderExito({ frase, monto }) {
  return `「${EMOJI}」 \`${TITULO}\`\n\n` +
    `   ➥⧽⧽  *${frase}*\n\n` +
    `🌱 \`GANANCIA\` ›› *+${monto} ${CURRENCY}*\n` +
    `✨ *EXPERIENCIA* ›› \`+0\``;
}

export default {
  names: [".superalbañil", ".albañil"],
  desc: "Construcción pesada, la mejor paga (cada 10 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "superalbanil",
    cooldownMs: 10 * 60 * 60 * 1000,
    renderExito,
    frases: {
      titulo: "¡OBRA TERMINADA!",
      exito: [
        { text: "Reparaste una pared chica.", min: 200, max: 400 },
        { text: "Levantaste un edificio entero vos solo.", min: 700, max: 1000 },
        { text: "Hiciste de albañil, plomero y electricista en la misma obra.", min: 1000, max: 1500 }
      ]
    }
  })
};
