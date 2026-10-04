import { addToWallet } from "../../motores/db.js";
import { addXp } from "../../motores/profile.js";
import { tarjeta, monto, avisoNivel } from "./formato.js";

const pendientes = new Map();
const LETRAS = ["A", "B", "C", "D"];

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

  if (respuesta !== pendiente.correcta) {
    await enviar({
      text: tarjeta({
        emoji: "❌",
        titulo: "RESPUESTA INCORRECTA",
        relato: `La respuesta correcta era la opción ${pendiente.correcta}. Se recomienda intentarlo nuevamente en la próxima ocasión.`
      })
    });
    return true;
  }

  addToWallet(sender, pendiente.premio);
  const { leveledUp, newLevel } = addXp(sender, pendiente.xp);
  await enviar({
    text: tarjeta({
      emoji: "🧠",
      titulo: "RESPUESTA CORRECTA",
      relato: "Se acreditó el premio por responder correctamente la pregunta.",
      lineas: [
        `🪙 *Ganancia* ›› +${monto(pendiente.premio)}`,
        `✨ *Experiencia* ›› +${pendiente.xp}`
      ]
    })
  });
  if (leveledUp) await enviar({ text: avisoNivel(newLevel) });
  return true;
}
