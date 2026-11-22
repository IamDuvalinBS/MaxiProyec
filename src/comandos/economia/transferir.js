import { getAccount, saveAccount } from "../../../motores/db.js";
import { tarjeta, monto, leerMonto, jidObjetivo } from "../../economia/formato.js";

export default {
  names: [".transferir", ".pay", ".dar"],
  usage: ".transferir <cantidad> @usuario | responder",
  desc: "Enviar dinero de tu mano a otro usuario",
  category: "Economía",
  handler: async ({ sender, cleanText, msg, reply }) => {
    const destino = jidObjetivo(msg);
    const cuenta = getAccount(sender);
    const palabras = cleanText.split(/\s+/).slice(1).filter((p) => !p.startsWith("@"));
    const cantidad = leerMonto(palabras[0], cuenta.wallet);

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
        subtitulo: `@${sender.split("@")[0]} ➜ @${destino.split("@")[0]}`,
        lineas: [`📤 *ENVIADO::* ${monto(cantidad)}`, `⛁ *TU CARTERA::* ${monto(cuenta.wallet)}`],
      }),
      mentions: [sender, destino]
    });
  }
};
