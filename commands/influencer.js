import { workCommand } from "../core.js";

export default {
  names: [".influencer", ".tiktoker"],
  desc: "Contenido viral, buena ganancia con riesgo de flop (cada 1 hora)",
  category: "Trabajos",
  handler: workCommand({
    key: "influencer",
    cooldownMs: 1 * 60 * 60 * 1000,
    minReward: 600,
    maxReward: 1000,
    riesgo: { chanceFallo: 0.3, minPerdida: 150, maxPerdida: 500 },
    frases: {
      titulo: "¡VIDEO VIRAL!",
      tituloFallo: "¡EL VIDEO FUE UN FLOP!",
      exito: [
        "📱 Tu video se volvió viral y ganaste por publicidad",
        "🔥 Conseguiste miles de seguidores nuevos y cobraste",
        "✨ Una marca te pagó por promocionar su producto:"
      ],
      fallo: [
        "📉 Nadie vio tu contenido y perdiste plata en producción:",
        "😬 Te cancelaron en redes y perdiste patrocinios, un total de"
      ]
    }
  })
};
