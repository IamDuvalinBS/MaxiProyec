import { workCommand, CURRENCY } from "../core.js";

const EMOJI = "👷";
const TITULO = "TRABAJAR";

function renderExito({ frase, monto }) {
  return `「${EMOJI}」 \`${TITULO}\`\n\n` +
    `   ➥⧽⧽  *${frase}*\n\n` +
    `🌱 \`GANANCIA\` ›› *+${monto} ${CURRENCY}*\n` +
    `✨ *EXPERIENCIA* ›› \`+0\``;
}

export default {
  names: [".trabajar", ".w", ".work"],
  desc: "Trabajo tranquilo, sin riesgo (cada 1 hora)",
  category: "Trabajos",
  handler: workCommand({
    key: "trabajar",
    cooldownMs: 60 * 60 * 1000,
    renderExito,
    frases: {
      titulo: "¡A TRABAJAR!",
      exito: [
        { text: "Trabajaste de ayudante en una cafetería.", min: 40, max: 80 },
        { text: "Hiciste entregas para una tienda.", min: 50, max: 100 },
        { text: "Limpiaste oficinas después de tu turno.", min: 30, max: 70 },
        { text: "Paseaste perros del vecindario.", min: 20, max: 60 },
        { text: "Trabajaste como cajero todo el día.", min: 60, max: 120 }
      ]
    }
  })
};
