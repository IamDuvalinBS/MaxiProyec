import { comandoGrupo, objetivoDe, buscarParticipante, numeroDe } from "../../grupos/nucleo.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo.js";
import { limpiarAdvertencias } from "../../../motores/db.js";

export default {
  names: [".unwarn", ".quitarwarn"],
  usage: ".unwarn @usuario | responder a un mensaje",
  desc: "Quitar todas las advertencias de un usuario",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "🧹", titulo: "UNWARN" }, async (ctx) => {
    const { from, sender, meta, responder, avisar } = ctx;
    const usuario = objetivoDe(ctx);
    if (!usuario) return avisar("Menciona a un usuario o responde a su mensaje.\n\n> Usa *.unwarn @usuario*");

    const objetivo = buscarParticipante(meta, usuario);
    const id = objetivo ? objetivo.id : usuario;

    let previas;
    try {
      previas = await limpiarAdvertencias(from, numeroDe(id));
    } catch (e) {
      return avisar("No fue posible retirar las advertencias. Intenta nuevamente.");
    }
    if (previas === null) return avisar("La base de datos no está disponible en este momento.");
    if (!previas) return avisar("Ese usuario no tiene advertencias registradas.");

    const texto = tarjetaMarcada({
      emoji: "🧹",
      titulo: "ADVERTENCIAS RETIRADAS",
      relato: "Se han eliminado todas las advertencias del usuario.",
      lineas: ["⧼🌿⧽ *Usuario*::", `> ${mencion(id)}`, "⧼🫯⧽ *Responsable*::", `> ${mencion(sender)} retiró las advertencias.`],
      tip: "Para advertir nuevamente usa *.warn* (admins)."
    });
    await responder(texto, [id, sender]);
  })
};
