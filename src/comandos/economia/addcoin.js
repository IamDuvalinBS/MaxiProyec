import { addToWallet } from "../../../motores/db.js";
import { ownerCommand } from "../../../motores/owner.js";
import { tarjeta, monto, leerMonto, leerDestinoYArgumento } from "../../economia/formato.js";

export default {
  names: [".addcoin", ".addcoins", ".agregarcoins"],
  usage: ".addcoin <cantidad> @usuario",
  desc: "Otorgar dinero a un usuario, acreditado en su cartera (solo owner)",
  category: "Owner",
  handler: ownerCommand(async ({ msg, cleanText, reply }) => {
    const { destino, argumento } = leerDestinoYArgumento(msg, cleanText);
    const cantidad = leerMonto(argumento, 0);

    if (!destino || !cantidad) {
      return reply({ text: "⚠️ Uso correcto: *.addcoin <cantidad> @usuario*\n\n> También puedes responder al mensaje del usuario." });
    }

    const cuenta = addToWallet(destino, cantidad);

    await reply({
      text: tarjeta({
        emoji: "🪙",
        titulo: "DINERO OTORGADO",
        subtitulo: `@${destino.split("@")[0]}`,
        lineas: [`📥 *AGREGADO::* ${monto(cantidad)}`, `⛁ *CARTERA::* ${monto(cuenta.wallet)}`],
        tip: "El saldo ya fue acreditado en la cuenta del usuario."
      }),
      mentions: [destino]
    });
  })
};
