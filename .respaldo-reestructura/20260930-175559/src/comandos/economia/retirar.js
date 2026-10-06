import { getAccount, saveAccount } from "../../../motores/db.js";
import { tarjeta, monto, leerMonto } from "../../economia/formato.js";

export default {
  names: [".retirar", ".with", ".withdraw"],
  usage: ".retirar <cantidad|todo>",
  desc: "Sacar dinero del banco a tu mano",
  category: "Economía",
  handler: async ({ sender, cleanText, reply }) => {
    const cuenta = getAccount(sender);
    const cantidad = leerMonto(cleanText.split(/\s+/)[1], cuenta.bank);

    if (!cantidad) {
      return reply({ text: "⚠️ Indica una cantidad válida o utiliza *todo*. Ejemplo: *.retirar 500*" });
    }
    if (cantidad > cuenta.bank) {
      return reply({ text: `⚠️ Fondos insuficientes. Dinero disponible en el banco: *${monto(cuenta.bank)}*.` });
    }

    cuenta.bank -= cantidad;
    cuenta.wallet += cantidad;
    saveAccount(sender);

    await reply({
      text: tarjeta({
        emoji: "💵",
        titulo: "RETIRO REALIZADO",
        relato: "El dinero solicitado fue entregado y ya se encuentra disponible en mano.",
        lineas: [
          `📤 *Retirado* ›› ${monto(cantidad)}`,
          `💰 *En mano* ›› ${monto(cuenta.wallet)}`,
          `🏛️ *En el banco* ›› ${monto(cuenta.bank)}`
        ]
      })
    });
  }
};
