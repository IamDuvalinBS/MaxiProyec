import { comandoGrupo, objetivoDe, buscarParticipante, olvidarMetadatos } from "../../grupos/nucleo.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo.js";

export default {
  names: [".promote", ".promover", ".promete"],
  usage: ".promote @usuario | responder a un mensaje",
  desc: "Dar admin a un miembro del grupo",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "🚂", titulo: "PROMOTE", botAdmin: true }, async (ctx) => {
    const { sock, from, sender, meta, responder, avisar } = ctx;
    const usuario = objetivoDe(ctx);
    if (!usuario) return avisar("Menciona a un usuario o responde a su mensaje.\n\n> Usa *.promote @usuario*");

    const objetivo = buscarParticipante(meta, usuario);
    if (!objetivo) return avisar("Ese usuario no está en el grupo.");
    if (objetivo.admin) return avisar("Ese usuario ya es administrador.");

    try {
      await sock.groupParticipantsUpdate(from, [objetivo.id], "promote");
    } catch (e) {
      return avisar("No fue posible otorgar el rol de administrador.");
    }
    olvidarMetadatos(from);

    const texto = tarjetaMarcada({
      emoji: "🚂",
      titulo: "NUEVO ADMIN",
      relato: "Un nuevo administrador ha llegado a este grupo.",
      lineas: ["⧼🎲⧽ *Nuevo admin*::", `> ${mencion(objetivo.id)}`, "⧼🎯⧽ *Responsable*::", `> ${mencion(sender)} le otorgó admin.`],
      tip: "Para remover esta acción usa *.demote* (admins)."
    });
    await responder(texto, [objetivo.id, sender]);
  })
};
