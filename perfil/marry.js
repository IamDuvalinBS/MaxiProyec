import { getProfile, saveAccount, box } from "../core.js";

function fechaHoy() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export default {
  names: [".marry", ".casar"],
  desc: "Casarte con otro usuario (etiquetándolo)",
  category: "Perfil",
  usage: ".marry @usuario",
  handler: async ({ sender, msg, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const destino = mentioned && mentioned[0];

    if (!destino) return reply({ text: "⚙️ Uso: .marry @usuario\nTenés que etiquetar a la persona." });
    if (destino === sender) return reply({ text: "❌ No podés casarte con vos mismo." });

    const pSender = getProfile(sender);
    const pDestino = getProfile(destino);

    if (pSender.marriedTo) return reply({ text: "❌ Ya estás casado. Primero tenés que separarte." });
    if (pDestino.marriedTo) return reply({ text: "❌ Esa persona ya está casada con alguien más." });

    const hoy = fechaHoy();
    pSender.marriedTo = destino;
    pSender.marriedSince = hoy;
    pDestino.marriedTo = sender;
    pDestino.marriedSince = hoy;

    await saveAccount(sender);
    await saveAccount(destino);

    await reply({
      text: box("¡BODA CELEBRADA! 💍", [
        `👰 @${sender.split("@")[0]}`,
        `🤵 @${destino.split("@")[0]}`,
        `📅 Casados desde: *${hoy}*`
      ]),
      mentions: [sender, destino]
    });
  }
};
