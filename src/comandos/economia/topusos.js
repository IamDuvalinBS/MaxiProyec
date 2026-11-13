import { getAllAccounts } from "../../../motores/db.js";
import { tarjeta, fmt } from "../../economia/formato-evento.js";
import { estilo } from "../../economia/temas.js";

const ESTILOS = {
  normal: {
    medallas: ["🥇", "🥈", "🥉"],
    emoji: "📊",
    titulo: "RANKING DE COMANDOS",
    relato: "Las personas que han usado *más comandos* en el bot.",
    vacio: "⚠️ Todavía no hay usuarios con comandos registrados.",
    fila: (puesto, jid, total) => `${puesto} @${jid.split("@")[0]} ››\n> ${fmt(total)} comandos utilizados.`,
    tip: "Usa *.perfil* para ver cuántos comandos llevas."
  },
  halloween: {
    medallas: ["👑", "🧛", "🧟"],
    emoji: "🕯️",
    titulo: "RANKING DE CONJUROS",
    relato: "Las almas que han lanzado *más conjuros* en todo el reino embrujado. 🦇",
    vacio: "⚠️ 🪦 Todavía no hay almas con conjuros registrados.",
    fila: (puesto, jid, total) => `${puesto} @${jid.split("@")[0]} ››\n> ${fmt(total)} conjuros lanzados.`,
    tip: "Usa *.perfil* para ver cuántos conjuros llevas. 🕸️"
  }
};

export function rankingComandos(limite = 10) {
  const lista = [];
  for (const [jid, cuenta] of getAllAccounts().entries()) {
    const total = cuenta.stats?.comandos || 0;
    if (total > 0) lista.push({ jid, total });
  }
  return lista.sort((a, b) => b.total - a.total).slice(0, limite);
}

export default {
  names: [".topusos", ".topusuarios", ".topuso"],
  desc: "Ver los usuarios que más comandos han utilizado",
  category: "Economía",
  handler: async ({ reply }) => {
    const E = estilo(ESTILOS);
    const ranking = rankingComandos(10);
    if (!ranking.length) return reply({ text: E.vacio });

    const lineas = ranking.map((u, i) => E.fila(E.medallas[i] || `*${i + 1}*`, u.jid, u.total));
    await reply({
      text: tarjeta({ emoji: E.emoji, titulo: E.titulo, relato: E.relato, lineas, tip: E.tip }),
      mentions: ranking.map((u) => u.jid)
    });
  }
};
