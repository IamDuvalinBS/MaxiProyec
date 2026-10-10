import { comandoGrupo, objetivoDe, buscarParticipante, olvidarMetadatos, numeroDe } from "../../grupos/nucleo.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo.js";
import { sumarAdvertencia, limpiarAdvertencias } from "../../../motores/db.js";

export const LIMITE_ADVERTENCIAS = 3;

export default {
  names: [".warn", ".advertir"],
  usage: ".warn @usuario | responder a un mensaje",
  desc: "Dar una advertencia a un usuario (3 advertencias lo expulsan)",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "🦑", titulo: "WARN" }, async (ctx) => {
    const { sock, from, sender, meta, bot, responder, avisar } = ctx;
    const usuario = objetivoDe(ctx);
    if (!usuario) return avisar("Menciona a un usuario o responde a su mensaje.\n\n> Usa *.warn @usuario*");

    const objetivo = buscarParticipante(meta, usuario);
    if (!objetivo) return avisar("Ese usuario no está en el grupo.");
    if (objetivo.admin) return avisar("No es posible advertir a un administrador.");

    let total;
    try {
      total = await sumarAdvertencia(from, numeroDe(objetivo.id));
    } catch (e) {
      console.log(`Error al registrar la advertencia en ${from}: ${e.message}`);
      return avisar("No fue posible registrar la advertencia. Intenta nuevamente.");
    }
    if (total === null) return avisar("La base de datos no está disponible en este momento.");

    const alLimite = total >= LIMITE_ADVERTENCIAS;
    let expulsado = false;
    if (alLimite && bot && bot.admin) {
      try {
        await sock.groupParticipantsUpdate(from, [objetivo.id], "remove");
        await limpiarAdvertencias(from, numeroDe(objetivo.id));
        olvidarMetadatos(from);
        expulsado = true;
      } catch (e) {
        expulsado = false;
      }
    }

    const lineas = [
      "⧼🌻⧽ *Usuario advertido*::",
      `> ${mencion(objetivo.id)}`,
      "⧼🫯⧽ *Responsable*::",
      `> ${mencion(sender)} advirtió al usuario.`,
      "⧼📊⧽ *Advertencias*::",
      `> ${Math.min(total, LIMITE_ADVERTENCIAS)}/${LIMITE_ADVERTENCIAS}${expulsado ? " (usuario expulsado)" : ""}`
    ];
    const relato = expulsado
      ? "El usuario alcanzó el límite de advertencias y fue expulsado del grupo."
      : alLimite
        ? "El usuario alcanzó el límite de advertencias, pero no fue posible expulsarlo."
        : "Un integrante ha recibido una advertencia formal.";

    const texto = tarjetaMarcada({
      emoji: "🦑",
      titulo: "USUARIO ADVERTIDO",
      relato,
      lineas,
      tip: "Para remover esta acción usa *.unwarn* (admins)."
    });
    await responder(texto, [objetivo.id, sender]);
  })
};
