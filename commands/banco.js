import { getAccount, box, CURRENCY } from "../core.js";

export default {
  names: [".banco", ".bal", ".bank"],
  desc: "Ver tu saldo o el de alguien mencionado",
  category: "Economía",
  usage: ".banco [@usuario]",
  handler: async ({ sender, msg, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const target = (mentioned && mentioned[0]) || sender;
    const acc = getAccount(target);
    const total = acc.wallet + acc.bank;
    await reply({
      text: box("BANCO DE ›› @" + target.split("@")[0], [
        `💰 EN MANO  ›› *${acc.wallet} ${CURRENCY}*`,
        `🏦 EN BANCO  ›› *${acc.bank} ${CURRENCY}*`,
        `📊 TOTAL  ›› *${total} ${CURRENCY}*`
      ]),
      mentions: [target]
    });
  }
};
