import { jidDe, idsDe, olvidarMetadatos, fueExpulsadoPorBot } from "../grupos/nucleo.js";
import { ajustesDe } from "../grupos/estado.js";
import { enviarBienvenida } from "./welcome.js";
import { enviarDespedida } from "./goodbye.js";

const MAXIMO_POR_EVENTO = 5;
const ACCIONES_SALIDA = new Set(["remove", "leave"]);

export async function manejarParticipantes(sock, update) {
  const grupo = update.id;
  olvidarMetadatos(grupo);

  const esIngreso = update.action === "add";
  const esSalida = ACCIONES_SALIDA.has(update.action);
  if (!esIngreso && !esSalida) return;

  const ajustes = ajustesDe(grupo);
  if ((esIngreso && !ajustes.bienvenida) || (esSalida && !ajustes.despedida)) return;

  for (const participante of update.participants.slice(0, MAXIMO_POR_EVENTO)) {
    const usuario = jidDe(participante);
    if (!usuario) continue;
    try {
      if (esIngreso) {
        await enviarBienvenida(sock, grupo, usuario);
      } else if (!fueExpulsadoPorBot(grupo, idsDe(typeof participante === "string" ? { id: participante } : participante))) {
        await enviarDespedida(sock, grupo, usuario);
      }
    } catch (e) {
      console.log(`Error en el aviso de ${update.action} del grupo ${grupo}: ${e.message}`);
    }
  }
}
