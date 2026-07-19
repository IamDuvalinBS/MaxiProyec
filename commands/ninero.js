import { workCommand, CURRENCY } from "../core.js";

const EMOJI = "🍼";
const TITULO = "NIÑERO";

function renderExito({ frase, monto }) {
  return `「${EMOJI}」 \`${TITULO}\`\n\n` +
    `   ➥⧽⧽  *${frase}*\n\n` +
    `🌱 \`GANANCIA\` ›› *+${monto} ${CURRENCY}*\n` +
    `✨ *EXPERIENCIA* ›› \`+0\``;
}

function renderFallo({ frase, monto }) {
  return `「😭」 \`${TITULO}\`\n\n` +
    `   ➥⧽⧽  *${frase}*\n\n` +
    `💸 \`PÉRDIDA\` ›› *-${monto} ${CURRENCY}*\n` +
    `✨ *EXPERIENCIA* ›› \`+0\``;
}

export default {
  names: [".niñero", ".cuidador"],
  desc: "Cuidar niños (cada 1 hora)",
  category: "Trabajos",
  handler: workCommand({
    key: "niñero",
    cooldownMs: 1 * 60 * 60 * 1000,
    riesgo: { chanceFallo: 0.25, minPerdida: 1000, maxPerdida: 5000 },
    renderExito,
    renderFallo,
    frases: {
      titulo: "¡NIÑERO PRECAVIDO!",
      tituloFallo: "¡DESCUIDASTE AL BEBÉ!",
      exito: [
        { text: "Cuidaste bien al bebé de Sarita y Duva.", min: 1000, max: 3000 },
        { text: "No dejaste que el bebé llorara ni un segundo, un cuidado excelente.", min: 3000, max: 5000 }
      ],
      fallo: [
        { text: "Te quedaste dormido mientras el bebé lloraba.", min: 1000, max: 3000 },
        { text: "El bebé llegó con mucha hambre a casa.", min: 2000, max: 5000 }
      ]
    }
  })
};
