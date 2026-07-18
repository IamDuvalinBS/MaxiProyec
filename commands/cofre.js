import { addToWallet, checkCooldown, formatTime, box, CURRENCY } from "../core.js";

export default {
  names: [".cofre", ".tesoro"],
  desc: "Cofre misterioso, cada 12 horas",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const wait = checkCooldown(sender, "cofre", 12 * 60 * 60 * 1000);
    if (wait > 0) return reply({ text: `⏳ Ya abriste un cofre. Esperá *${formatTime(wait)}*.` });
const base = Math.floor(Math.random() * 4500) + 500; // siempre entre 500 y 5000
const esRaro = Math.random() < 0.15; // 15% de probabilidad de bonus
const bonus = esRaro ? Math.floor(Math.random() * 2000) + 500 : 0; // bonus de 500 a 2500 extra
const gano = base + bonus;
addToWallet(sender, gano);
const texto = esRaro
  ? `📦 Abriste un cofre y encontraste monedas... ¡y un BONUS de *${bonus} ${CURRENCY}* de regalo! ✨`
  : "📦 Abriste un cofre y encontraste monedas...";
await reply({ text: box("¡COFRE ABIERTO!", [texto, `🪙 GANASTE  ›› *${gano} ${CURRENCY}*`]) });
  }
};
