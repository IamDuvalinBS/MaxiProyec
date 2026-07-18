import { workCommand } from "../core.js";

export default {
  names: [".crimen", ".crime"],
  desc: "Ganancia alta, riesgo de multa (cada 3 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "crimen",
    cooldownMs: 30 * 60 * 1000,
    minReward: 500,
    maxReward: 1700,
    riesgo: { chanceFallo: 0.4, minPerdida: 50, maxPerdida: 150 },
    frases: {
      titulo: "¡CRIMEN EXITOSO!",
      tituloFallo: "¡TE ATRAPARON!",
      exito: [
        "🕵️ Asaltaste una tienda y te escapaste sin ser visto, ganando",
        "💰 Le robaste la cartera a un rico y sacaste",
        "🚪 Entraste a robar una casa y te llevaste"
      ],
      fallo: [
        "🚔 La policía te agarró con las manos en la masa y pagaste una multa de",
        "👮 Te delataron y tuviste que pagar una fianza de",
        "🚨 Sonó la alarma y perdiste parte del botín, un total de"
      ]
    }
  })
};
