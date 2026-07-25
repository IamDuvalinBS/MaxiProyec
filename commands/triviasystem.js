import { addToWallet, CURRENCY } from "./db.js";
import { box } from "./ui.js";

// ============ SISTEMA DE TRIVIA (pregunta y espera respuesta) ============
const pendingTrivia = new Map(); // sender -> { correcta, reward, expira }

export function setPendingTrivia(sender, data) {
  pendingTrivia.set(sender, data);
}

// Llamado desde index.js en CADA mensaje (no solo comandos), para ver si el
// texto es la respuesta a una trivia pendiente de esa persona.
export async function checkTriviaAnswer(sock, from, sender, text, msg) {
  const pending = pendingTrivia.get(sender);
  if (!pending) return false;
  if (Date.now() > pending.expira) {
    pendingTrivia.delete(sender);
    return false;
  }
  const respuesta = text.trim().toUpperCase();
  if (!["A", "B", "C", "D"].includes(respuesta)) return false;

  pendingTrivia.delete(sender);
  const reply = (content) => sock.sendMessage(from, content, { quoted: msg });

  if (respuesta === pending.correcta) {
    addToWallet(sender, pending.reward);
    await reply({ text: box("¡RESPUESTA CORRECTA!", [`🧠 Ganaste por acertar la trivia...`, `🪙 GANASTE  ›› *${pending.reward} ${CURRENCY}*`]) });
  } else {
    await reply({ text: `❌ Incorrecto. La respuesta era *${pending.correcta}*. Mejor suerte la próxima.` });
  }
  return true;
}
