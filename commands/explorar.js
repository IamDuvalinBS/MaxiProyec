import { workCommand, CURRENCY } from "../core.js";

const EMOJI = "🗺️";
const TITULO = "EXPLORAR";

function renderExito({ frase, monto }) {
  return `「${EMOJI}」 \`${TITULO}\`\n\n` +
    `   ➥⧽⧽  *${frase}*\n\n` +
    `🌱 \`GANANCIA\` ›› *+${monto} ${CURRENCY}*\n` +
    `✨ *EXPERIENCIA* ›› \`+0\``;
}

export default {
  names: [".explorar", ".investigar"],
  desc: "Exploración, ganancia media-alta (cada 4 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "explorar",
    cooldownMs: 4 * 60 * 60 * 1000,
    renderExito,
    frases: {
      titulo: "¡EXPLORACIÓN COMPLETADA!",
      exito: [
        { text: "Encontraste ruinas vacías, no había nada de valor.", min: 20, max: 60 },
        { text: "Hallaste un mapa del tesoro y lo vendiste.", min: 150, max: 300 },
        { text: "Descubriste una cueva con objetos antiguos.", min: 250, max: 450 },
        { text: "¡Encontraste una cámara secreta llena de oro!", min: 600, max: 1000 }
      ]
    }
  })
};
