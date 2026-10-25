import { checkCooldown } from "../../../motores/db.js";
import { tarjeta, monto, textoEspera } from "../../economia/formato-evento.js";
import { esHalloween } from "../../economia/temas.js";
import { PREGUNTAS, PREGUNTAS_HALLOWEEN } from "../../economia/preguntas.js";
import { setPendingTrivia } from "../../economia/trivia.js";

const LETRAS = ["A", "B", "C", "D"];
const ESPERA_MS = 15 * 60;
const TIEMPO_RESPUESTA_MS = 60 * 1000;
const PREMIO_MIN = 4000;
const PREMIO_MAX = 12000;
const XP_MIN = 15;
const XP_MAX = 40;

const aleatorio = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

function mezclar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

const ESTILOS = {
  normal: { emoji: "🧠", titulo: "TRIVIA", tip: "Responde con la letra *A*, *B*, *C* o *D* sin prefijo en los próximos 60 segundos." },
  halloween: { emoji: "🔮", titulo: "TRIVIA MACABRA", tip: "Responde con la letra *A*, *B*, *C* o *D* sin prefijo antes de que se apague la vela. 🕯️" }
};

export default {
  names: [".trivia"],
  desc: "Responde una pregunta de cultura general y gana monedas y experiencia",
  category: "Economía",
  handler: async ({ from, sender, reply }) => {
    const restante = checkCooldown(sender, "trivia", ESPERA_MS);
    if (restante > 0) return reply({ text: textoEspera(restante) });

    const E = esHalloween() ? ESTILOS.halloween : ESTILOS.normal;
    const banco = esHalloween() && PREGUNTAS_HALLOWEEN?.length ? PREGUNTAS_HALLOWEEN : PREGUNTAS;
    const base = banco[Math.floor(Math.random() * banco.length)];

    const opciones = mezclar(base.opciones.map((texto, indice) => ({ texto, correcta: indice === base.correcta })));
    const correcta = LETRAS[opciones.findIndex((o) => o.correcta)];
    const premio = aleatorio(PREMIO_MIN, PREMIO_MAX);
    const xp = aleatorio(XP_MIN, XP_MAX);

    setPendingTrivia(`${from}:${sender}`, { correcta, premio, xp, expira: Date.now() + TIEMPO_RESPUESTA_MS });

    await reply({
      text: tarjeta({
        emoji: E.emoji,
        titulo: E.titulo,
        relato: base.pregunta,
        lineas: [
          ...opciones.map((o, i) => `*${LETRAS[i]})* ${o.texto}`),
          "",
          `🪙 *Premio* ›› ${monto(premio)}`
        ],
        tip: E.tip
      })
    });
  }
};
