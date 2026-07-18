import { workCommand } from "../core.js";

export default {
  names: [".espiar", ".espia"],
  desc: "Espionaje, riesgo de que te descubran (cada 5 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "espiar",
    cooldownMs: 5 * 60 * 60 * 1000,
    minReward: 150,
    maxReward: 320,
    riesgo: { chanceFallo: 0.35, minPerdida: 40, maxPerdida: 120 },
    frases: {
      titulo: "¡ESPIONAJE EXITOSO!",
      tituloFallo: "¡TE DESCUBRIERON ESPIANDO!",
      exito: [
        "🕶️ Conseguiste información valiosa y la vendiste por",
        "📷 Sacaste fotos comprometedoras y cobraste",
        "🔍 Vendiste secretos de la competencia por"
      ],
      fallo: [
        "😳 Te encontraron espiando y tuviste que pagar para que no dijeran nada:",
        "🚫 Te descubrieron y perdiste el equipo de espionaje, valuado en"
      ]
    }
  })
};
