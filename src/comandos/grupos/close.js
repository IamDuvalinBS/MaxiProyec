import { comandoGrupo } from "../../grupos/nucleo.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo.js";

export default {
  names: [".close", ".cerrar"],
  usage: ".close",
  desc: "Cerrar el grupo para que solo escriban los administradores",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "⏱️", titulo: "CLOSE", botAdmin: true }, async ({ sock, from, sender, responder, avisar }) => {
    try {
      await sock.groupSettingUpdate(from, "announcement");
    } catch (e) {
      return avisar("No fue posible cerrar el grupo.");
    }
    const texto = tarjetaMarcada({
      emoji: "⏱️",
      titulo: "GRUPO CERRADO",
      relato: `El grupo fue cerrado por ${mencion(sender)}. Podrán volver a escribir cuando el grupo esté abierto.`,
      tip: "Para abrir el grupo usa *.open* (admins)."
    });
    await responder(texto, [sender]);
  })
};
