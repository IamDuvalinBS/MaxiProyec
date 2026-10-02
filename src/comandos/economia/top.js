import { getAllAccounts } from "../../../motores/db.js";
import { tarjeta, fmt } from "../../economia/formato.js";
import { CURRENCY } from "../../../motores/db.js";

const MEDALLAS = ["🥇", "🥈", "🥉"];

export default {
  names: [".baltop", ".top", ".ranking"],
  desc: "Ver los usuarios con mayor patrimonio",
  category: "Economía",
  handler: async ({ reply }) => {
    const ranking = [...getAllAccounts().entries()]
      .map(([jid, cuenta]) => ({ jid, total: cuenta.wallet + cuenta.bank }))
      .filter((u) => u.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    if (!ranking.length) {
      return reply({ text: "⚠️ Todavía no hay usuarios con patrimonio registrado." });
    }

    const lineas = ranking.map((u, i) => {
      const puesto = MEDALLAS[i] || `*${i + 1}*`;
      return `${puesto} @${u.jid.split("@")[0]} ››\n> ${fmt(u.total)} ${CURRENCY} en el bot.`;
    });

    await reply({
      text: tarjeta({
        emoji: "🏆",
        titulo: "RANKING GLOBAL",
        relato: "La cantidad *global* de las personas con más dinero en el bot.",
        lineas,
        tip: "Usa *.bal* para ver tu propio dinero."
      }),
      mentions: ranking.map((u) => u.jid)
    });
  }
};
