import { workCommand } from "../core.js";

export default {
  names: [".minar", ".mine"],
  desc: "Minería, ganancia media (cada 20 minutos)",
  category: "Trabajos",
  handler: workCommand({
    key: "minar",
    cooldownMs: 20 * 60 * 1000,
    minReward: 509,
    maxReward: 4000,
    frases: {
      titulo: "¡A LA MINA!",
      exito: [
        "⛏️ Encontraste una veta de minerales valiosos y sacaste",
        "💎 Hallaste piedras preciosas en la mina y vendiste por",
        "🪨 Extrajiste carbón y metales, ganando"
      ]
    }
  })
};
