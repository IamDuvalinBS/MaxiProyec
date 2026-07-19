import { workCommand, CURRENCY } from "../core.js";

const EMOJI = "🕶️";
const TITULO = "ESPIONAJE";

function renderExito({ frase, monto }) {
  return `「${EMOJI}」 \`${TITULO}\`\n\n` +
    `   ➥⧽⧽  *${frase}*\n\n` +
    `🌱 \`GANANCIA\` ›› *+${monto} ${CURRENCY}*\n` +
    `✨ *EXPERIENCIA* ›› \`+0\``;
}

function renderFallo({ frase, monto }) {
  return `「😳」 \`${TITULO}\`\n\n` +
    `   ➥⧽⧽  *${frase}*\n\n` +
    `💸 \`PÉRDIDA\` ›› *-${monto} ${CURRENCY}*\n` +
    `✨ *EXPERIENCIA* ›› \`+0\``;
}

export default {
  names: [".espiar", ".espia"],
  desc: "Espionaje, riesgo de que te descubran (cada 5 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "espiar",
    cooldownMs: 5 * 60 * 60 * 1000,
    riesgo: { chanceFallo: 0.35, minPerdida: 40, maxPerdida: 120 },
    renderExito,
    renderFallo,
    frases: {
      titulo: "¡ESPIONAJE EXITOSO!",
      tituloFallo: "¡TE DESCUBRIERON!",
      exito: [
        { text: "Conseguiste chismes sin importancia.", min: 20, max: 60 },
        { text: "Sacaste fotos comprometedoras y cobraste.", min: 150, max: 300 },
        { text: "Vendiste secretos importantes de la competencia.", min: 350, max: 600 }
      ],
      fallo: [
        { text: "Te encontraron espiando y pagaste para que no dijeran nada.", min: 40, max: 120 },
        { text: "Perdiste el equipo de espionaje.", min: 60, max: 150 }
      ]
    }
  })
};
