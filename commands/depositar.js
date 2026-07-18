import { getAccount, saveAccount, box, CURRENCY } from "../core.js";

export default {
  names: [".depositar"],
  desc: "Guardar plata de tu mano al banco",
  category: "Economía",
  usage: ".depositar <cantidad|todo>",
  handler: async ({ sender, cleanText, reply }) => {
    const acc = getAccount(sender);
    const arg = cleanText.split(/\s+/)[1];
    const amount = arg === "todo" ? acc.wallet : parseInt(arg, 10);
    if (!amount || amount <= 0 || amount > acc.wallet) {
      return reply({ text: `⚙️ Uso: .depositar <cantidad|todo>\n💰 En mano: ${acc.wallet} ${CURRENCY}` });
    }
    acc.wallet -= amount;
    acc.bank += amount;
    await saveAccount(sender);
    await reply({
      text: box("¡DEPÓSITO REALIZADO!", [
        `🪙 DEPOSITASTE  ›› *${amount} ${CURRENCY}*`,
        `💰 EN MANO  ›› *${acc.wallet} ${CURRENCY}*`,
        `🏦 EN BANCO  ›› *${acc.bank} ${CURRENCY}*`
      ])
    });
  }
};
