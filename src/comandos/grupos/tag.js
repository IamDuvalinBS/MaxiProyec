import { comandoGrupo, textoTrasComando } from "../../grupos/nucleo.js";
import { contextoDe } from "../../nucleo/objetivo.js";

export default {
  names: [".tag", ".hidetag", ".todos"],
  usage: ".tag <mensaje>",
  desc: "Menciona a todos los miembros de forma oculta",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "📣", titulo: "TAG" }, async ({ sock, from, msg, meta, cleanText }) => {
    const citado = contextoDe(msg)?.quotedMessage;
    const textoCitado = citado?.conversation || citado?.extendedTextMessage?.text || citado?.imageMessage?.caption || "";
    const texto = textoTrasComando(cleanText) || textoCitado || "Atención a todos los miembros del grupo.";
    await sock.sendMessage(from, { text: texto, mentions: meta.participantes.map((p) => p.id) });
  })
};
