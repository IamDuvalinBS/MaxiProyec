import { getAccount, saveAccount, box, CURRENCY } from "../core.js";

export default {
  names: [".retirar"],
  desc: "Sacar plata del banco a tu mano",
  category: "Economía",
  usage: ".retirar <cantidad|todo>",
  handler: async ({ sender, cleanText, reply }) => {
    const acc = getAccount(sender);
    const arg = cleanText.split(/\s+/)[1];
    const amount = arg === "todo" ? acc.bank : parseInt(arg, 10);
    if (!amount || amount <= 0 || amount > acc.bank) {
      return reply({ text:  });
    }
    acc.bank -= amount;
    acc.wallet += amount;
    await saveAccount(sender);
    await reply({
      text: box("¡RETIRO REALIZADO!", [
        ,
        ,
        
      ])
    });
  }
};
