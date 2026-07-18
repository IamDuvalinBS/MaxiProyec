import { workCommand } from "../core.js";

export default {
  names: [".migajear", ".limosna", ".ayudas"],
  desc: "Pedir ayudas, ganancia mínima pero rápida (cada 10 minutos)",
  category: "Trabajos",
  handler: workCommand({
    key: "migajear",
    cooldownMs: 10 * 60 * 1000,
    minReward: 20,
    maxReward: 70,
    frases: {
      titulo: "MIGAJAS DEL DÍA",
      exito: [
        "🙏 Pediste ayuda en la calle y te dieron",
        "🥺 Alguien se compadeció de tí y te regaló",
        "🤲 Recolectaste algunas monedas sueltas, un total de"
      ]
    }
  })
};
