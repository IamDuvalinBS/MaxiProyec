import { comandoGrupo, textoTrasComando, olvidarMetadatos } from "../../grupos/nucleo.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo.js";

const LIMITE = 2048;

export default {
  names: [".setdesc", ".setdec", ".setdescripcion"],
  usage: ".setdesc <nueva descripción>",
  desc: "Cambiar la descripción del grupo",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "📝", titulo: "SETDESC", botAdmin: true }, async ({ sock, from, sender, cleanText, responder, avisar }) => {
    const descripcion = textoTrasComando(cleanText);
    if (!descripcion) return avisar("Indica la nueva descripción del grupo.\n\n> Usa *.setdesc <nueva descripción>*");
    if (descripcion.length > LIMITE) return avisar(`La descripción no puede superar los ${LIMITE} caracteres.`);

    try {
      await sock.groupUpdateDescription(from, descripcion);
    } catch (e) {
      return avisar("No fue posible cambiar la descripción del grupo.");
    }
    olvidarMetadatos(from);

    const texto = tarjetaMarcada({
      emoji: "📝",
      titulo: "DESCRIPCIÓN ACTUALIZADA",
      relato: "La descripción del grupo ha sido modificada.",
      lineas: ["⧼🎯⧽ *Responsable*::", `> ${mencion(sender)} actualizó la descripción.`]
    });
    await responder(texto, [sender]);
  })
};
