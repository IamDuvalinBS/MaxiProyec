import { comandoGrupo } from "../../grupos/nucleo.js";
import { botApagado, definirAjuste } from "../../grupos/estado.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo.js";

export default {
  names: [".bot"],
  usage: ".bot on | .bot off",
  desc: "Encender o apagar el bot solo en este grupo (admins y owners)",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "🔌", titulo: "BOT" }, async ({ from, sender, cleanText, responder, avisar }) => {
    const opcion = (cleanText.split(/\s+/)[1] || "").toLowerCase();
    const apagado = botApagado(from);

    if (opcion !== "on" && opcion !== "off") {
      return avisar(`Estado actual: *${apagado ? "apagado" : "encendido"}* en este grupo.\n\n> Usa *.bot on* o *.bot off*.`);
    }

    const apagar = opcion === "off";
    if (apagar === apagado) return avisar(`El bot ya se encuentra ${apagar ? "apagado" : "encendido"} en este grupo.`);

    definirAjuste(from, "apagado", apagar);

    await responder(
      tarjetaMarcada({
        emoji: apagar ? "🌙" : "🔌",
        titulo: apagar ? "BOT APAGADO" : "BOT ENCENDIDO",
        relato: apagar
          ? "El bot se apagó en este grupo y no responderá a ningún mensaje hasta que se vuelva a encender."
          : "El bot se encendió nuevamente en este grupo.",
        lineas: ["⧼🫯⧽ *Responsable*::", `> ${mencion(sender)} hizo esta acción.`],
        tip: apagar ? "Para encenderlo usa *.bot on* (admins)." : "Para apagarlo usa *.bot off* (admins)."
      }),
      [sender]
    );
  })
};
