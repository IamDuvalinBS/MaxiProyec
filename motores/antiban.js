// Practicas simples para que el bot se comporte menos "robotico" y no
// dispare tan facil las detecciones automaticas de WhatsApp.
// OJO: esto reduce el riesgo, no lo elimina - Baileys sigue siendo una
// conexion no oficial, siempre hay algo de riesgo de base.

export function delayAleatorio(min = 500, max = 1500) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Simula que el bot esta "escribiendo..." antes de mandar el mensaje,
// como haria una persona real.
export async function simularEscritura(sock, jid, ms = 1200) {
  try {
    await sock.sendPresenceUpdate("composing", jid);
    await new Promise(resolve => setTimeout(resolve, ms));
    await sock.sendPresenceUpdate("paused", jid);
  } catch (e) {
    // Si falla (por ejemplo el chat no existe mas), no rompemos nada por esto.
  }
      }

