import { comandoGrupo, metadatos, buscarBot, buscarParticipante, limpiarJid, objetivoDe } from "../../grupos/nucleo.js";
import { ajustesDe, definirAjuste } from "../../grupos/estado.js";
import { socketsSubbots } from "../../subbots/gestor.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo.js";

const OPCIONES_QUITAR = new Set(["off", "all", "todos", "reset", "quitar"]);
const OPCIONES_ESTADO = new Set(["status", "estado"]);

const idsDeBot = (s) => [s.user?.id, s.user?.lid].filter(Boolean).map(limpiarJid);
const numeroDeBot = (s) => limpiarJid(s.user.id).split("@")[0];

export default {
  names: [".setprimary", ".botprincipal"],
  usage: ".setprimary [@bot | responder a un bot | número | off]",
  desc: "Elegir qué bot responde en el grupo cuando hay varios (bot principal y subbots)",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "🎖️", titulo: "BOT PRINCIPAL" }, async ({ sock, from, sender, cleanText, msg, meta, responder, avisar }) => {
    const opcion = (cleanText.split(/\s+/)[1] || "").toLowerCase();
    const actual = ajustesDe(from).principal;

    if (OPCIONES_ESTADO.has(opcion)) {
      return avisar(actual ? `Bot principal de este grupo:: *${actual}*` : "Este grupo no tiene un bot principal: responden todos los bots.");
    }

    if (OPCIONES_QUITAR.has(opcion)) {
      if (!actual) return avisar("Este grupo ya no tiene un bot principal: todos los bots pueden responder.");
      definirAjuste(from, "principal", false);
      return responder(
        tarjetaMarcada({
          emoji: "🎖️",
          titulo: "BOTS LIBRES",
          relato: "Se quitó el bot principal. Ahora todos los bots del grupo pueden responder.",
          lineas: ["⧼🫯⧽ *Responsable*::", `> ${mencion(sender)} hizo esta acción.`],
          tip: "Para elegir uno usa *.setprimary @bot* (admins)."
        }),
        [sender]
      );
    }

    const candidatos = [sock, ...socketsSubbots().map((x) => x.sock).filter((s) => s && s !== sock)].filter((s) => s.user && s.user.id);
    const objetivo = objetivoDe({ msg, cleanText });

    let elegido = sock;
    let numero = numeroDeBot(sock);
    let externo = false; // bot que vive en OTRA copia del bot (otro Termux/hosting): aquí solo se anota quién manda

    if (objetivo) {
      const limpio = limpiarJid(objetivo);
      const participante = buscarParticipante(meta, limpio);
      // WhatsApp a veces menciona con el LID y otras con el número: se comparan todas las identidades del participante.
      const ids = new Set([limpio, ...(participante?.ids || [])]);
      const digitos = new Set([...ids].map((i) => i.split("@")[0]));
      const local = candidatos.find((s) => idsDeBot(s).some((i) => ids.has(i) || digitos.has(i.split("@")[0])));

      if (local) {
        elegido = local;
        numero = numeroDeBot(local);
      } else {
        if (!participante) return avisar("No encontré a ese usuario en este grupo. Menciona al bot, responde a uno de sus mensajes o escribe su número completo.");
        const telefono = participante.ids.find((i) => i.endsWith("@s.whatsapp.net"));
        if (!telefono) return avisar("No pude saber el número real de ese bot (WhatsApp solo me dio un identificador interno). Escribe su número completo: *.setprimary 521XXXXXXXXXX*");
        numero = telefono.split("@")[0];
        externo = true;
      }
    }

    // El bot que recibe el mensaje ya está en el grupo; solo se verifica a los subbots (el LID puede no coincidir en el principal).
    if (!externo && elegido !== sock) {
      const metaElegido = await metadatos(elegido, from);
      if (!buscarBot(elegido, metaElegido)) return avisar("Ese bot no está en este grupo.");
    }

    if (actual === numero) return avisar(`El bot *${numero}* ya es el principal de este grupo.`);

    definirAjuste(from, "principal", numero);

    await responder(
      tarjetaMarcada({
        emoji: "🎖️",
        titulo: "BOT PRINCIPAL",
        relato: externo
          ? "Ese bot es de otra copia del bot. Quedó anotado como principal: los bots de esta copia se quedarán en silencio en el grupo."
          : "Desde ahora solo este bot responderá en el grupo. Los demás bots se quedarán en silencio.",
        lineas: [`⧼🤖⧽ *Bot*:: ${numero}`, "", "⧼🫯⧽ *Responsable*::", `> ${mencion(sender)} hizo esta acción.`],
        tip: "Para que vuelvan a responder todos usa *.setprimary off* (admins)."
      }),
      [sender]
    );
  })
};
