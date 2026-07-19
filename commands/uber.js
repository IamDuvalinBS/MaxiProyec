import { workCommand, CURRENCY } from "../core.js";

const EMOJI = "🚕";
const TITULO = "UBER";

function renderExito({ frase, monto }) {
  return `「${EMOJI}」 \`${TITULO}\`\n\n` +
    `   ➥⧽⧽  *${frase}*\n\n` +
    `🌱 \`GANANCIA\` ›› *+${monto} ${CURRENCY}*\n` +
    `✨ *EXPERIENCIA* ›› \`+0\``;
}

function renderFallo({ frase, monto }) {
  return `「🚨」 \`${TITULO}\`\n\n` +
    `   ➥⧽⧽  *${frase}*\n\n` +
    `💸 \`PÉRDIDA\` ›› *-${monto} ${CURRENCY}*\n` +
    `✨ *EXPERIENCIA* ›› \`+0\``;
}

export default {
  names: [".uber", ".conductor"],
  desc: "Manejar Uber, riesgo de choques y multas (cada 2 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "uber",
    cooldownMs: 2 * 60 * 60 * 1000,
    riesgo: { chanceFallo: 0.3, minPerdida: 50, maxPerdida: 200 },
    renderExito,
    renderFallo,
    frases: {
      titulo: "¡VIAJE COMPLETADO!",
      tituloFallo: "¡PROBLEMAS EN EL VIAJE!",
      exito: [
        { text: "Hiciste un viaje cortito dentro del barrio.", min: 30, max: 70 },
        { text: "Llevaste a un pasajero al aeropuerto.", min: 100, max: 200 },
        { text: "Un pasajero te dio una propina enorme.", min: 250, max: 450 }
      ],
      fallo: [
        { text: "Chocaste el auto contra un poste.", min: 100, max: 300 },
        { text: "Te multaron por exceso de velocidad.", min: 50, max: 150 },
        { text: "Un pasajero te canceló y perdiste tiempo y gasolina.", min: 20, max: 60 }
      ]
    }
  })
};
