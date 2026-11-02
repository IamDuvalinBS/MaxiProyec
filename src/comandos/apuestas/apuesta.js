import { getAccount } from "../../../motores/db.js";
import { resolverApuesta, chequearEnfriamiento, liquidar } from "../../economia/apuestas.js";
import { tarjeta, montoConSigno, monto, elegir, enviarYEditar, avisoNivel } from "../../economia/formato-evento.js";
import { estilo } from "../../economia/temas.js";

const APUESTA_MIN = 100;
const APUESTA_MAX = 20000;
const PROBABILIDAD = 0.48;
const GANANCIA_MIN = 0.25;
const GANANCIA_MAX = 0.75;
const PERDIDA_MIN = 0.3;
const PERDIDA_MAX = 0.7;

const ESTILOS = {
  normal: {
    victoria: [
      "La suerte estuvo de tu lado en la mesa principal.",
      "Tu jugada resultó favorable y el casino liquidó tu premio.",
      "La banca reconoció tu acierto y entregó la ganancia correspondiente.",
      "Una racha positiva te permitió cerrar la ronda con beneficios."
    ],
    derrota: [
      "La ronda no resultó favorable y la banca retuvo parte de tu apuesta.",
      "El casino cobró una parte de la apuesta tras un resultado adverso.",
      "La suerte no acompañó esta jugada y parte del monto fue perdido.",
      "La mesa cerró la ronda a favor de la casa, aunque recuperaste una parte."
    ],
    emojiGana: "🎰",
    emojiPierde: "🎲",
    tituloGana: "APUESTA GANADA",
    tituloPierde: "APUESTA PERDIDA",
    uso: (min, max) => `> Uso: *.apuesta <cantidad|todo>*\n> Apuesta mínima: *${monto(min)}* · máxima: *${monto(max)}*`,
    apuesta: (n) => `🎟️ *APUESTA::* ${monto(n)}`,
    resultado: (gana, n, pct) => `${gana ? "🪙" : "💸"} *RESULTADO::* ${montoConSigno(n)} (${pct > 0 ? "+" : ""}${pct}%)`,
    devuelto: (n) => `💰 *DEVUELTO::* ${monto(n)}`,
    experiencia: (n) => `✨ *EXPERIENCIA::* +${n}`,
    tip: "Usa *.dep* para guardar tu dinero antes de apostar.",
    cancelada: "⚠️ La apuesta fue cancelada porque ya no cuentas con fondos suficientes.",
    inicial: "🎰 Realizando la apuesta..."
  },
  halloween: {
    victoria: [
  "La Catrina te guiñó el ojo desde el altar y te concedió una victoria más 🌹💀.",
  "Seguiste el camino de pétalos de cempasúchil y encontraste la fortuna al final 🏵️.",
  "Un difuntito salió del Mictlán para echarte la mano; hasta en el más allá tienes contactos 💀.",
  "El esqueleto de la lotería cantó ¡BUENA SUERTE! y te llevaste todas las fichas 🎴.",
  "El Charro Negro quiso cobrarte la apuesta, pero terminaste quitándole hasta el último peso 🐎.",
  "Tu ofrenda estaba tan bien preparada que los espíritus te bendijeron con una victoria 🕯️."
],
derrota: [
  "La Catrina te invitó a bailar y terminaste entregándole hasta tus últimas monedas 💀.",
  "Un aire del panteón apagó tus veladoras y con ellas se fue toda tu suerte 🕯️.",
  "Te distrajiste siguiendo las flores de cempasúchil y cuando volviste, ya habías perdido 🏵️.",
  "El Charro Negro aceptó tu apuesta y se marchó cabalgando con tus ganancias 🐎.",
  "Los espíritus del Mictlán jugaron en tu contra; ni poniendo una ofrenda pudiste salvarte 👻.",
  "Hasta las calaveritas de azúcar se burlaron de ti; hoy la suerte se fue al otro mundo 💀."
],
emojiGana: "🏵️",
emojiPierde: "💀",
tituloGana: "🏵️ OFRENDA DE LA FORTUNA",
tituloPierde: "💀 LA SUERTE SE FUE AL MICTLÁN",
uso: (min, max) => `> Uso: *.apuesta <cantidad|todo>*\n> Apuesta mínima: *${monto(min)}* · máxima: *${monto(max)}* 🏵️`,
apuesta: (n) => `🕯️ *OFRENDA::* ${monto(n)}`,
resultado: (gana, n, pct) => `${gana ? "🏵️" : "💀"} *DESTINO::* ${montoConSigno(n)} (${pct > 0 ? "+" : ""}${pct}%)`,
devuelto: (n) => `🪙 *MONEDAS RECUPERADAS::* ${monto(n)}`,
experiencia: (n) => `💀 *SABIDURÍA DEL MÁS ALLÁ::* +${n}`,
tip: "Usa *.dep* para guardar tus monedas en el altar antes de tentar a la suerte 🏵️🕯️.",
cancelada: "⚠️ 💀 La ofrenda fue cancelada; ya no tienes suficientes monedas para continuar.",
inicial: "🏵️ Las cartas están listas, las veladoras encendidas y los espíritus esperan tu apuesta..."
  },
};

export default {
  names: [".apuesta", ".casino", ".bet"],
  usage: ".apuesta <cantidad|todo>",
  desc: "Apuesta en el casino: si ganas recibes lo apostado más un porcentaje, si pierdes solo pierdes una parte",
  category: "Apuestas",
  handler: async ({ sock, from, sender, cleanText, reply }) => {
    const E = estilo(ESTILOS);
    const apuesta = resolverApuesta(cleanText.split(/\s+/)[1], getAccount(sender).wallet, APUESTA_MIN, APUESTA_MAX);
    if (apuesta.error) {
      return reply({
        text: `${apuesta.error}\n\n${E.uso(APUESTA_MIN, APUESTA_MAX)}`
      });
    }

    const espera = chequearEnfriamiento(`casino:${sender}`, 10000);
    if (espera) return reply({ text: espera });

    const stake = apuesta.stake;
    const gana = Math.random() < PROBABILIDAD;
    const rango = gana ? [GANANCIA_MIN, GANANCIA_MAX] : [PERDIDA_MIN, PERDIDA_MAX];
    const factor = rango[0] + Math.random() * (rango[1] - rango[0]);
    const variacion = Math.min(stake, Math.max(1, Math.round(stake * factor)));
    const neto = gana ? variacion : -variacion;
    const porcentaje = Math.round((neto / stake) * 100);
    const cierre = liquidar(sender, stake, neto);

    const texto = cierre
      ? tarjeta({
          emoji: gana ? E.emojiGana : E.emojiPierde,
          titulo: gana ? E.tituloGana : E.tituloPierde,
          relato: elegir(gana ? E.victoria : E.derrota),
          lineas: [E.apuesta(stake), E.resultado(gana, neto, porcentaje), E.devuelto(stake + neto), E.experiencia(cierre.xp)],
          tip: E.tip
        })
      : E.cancelada;

    await enviarYEditar({ sock, from, reply, inicial: E.inicial, final: texto, espera: 1500 });
    if (cierre?.subioNivel) await reply({ text: avisoNivel(cierre.nivel) });
  }
};
