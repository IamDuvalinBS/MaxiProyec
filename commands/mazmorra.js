import { workCommand } from "../core.js";

export default {
  names: [".mazmorra", ".castillo"],
  desc: "Máximo riesgo, máxima recompensa (cada 1 hora)",
  category: "Trabajos",
  handler: workCommand({
    key: "mazmorra",
    cooldownMs: 1 * 60 * 60 * 1000,
    minReward: 700,
    maxReward: 2100,
    riesgo: {
    chanceFallo: 0.40, minPerdida: 750,  maxPerdida: 1800},
    frases: {
      titulo: "¡MAZMORRA SUPERADA!",
      tituloFallo: "¡CAÍSTE EN LA MAZMORRA!",
      exito: [
        "⚔️ Derrotaste al jefe final del castillo y te llevaste",
        "🏰 Saqueaste el tesoro real y ganaste",
        "🛡️ Sobreviviste a la mazmorra maldita con un botín de"
      ],
      fallo: [
      "☠️ Te emboscaron dentro del castillo y perdiste"
      ]
    }
  })
};
