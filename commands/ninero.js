import { workCommand } from "../core.js";

export default {
  names: [".niñero", ".cuidador"],
  desc: "Cuidar niños (cada 1 hora)",
  category: "Trabajos",
  handler: workCommand({
    key: "niñero",
    cooldownMs: 1 * 0 * 60 * 1000,
    minReward: 1000,
    maxReward: 5000,
    riesgo: { chanceFallo: 0.25, minPerdida: 1000, maxPerdida: 5000 },
    frases: {
      titulo: "¡NIÑERO PRECAVIDO!",
      tituloFallo: "¡DESCUIDASTE AL BEBÉ!",
      exito: [
        "😼 Cuidaste bien al bebé de Sarita y Duva, lo cuál tu pago es de",
        "🧸 No dejaste que el bebé de Sarita y Duva llorara, tu premio es de",
        "✨ Cuidaste súper bien del bebé de Sarita... Gracias a ella obtienes:"
      ],
      fallo: [
        "🔕 Te quedaste dormido mientras el beb de Sarita lloraba",
        "🍼 El bebé llegó con mucha hambre a casa, hiciste mal cuidado de él"
      ]
    }
  })
};
