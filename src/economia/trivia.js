import { addToWallet } from "../../motores/db.js";
import { addXp } from "../../motores/profile.js";
import { tarjeta, monto, avisoNivel } from "./formato-evento.js";
import { estilo } from "./temas.js";

const pendientes = new Map();
const LETRAS = ["A", "B", "C", "D"];

const ESTILOS = {
  normal: {
    incorrectaEmoji: "❌",
    incorrectaTitulo: "RESPUESTA INCORRECTA",
    incorrecta: (letra) => `La respuesta correcta era la opción ${letra}. Se recomienda intentarlo nuevamente en la próxima ocasión.`,
    correctaEmoji: "🧠",
    correctaTitulo: "RESPUESTA CORRECTA",
    correcta: "Se acreditó el premio por responder correctamente la pregunta.",
    ganancia: (n) => `🪙 *Ganancia* ›› +${monto(n)}`,
    experiencia: (n) => `✨ *Experiencia* ›› +${n}`
  },
  halloween: {
    incorrectaEmoji: "💀",
    incorrectaTitulo: "RESPUESTA MALDITA",
    incorrecta: (letra) => {
      const frases = [
        `Un fantasma sopló la respuesta correcta: era la opción ${letra}. Tarde, como siempre 👻`,
        `La Llorona lloró al escuchar tu respuesta; la correcta era la opción ${letra} 😭`,
        `El esqueleto del salón negó con la cabeza: la respuesta era la opción ${letra} 💀`,
        `Un cuervo graznó la verdad: la opción correcta era la ${letra} 🐦‍⬛`
      ];
      return `${frases[Math.floor(Math.random() * frases.length)]}. Vuelve a intentarlo cuando el reloj de la torre lo permita. 🕸️`;
    },
    correctaEmoji: "🔮",
    correctaTitulo: "RESPUESTA ENCANTADA",
    correcta: "La bola de cristal confirma tu acierto; hasta el murciélago de la esquina aplaudió y los espíritus te dejaron un botín 🦇.",
    ganancia: (n) => `🎃 *Botín* ›› +${monto(n)}`,
    experiencia: (n) => `🦇 *Experiencia* ›› +${n}`
  }
};

export function setPendingTrivia(clave, datos) {
  pendientes.set(clave, datos);
}

export async function checkTriviaAnswer(sock, from, sender, text, msg) {
  const clave = `${from}:${sender}`;
  const pendiente = pendientes.get(clave);
  if (!pendiente) return false;
  if (Date.now() > pendiente.expira) {
    pendientes.delete(clave);
    return false;
  }

  const respuesta = text.trim().toUpperCase();
  if (!LETRAS.includes(respuesta)) return false;
  pendientes.delete(clave);

  const enviar = (contenido) => sock.sendMessage(from, contenido, { quoted: msg });
  const E = estilo(ESTILOS);

  if (respuesta !== pendiente.correcta) {
    await enviar({
      text: tarjeta({
        emoji: E.incorrectaEmoji,
        titulo: E.incorrectaTitulo,
        relato: E.incorrecta(pendiente.correcta)
      })
    });
    return true;
  }

  addToWallet(sender, pendiente.premio);
  const { leveledUp, newLevel } = addXp(sender, pendiente.xp);
  await enviar({
    text: tarjeta({
      emoji: E.correctaEmoji,
      titulo: E.correctaTitulo,
      relato: E.correcta,
      lineas: [E.ganancia(pendiente.premio), E.experiencia(pendiente.xp)]
    })
  });
  if (leveledUp) await enviar({ text: avisoNivel(newLevel) });
  return true;
}
