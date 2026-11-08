import { comandoGrupo, objetivoDe, buscarParticipante, buscarBot, olvidarMetadatos } from "../../grupos/nucleo.js";
import { usuarioEnLista, agregarALista, quitarDeLista, listaDeGrupo } from "../../grupos/estado.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo.js";

// Crea un par de comandos (poner / quitar) que guardan al usuario en una lista del grupo.
function parDeLista({ clave, poner, quitar, emoji, tituloPoner, tituloQuitar, relatoPoner, relatoQuitar, tipPoner, requiereBotAdmin, expulsar = false }) {
  const ponerCmd = {
    names: poner.names,
    usage: poner.usage,
    desc: poner.desc,
    category: "Grupos",
    handler: comandoGrupo({ emoji, titulo: tituloPoner, botAdmin: expulsar }, async (ctx) => {
      const { sock, from, sender, meta, quien, bot, responder, avisar } = ctx;
      const usuario = objetivoDe(ctx);
      if (!usuario) return avisar(`Menciona a un usuario o responde a su mensaje.\n\n> Usa *${poner.names[0]} @usuario*`);

      const objetivo = buscarParticipante(meta, usuario);
      if (!objetivo) return avisar("Ese usuario no está en el grupo.");
      if (objetivo.admin) return avisar("No es posible hacerlo con un administrador.");
      if (objetivo === buscarBot(sock, meta)) return avisar("No puedes hacerlo con el propio bot.");
      if (objetivo === quien) return avisar("No puedes hacerlo contigo mismo.");
      if (usuarioEnLista(from, clave, objetivo.id)) return avisar("Ese usuario ya está en esta lista.");

      agregarALista(from, clave, objetivo.ids, sender);
      if (expulsar) {
        try {
          await sock.groupParticipantsUpdate(from, [objetivo.id], "remove");
          olvidarMetadatos(from);
        } catch (e) {
          return avisar("Lo agregué a la lista de vetados, pero no pude expulsarlo ahora.");
        }
      }

      const lineas = ["⧼🦉⧽ *Usuario*::", `> ${mencion(objetivo.id)}`, "⧼🫯⧽ *Responsable*::", `> ${mencion(sender)} hizo esta acción.`];
      if (requiereBotAdmin && !(bot && bot.admin)) lineas.push("⧼⚠️⧽ *Aviso*::", "> Necesito ser administrador para borrar sus mensajes.");
      await responder(tarjetaMarcada({ emoji, titulo: tituloPoner, relato: relatoPoner, lineas, tip: tipPoner }), [objetivo.id, sender]);
    })
  };

  const quitarCmd = {
    names: quitar.names,
    usage: quitar.usage,
    desc: quitar.desc,
    category: "Grupos",
    handler: comandoGrupo({ emoji: "✅", titulo: tituloQuitar }, async (ctx) => {
      const { from, sender, meta, responder, avisar } = ctx;
      const usuario = objetivoDe(ctx);
      if (!usuario) return avisar(`Menciona a un usuario o responde a su mensaje.\n\n> Usa *${quitar.names[0]} @usuario*`);

      const objetivo = buscarParticipante(meta, usuario);
      const ids = objetivo ? objetivo.ids : [usuario];
      if (!quitarDeLista(from, clave, ids)) return avisar("Ese usuario no está en esta lista.");

      const jid = objetivo ? objetivo.id : usuario;
      await responder(
        tarjetaMarcada({
          emoji: "✅",
          titulo: tituloQuitar,
          relato: relatoQuitar,
          lineas: ["⧼🦉⧽ *Usuario*::", `> ${mencion(jid)}`, "⧼🫯⧽ *Responsable*::", `> ${mencion(sender)} hizo esta acción.`]
        }),
        [jid, sender]
      );
    })
  };
  return [ponerCmd, quitarCmd];
}

const [ban, unban] = parDeLista({
  clave: "silenciados",
  poner: { names: [".ban", ".silenciar", ".mute"], usage: ".ban @usuario | responder a un mensaje", desc: "Silenciar a un usuario: el bot borra todo lo que escriba en el grupo (admins)" },
  quitar: { names: [".unban", ".desilenciar", ".unmute"], usage: ".unban @usuario | responder a un mensaje", desc: "Quitar el silencio a un usuario (admins)" },
  emoji: "🔇",
  tituloPoner: "USUARIO SILENCIADO",
  tituloQuitar: "SILENCIO RETIRADO",
  relatoPoner: "Todo lo que escriba este usuario será borrado por el bot.",
  relatoQuitar: "El usuario ya puede escribir con normalidad.",
  tipPoner: "Para quitarlo usa *.unban @usuario* (admins).",
  requiereBotAdmin: true
});

const [banbot, unbanbot] = parDeLista({
  clave: "sinBot",
  poner: { names: [".banbot", ".bloquearbot"], usage: ".banbot @usuario | responder a un mensaje", desc: "Impedir que un usuario use el bot en este grupo (admins)" },
  quitar: { names: [".unbanbot", ".desbloquearbot"], usage: ".unbanbot @usuario | responder a un mensaje", desc: "Devolverle el acceso al bot a un usuario (admins)" },
  emoji: "🚫",
  tituloPoner: "USUARIO SIN BOT",
  tituloQuitar: "ACCESO AL BOT RESTAURADO",
  relatoPoner: "Este usuario ya no puede usar el bot en este grupo.",
  relatoQuitar: "El usuario puede volver a usar el bot.",
  tipPoner: "Para devolverle el acceso usa *.unbanbot @usuario* (admins).",
  requiereBotAdmin: false
});

const [vetar, unvetar] = parDeLista({
  clave: "vetados",
  poner: { names: [".vetar", ".banpermanente"], usage: ".vetar @usuario | responder a un mensaje", desc: "Expulsar a un usuario y sacarlo de nuevo si vuelve a entrar (admins)" },
  quitar: { names: [".unvetar", ".perdonar"], usage: ".unvetar @usuario | responder a un mensaje", desc: "Quitar el veto: ya puede volver a entrar al grupo (admins)" },
  emoji: "⛔",
  tituloPoner: "USUARIO VETADO",
  tituloQuitar: "VETO RETIRADO",
  relatoPoner: "Fue expulsado y si vuelve a entrar al grupo lo saco otra vez.",
  relatoQuitar: "El usuario ya puede volver a entrar al grupo.",
  tipPoner: "Para quitarlo usa *.unvetar @usuario* (admins).",
  requiereBotAdmin: true,
  expulsar: true
});

const baneados = {
  names: [".baneados", ".silenciados"],
  usage: ".baneados",
  desc: "Ver los usuarios silenciados y los que no pueden usar el bot (admins)",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "📋", titulo: "BANEADOS" }, async ({ from, responder, avisar }) => {
    const silenciados = listaDeGrupo(from, "silenciados");
    const sinBot = listaDeGrupo(from, "sinBot");
    const vetados = listaDeGrupo(from, "vetados");
    if (!silenciados.length && !sinBot.length && !vetados.length) return avisar("No hay usuarios silenciados ni bloqueados del bot en este grupo.");
    const fila = (e) => `> @${e.ids[0]}`;
    const partes = [];
    if (silenciados.length) partes.push("⧼🔇⧽ *Silenciados (.ban)*::", ...silenciados.map(fila));
    if (sinBot.length) partes.push("⧼🚫⧽ *Sin bot (.banbot)*::", ...sinBot.map(fila));
    if (vetados.length) partes.push("⧼⛔⧽ *Vetados (.vetar)*::", ...vetados.map(fila));
    const mentions = [...silenciados, ...sinBot, ...vetados].map((e) => `${e.ids[0]}@s.whatsapp.net`);
    await responder(tarjetaMarcada({ emoji: "📋", titulo: "BANEADOS", lineas: partes }), mentions);
  })
};

export default [ban, unban, banbot, unbanbot, vetar, unvetar, baneados];
