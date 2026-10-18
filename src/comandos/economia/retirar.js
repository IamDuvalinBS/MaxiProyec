import { getAccount, saveAccount } from "../../../motores/db.js";
import { tarjeta, monto, leerMonto } from "../../economia/formato-evento.js";
import { estilo } from "../../economia/temas.js";

const ESTILOS = {
  normal: {
    emoji: "💵",
    titulo: "RETIRO REALIZADO",
    invalido: "⚠️ Indica una cantidad válida o utiliza *todo*. Ejemplo: *.retirar 500*",
    sinFondos: (n) => `⚠️ Fondos insuficientes. Dinero disponible en el banco: *${monto(n)}*.`,
    retirado: (n) => `📤 *RETIRADO::* ${monto(n)}`,
    cartera: (n) => `⛁ *CARTERA::* ${monto(n)}`,
    banco: (n) => `✦ *BANCO::* ${monto(n)}`,
    tip: "Recuerda que el dinero en mano puede perderse en operaciones fallidas como *.crimen*."
  },
  halloween: {
    emoji: "🪦",
    titulo: "DESENTIERRO REALIZADO",
    invalido: "⚠️ 🦇 Indica una cantidad válida o utiliza *todo*. Ejemplo: *.retirar 500*",
    sinFondos: (n) => `⚠️ 💀 La cripta no guarda tanto. Calabazas disponibles en la cripta: *${monto(n)}*.`,
    retirado: (n) => `🧟 *DESENTERRADO::* ${monto(n)}`,
    cartera: (n) => `🧙‍♀️ *CALDERO::* ${monto(n)}`,
    banco: (n) => `⚰️ *CRIPTA::* ${monto(n)}`,
    tip: "Cuidado: las calabazas que llevas en el caldero pueden perderse en travesuras fallidas como *.crimen*. 👻"
  }
};

export default {
  names: [".retirar", ".with", ".withdraw"],
  usage: ".retirar <cantidad|todo>",
  desc: "Sacar dinero del banco a tu mano",
  category: "Economía",
  handler: async ({ sender, cleanText, reply }) => {
    const E = estilo(ESTILOS);
    const cuenta = getAccount(sender);
    const cantidad = leerMonto(cleanText.split(/\s+/)[1], cuenta.bank);

    if (!cantidad) return reply({ text: E.invalido });
    if (cantidad > cuenta.bank) return reply({ text: E.sinFondos(cuenta.bank) });

    cuenta.bank -= cantidad;
    cuenta.wallet += cantidad;
    saveAccount(sender);

    await reply({
      text: tarjeta({
        emoji: E.emoji,
        titulo: E.titulo,
        lineas: [E.retirado(cantidad), E.cartera(cuenta.wallet), E.banco(cuenta.bank)],
        tip: E.tip
      })
    });
  }
};
