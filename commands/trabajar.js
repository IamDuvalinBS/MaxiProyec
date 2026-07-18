import { workCommand } from "../core.js";

export default {
  names: [".trabajar", ".w", ".work"],
  desc: "Trabajo tranquilo, sin riesgo (cada 1 hora)",
  category: "Trabajos",
  handler: workCommand({
    key: "trabajar",
    cooldownMs: 60 * 60 * 1000, // 1 hora
    minReward: 100,
    maxReward: 500,
    frases: {
      titulo: "¡A TRABAJAR!",
      exito: [
        "☕ Trabajaste de ayudante en una cafetería lo cual te generó",
        "📦 Hiciste entregas para una tienda y ganaste",
        "🧹 Limpiaste oficinas después de tu turno y ganaste",
        "🐕 Paseaste perros del vecindario y ganaste"
      ]
    }
  })
};
