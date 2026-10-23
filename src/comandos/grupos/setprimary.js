import { comandoGrupo, metadatos, buscarBot, limpiarJid, objetivoDe } from "../../grupos/nucleo.js";
import { ajustesDe, definirAjuste } from "../../grupos/estado.js";
import { socketsSubbots } from "../../subbots/gestor.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo.js";

const OPCIONES_QUITAR = new Set(["off", "all", "todos", "reset", "quitar"]);

const idsDeBot = (s) => [s.user?.id, s.user?.lid].filter(Boolean).map(limpiarJid);
const numeroDeBot = (s) => limpiarJid(s.user.id).split("@")[0];

export default {
  names: [".setprimary", ".botprincipal"],
  usage: ".setprimary [@bot | responder a un bot | número | off]",
  desc: "Elegir qué bot responde en el grupo cuando hay varios (bot principal y subbots)",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "🎖️", titulo: "BOT PRINCIPAL" }, async ({ sock, from, sender, cleanText, msg, responder, avisar }) => {
    const opcion = (cleanText.split(/\s+/)[1] || "").toLowerCase();
    const actual = ajustesDe(from).principal;

    if (OPCIONES_QUITAR.has(opcion)) {
      if (!actual) return avisar("Este grupo ya no tiene un bot principal: todos los bots pueden responder.");
      definirAjuste(from, "principal", false);
      return responder(
        tarjetaMarcada({
          emoji: "🎖️",
          titulo: "BOTS LIBRES",
          relato: "Se quitó el bot principal. Ahora todos los bots del grupo pueden responder.",
          lineas: ["⧼🫯⧽ *Responsable*::", `> ${mencion(sender)} hizo esta acción.`],
          tip: "Para elegir uno usa *.setprimary* (admins)."
        }),
        [sender]
      );
    }

    const candidatos = [sock, ...socketsSubbots().map((x) => x.sock).filter((s) => s && s !== sock)].filter((s) => s.user && s.user.id);
    const objetivo = objetivoDe({ msg, cleanText: opcion === "status" || opcion === "estado" ? ".setprimary" : cleanText });

    if (opcion === "status" || opcion === "estado") {
      return avisar(actual ? `Bot principal de este grupo:: *${actual}*` : "Este grupo no tiene un bot principal: responden todos los bots.");
    }

    let elegido = sock;
    if (objetivo) {
      const limpio = limpiarJid(objetivo);
      const digitos = limpio.split("@")[0];
      elegido = candidatos.find((s) => idsDeBot(s).includes(limpio) || idsDeBot(s).some((i) => i.split("@")[0] === digitos));
      if (!elegido) return avisar("Ese usuario no es uno de mis bots. Menciona al bot, responde a uno de sus mensajes o usa *.setprimary* sin nada para elegir este bot.");
    }

    const meta = await metadatos(elegido, from);
    if (!buscarBot(elegido, meta)) return avisar("Ese bot no está en este grupo.");

    const numero = numeroDeBot(elegido);
    if (actual === numero) return avisar(`El bot *${numero}* ya es el principal de este grupo.`);

    definirAjuste(from, "principal", numero);

    await responder(
      tarjetaMarcada({
        emoji: "🎖️",
        titulo: "BOT PRINCIPAL",
        relato: "Desde ahora solo este bot responderá en el grupo. Los demás bots se quedarán en silencio.",
        lineas: [`⧼🤖⧽ *Bot*:: ${numero}`, "", "⧼🫯⧽ *Responsable*::", `> ${mencion(sender)} hizo esta acción.`],
        tip: "Para que vuelvan a responder todos usa *.setprimary off* (admins)."
      }),
      [sender]
    );
  })
};
