import { comandoGrupo, objetivoDe, buscarParticipante, buscarBot, olvidarMetadatos } from "../../grupos/nucleo.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo.js";

export default {
  names: [".demote", ".demo", ".degradar"],
  usage: ".demote @usuario | responder a un mensaje",
  desc: "Quitar el admin a un miembro del grupo",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "🍂", titulo: "DEMOTE", botAdmin: true }, async (ctx) => {
    const { sock, from, sender, meta, responder, avisar } = ctx;
    const usuario = objetivoDe(ctx);
    if (!usuario) return avisar("Menciona a un usuario o responde a su mensaje.\n\n> Usa *.demote @usuario*");

    const objetivo = buscarParticipante(meta, usuario);
    if (!objetivo) return avisar("Ese usuario no está en el grupo.");
    if (!objetivo.admin) return avisar("Ese usuario no es administrador.");
    if (objetivo.superadmin) return avisar("No es posible retirar el rol al creador del grupo.");
    if (objetivo === buscarBot(sock, meta)) return avisar("No es posible retirar el rol al propio bot.");

    try {
      await sock.groupParticipantsUpdate(from, [objetivo.id], "demote");
    } catch (e) {
      return avisar("No fue posible retirar el rol de administrador.");
    }
    olvidarMetadatos(from);

    const texto = tarjetaMarcada({
      emoji: "🍂",
      titulo: "ADMIN REMOVIDO",
      relato: "Un administrador ha dejado de serlo en este grupo.",
      lineas: ["⧼🥀⧽ *Admin removido*::", `> ${mencion(objetivo.id)}`, "⧼🎯⧽ *Responsable*::", `> ${mencion(sender)} le retiró el admin.`],
      tip: "Para otorgar el rol nuevamente usa *.promote* (admins)."
    });
    await responder(texto, [objetivo.id, sender]);
  })
};
