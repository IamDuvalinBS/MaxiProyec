import { jidDe, numeroDe, olvidarMetadatos } from "../grupos/nucleo.js";
import { ajustesDe } from "../grupos/estado.js";
import { enviarBienvenida } from "./welcome.js";
import { enviarDespedida } from "./goodbye.js";

const MAXIMO_POR_EVENTO = 5;

export async function manejarParticipantes(sock, update) {
  const grupo = update.id;
  olvidarMetadatos(grupo);
  if (update.action === "promote" || update.action === "demote") return;

  const ajustes = ajustesDe(grupo);
  const esIngreso = update.action === "add";
  const esSalida = update.action === "remove";
  if ((esIngreso && !ajustes.bienvenida) || (esSalida && !ajustes.despedida) || (!esIngreso && !esSalida)) return;

  const autor = update.author ? numeroDe(update.author) : null;

  for (const participante of update.participants.slice(0, MAXIMO_POR_EVENTO)) {
    const usuario = jidDe(participante);
    if (!usuario) continue;
    try {
      if (esIngreso) {
        await enviarBienvenida(sock, grupo, usuario);
      } else if (!autor || autor === numeroDe(usuario)) {
        await enviarDespedida(sock, grupo, usuario);
      }
    } catch (e) {
      console.log(`Error en el aviso de ${update.action} del grupo ${grupo}: ${e.message}`);
    }
  }
}
