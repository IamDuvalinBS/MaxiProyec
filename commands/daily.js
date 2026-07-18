import { addToWallet, checkCooldown, formatTime, box, CURRENCY } from "../core.js";

export default {
  names: [".daily", ".diario"],
  desc: "Recompensa gratis cada 24 horas",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const wait = checkCooldown(sender, "daily", 24 * 60 * 60 * 1000);
    if (wait > 0) return reply({ text: `⏳ Ya reclamaste tu recompensa diaria. Volvé en *${formatTime(wait)}* para volver a reclamar tus *20k*.` });
    const gano = 20000;
    addToWallet(sender, gano);
    await reply({ text: box("¡RECOMPENSA DIARIA!", ["🎁 Reclamaste tu regalo del día...", `🪙 GANASTE  ›› *${gano} ${CURRENCY}*`]) });
  }
};
