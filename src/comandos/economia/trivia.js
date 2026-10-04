import { checkCooldown } from "../../../motores/db.js";
import { PREGUNTAS } from "../../economia/preguntas.js";
import { setPendingTrivia } from "../../economia/trivia.js";
import { tarjeta, elegir, entre, textoEspera } from "../../economia/formato.js";

const ESPERA_MS = 29 * 60 * 1000;
const TIEMPO_RESPUESTA_MS = 30 * 1000;
const LETRAS = ["A", "B", "C", "D"];

export default {
  names: [".trivia"],
  desc: "Responder una pregunta de cultura general (cada 2 minutos)",
  category: "Economía",
  handler: async ({ from, sender, reply }) => {
    const espera = checkCooldown(sender, "trivia", ESPERA_MS);
    if (espera > 0) return reply({ text: textoEspera(espera) });

    const pregunta = elegir(PREGUNTAS);
    setPendingTrivia(`${from}:${sender}`, {
      correcta: LETRAS[pregunta.correcta],
      premio: entre(100, 300),
      xp: entre(5, 15),
      expira: Date.now() + TIEMPO_RESPUESTA_MS
    });

    const opciones = pregunta.opciones.map((o, i) => `${LETRAS[i]}) ${o}`);
    await reply({
      text: tarjeta({
        emoji: "💭",
        titulo: "DUVA TRIVIA!",
        relato: `*${pregunta.pregunta}*`,
        lineas: opciones,
        tip: "Responde con la letra correcta (A-B-C-D) en los próximos 30 segundos."
      })
    });
  }
};
