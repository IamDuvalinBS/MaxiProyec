import { getAccount, saveAccount, box, CURRENCY } from "../core.js";

export default {
  names: [".transferir", ".pagar"],
  desc: "Mandarle plata a otro usuario",
  category: "Economía",
  usage: ".transferir <cantidad> @usuario",
  handler: async ({ sender, cleanText, msg, reply }) => {
    const acc = getAccount(sender);
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const destino = mentioned && mentioned[0];
    if (!destino) return reply({ text: "⚙️ Uso: .transferir <cantidad> @usuario\nTenés que etiquetar a la persona." });
    if (destino === sender) return reply({ text: "❌ No podés transferirte plata a vos mismo." });
    const amount = parseInt(cleanText.split(/\s+/)[1], 10);
    if (!amount || amount <= 0 || amount > acc.wallet) {
      return reply({ text: `⚙️ Uso: .transferir <cantidad> @usuario\n💰 En mano: ${acc.wallet} ${CURRENCY}` });
    }
    const destAcc = getAccount(destino);
    acc.wallet -= amount;
    destAcc.wallet += amount;
    await saveAccount(sender);
    await saveAccount(destino);
    await reply({
      text: box("¡TRANSFERENCIA REALIZADA!", [
        `👤 DE  ›› @${sender.split("@")[0]}`,
        `👤 PARA  ›› @${destino.split("@")[0]}`,
        `🪙 MONTO  ›› *${amount} ${CURRENCY}*`
      ]),
      mentions: [sender, destino]
    });
  }
};
