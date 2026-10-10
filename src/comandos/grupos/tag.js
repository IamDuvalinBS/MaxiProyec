import { comandoGrupo, textoTrasComando } from "../../grupos/nucleo.js";

export default {
  names: [".tag", ".hidetag", ".todos"],
  usage: ".tag <mensaje> | responder a un mensaje",
  desc: "Mencionar a todos los miembros de forma oculta",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "📣", titulo: "TAG" }, async ({ sock, from, msg, meta, cleanText }) => {
    const citado = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const textoCitado = citado?.conversation || citado?.extendedTextMessage?.text || citado?.imageMessage?.caption || "";
    const texto = textoTrasComando(cleanText) || textoCitado || "Atención a todos los miembros del grupo.";
    await sock.sendMessage(from, { text: texto, mentions: meta.participantes.map((p) => p.id) });
  })
};
