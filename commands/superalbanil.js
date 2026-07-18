import { workCommand } from "../core.js";

export default {
  names: [".superalbañil"],
  desc: "Construcción pesada, la mejor paga (cada 6 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "superalbanil",
    cooldownMs: 6 * 60 * 60 * 1000,
    minReward: 5000,
    maxReward: 50000,
    frases: {
      titulo: "¡OBRA TERMINADA!",
      exito: [
        "🧱 Levantaste un edificio entero tú solo y cobraste",
        "🏗️ Terminaste una construcción pesada y te pagaron",
        "🔨 Hiciste de albañil, plomero y electricista en la misma obra, ganando",
        "🚚 Hiciste una tienda de accesorios para damas con doble piso, por ello cobraste"
      ]
    }
  })
};
