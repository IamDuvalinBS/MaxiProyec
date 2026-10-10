import { comandoGrupo, objetivoDe, buscarParticipante, enlaceDeGrupo, olvidarMetadatos, limpiarJid } from "../../grupos/nucleo.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo.js";

export default {
  names: [".add", ".agregar"],
  usage: ".add <número> | responder a un mensaje",
  desc: "Añadir a un usuario al grupo",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "🦊", titulo: "AGREGAR", botAdmin: true }, async (ctx) => {
    const { sock, from, sender, meta, responder, avisar } = ctx;
    const usuario = objetivoDe(ctx);
    if (!usuario) return avisar("Indica el número del usuario o responde a su mensaje.\n\n> Usa *.agregar 521234567890*");

    if (buscarParticipante(meta, usuario)) return avisar("Ese usuario ya está en el grupo.");

    let jid;
    try {
      const [registro] = await sock.onWhatsApp(limpiarJid(usuario));
      if (!registro || !registro.exists) return avisar("Ese número no está registrado en WhatsApp.");
      jid = registro.jid;
    } catch (e) {
      return avisar("No fue posible verificar el número indicado.");
    }

    let estado;
    try {
      const [resultado] = await sock.groupParticipantsUpdate(from, [jid], "add");
      estado = String(resultado?.status || "200");
    } catch (e) {
      return avisar("No fue posible agregar al usuario.");
    }
    olvidarMetadatos(from);

    if (estado === "200") {
      const texto = tarjetaMarcada({
        emoji: "🦊",
        titulo: "USUARIO AGREGADO",
        relato: "Un nuevo integrante fue añadido al grupo.",
        lineas: ["⧼🐾⧽ *Usuario agregado*::", `> ${mencion(jid)}`, "⧼🎯⧽ *Responsable*::", `> ${mencion(sender)} agregó al usuario.`],
        tip: "Para remover esta acción usa *.kick* (admins)."
      });
      return responder(texto, [jid, sender]);
    }

    if (estado === "403") {
      const enlace = await enlaceDeGrupo(sock, from);
      if (enlace) {
        await sock.sendMessage(jid, { text: `⧼🦊⧽ *INVITACIÓN*\n\n> Has sido invitado a unirte a *${meta.asunto}*.\n\n> ${enlace}` }).catch(() => {});
        return avisar("La configuración de privacidad del usuario impidió agregarlo. Se le envió una invitación por mensaje privado.");
      }
    }
    if (estado === "408") return avisar("El usuario salió recientemente del grupo y no puede ser agregado todavía.");
    return avisar("No fue posible agregar al usuario por sus configuraciones de privacidad.");
  })
};
