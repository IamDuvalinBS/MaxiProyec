import { workCommand } from "../core.js";

export default {
  names: [".explorar", ".investigar"],
  desc: "Exploración, ganancia media-alta (cada 30 minutos)",
  category: "Trabajos",
  handler: workCommand({
    key: "explorar",
    cooldownMs: 30 * 60 * 1000,
    minReward: 500,
    maxReward: 1200,
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
