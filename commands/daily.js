import { addToWallet, checkCooldown, formatTime, box, CURRENCY } from "../core.js";

export default {
  names: [".daily", ".diario"],
  desc: "Recompensa gratis cada 24 horas",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const wait = checkCooldown(sender, "daily", 24 * 60 * 60 * 1000);
    if (wait > 0) return reply({ text:  });
    const gano = Math.floor(Math.random() * 200) + 300;
    addToWallet(sender, gano);
    await reply({ text: box("¡RECOMPENSA DIARIA!", ["🎁 Reclamaste tu regalo del día...", ]) });
  }
};
