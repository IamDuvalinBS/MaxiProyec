import { workCommand, CURRENCY } from "../core.js";

const EMOJI = "🙏";
const TITULO = "MIGAJEAR";

function renderExito({ frase, monto }) {
  return `「${EMOJI}」 \`${TITULO}\`\n\n` +
    `   ➥⧽⧽  *${frase}*\n\n` +
    `🌱 \`GANANCIA\` ›› *+${monto} ${CURRENCY}*\n` +
    `✨ *EXPERIENCIA* ›› \`+0\``;
}

export default {
  names: [".migajear", ".limosna", ".ayudas"],
  desc: "Pedir ayudas, ganancia mínima pero rápida (cada 3 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "migajear",
    cooldownMs: 3 * 60 * 60 * 1000,
    renderExito,
    frases: {
      titulo: "MIGAJAS DEL DÍA",
      exito: [
        { text: "Nadie te hizo caso hoy...", min: 2, max: 10 },
        { text: "Alguien se compadeció de vos y te regaló unas monedas.", min: 10, max: 30 },
        { text: "Un desconocido generoso te dio bastante plata.", min: 40, max: 80 }
      ]
    }
  })
};
