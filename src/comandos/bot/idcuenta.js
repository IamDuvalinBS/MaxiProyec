import { ownerCommand } from "../../../motores/owner.js";
import { getAccount } from "../../../motores/db.js";
import { contextoDe } from "../../nucleo/objetivo.js";

const ver = (v) => (v === undefined || v === null || v === "" ? "—" : String(v));

function resumenCuenta(jid) {
  if (!jid) return "—";
  const acc = getAccount(jid);
  const p = acc.profile || {};
  return `cartera ${acc.wallet}, banco ${acc.bank}, nivel ${p.level || 1}, casado con ${ver(p.marriedTo)}`;
}

export default {
  names: [".idcuenta"],
  usage: ".idcuenta [@usuario]",
  desc: "Muestra los IDs que el bot ve de ti u otra persona",
  category: "Owner",
  handler: ownerCommand(async ({ sender, msg, reply }) => {
    const ctx = contextoDe(msg) || {};
    const mencionado = ctx.mentionedJid && ctx.mentionedJid[0];
    const citado = ctx.participant;
    const lineas = [
      "🪪 *IDS QUE VE EL BOT*",
      "",
      "*Tu mensaje*",
      `sender:: ${sender}`,
      `key:: ${JSON.stringify(msg.key)}`,
      `cuenta:: ${resumenCuenta(sender)}`,
      "",
      "*Mencionado*",
      `jid:: ${ver(mencionado)}`,
      `cuenta:: ${resumenCuenta(mencionado)}`,
      "",
      "*Mensaje al que respondes*",
      `autor:: ${ver(citado)}`,
      `cuenta:: ${resumenCuenta(citado)}`
    ];
    await reply({ text: lineas.join("\n") });
  })
};
