import { comandoGrupo } from "../../grupos/nucleo.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo.js";

export default {
  names: [".open", ".abrir"],
  usage: ".open",
  desc: "Abrir el grupo para que todos puedan escribir",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "🔓", titulo: "OPEN", botAdmin: true }, async ({ sock, from, sender, responder, avisar }) => {
    try {
      await sock.groupSettingUpdate(from, "not_announcement");
    } catch (e) {
      return avisar("No fue posible abrir el grupo.");
    }
    const texto = tarjetaMarcada({
      emoji: "🔓",
      titulo: "GRUPO ABIERTO",
      relato: `El grupo fue abierto por ${mencion(sender)}. Todos los miembros pueden escribir nuevamente.`,
      tip: "Para cerrar el grupo usa *.close* (admins)."
    });
    await responder(texto, [sender]);
  })
};
