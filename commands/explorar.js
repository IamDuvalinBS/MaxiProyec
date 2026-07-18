import { workCommand } from "../core.js";

export default {
  names: [".explorar", ".investigar"],
  desc: "Exploración, ganancia media-alta (cada 4 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "explorar",
    cooldownMs: 4 * 60 * 60 * 1000,
    minReward: 180,
    maxReward: 350,
    frases: {
      titulo: "¡EXPLORACIÓN COMPLETADA!",
      exito: [
        "🗺️ Encontraste ruinas antiguas con objetos de valor y sacaste",
        "🔦 Investigaste una cueva olvidada y hallaste",
        "🧭 Descubriste un mapa del tesoro y lo vendiste por"
      ]
    }
  })
};
