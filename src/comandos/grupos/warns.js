import { comandoGrupo, objetivoDe, buscarParticipanteResuelto, numeroDe } from "../../grupos/nucleo.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo.js";
import { obtenerAdvertencias } from "../../../motores/advertencias.js";
import { LIMITE_ADVERTENCIAS } from "./warn.js";

export default {
  names: [".warns", ".advertencias"],
  usage: ".warns @usuario | responder a un mensaje",
  desc: "Ver cuántas advertencias tiene un usuario",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "📊", titulo: "WARNS", admin: false }, async (ctx) => {
    const { sock, from, sender, meta, responder, avisar } = ctx;
    // Sin mención ni respuesta, muestra las advertencias de quien escribe el comando
    const usuario = objetivoDe(ctx) || sender;

    const objetivo = await buscarParticipanteResuelto(sock, from, meta, usuario);
    if (!objetivo) return avisar("Ese usuario no está en el grupo.");

    let total;
    try {
      total = await obtenerAdvertencias(from, numeroDe(objetivo.id));
    } catch (e) {
      console.log(`Error al leer advertencias en ${from}: ${e.message}`);
      return avisar("No fue posible consultar las advertencias. Intenta nuevamente.");
    }
    if (total === null) return avisar("La base de datos no está disponible en este momento.");

    const texto = tarjetaMarcada({
      emoji: "📊",
      titulo: "ADVERTENCIAS",
      relato: `${mencion(objetivo.id)} tiene ${Math.min(total, LIMITE_ADVERTENCIAS)}/${LIMITE_ADVERTENCIAS} advertencia.`,
      tip: "Usa *.warn* para advertir o *.unwarn* para retirar (admins)."
    });
    await responder(texto, [objetivo.id]);
  })
};
