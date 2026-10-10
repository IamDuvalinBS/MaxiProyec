import { comandoGrupo, objetivoDe, buscarParticipante, buscarBot, olvidarMetadatos } from "../../grupos/nucleo.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo.js";

export default {
  names: [".kick", ".eliminar", ".expulsar"],
  usage: ".kick @usuario | responder a un mensaje",
  desc: "Eliminar a un usuario del grupo",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "😿", titulo: "KICK", botAdmin: true }, async (ctx) => {
    const { sock, from, sender, meta, quien, responder, avisar } = ctx;
    const usuario = objetivoDe(ctx);
    if (!usuario) return avisar("Menciona a un usuario o responde a su mensaje.\n\n> Usa *.kick @usuario*");

    const objetivo = buscarParticipante(meta, usuario);
    if (!objetivo) return avisar("Ese usuario no está en el grupo.");
    if (objetivo.superadmin) return avisar("No es posible eliminar al creador del grupo.");
    if (objetivo === buscarBot(sock, meta)) return avisar("No es posible eliminar al propio bot.");
    if (objetivo === quien) return avisar("No puedes eliminarte a ti mismo.");

    try {
      await sock.groupParticipantsUpdate(from, [objetivo.id], "remove");
    } catch (e) {
      return avisar("No fue posible eliminar al usuario.");
    }
    olvidarMetadatos(from);

    const texto = tarjetaMarcada({
      emoji: "😿",
      titulo: "USUARIO ELIMINADO",
      relato: "Un integrante menos en el grupo...",
      lineas: ["⧼🦉⧽ *Usuario eliminado*::", `> ${mencion(objetivo.id)}`, "⧼🦖⧽ *Responsable*::", `> ${mencion(sender)} eliminó al usuario.`],
      tip: "Para remover esta acción usa *.agregar* (admins)."
    });
    await responder(texto, [objetivo.id, sender]);
  })
};
