import { getAccount } from "../../../motores/db.js";
import { registrarEspera } from "../../nucleo/espera.js";
import { resolverApuesta, chequearEnfriamiento, liquidar } from "../../economia/apuestas.js";
import { tarjeta, monto, montoConSigno, entre, elegir, pausa, avisoNivel } from "../../economia/formato-evento.js";
import { estilo } from "../../economia/temas.js";

const CARAS = 8;
const APUESTA_BASE = 100;
const APUESTA_MAX = 5000;
const MULTIPLICADOR = 6;
const TIEMPO_ELECCION_MS = 30 * 1000;

const ESTILOS = {
  normal: {
    emoji: "🎲",
    titulo: "DADO",
    relato: `Elige en qué número crees que caerá el dado, del *1 al ${CARAS}*.`,
    apuesta: (n) => `🎟️ *APUESTA::* ${monto(n)}`,
    premio: (n) => `🏆 *PREMIO SI ACIERTAS::* ${monto(n)}`,
    tip: `Responde con un número del 1 al ${CARAS} en los próximos 30 segundos.`,
    tirando: "🎲 Tirando el dado...",
    tituloAcierto: "DADO ACERTADO",
    tituloFallo: "DADO FALLADO",
    relatoAcierto: "Tu predicción coincidió con el resultado y se acreditó el premio.",
    relatoFallo: "Tu predicción no coincidió con el resultado y se descontó la apuesta.",
    eleccion: (n) => `🎯 *TU ELECCIÓN::* ${n}`,
    resultado: (n) => `🎲 *RESULTADO::* ${n}`,
    monedas: (acierto, n) => `${acierto ? "🪙" : "💸"} *MONEDAS::* ${montoConSigno(n)}`,
    experiencia: (n) => `✨ *EXPERIENCIA::* +${n}`,
    tipFinal: "Usa *.dado* de nuevo para intentar otra vez.",
    cancelada: "⚠️ La apuesta fue cancelada porque ya no cuentas con fondos suficientes."
  },
   halloween: {
    emoji: "🏵️",
    titulo: "DADO DEL MICTLÁN",
    relato: `Adivina en qué número caerá el *dado de hueso*, del *1 al ${CARAS}*. 🦴`,
    apuesta: (n) => `🕯️ *OFRENDA::* ${monto(n)}`,
    premio: (n) => `🏵️ *PREMIO SI ACIERTAS::* ${monto(n)}`,
    tip: `Responde con un número del 1 al ${CARAS} en los próximos 30 segundos, antes de que se apague la veladora. 🕯️`,
    tirando: "🏵️ Lanzando el dado del más allá...",
    tituloAcierto: "🏵️ DESTINO DEL MICTLÁN ACERTADO",
    tituloFallo: "💀 EL DESTINO TE HA FALLADO",
    relatoAcierto: [
      "El dado cayó justo en tu número; hasta las almas del Mictlán celebraron tu buena fortuna 🏵️.",
      "Los pétalos de cempasúchil guiaron al dado hasta tu número; tu ofrenda fue bien recibida 🌼.",
      "La Catrina observó tu jugada, sonrió y te concedió la fortuna de esta noche 💀🌹.",
      "Una veladora iluminó tu destino y el dado cayó exactamente donde lo predijiste 🕯️."
    ],
    relatoFallo: [
      "El dado cayó en otro número y la Catrina se llevó tu suerte al más allá 💀.",
      "Un viento del panteón dispersó los pétalos de cempasúchil y el dado terminó en otro número 🏵️.",
      "Un difuntito movió el dado mientras nadie miraba; esta vez no hubo fortuna 👻.",
      "La veladora se apagó justo antes de la tirada y tu suerte se perdió entre las sombras del Mictlán 🕯️."
    ],
    eleccion: (n) => `🎯 *TU NÚMERO ELEGIDO::* ${n}`,
    resultado: (n) => `🦴 *NÚMERO DEL DESTINO::* ${n}`,
    monedas: (acierto, n) => `${acierto ? "🏵️" : "💀"} *MONEDAS DE LA OFRENDA::* ${montoConSigno(n)}`,
    experiencia: (n) => `🕯️ *SABIDURÍA ANCESTRAL::* +${n}`,
    tipFinal: "Usa *.dado* para volver a desafiar al destino y probar tu fortuna en el Mictlán 🏵️.",
    cancelada: "⚠️ 💀 La ofrenda fue cancelada porque ya no tienes suficientes monedas."
   },
};

export default {
  names: [".dado", ".dice"],
  usage: ".dado [monto]",
  desc: `Adivina en qué número caerá el dado (1 al ${CARAS}) y gana ${MULTIPLICADOR} veces lo apostado`,
  category: "Apuestas",
  handler: async ({ from, sender, cleanText, reply }) => {
    const E = estilo(ESTILOS);
    const argumento = cleanText.split(/\s+/)[1];
    const disponible = getAccount(sender).wallet;
    const apuesta = argumento
      ? resolverApuesta(argumento, disponible, APUESTA_BASE, APUESTA_MAX)
      : resolverApuesta(String(APUESTA_BASE), disponible, APUESTA_BASE, APUESTA_MAX);
    if (apuesta.error) return reply({ text: apuesta.error });

    const espera = chequearEnfriamiento(`dado:${sender}`, 8000);
    if (espera) return reply({ text: espera });

    const stake = apuesta.stake;
    registrarEspera(`${from}:${sender}`, {
      duracionMs: TIEMPO_ELECCION_MS,
      alResponder: async (respuesta, { sock, msg }) => {
        const limpia = respuesta.trim();
        const elegido = parseInt(limpia, 10);
        if (!/^\d+$/.test(limpia) || elegido < 1 || elegido > CARAS) return false;

        const responder = (contenido) => sock.sendMessage(from, contenido, { quoted: msg });
        const inicial = await responder({ text: E.tirando });
        await pausa(1800);

        const resultado = entre(1, CARAS);
        const acierto = resultado === elegido;
        const neto = acierto ? stake * MULTIPLICADOR : -stake;
        const cierre = liquidar(sender, stake, neto);

        const texto = cierre
          ? tarjeta({
              emoji: E.emoji,
              titulo: acierto ? E.tituloAcierto : E.tituloFallo,
              relato: elegir([].concat(acierto ? E.relatoAcierto : E.relatoFallo)),
              lineas: [E.eleccion(elegido), E.resultado(resultado), E.monedas(acierto, neto), E.experiencia(cierre.xp)],
              tip: E.tipFinal
            })
          : E.cancelada;

        try {
          await sock.sendMessage(from, { text: texto, edit: inicial.key });
        } catch (e) {
          await responder({ text: texto });
        }
        if (cierre?.subioNivel) await responder({ text: avisoNivel(cierre.nivel) });
        return true;
      }
    });

    await reply({
      text: tarjeta({
        emoji: E.emoji,
        titulo: E.titulo,
        relato: E.relato,
        lineas: [E.apuesta(stake), E.premio(stake * MULTIPLICADOR)],
        tip: E.tip
      })
    });
  }
};
