import { getAccount, saveAccount } from "../../../motores/db.js";
import { tarjeta, monto, leerMonto } from "../../economia/formato-evento.js";
import { estilo } from "../../economia/temas.js";

const ESTILOS = {
  normal: {
    emoji: "🏛️",
    titulo: "DEPÓSITO REALIZADO",
    invalido: "⚠️ Indica una cantidad válida o utiliza *todo*. Ejemplo: *.depositar 500*",
    sinFondos: (n) => `⚠️ Fondos insuficientes. Dinero disponible en mano: *${monto(n)}*.`,
    depositado: (n) => `📥 *DEPOSITADO::* ${monto(n)}`,
    cartera: (n) => `⛁ *CARTERA::* ${monto(n)}`,
    banco: (n) => `✦ *BANCO::* ${monto(n)}`,
    tip: "Usa *.retirar* cuando necesites ese dinero de vuelta en mano."
  },
  halloween: {
    emoji: "⚰️",
    titulo: "ENTIERRO EN LA CRIPTA",
    invalido: "⚠️ 🦇 Indica una cantidad válida o utiliza *todo*. Ejemplo: *.depositar 500*",
    sinFondos: (n) => `⚠️ 💀 No tienes tantas calabazas. En tu caldero solo hay: *${monto(n)}*.`,
    depositado: (n) => `🪦 *ENTERRADO::* ${monto(n)}`,
    cartera: (n) => `🧙‍♀️ *CALDERO::* ${monto(n)}`,
    banco: (n) => `⚰️ *CRIPTA::* ${monto(n)}`,
    tip: "Usa *.retirar* cuando quieras desenterrar tus calabazas. 🕯️"
  }
};

export default {
  names: [".depositar", ".dep", ".deposit"],
  usage: ".depositar <cantidad|todo>",
  desc: "Guardar dinero de tu mano en el banco",
  category: "Economía",
  handler: async ({ sender, cleanText, reply }) => {
    const E = estilo(ESTILOS);
    const cuenta = getAccount(sender);
    const cantidad = leerMonto(cleanText.split(/\s+/)[1], cuenta.wallet);

    if (!cantidad) return reply({ text: E.invalido });
    if (cantidad > cuenta.wallet) return reply({ text: E.sinFondos(cuenta.wallet) });

    cuenta.wallet -= cantidad;
    cuenta.bank += cantidad;
    saveAccount(sender);

    await reply({
      text: tarjeta({
        emoji: E.emoji,
        titulo: E.titulo,
        lineas: [E.depositado(cantidad), E.cartera(cuenta.wallet), E.banco(cuenta.bank)],
        tip: E.tip
      })
    });
  }
};
