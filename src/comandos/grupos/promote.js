import { isOwner } from "../../../motores/owner.js";

function idsDe(p) {
  return [p.id, p.lid, p.jid, p.phoneNumber].filter(Boolean);
}

export default {
  names: [".promote", ".promover"],
  desc: "Dar admin a un miembro del grupo",
  category: "Grupos",
  usage: ".promote @usuario",
  handler: async ({ sock, from, sender, cleanText, msg }) => {
    if (!from.endsWith("@g.us")) {
      await sock.sendMessage(from, { text: "⧼🚂⧽ *PROMOTE*\n\n> Este comando solo funciona en grupos." }, { quoted: msg });
      return;
    }

    const metadata = await sock.groupMetadata(from);
    const quienEjecuta = metadata.participants.find((p) => idsDe(p).includes(sender));
    const esAdmin = quienEjecuta && (quienEjecuta.admin === "admin" || quienEjecuta.admin === "superadmin");
    if (!esAdmin && !isOwner(sender)) {
      await sock.sendMessage(from, { text: "⧼🚂⧽ *PROMOTE*\n\n> Solo los administradores pueden usar este comando." }, { quoted: msg });
      return;
    }

    const info = msg.message?.extendedTextMessage?.contextInfo;
    const argumento = cleanText.split(/\s+/)[1];
    const numero = argumento ? argumento.replace(/\D/g, "") : "";
    const usuario = info?.mentionedJid?.[0] || info?.participant || (numero ? `${numero}@s.whatsapp.net` : null);

    if (!usuario) {
      await sock.sendMessage(from, { text: "⧼🚂⧽ *PROMOTE*\n\n> Menciona a un usuario o responde a su mensaje.\n\n> Usa *.promote @usuario*" }, { quoted: msg });
      return;
    }

    const objetivo = metadata.participants.find((p) => idsDe(p).includes(usuario));
    if (!objetivo) {
      await sock.sendMessage(from, { text: "⧼🚂⧽ *PROMOTE*\n\n> Ese usuario no está en el grupo." }, { quoted: msg });
      return;
    }
    if (objetivo.admin === "admin" || objetivo.admin === "superadmin") {
      await sock.sendMessage(from, { text: "⧼🚂⧽ *PROMOTE*\n\n> Ese usuario ya es administrador." }, { quoted: msg });
      return;
    }

    try {
      await sock.groupParticipantsUpdate(from, [objetivo.id], "promote");
    } catch (e) {
      await sock.sendMessage(from, { text: "⧼🚂⧽ *PROMOTE*\n\n> No pude dar admin. Verifica que el bot sea administrador del grupo." }, { quoted: msg });
      return;
    }

    const texto = [
      "⧼🚂⧽ ```##``` *NUEVO ADMIN*",
      "",
      "> Un nuevo administrador ha llegado a este grupo.",
      "",
      "⧼🎲⧽ *Nuevo admin*::",
      `> @${objetivo.id.split("@")[0]}`,
      "⧼🎯⧽ *Responsable*::",
      `> @${sender.split("@")[0]} le otorgó admin.`,
      "",
      "> Para remover esta acción usa *.demote* (admins)."
    ].join("\n");

    await sock.sendMessage(from, { text: texto, mentions: [objetivo.id, sender] }, { quoted: msg });
  }
};
