import { getAllAccounts } from "../../../motores/db.js";
import { tarjeta, fmt } from "../../economia/formato-evento.js";
import { estilo, moneda } from "../../economia/temas.js";

const ESTILOS = {
  normal: {
    medallas: ["🥇", "🥈", "🥉"],
    emoji: "🏆",
    titulo: "RANKING GLOBAL",
    relato: "La cantidad *global* de las personas con más dinero en el bot.",
    vacio: "⚠️ Todavía no hay usuarios con patrimonio registrado.",
    fila: (puesto, jid, total) => `${puesto} @${jid.split("@")[0]} ››\n> ${fmt(total)} ${moneda()} en el bot.`,
    tip: "Usa *.bal* para ver tu propio dinero."
  },
  halloween: {
    medallas: ["👑", "🧛", "🧟"],
    emoji: "💀",
    titulo: "SALÓN DE LOS MALDITOS",
    relato: "Las almas con *más calabazas* acumuladas en todo el reino embrujado. 🕸️",
    vacio: "⚠️ 🪦 Todavía no hay almas con calabazas registradas.",
    fila: (puesto, jid, total) => `${puesto} @${jid.split("@")[0]} ››\n> ${fmt(total)} ${moneda()} escondidas en su cripta.`,
    tip: "Usa *.bal* para ver cuántas calabazas tienes tú. 🎃"
  }
};

export default {
  names: [".baltop", ".top", ".ranking"],
  desc: "Ver los usuarios con mayor patrimonio",
  category: "Economía",
  handler: async ({ reply }) => {
    const E = estilo(ESTILOS);
    const ranking = [...getAllAccounts().entries()]
      .map(([jid, cuenta]) => ({ jid, total: cuenta.wallet + cuenta.bank }))
      .filter((u) => u.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    if (!ranking.length) return reply({ text: E.vacio });

    const lineas = ranking.map((u, i) => E.fila(E.medallas[i] || `*${i + 1}*`, u.jid, u.total));

    await reply({
      text: tarjeta({ emoji: E.emoji, titulo: E.titulo, relato: E.relato, lineas, tip: E.tip }),
      mentions: ranking.map((u) => u.jid)
    });
  }
};
