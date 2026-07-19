import { workCommand, CURRENCY } from "../core.js";

const EMOJI = "📱";
const TITULO = "INFLUENCER";

function renderExito({ frase, monto }) {
  return `「${EMOJI}」 \`${TITULO}\`\n\n` +
    `   ➥⧽⧽  *${frase}*\n\n` +
    `🌱 \`GANANCIA\` ›› *+${monto} ${CURRENCY}*\n` +
    `✨ *EXPERIENCIA* ›› \`+0\``;
}

function renderFallo({ frase, monto }) {
  return `「📉」 \`${TITULO}\`\n\n` +
    `   ➥⧽⧽  *${frase}*\n\n` +
    `💸 \`PÉRDIDA\` ›› *-${monto} ${CURRENCY}*\n` +
    `✨ *EXPERIENCIA* ›› \`+0\``;
}

export default {
  names: [".influencer", ".tiktoker"],
  desc: "Contenido viral, buena ganancia con riesgo de flop (cada 8 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "influencer",
    cooldownMs: 8 * 60 * 60 * 1000,
    riesgo: { chanceFallo: 0.3, minPerdida: 20, maxPerdida: 60 },
    renderExito,
    renderFallo,
    frases: {
      titulo: "¡VIDEO VIRAL!",
      tituloFallo: "¡EL VIDEO FUE UN FLOP!",
      exito: [
        { text: "Tu video pasó sin pena ni gloria.", min: 30, max: 80 },
        { text: "Tu video se volvió viral y ganaste por publicidad.", min: 200, max: 400 },
        { text: "¡Una marca grande te pagó por promocionarla!", min: 500, max: 900 }
      ],
      fallo: [
        { text: "Nadie vio tu contenido.", min: 20, max: 60 },
        { text: "Te cancelaron en redes y perdiste patrocinios.", min: 40, max: 100 }
      ]
    }
  })
};
