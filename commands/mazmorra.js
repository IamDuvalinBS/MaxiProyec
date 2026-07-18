import { workCommand } from "../core.js";

export default {
  names: [".mazmorra", ".castillo"],
  desc: "Máximo riesgo, máxima recompensa (cada 6 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "mazmorra",
    cooldownMs: 6 * 60 * 60 * 1000,
    minReward: 400,
    maxReward: 900,
    riesgo: { chanceFallo: 0.55, perdidaTotal: true },
    frases: {
      titulo: "¡MAZMORRA SUPERADA!",
      tituloFallo: "¡CAÍSTE EN LA MAZMORRA!",
      exito: [
        "⚔️ Derrotaste al jefe final del castillo y te llevaste",
        "🏰 Saqueaste el tesoro real y ganaste",
        "🛡️ Sobreviviste a la mazmorra maldita con un botín de"
      ],
      fallo: [
        "💀 Perdiste todo lo que llevabas en mano, un total de",
        "☠️ Te emboscaron dentro del castillo y perdiste"
      ]
    }
  })
};
