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
        lineas: [
          `📤 *RETIRADO::* ${monto(cantidad)}`,
          `⛁ *CARTERA::* ${monto(cuenta.wallet)}`,
          `✦ *BANCO::* ${monto(cuenta.bank)}`
        ],
        tip: "Recuerda que el dinero en mano puede perderse en operaciones fallidas como *.crimen*."
      })
    });
  }
};
