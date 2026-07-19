import { workCommand, CURRENCY } from "../core.js";

const EMOJI = "⛏️";
const TITULO = "MINAR";

function renderExito({ frase, monto }) {
  return `「${EMOJI}」 \`${TITULO}\`\n\n` +
    `   ➥⧽⧽  *${frase}*\n\n` +
    `🌱 \`GANANCIA\` ›› *+${monto} ${CURRENCY}*\n` +
    `✨ *EXPERIENCIA* ›› \`+0\``;
}

export default {
  names: [".minar", ".mine"],
  desc: "Minería, ganancia media (cada 2 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "minar",
    cooldownMs: 2 * 60 * 60 * 1000,
    renderExito,
    frases: {
      titulo: "¡A LA MINA!",
      exito: [
        { text: "Encontraste piedras comunes, casi no valen nada.", min: 20, max: 50 },
        { text: "Sacaste carbón de la mina.", min: 60, max: 120 },
        { text: "Encontraste una veta de plata.", min: 200, max: 350 },
        { text: "¡Hallaste un diamante en bruto!", min: 500, max: 900 }
      ]
    }
  })
};
