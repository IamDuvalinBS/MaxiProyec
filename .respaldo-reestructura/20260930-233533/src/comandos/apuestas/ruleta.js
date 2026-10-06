import { getAccount } from "../../../motores/db.js";
import { resolverApuesta, chequearEnfriamiento, liquidar } from "../../economia/apuestas.js";
import { COLORES, APUESTA_MIN, APUESTA_MAX, buscarColor, girar, textoPanel, textoMultiplicador } from "../../economia/ruleta.js";
import { monto, montoConSigno, enviarYEditar, avisoNivel } from "../../economia/formato.js";

export default {
  names: [".ruleta", ".roulette"],
  usage: ".ruleta <número o color> <monto>",
  desc: "Ruleta de colores con probabilidades reales (escribe .ruleta para ver la tabla)",
  category: "Apuestas",
  handler: async ({ sock, from, sender, cleanText, reply }) => {
    const [, eleccion, cantidad] = cleanText.split(/\s+/);
    if (!eleccion) return reply({ text: textoPanel() });

    const encontrado = buscarColor(eleccion);
    if (!encontrado) {
      return reply({ text: `⚠️ Color no válido. Elige un número del 1 al ${COLORES.length} o el nombre del color. Escribe *.ruleta* para ver la tabla.` });
    }

    const apuesta = resolverApuesta(cantidad, getAccount(sender).wallet, APUESTA_MIN, APUESTA_MAX);
    if (apuesta.error) return reply({ text: `${apuesta.error}\nUso:: *.ruleta <número o color> <monto>*` });

    const espera = chequearEnfriamiento(`ruleta:${sender}`, 10000);
    if (espera) return reply({ text: espera });

    const stake = apuesta.stake;
    const elegido = encontrado.color;
    const obtenido = girar();
    const acierto = obtenido === elegido;
    const neto = acierto ? Math.round(stake * elegido.mult) - stake : -stake;
    const cierre = liquidar(sender, stake, neto);

    let resultado = "Sin coincidencia, se pierde el monto apostado.";
    if (acierto) resultado = `Coincidencia con ${textoMultiplicador(elegido)}.`;
    if (acierto && obtenido.nombre === "Diamante") resultado = `💎 ¡PREMIO MAYOR! Coincidencia con ${textoMultiplicador(elegido)}.`;

    const texto = cierre
      ? [
          "🎡 *RULETA MÁGICA*",
          `Color elegido:: *${elegido.emoji} ${elegido.nombre}*`,
          `Color obtenido:: *${obtenido.emoji} ${obtenido.nombre}*`,
          `Resultado:: ${resultado}`,
          "",
          `Apuesta:: *${monto(stake)}*`,
          `MONEDAS:: *${montoConSigno(neto)}*`,
          `EXPERIENCIA:: *+${cierre.xp}*`
        ].join("\n")
      : "⚠️ La apuesta fue cancelada porque ya no cuentas con fondos suficientes.";

    await enviarYEditar({ sock, from, reply, inicial: "🎡 Girando la ruleta...", final: texto, espera: 2500 });
    if (cierre?.subioNivel) await reply({ text: avisoNivel(cierre.nivel) });
  }
};
