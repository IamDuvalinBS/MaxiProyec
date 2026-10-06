import { iniciarJuego } from "../motores/juegos-core.js";
import { checkCooldown } from "../motores/db.js";
import { formatTime } from "../motores/ui.js";

const COOLDOWN_MS = 10 * 60 * 1000;

export default {
  names: [".gatopremio", ".gatoranked"],
  desc: "Gato con premio: cooldown de 10 min, el ganador se lleva monedas y XP reales",
  category: "Juegos",
  usage: ".gatopremio [@persona]",
  handler: async ({ sock, from, sender, msg, reply }) => {
    const espera = checkCooldown(sender, "gatopremio", COOLDOWN_MS);
    if (espera > 0) {
      await reply({ text: `⏳ Ya jugaste el Gato con premio hace poco. Esperá *${formatTime(espera)}*.` });
      return;
    }
    const mencionado = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    await iniciarJuego(sock, from, sender, msg, "gato", { oponente: mencionado || null, conPremio: true });
  },
};
