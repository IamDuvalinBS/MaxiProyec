import { comandoGrupo, textoTrasComando } from "../../grupos/nucleo.js";
import { definirAjuste } from "../../grupos/estado.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo.js";

const LIMITE = 400;

export default {
  names: [".setwelcome"],
  usage: ".setwelcome <mensaje> | .setwelcome reset",
  desc: "Establecer el mensaje de bienvenida del grupo (máximo 400 caracteres)",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "🏰", titulo: "SETWELCOME" }, async ({ from, sender, cleanText, responder, avisar }) => {
    const frase = textoTrasComando(cleanText);
    if (!frase) return avisar(`Indica el mensaje de bienvenida (máximo ${LIMITE} caracteres).\n\n> Usa *.setwelcome <mensaje>*`);

    if (frase.toLowerCase() === "reset") {
      definirAjuste(from, "textoBienvenida", null);
      return avisar("Se restableció el mensaje de bienvenida predeterminado.");
    }
    if (frase.length > LIMITE) return avisar(`El mensaje supera el máximo permitido. Tiene ${frase.length} de ${LIMITE} caracteres.`);

    definirAjuste(from, "textoBienvenida", frase);

    const texto = tarjetaMarcada({
      emoji: "🏰",
      titulo: "BIENVENIDA ACTUALIZADA",
      relato: frase,
      lineas: ["⧼🎯⧽ *Responsable*::", `> ${mencion(sender)} actualizó el mensaje.`],
      tip: ["Para probarlo usa *.testwelcome* (admins).", "Para restablecerlo usa *.setwelcome reset* (admins)."]
    });
    await responder(texto, [sender]);
  })
};
