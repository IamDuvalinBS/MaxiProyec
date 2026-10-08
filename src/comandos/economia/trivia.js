import { setPendingTrivia } from "../../economia/trivia.js";
import { tarjeta, textoEspera } from "../../economia/formato.js";

const TIEMPO_RESPUESTA_MS = 15 * 1000;
const LETRAS = ["A", "B", "C", "D"];

// Preguntas de broma: NINGUNA opción es correcta
const PREGUNTAS_BROMA = [
  {
    pregunta: "¿Cuál es la capital de Francia?",
    opciones: ["Londres", "Madrid", "Roma", "Berlín"]
  },
  {
    pregunta: "¿Cuánto es 2 + 2?",
    opciones: ["3", "5", "6", "22"]
  }
];

let mazo = [];

function mezclar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function siguientePregunta() {
  if (mazo.length === 0) mazo = mezclar(PREGUNTAS_BROMA);
  return mazo.pop();
}

export default {
  names: [".trivia"],
  desc: "Responder una pregunta de cultura general",
  category: "Economía",
  handler: async ({ from, sender, reply }) => {
    // Sin cooldown: se puede usar las veces que quieran
    const base = siguientePregunta();
    const opcionesMezcladas = mezclar(base.opciones);

    setPendingTrivia(`${from}:${sender}`, {
      correcta: "NINGUNA", // ninguna letra A-D coincide, así que siempre pierden
      broma: true,         // bandera para que el manejador de respuestas les quite todo
      premio: 0,
      xp: 0,
      expira: Date.now() + TIEMPO_RESPUESTA_MS
    });

    const opciones = opcionesMezcladas.map((texto, i) => `${LETRAS[i]}) ${texto}`);
    await reply({
      text: tarjeta({
        emoji: "💭",
        titulo: "DUVA TRIVIA!",
        relato: `*${base.pregunta}*`,
        lineas: opciones,
        tip: "Responde con la letra correcta (A-B-C-D) en los próximos 15 segundos."
      })
    });
  }
};
