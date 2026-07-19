import { workCommand, CURRENCY } from "../core.js";

const EMOJI = "🏰";
const TITULO = "MAZMORRA";

function renderExito({ frase, monto }) {
  return `「${EMOJI}」 \`${TITULO}\`\n\n` +
    `   ➥⧽⧽  *${frase}*\n\n` +
    `🌱 \`GANANCIA\` ›› *+${monto} ${CURRENCY}*\n` +
    `✨ *EXPERIENCIA* ›› \`+0\``;
}

function renderFallo({ frase, monto }) {
  return `「💀」 \`${TITULO}\`\n\n` +
    `   ➥⧽⧽  *${frase}*\n\n` +
    `💸 \`PERDISTE TODO\` ›› *-${monto} ${CURRENCY}*\n` +
    `✨ *EXPERIENCIA* ›› \`+0\``;
}

export default {
  names: [".mazmorra", ".castillo"],
  desc: "Máximo riesgo, máxima recompensa (cada 6 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "mazmorra",
    cooldownMs: 6 * 60 * 60 * 1000,
    riesgo: { chanceFallo: 0.55, perdidaTotal: true },
    renderExito,
    renderFallo,
    frases: {
      titulo: "¡MAZMORRA SUPERADA!",
      tituloFallo: "¡CAÍSTE EN LA MAZMORRA!",
      exito: [
        { text: "Derrotaste a un esqueleto y sacaste unas monedas viejas.", min: 200, max: 400 },
        { text: "Saqueaste el tesoro de un cofre chico.", min: 400, max: 700 },
        { text: "¡Derrotaste al jefe final y te llevaste el tesoro real!", min: 900, max: 1500 }
      ],
      fallo: [
        { text: "Te emboscaron dentro del castillo.", min: 0, max: 0 },
        { text: "Caíste en una trampa mortal.", min: 0, max: 0 }
      ]
    }
  })
};
