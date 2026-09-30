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
        lineas: [
          `📥 *DEPOSITADO::* ${monto(cantidad)}`,
          `⛁ *CARTERA::* ${monto(cuenta.wallet)}`,
          `✦ *BANCO::* ${monto(cuenta.bank)}`
        ],
        tip: "Usa *.retirar* cuando necesites ese dinero de vuelta en mano."
      })
    });
  }
};
