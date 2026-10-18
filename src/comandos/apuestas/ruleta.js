import { getAccount } from "../../../motores/db.js";
import { resolverApuesta, chequearEnfriamiento, liquidar } from "../../economia/apuestas.js";
import { COLORES, APUESTA_MIN, APUESTA_MAX, buscarColor, girar, textoPanel, textoMultiplicador, verColor } from "../../economia/ruleta.js";
import { tarjeta, monto, montoConSigno, enviarYEditar, avisoNivel } from "../../economia/formato-evento.js";
import { estilo } from "../../economia/temas.js";

const ESTILOS = {
  normal: {
    invalido: `⚠️ Color no válido. Elige un número del 1 al ${COLORES.length} o el nombre del color. Escribe *.ruleta* para ver la tabla.`,
    uso: "> Uso: *.ruleta <número o color> <monto>*",
    sinCoincidencia: "Sin coincidencia, se pierde el monto apostado.",
    coincidencia: (mult) => `Coincidencia con ${mult}.`,
    premioMayor: (mult) => `💎 ¡PREMIO MAYOR! Coincidencia con ${mult}.`,
    emojiGana: "🎡",
    emojiPierde: "🎲",
    tituloGana: "RULETA ACERTADA",
    tituloPierde: "RULETA FALLIDA",
    elegido: (v) => `🎨 *ELEGIDO::* ${v.emoji} ${v.nombre}`,
    obtenido: (v) => `🎯 *OBTENIDO::* ${v.emoji} ${v.nombre}`,
    apuesta: (n) => `🎟️ *APUESTA::* ${monto(n)}`,
    monedas: (ok, n) => `${ok ? "🪙" : "💸"} *MONEDAS::* ${montoConSigno(n)}`,
    experiencia: (n) => `✨ *EXPERIENCIA::* +${n}`,
    tip: "Usa *.ruleta* para ver la tabla de colores y probabilidades.",
    cancelada: "⚠️ La apuesta fue cancelada porque ya no cuentas con fondos suficientes.",
    girando: "🎡 Girando la ruleta..."
  },
  halloween: {
    invalido: `⚠️ 🦇 Criatura no válida. Elige un número del 1 al ${COLORES.length} o el nombre de la criatura. Escribe *.ruleta* para ver la tabla.`,
    uso: "> Uso: *.ruleta <número o criatura> <monto>* 🕸️",
    sinCoincidencia: [
      "La ruleta se detuvo en otra criatura; el Silbón silbó de burla y se llevó tu apuesta 🦴.",
      "La bola cayó en el casillero equivocado; el fantasma del crupier ni siquiera se disculpó 👻.",
      "Giraste la ruleta y una mano salió de la rueda a recoger tus calabazas 🖐️.",
      "Los espíritus se rieron de tu elección y se quedaron con la apuesta 🕸️."
    ],
    coincidencia: (mult) => {
      const frases = [
        "La ruleta se detuvo justo en tu criatura y el murciélago de la mesa aplaudió 🦇",
        "La bruja que giraba la rueda guiñó un ojo y cayó en tu casillero 🧙‍♀️",
        "Un fantasma empujó la bola con cariño hasta tu criatura 👻",
        "La Catrina sonrió y la ruleta cayó donde dijiste 🌹"
      ];
      return `${frases[Math.floor(Math.random() * frases.length)]}. Coincidencia con ${mult}.`;
    },
    premioMayor: (mult) => `🧛 ¡PREMIO MAYOR! El Vampiro te eligió. Coincidencia con ${mult}. 🦇`,
    emojiGana: "🎃",
    emojiPierde: "💀",
    tituloGana: "RULETA EMBRUJADA ACERTADA",
    tituloPierde: "RULETA EMBRUJADA FALLIDA",
    elegido: (v) => `🔮 *ELEGIDO::* ${v.emoji} ${v.nombre}`,
    obtenido: (v) => `🎯 *OBTENIDO::* ${v.emoji} ${v.nombre}`,
    apuesta: (n) => `🎟️ *PACTO::* ${monto(n)}`,
    monedas: (ok, n) => `${ok ? "🎃" : "💀"} *CALABAZAS::* ${montoConSigno(n)}`,
    experiencia: (n) => `🦇 *EXPERIENCIA::* +${n}`,
    tip: "Usa *.ruleta* para ver la tabla de criaturas y probabilidades. 🕯️",
    cancelada: "⚠️ 💀 El pacto fue cancelado porque ya no tienes calabazas suficientes.",
    girando: "🎡 🕸️ Girando la ruleta embrujada..."
  }
};

export default {
  names: [".ruleta", ".roulette"],
  usage: ".ruleta <número o color> <monto>",
  desc: "Ruleta de colores con probabilidades reales (escribe .ruleta para ver la tabla)",
  category: "Apuestas",
  handler: async ({ sock, from, sender, cleanText, reply }) => {
    const E = estilo(ESTILOS);
    const [, eleccion, cantidad] = cleanText.split(/\s+/);
    if (!eleccion) return reply({ text: textoPanel() });

    const encontrado = buscarColor(eleccion);
    if (!encontrado) {
      return reply({ text: E.invalido });
    }

    const apuesta = resolverApuesta(cantidad, getAccount(sender).wallet, APUESTA_MIN, APUESTA_MAX);
    if (apuesta.error) return reply({ text: `${apuesta.error}\n\n${E.uso}` });

    const espera = chequearEnfriamiento(`ruleta:${sender}`, 10000);
    if (espera) return reply({ text: espera });

    const stake = apuesta.stake;
    const elegido = encontrado.color;
    const obtenido = girar();
    const acierto = obtenido === elegido;
    const neto = acierto ? Math.round(stake * elegido.mult) - stake : -stake;
    const cierre = liquidar(sender, stake, neto);

    let resultado = [].concat(E.sinCoincidencia)[Math.floor(Math.random() * [].concat(E.sinCoincidencia).length)];
    if (acierto) resultado = E.coincidencia(textoMultiplicador(elegido));
    if (acierto && obtenido === COLORES[COLORES.length - 1]) resultado = E.premioMayor(textoMultiplicador(elegido));

    const texto = cierre
      ? tarjeta({
          emoji: acierto ? E.emojiGana : E.emojiPierde,
          titulo: acierto ? E.tituloGana : E.tituloPierde,
          relato: resultado,
          lineas: [
            E.elegido(verColor(elegido)),
            E.obtenido(verColor(obtenido)),
            E.apuesta(stake),
            E.monedas(neto >= 0, neto),
            E.experiencia(cierre.xp)
          ],
          tip: E.tip
        })
      : E.cancelada;

    await enviarYEditar({ sock, from, reply, inicial: E.girando, final: texto, espera: 2500 });
    if (cierre?.subioNivel) await reply({ text: avisoNivel(cierre.nivel) });
  }
};
