import { getAllAccounts, box, CURRENCY } from "../core.js";

export default {
  names: [".top", ".baltop"],
  desc: "Ranking de los que más ¥enes tienen",
  category: "Economía",
  handler: async ({ reply }) => {
    const accounts = getAllAccounts();
    const lista = Array.from(accounts.entries())
      .map(([jid, acc]) => ({ jid, total: acc.wallet + acc.bank }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    if (lista.length === 0) return reply({ text: "⚙️ Todavía nadie tiene ¥enes registrados." });
    const medallas = ["🥇", "🥈", "🥉"];
    const lineas = lista.map((u, i) => `${medallas[i] || `${i + 1}.`} @${u.jid.split("@")[0]}  ›› *${u.total} ${CURRENCY}*`);
    await reply({ text: box("TOP RICOS ›› ¥enes", lineas), mentions: lista.map(u => u.jid) });
  }
};
