import { comandoGrupo, buscarParticipante } from "../../grupos/nucleo.js";

export default {
  names: [".del", ".eliminar"],
  usage: ".del (respondiendo a un mensaje)",
  desc: "Eliminar el mensaje al que respondes",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "🗑️", titulo: "DEL" }, async ({ sock, from, msg, meta, bot, avisar }) => {
    const info = msg.message?.extendedTextMessage?.contextInfo;
    if (!info?.stanzaId) return avisar("Responde al mensaje que deseas eliminar.\n\n> Usa *.del* respondiendo a un mensaje.");

    const autor = info.participant;
    const esDelBot = Boolean(bot && autor && buscarParticipante(meta, autor) === bot);
    if (!esDelBot && !(bot && bot.admin)) {
      return avisar("Necesito ser administrador del grupo para eliminar mensajes de otros usuarios.");
    }

    try {
      await sock.sendMessage(from, { delete: { remoteJid: from, fromMe: esDelBot, id: info.stanzaId, participant: autor } });
    } catch (e) {
      return avisar("No fue posible eliminar el mensaje.");
    }
    await sock.sendMessage(from, { delete: msg.key }).catch(() => {});
  })
};
