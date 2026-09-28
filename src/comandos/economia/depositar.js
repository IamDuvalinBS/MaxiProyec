import { getAccount, saveAccount } from "../../../motores/db.js";
import { tarjeta, monto, leerMonto } from "../../economia/formato.js";

export default {
  names: [".depositar", ".dep", ".deposit"],
  usage: ".depositar <cantidad|todo>",
  desc: "Guardar dinero de tu mano en el banco",
  category: "Economía",
  handler: async ({ sender, cleanText, reply }) => {
    const cuenta = getAccount(sender);
    const cantidad = leerMonto(cleanText.split(/\s+/)[1], cuenta.wallet);

    if (!cantidad) {
      return reply({ text: "⚠️ Indica una cantidad válida o utiliza *todo*. Ejemplo: *.depositar 500*" });
    }
    if (cantidad > cuenta.wallet) {
      return reply({ text: `⚠️ Fondos insuficientes. Dinero disponible en mano: *${monto(cuenta.wallet)}*.` });
    }

    cuenta.wallet -= cantidad;
    cuenta.bank += cantidad;
    saveAccount(sender);

    await reply({
      text: tarjeta({
        emoji: "🏛️",
        titulo: "DEPÓSITO REALIZADO",
        relato: "El dinero fue resguardado correctamente en tu cuenta bancaria.",
        lineas: [
          `📥 *Depositado* ›› ${monto(cantidad)}`,
          `💰 *En mano* ›› ${monto(cuenta.wallet)}`,
          `🏛️ *En el banco* ›› ${monto(cuenta.bank)}`
        ]
      })
    });
  }
};
