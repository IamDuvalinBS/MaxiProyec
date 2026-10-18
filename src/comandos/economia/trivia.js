import { checkCooldown } from "../../../motores/db.js";
import { PREGUNTAS, PREGUNTAS_HALLOWEEN } from "../../economia/preguntas.js";
import { setPendingTrivia } from "../../economia/trivia.js";
import { tarjeta, entre, textoEspera } from "../../economia/formato-evento.js";
import { estilo, esHalloween } from "../../economia/temas.js";

const ESPERA_MS = 15 * 60 * 1000;
const TIEMPO_RESPUESTA_MS = 15 * 1000;
const LETRAS = ["A", "B", "C", "D"];

const ESTILOS = {
  normal: {
    emoji: "💭",
    titulo: "DUVA TRIVIA!",
    tip: "Responde con la letra correcta (A-B-C-D) en los próximos 15 segundos."
  },
  halloween: {
    emoji: "🔮",
    titulo: "TRIVIA DE ULTRATUMBA!",
    tip: "Responde con la letra correcta (A-B-C-D) antes de que los fantasmas se desvanezcan (15 segundos). 👻"
  }
};

// Cada evento tiene su propio mazo de preguntas.
const mazos = { normal: [], halloween: [] };

function mezclar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function siguientePregunta() {
  const clave = esHalloween() ? "halloween" : "normal";
  if (mazos[clave].length === 0) mazos[clave] = mezclar(clave === "halloween" ? PREGUNTAS_HALLOWEEN : PREGUNTAS);
  return mazos[clave].pop();
}

export default {
  names: [".trivia"],
  desc: "Responder una pregunta de cultura general (cada 30 minutos)",
  category: "Economía",
  handler: async ({ from, sender, reply }) => {
    const E = estilo(ESTILOS);
    const espera = checkCooldown(sender, "trivia", ESPERA_MS);
    if (espera > 0) return reply({ text: textoEspera(espera) });

    const base = siguientePregunta();
    const opcionesMezcladas = mezclar(
      base.opciones.map((texto, i) => ({ texto, ok: i === base.correcta }))
    );
    const indiceCorrecto = opcionesMezcladas.findIndex((o) => o.ok);

    setPendingTrivia(`${from}:${sender}`, {
      correcta: LETRAS[indiceCorrecto],
      premio: entre(100, 300),
      xp: entre(5, 15),
      expira: Date.now() + TIEMPO_RESPUESTA_MS
    });

    const opciones = opcionesMezcladas.map((o, i) => `${LETRAS[i]}) ${o.texto}`);
    await reply({
      text: tarjeta({
        emoji: E.emoji,
        titulo: E.titulo,
        relato: `*${base.pregunta}*`,
        lineas: opciones,
        tip: E.tip
      })
    });
  }
};
