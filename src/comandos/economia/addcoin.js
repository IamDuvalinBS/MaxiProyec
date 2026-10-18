import { addToWallet } from "../../../motores/db.js";
import { ownerCommand } from "../../../motores/owner.js";
import { tarjeta, monto, leerMonto, leerDestinoYArgumento } from "../../economia/formato-evento.js";
import { estilo } from "../../economia/temas.js";

const ESTILOS = {
  normal: {
    uso: "⚠️ Uso correcto: *.addcoin <cantidad> @usuario*\n\n> También puedes responder al mensaje del usuario.",
    emoji: "🪙",
    titulo: "DINERO OTORGADO",
    agregado: (n) => `📥 *AGREGADO::* ${monto(n)}`,
    cartera: (n) => `⛁ *CARTERA::* ${monto(n)}`,
    tip: "El saldo ya fue acreditado en la cuenta del usuario."
  },
  halloween: {
    uso: "⚠️ 🦇 Uso correcto: *.addcoin <cantidad> @usuario*\n\n> También puedes responder al mensaje del usuario. 🕸️",
    emoji: "🧙‍♀️",
    titulo: "HECHIZO DE RIQUEZA",
    agregado: (n) => `🎃 *CONJURADO::* ${monto(n)}`,
    cartera: (n) => `🧙‍♀️ *CALDERO::* ${monto(n)}`,
    tip: "Las calabazas ya aparecieron mágicamente en el caldero del usuario. ✨"
  }
};

export default {
  names: [".addcoin", ".addcoins", ".agregarcoins"],
  usage: ".addcoin <cantidad> @usuario",
  desc: "Otorgar dinero a un usuario, acreditado en su cartera (solo owner)",
  category: "Owner",
  handler: ownerCommand(async ({ msg, cleanText, reply }) => {
    const E = estilo(ESTILOS);
    const { destino, argumento } = leerDestinoYArgumento(msg, cleanText);
    const cantidad = leerMonto(argumento, 0);

    if (!destino || !cantidad) {
      return reply({ text: E.uso });
    }

    const cuenta = addToWallet(destino, cantidad);

    await reply({
      text: tarjeta({
        emoji: E.emoji,
        titulo: E.titulo,
        subtitulo: `@${destino.split("@")[0]}`,
        lineas: [E.agregado(cantidad), E.cartera(cuenta.wallet)],
        tip: E.tip
      }),
      mentions: [destino]
    });
  })
};
