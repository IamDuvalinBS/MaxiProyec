import { workCommand, CURRENCY } from "../core.js";

const EMOJI = "🕵️";
const TITULO = "CRIMEN";

function renderExito({ frase, monto }) {
  return `「${EMOJI}」 \`${TITULO}\`\n\n` +
    `   ➥⧽⧽  *${frase}*\n\n` +
    `🌱 \`GANANCIA\` ›› *+${monto} ${CURRENCY}*\n` +
    `✨ *EXPERIENCIA* ›› \`+0\``;
}

function renderFallo({ frase, monto }) {
  return `「🚔」 \`${TITULO}\`\n\n` +
    `   ➥⧽⧽  *${frase}*\n\n` +
    `💸 \`PÉRDIDA\` ›› *-${monto} ${CURRENCY}*\n` +
    `✨ *EXPERIENCIA* ›› \`+0\``;
}

export default {
  names: [".crimen", ".crime"],
  desc: "Ganancia alta, riesgo de multa (cada 3 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "crimen",
    cooldownMs: 3 * 60 * 60 * 1000,
    riesgo: { chanceFallo: 0.4, minPerdida: 50, maxPerdida: 150 },
    renderExito,
    renderFallo,
    frases: {
      titulo: "¡CRIMEN EXITOSO!",
      tituloFallo: "¡TE ATRAPARON!",
      exito: [
        { text: "Le robaste la cartera a alguien de la calle.", min: 30, max: 80 },
        { text: "Robaste un teléfono de juguete, casi no valía nada.", min: 5, max: 15 },
        { text: "Le robaste un reloj de diamante a un rico.", min: 800, max: 1500 },
        { text: "Encontraste un anillo de oro puro en el robo.", min: 1000, max: 1800 },
        { text: "Robaste un auto y lo desarmaste para vender piezas.", min: 300, max: 600 },
        { text: "Asaltaste una tienda de barrio.", min: 100, max: 250 }
      ],
      fallo: [
        { text: "La policía te agarró con las manos en la masa.", min: 50, max: 150 },
        { text: "Te delataron y tuviste que pagar una fianza.", min: 80, max: 200 },
        { text: "Sonó la alarma y tuviste que huir sin nada.", min: 30, max: 90 }
      ]
    }
  })
};
