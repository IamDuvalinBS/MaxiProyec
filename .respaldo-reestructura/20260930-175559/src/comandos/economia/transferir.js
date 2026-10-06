import { getAccount, saveAccount } from "../../../motores/db.js";
import { tarjeta, monto, leerMonto, jidMencionado } from "../../economia/formato.js";

export default {
  names: [".transferir", ".pay", ".dar"],
  usage: ".transferir <cantidad> @usuario",
  desc: "Enviar dinero de tu mano a otro usuario",
  category: "Economía",
  handler: async ({ sender, cleanText, msg, reply }) => {
    const destino = jidMencionado(msg);
    const cuenta = getAccount(sender);
    const cantidad = leerMonto(cleanText.split(/\s+/)[1], cuenta.wallet);

    if (!destino || !cantidad) {
      return reply({ text: "⚠️ Uso correcto: *.transferir <cantidad> @usuario*" });
    }
    if (destino === sender) {
      return reply({ text: "⚠️ No es posible realizar una transferencia a tu propia cuenta." });
    }
    if (cantidad > cuenta.wallet) {
      return reply({ text: `⚠️ Fondos insuficientes. Dinero disponible en mano: *${monto(cuenta.wallet)}*.` });
    }

    const cuentaDestino = getAccount(destino);
    cuenta.wallet -= cantidad;
    cuentaDestino.wallet += cantidad;
    saveAccount(sender);
    saveAccount(destino);

    await reply({
      text: tarjeta({
        emoji: "💸",
        titulo: "TRANSFERENCIA COMPLETADA",
        relato: `Se envió dinero a @${destino.split("@")[0]} de forma satisfactoria.`,
        lineas: [
          `📤 *Monto enviado* ›› ${monto(cantidad)}`,
          `💰 *Tu saldo en mano* ›› ${monto(cuenta.wallet)}`
        ]
      }),
      mentions: [destino]
    });
  }
};
