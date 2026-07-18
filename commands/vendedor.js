import { workCommand } from "../core.js";

export default {
  names: [".vendedor", ".ambulante"],
  desc: "Ventas ambulantes, ganancia chica pero segura (cada 2 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "vendedor",
    cooldownMs: 2 * 60 * 60 * 1000,
    minReward: 60,
    maxReward: 150,
    frases: {
      titulo: "¡VENTA DEL DÍA!",
      exito: [
        "🌭 Vendiste hot dogs en la esquina y ganaste",
        "🍦 Vendiste helados en el parque y sacaste",
        "🧢 Vendiste gorras y accesorios en el semáforo, ganando"
      ]
    }
  })
};
