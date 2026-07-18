import { workCommand } from "../core.js";

export default {
  names: [".migajear", ".limosna", ".ayudas"],
  desc: "Pedir ayudas, ganancia mínima pero rápida (cada 3 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "migajear",
    cooldownMs: 3 * 60 * 60 * 1000,
    minReward: 10,
    maxReward: 45,
    frases: {
      titulo: "MIGAJAS DEL DÍA",
      exito: [
        "🙏 Pediste ayuda en la calle y te dieron",
        "🥺 Alguien se compadeció de vos y te regaló",
        "🤲 Recolectaste algunas monedas sueltas, un total de"
      ]
    }
  })
};
