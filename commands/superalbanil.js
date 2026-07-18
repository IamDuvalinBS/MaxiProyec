import { workCommand } from "../core.js";

export default {
  names: [".superalbañil", ".albañil"],
  desc: "Construcción pesada, la mejor paga (cada 10 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "superalbanil",
    cooldownMs: 10 * 60 * 60 * 1000,
    minReward: 500,
    maxReward: 1100,
    frases: {
      titulo: "¡OBRA TERMINADA!",
      exito: [
        "🧱 Levantaste un edificio entero vos solo y cobraste",
        "🏗️ Terminaste una construcción pesada y te pagaron",
        "🔨 Hiciste de albañil, plomero y electricista en la misma obra, ganando"
      ]
    }
  })
};
