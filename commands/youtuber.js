import { workCommand } from "../core.js";

export default {
  names: [".youtuber", ".cc"],
  desc: "Contenido en YouTube, buena ganancia (cada 8 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "youtuber",
    cooldownMs: 8 * 60 * 60 * 1000,
    minReward: 220,
    maxReward: 520,
    riesgo: { chanceFallo: 0.25, minPerdida: 30, maxPerdida: 70 },
    frases: {
      titulo: "¡MONETIZACIÓN ACTIVADA!",
      tituloFallo: "¡YOUTUBE TE DESMONETIZÓ!",
      exito: [
        "🎥 Subiste un video que pegó fuerte y ganaste por anuncios",
        "🎬 Tu canal creció bastante esta semana, cobraste",
        "🖥️ Conseguiste un sponsor para tu contenido:"
      ],
      fallo: [
        "⚠️ Youtube desmonetizó tu video y perdiste",
        "🚫 Te llegó un copyright strike y perdiste ingresos por"
      ]
    }
  })
};
