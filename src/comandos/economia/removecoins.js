import { getAccount, getAllAccounts, saveAccount } from "../../../motores/db.js";
import { ownerCommand } from "../../../motores/owner.js";
import { tarjeta, monto, leerMonto, leerDestinoYArgumento } from "../../economia/formato.js";

export default {
  names: [".removecoins", ".removecoin", ".removercoins"],
  usage: ".removecoins <cantidad|all> @usuario",
  desc: "Quitar dinero a un usuario, o todo su dinero con all (solo owner)",
  category: "Owner",
  handler: ownerCommand(async ({ msg, cleanText, reply }) => {
    const { destino, argumento } = leerDestinoYArgumento(msg, cleanText);
    const todo = ["all", "todo"].includes((argumento || "").toLowerCase());

    if (!destino || !argumento) {
      return reply({ text: "⚠️ Uso correcto: *.removecoins <cantidad> @usuario*\n\n> Usa *.removecoins all @usuario* para quitar todo su dinero (cartera y banco)." });
    }
    if (!getAllAccounts().has(destino)) {
      return reply({ text: "⚠️ Ese usuario todavía no tiene una cuenta registrada." });
    }

    const cuenta = getAccount(destino);
    const total = cuenta.wallet + cuenta.bank;
    const cantidad = todo ? total : leerMonto(argumento, total);

    if (!cantidad && !todo) {
      return reply({ text: "⚠️ Indica una cantidad válida o usa *all*.\n\n> Ejemplo: *.removecoins 5000 @usuario*" });
    }
    if (!total) {
      return reply({ text: "⚠️ Ese usuario no tiene dinero en su cartera ni en su banco." });
    }

    const quitado = Math.min(cantidad, total);
    const deCartera = Math.min(cuenta.wallet, quitado);
    cuenta.wallet -= deCartera;
    cuenta.bank -= quitado - deCartera;
    saveAccount(destino);

    await reply({
      text: tarjeta({
        emoji: "💸",
        titulo: "DINERO RETIRADO",
        subtitulo: `@${destino.split("@")[0]}`,
        lineas: [
          `📤 *RETIRADO::* ${monto(quitado)}`,
          `⛁ *CARTERA::* ${monto(cuenta.wallet)}`,
          `🏦 *BANCO::* ${monto(cuenta.bank)}`
        ],
        tip: "Se descuenta primero de la cartera y después del banco."
      }),
      mentions: [destino]
    });
  })
};
