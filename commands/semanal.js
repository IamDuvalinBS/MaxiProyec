import { addToWallet, checkCooldown, formatTime, box, CURRENCY } from "../core.js";

export default {
  names: [".semanal", ".semanales"],
  desc: "Recompensa gratis cada 7 días",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const wait = checkCooldown(sender, "semanal", 7 * 24 * 60 * 60 * 1000);
    if (wait > 0) return reply({ text: `⏳ Ya reclamaste tu recompensa semanal. Vuelve en *${formatTime(wait)}* para reclamar tu siguiente recompensa semanal.` });
    const reward = 70000;
    addToWallet(sender, gano);
    await reply({ text: box("¡RECOMPENSA SEMANAL!", ["🎉 Reclamaste tu regalo de la semana...", `🪙 GANASTE  ›› *${gano} ${CURRENCY}*`]) });
  }
};
