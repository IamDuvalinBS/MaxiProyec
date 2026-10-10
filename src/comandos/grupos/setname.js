import { comandoGrupo, textoTrasComando, olvidarMetadatos } from "../../grupos/nucleo.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo.js";

const LIMITE = 100;

export default {
  names: [".namegp", ".nombregp"],
  usage: ".setname <nuevo nombre>",
  desc: "Cambiar el nombre del grupo",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "✏️", titulo: "SETNAME", botAdmin: true }, async ({ sock, from, sender, cleanText, responder, avisar }) => {
    const nombre = textoTrasComando(cleanText);
    if (!nombre) return avisar("Indica el nuevo nombre del grupo.\n\n> Usa *.setname <nuevo nombre>*");
    if (nombre.length > LIMITE) return avisar(`El nombre no puede superar los ${LIMITE} caracteres.`);

    try {
      await sock.groupUpdateSubject(from, nombre);
    } catch (e) {
      return avisar("No fue posible cambiar el nombre del grupo.");
    }
    olvidarMetadatos(from);

    const texto = tarjetaMarcada({
      emoji: "✏️",
      titulo: "NOMBRE ACTUALIZADO",
      relato: "El nombre del grupo ha sido modificado.",
      lineas: ["⧼🏷️⧽ *Nuevo nombre*::", `> ${nombre}`, "⧼🎯⧽ *Responsable*::", `> ${mencion(sender)} actualizó el nombre.`]
    });
    await responder(texto, [sender]);
  })
};
