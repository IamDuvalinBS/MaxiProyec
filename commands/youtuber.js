import { workCommand, CURRENCY } from "../core.js";

const EMOJI = "🎥";
const TITULO = "YOUTUBER";

function renderExito({ frase, monto }) {
  return `「${EMOJI}」 \`${TITULO}\`\n\n` +
    `   ➥⧽⧽  *${frase}*\n\n` +
    `🌱 \`GANANCIA\` ›› *+${monto} ${CURRENCY}*\n` +
    `✨ *EXPERIENCIA* ›› \`+0\``;
}

function renderFallo({ frase, monto }) {
  return `「⚠️」 \`${TITULO}\`\n\n` +
    `   ➥⧽⧽  *${frase}*\n\n` +
    `💸 \`PÉRDIDA\` ›› *-${monto} ${CURRENCY}*\n` +
    `✨ *EXPERIENCIA* ›› \`+0\``;
}

export default {
  names: [".youtuber", ".cc"],
  desc: "Contenido en YouTube, buena ganancia (cada 8 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "youtuber",
    cooldownMs: 8 * 60 * 60 * 1000,
    riesgo: { chanceFallo: 0.25, minPerdida: 30, maxPerdida: 70 },
    renderExito,
    renderFallo,
    frases: {
      titulo: "¡MONETIZACIÓN ACTIVADA!",
      tituloFallo: "¡YOUTUBE TE DESMONETIZÓ!",
      exito: [
        { text: "Tu video generó pocas visitas.", min: 40, max: 90 },
        { text: "Tu canal creció bastante esta semana.", min: 220, max: 420 },
        { text: "¡Conseguiste un sponsor grande para tu contenido!", min: 500, max: 900 }
      ],
      fallo: [
        { text: "Youtube desmonetizó tu video.", min: 30, max: 70 },
        { text: "Te llegó un copyright strike.", min: 50, max: 110 }
      ]
    }
  })
};
