import { comandoGrupo } from "./nucleo.js";
import { ajustesDe, definirAjuste } from "./estado.js";
import { tarjetaMarcada, mencion } from "../economia/estilo.js";

export function crearInterruptor({
  names,
  usage,
  desc,
  clave,
  emoji,
  titulo,
  tituloActivado,
  tituloDesactivado,
  relatoActivado,
  relatoDesactivado,
  tipActivado,
  tipDesactivado,
  botAdmin = false
}) {
  return {
    names,
    usage,
    desc,
    category: "Grupos",
    handler: comandoGrupo({ emoji, titulo, botAdmin }, async ({ from, sender, cleanText, responder, avisar }) => {
      const opcion = (cleanText.split(/\s+/)[1] || "").toLowerCase();
      const activo = Boolean(ajustesDe(from)[clave]);

      if (opcion !== "on" && opcion !== "off") {
        return avisar(`Estado actual: *${activo ? "activado" : "desactivado"}*.\n\n> Usa *${names[0]} on* o *${names[0]} off*.`);
      }

      const nuevo = opcion === "on";
      if (nuevo === activo) return avisar(`Esta función ya se encuentra ${nuevo ? "activada" : "desactivada"}.`);

      definirAjuste(from, clave, nuevo);

      const texto = tarjetaMarcada({
        emoji,
        titulo: nuevo ? tituloActivado : tituloDesactivado,
        relato: nuevo ? relatoActivado : relatoDesactivado,
        lineas: ["⧼🫯⧽ *Responsable*::", `> ${mencion(sender)} hizo esta acción.`],
        tip: nuevo ? tipActivado : tipDesactivado
      });
      await responder(texto, [sender]);
    })
  };
}
