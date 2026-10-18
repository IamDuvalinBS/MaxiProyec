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
      "Apostaste con un esqueleto y su mano de huesos temblaba más que tu pulso; ganaste la ronda 💀.",
      "La Catrina repartió las cartas y, por simpatía, te dejó la mejor mano 🌹.",
      "Un fantasma te sopló el número ganador; luego pidió una comisión que nunca cobró 👻.",
      "Hiciste trampa con una carta de la manga... era una mano de verdad y ganaste igual 🃏.",
      "El Charro Negro se sentó en la mesa; perdió contigo y se fue silbando sin llevarse tu alma 🐎.",
      "Una bruja bendijo tus fichas con un hechizo de suerte y la banca lloró calabazas 🧙‍♀️."
    ],
    derrota: [
      "Apostaste contra el diablo en persona; su sonrisa cobró buena parte de tus fichas 😈.",
      "Un gato negro cruzó la mesa justo cuando tirabas y tu suerte huyó con él 🐈‍⬛.",
      "La Llorona se sentó a tu lado y lloró tanto que se mojaron las cartas y perdiste 😭.",
      "El crupier era un vampiro y se bebió parte de tu apuesta... el resto se salvó por poco 🧛.",
      "Un espectro barajó con las manos atravesadas y las cartas cayeron a su favor 👻.",
      "La mesa estaba maldita desde 1892 y tú no leíste el cartel 🪦."
    ],
    emojiGana: "🃏",
    emojiPierde: "💀",
    tituloGana: "APUESTA MALDITA GANADA",
    tituloPierde: "APUESTA MALDITA PERDIDA",
    uso: (min, max) => `> Uso: *.apuesta <cantidad|todo>*\n> Apuesta mínima: *${monto(min)}* · máxima: *${monto(max)}* 🕸️`,
    apuesta: (n) => `🎟️ *PACTO::* ${monto(n)}`,
    resultado: (gana, n, pct) => `${gana ? "🎃" : "💀"} *RESULTADO::* ${montoConSigno(n)} (${pct > 0 ? "+" : ""}${pct}%)`,
    devuelto: (n) => `🏺 *DEVUELTO::* ${monto(n)}`,
    experiencia: (n) => `🔮 *EXPERIENCIA::* +${n}`,
    tip: "Usa *.dep* para esconder tus calabazas en la cripta antes de apostar con los espíritus. ⚰️",
    cancelada: "⚠️ 💀 El pacto fue cancelado porque ya no tienes calabazas suficientes.",
    inicial: "🃏 Barajando las cartas malditas..."
  }
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
