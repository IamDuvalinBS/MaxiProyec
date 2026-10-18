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
    emoji: "💀",
    titulo: "DADO MALDITO",
    relato: `Elige en qué número crees que caerá el *dado de hueso*, del *1 al ${CARAS}*. 🦴`,
    apuesta: (n) => `🎟️ *PACTO::* ${monto(n)}`,
    premio: (n) => `🏆 *BOTÍN SI ACIERTAS::* ${monto(n)}`,
    tip: `Responde con un número del 1 al ${CARAS} en los próximos 30 segundos, antes de que cante el cuervo. 🐦‍⬛`,
    tirando: "🎲 💀 Lanzando el dado de hueso...",
    tituloAcierto: "DADO MALDITO ACERTADO",
    tituloFallo: "DADO MALDITO FALLADO",
    relatoAcierto: [
      "El dado de hueso cayó justo donde dijiste; el esqueleto que lo lanzó aplaudió con sus propias manos 💀.",
      "Un fantasma sopló el dado hasta tu número y pidió que no lo acusaras de trampa 👻.",
      "La Catrina vio el dado, sonrió y dijo 'este me cae bien'. Cobraste el botín 🌹.",
      "El dado giró tanto que hasta un murciélago se mareó, pero cayó en tu número 🦇."
    ],
    relatoFallo: [
      "El dado cayó en otro número; el cuervo que lo miraba soltó una carcajada 🐦‍⬛.",
      "Un gato negro tiró el dado de la mesa y rodó hacia el número equivocado 🐈‍⬛.",
      "La Llorona lloró encima del dado y lo desvió; perdiste la apuesta 😭.",
      "El dado era un hueso del vecino y se fue rodando a su lugar de descanso 🪦."
    ],
    eleccion: (n) => `🎯 *TU ELECCIÓN::* ${n}`,
    resultado: (n) => `🦴 *RESULTADO::* ${n}`,
    monedas: (acierto, n) => `${acierto ? "🎃" : "💀"} *CALABAZAS::* ${montoConSigno(n)}`,
    experiencia: (n) => `🔮 *EXPERIENCIA::* +${n}`,
    tipFinal: "Usa *.dado* de nuevo para desafiar otra vez a los espíritus. 🦇",
    cancelada: "⚠️ 💀 El pacto fue cancelado porque ya no tienes calabazas suficientes."
  }
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
