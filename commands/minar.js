import { workCommand } from "../core.js";

export default {
  names: [".minar", ".mine"],
  desc: "Minería, ganancia media (cada 2 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "minar",
    cooldownMs: 2 * 60 * 60 * 1000,
    minReward: 100,
    maxReward: 250,
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
