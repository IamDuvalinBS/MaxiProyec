import { addToWallet, checkCooldown, formatTime, box, CURRENCY } from "../core.js";

export default {
  names: [".cofre", ".tesoro"],
  desc: "Cofre misterioso, cada 12 horas",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const wait = checkCooldown(sender, "cofre", 12 * 60 * 60 * 1000);
    if (wait > 0) return reply({ text:  });
    const esRaro = Math.random() < 0.15;
    const gano = esRaro
      ? Math.floor(Math.random() * 500) + 500
      : Math.floor(Math.random() * 150) + 80;
    addToWallet(sender, gano);
    const texto = esRaro ? "✨ ¡Encontraste un cofre LEGENDARIO!" : "📦 Abriste un cofre y encontraste monedas...";
    await reply({ text: box("¡COFRE ABIERTO!", [texto, ]) });
  }
};
