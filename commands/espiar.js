import { workCommand } from "../core.js";

export default {
  names: [".espiar", ".espia"],
  desc: "Espionaje, riesgo de que te descubran (cada 3 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "espiar",
    cooldownMs: 3 * 60 * 60 * 1000,
    minReward: 700,
    maxReward: 5000,
    riesgo: { chanceFallo: 0.35, minPerdida: 1200, maxPerdida: 3750 },
    frases: {
      titulo: "¡ESPIONAJE EXITOSO!",
      tituloFallo: "¡TE DESCUBRIERON ESPIANDO!",
      exito: [
        "🕶️ Conseguiste información valiosa y la vendiste por",
        "📷 Sacaste fotos comprometedoras y cobraste",
        "🔍 Vendiste secretos de la competencia por",
        "🤤 Grabastes a la vecina en la ducha y procediste a vender el video por"
      ],
      fallo: [
        "😳 Te encontraron espiando y tuviste que pagar para que no dijeran nada:",
        "🚫 Te descubrieron y perdiste el equipo de espionaje, valuado en"
      ]
    }
  })
};
