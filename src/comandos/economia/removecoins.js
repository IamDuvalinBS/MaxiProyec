import { getAccount, getAllAccounts, saveAccount } from "../../../motores/db.js";
import { ownerCommand } from "../../../motores/owner.js";
import { tarjeta, monto, leerMonto, leerDestinoYArgumento } from "../../economia/formato-evento.js";
import { estilo } from "../../economia/temas.js";

const ESTILOS = {
  normal: {
    uso: "⚠️ Uso correcto: *.removecoins <cantidad> @usuario*\n\n> Usa *.removecoins all @usuario* para quitar todo su dinero (cartera y banco).",
    sinCuenta: "⚠️ Ese usuario todavía no tiene una cuenta registrada.",
    invalido: "⚠️ Indica una cantidad válida o usa *all*.\n\n> Ejemplo: *.removecoins 5000 @usuario*",
    sinDinero: "⚠️ Ese usuario no tiene dinero en su cartera ni en su banco.",
    emoji: "💸",
    titulo: "DINERO RETIRADO",
    retirado: (n) => `📤 *RETIRADO::* ${monto(n)}`,
    cartera: (n) => `⛁ *CARTERA::* ${monto(n)}`,
    banco: (n) => `🏦 *BANCO::* ${monto(n)}`,
    tip: "Se descuenta primero de la cartera y después del banco."
  },
  halloween: {
    uso: "⚠️ 🦇 Uso correcto: *.removecoins <cantidad> @usuario*\n\n> Usa *.removecoins all @usuario* para llevarte todas sus calabazas (caldero y cripta). 💀",
    sinCuenta: "⚠️ 🪦 Esa alma todavía no tiene una cuenta registrada.",
    invalido: "⚠️ 🕸️ Indica una cantidad válida o usa *all*.\n\n> Ejemplo: *.removecoins 5000 @usuario*",
    sinDinero: "⚠️ 👻 Esa alma no tiene calabazas en su caldero ni en su cripta.",
    emoji: "🧛",
    titulo: "CALABAZAS ROBADAS",
    retirado: (n) => `🩸 *DRENADO::* ${monto(n)}`,
    cartera: (n) => `🧙‍♀️ *CALDERO::* ${monto(n)}`,
    banco: (n) => `⚰️ *CRIPTA::* ${monto(n)}`,
    tip: "Se drena primero del caldero y después de la cripta. 🦇"
  }
};

export default {
  names: [".removecoins", ".removecoin", ".removercoins"],
  usage: ".removecoins <cantidad|all> @usuario",
  desc: "Quitar dinero a un usuario, o todo su dinero con all (solo owner)",
  category: "Owner",
  handler: ownerCommand(async ({ msg, cleanText, reply }) => {
    const E = estilo(ESTILOS);
    const { destino, argumento } = leerDestinoYArgumento(msg, cleanText);
    const todo = ["all", "todo"].includes((argumento || "").toLowerCase());

    if (!destino || !argumento) {
      return reply({ text: E.uso });
    }
    if (!getAllAccounts().has(destino)) {
      return reply({ text: E.sinCuenta });
    }

    const cuenta = getAccount(destino);
    const total = cuenta.wallet + cuenta.bank;
    const cantidad = todo ? total : leerMonto(argumento, total);

    if (!cantidad && !todo) {
      return reply({ text: E.invalido });
    }
    if (!total) {
      return reply({ text: E.sinDinero });
    }

    const quitado = Math.min(cantidad, total);
    const deCartera = Math.min(cuenta.wallet, quitado);
    cuenta.wallet -= deCartera;
    cuenta.bank -= quitado - deCartera;
    saveAccount(destino);

    await reply({
      text: tarjeta({
        emoji: E.emoji,
        titulo: E.titulo,
        subtitulo: `@${destino.split("@")[0]}`,
        lineas: [E.retirado(quitado), E.cartera(cuenta.wallet), E.banco(cuenta.bank)],
        tip: E.tip
      }),
      mentions: [destino]
    });
  })
};
