import { getAccount } from "../../../motores/db.js";
import { resolverApuesta, chequearEnfriamiento, liquidar } from "../../economia/apuestas.js";
import { tarjeta, montoConSigno, monto, elegir, enviarYEditar, avisoNivel } from "../../economia/formato.js";

const APUESTA_MIN = 100;
const APUESTA_MAX = 20000;
const PROBABILIDAD = 0.5;
const GANANCIA_MIN = 0.4;
const GANANCIA_MAX = 0.9;

const RELATOS_VICTORIA = [
  "La suerte estuvo de tu lado en la mesa principal.",
  "Tu jugada resultó favorable y el casino liquidó tu premio.",
  "La banca reconoció tu acierto y entregó la ganancia correspondiente.",
  "Una racha positiva te permitió cerrar la ronda con beneficios."
];

const RELATOS_DERROTA = [
  "La ronda no resultó favorable y la banca retuvo tu apuesta.",
  "El casino cobró la apuesta tras un resultado adverso.",
  "La suerte no acompañó esta jugada y el monto fue perdido.",
  "La mesa cerró la ronda a favor de la casa."
];

export default {
  names: [".apuesta", ".casino", ".bet"],
  usage: ".apuesta <cantidad|todo>",
  desc: "Apuesta en el casino: si ganas recibes algo más de lo apostado, si pierdes lo pierdes",
  category: "Apuestas",
  handler: async ({ sock, from, sender, cleanText, reply }) => {
    const apuesta = resolverApuesta(cleanText.split(/\s+/)[1], getAccount(sender).wallet, APUESTA_MIN, APUESTA_MAX);
    if (apuesta.error) {
      return reply({
        text: `${apuesta.error}\n\n> Uso: *.apuesta <cantidad|todo>*\n> Apuesta mínima: *${monto(APUESTA_MIN)}* · máxima: *${monto(APUESTA_MAX)}*`
      });
    }

    const espera = chequearEnfriamiento(`casino:${sender}`, 10000);
    if (espera) return reply({ text: espera });

    const stake = apuesta.stake;
    const gana = Math.random() < PROBABILIDAD;
    const factor = GANANCIA_MIN + Math.random() * (GANANCIA_MAX - GANANCIA_MIN);
    const neto = gana ? Math.max(1, Math.round(stake * factor)) : -stake;
    const cierre = liquidar(sender, stake, neto);

    const texto = cierre
      ? tarjeta({
          emoji: gana ? "🎰" : "🎲",
          titulo: gana ? "APUESTA GANADA" : "APUESTA PERDIDA",
          relato: elegir(gana ? RELATOS_VICTORIA : RELATOS_DERROTA),
          lineas: [
            `🎟️ *APUESTA::* ${monto(stake)}`,
            `${gana ? "🪙" : "💸"} *RESULTADO::* ${montoConSigno(neto)}`,
            `✨ *EXPERIENCIA::* +${cierre.xp}`
          ],
          tip: "Usa *.dep* para guardar tu dinero antes de apostar."
        })
      : "⚠️ La apuesta fue cancelada porque ya no cuentas con fondos suficientes.";

    await enviarYEditar({ sock, from, reply, inicial: "🎰 Realizando la apuesta...", final: texto, espera: 1500 });
    if (cierre?.subioNivel) await reply({ text: avisoNivel(cierre.nivel) });
  }
};
