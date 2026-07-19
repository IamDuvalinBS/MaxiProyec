import { workCommand, CURRENCY } from "../core.js";

const EMOJI = "🌭";
const TITULO = "VENDEDOR";

function renderExito({ frase, monto }) {
  return `「${EMOJI}」 \`${TITULO}\`\n\n` +
    `   ➥⧽⧽  *${frase}*\n\n` +
    `🌱 \`GANANCIA\` ›› *+${monto} ${CURRENCY}*\n` +
    `✨ *EXPERIENCIA* ›› \`+0\``;
}

export default {
  names: [".vendedor", ".ambulante"],
  desc: "Ventas ambulantes, ganancia chica pero segura (cada 2 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "vendedor",
    cooldownMs: 2 * 60 * 60 * 1000,
    renderExito,
    frases: {
      titulo: "¡VENTA DEL DÍA!",
      exito: [
        { text: "Vendiste hot dogs en la esquina.", min: 40, max: 80 },
        { text: "Vendiste helados en el parque.", min: 60, max: 110 },
        { text: "Vendiste gorras y accesorios en el semáforo.", min: 50, max: 100 }
      ]
    }
  })
};
