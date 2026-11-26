import { comandoGrupo, objetivoDe, buscarParticipanteResuelto, numeroDe } from "../../grupos/nucleo.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo.js";
import { limpiarAdvertencias, restarAdvertencias } from "../../../motores/db.js";

const USO = "Indica cuántas advertencias quitar:\n\n> *.unwarn 1* → quita una\n> *.unwarn 2* → quita dos\n> *.unwarn all* → quita todas\n\nMenciona al usuario o responde a su mensaje.\nEj: *.unwarn 1 @usuario*";

// Busca la cantidad en los argumentos: "all"/"todas" o un número corto (los de 8+ dígitos son teléfonos).
function leerCantidad(cleanText) {
  const partes = cleanText.trim().split(/\s+/).slice(1);
  for (const p of partes) {
    const t = p.toLowerCase();
    if (["all", "todas", "todo", "todos"].includes(t)) return "all";
    if (/^\d{1,3}$/.test(t) && Number(t) >= 1) return Number(t);
  }
  return null;
}

export default {
  names: [".unwarn", ".quitarwarn"],
  usage: ".unwarn 1 | 2 | all @usuario (o responde a su mensaje)",
  desc: "Quitar advertencias de un usuario: 1, 2 o all (todas)",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "🧹", titulo: "UNWARN" }, async (ctx) => {
    const { sock, from, sender, meta, cleanText, responder, avisar } = ctx;
    const cantidad = leerCantidad(cleanText);
    if (cantidad === null) return avisar(USO);

    const usuario = objetivoDe(ctx);
    if (!usuario) return avisar("Menciona a un usuario o responde a su mensaje.\n\n> Ej: *.unwarn 1 @usuario*");

    const objetivo = await buscarParticipanteResuelto(sock, from, meta, usuario);
    const id = objetivo ? objetivo.id : usuario;
    const numero = numeroDe(id);

    let previas, quitadas, quedan;
    try {
      if (cantidad === "all") {
        previas = await limpiarAdvertencias(from, numero);
        if (previas === null) return avisar("La base de datos no está disponible en este momento.");
        quitadas = previas;
        quedan = 0;
      } else {
        const r = await restarAdvertencias(from, numero, cantidad);
        if (r === null) return avisar("La base de datos no está disponible en este momento.");
        previas = r.previas;
        quitadas = r.quitadas;
        quedan = r.quedan;
      }
    } catch (e) {
      return avisar("No fue posible retirar las advertencias. Intenta nuevamente.");
    }
    if (!previas) return avisar("Ese usuario no tiene advertencias registradas.");

    const texto = tarjetaMarcada({
      emoji: "🧹",
      titulo: "ADVERTENCIAS RETIRADAS",
      relato: cantidad === "all"
        ? "Se han eliminado todas las advertencias del usuario."
        : `Se ${quitadas === 1 ? "ha eliminado 1 advertencia" : `han eliminado ${quitadas} advertencias`} del usuario.`,
      lineas: [
        "⧼🌿⧽ *Usuario*::", `> ${mencion(id)}`,
        "⧼🫯⧽ *Responsable*::", `> ${mencion(sender)} retiró ${quitadas === 1 ? "1 advertencia" : `${quitadas} advertencias`}.`,
        "⧼📊⧽ *Advertencias restantes*::", `> ${quedan}`
      ],
      tip: "Para advertir nuevamente usa *.warn* (admins)."
    });
    await responder(texto, [id, sender]);
  })
};
