import { getAllAccounts } from "../../../motores/db.js";
import { tarjeta, fmt } from "../../economia/formato-evento.js";
import { estilo } from "../../economia/temas.js";

const ESTILOS = {
  normal: {
    medallas: ["🥇", "🥈", "🥉"],
    emoji: "✨",
    titulo: "RANKING DE XP",
    relato: "Las personas con más *experiencia* acumulada en el bot.",
    vacio: "⚠️ Todavía no hay usuarios con experiencia registrada.",
    fila: (puesto, jid, nivel, total) => `${puesto} @${jid.split("@")[0]} ››\n> Nivel ${nivel} · ${fmt(total)} XP en total.`,
    tip: "Usa *.perfil* para ver tu nivel y tu experiencia."
  },
  halloween: {
    medallas: ["👑", "🧛", "🧟"],
    emoji: "🔮",
    titulo: "RANKING DE ALMAS",
    relato: "Las almas con más *experiencia sobrenatural* acumulada en el bot. 👻",
    vacio: "⚠️ 🪦 Todavía no hay almas con experiencia registrada.",
    fila: (puesto, jid, nivel, total) => `${puesto} @${jid.split("@")[0]} ››\n> Nivel ${nivel} · ${fmt(total)} XP de poder oscuro.`,
    tip: "Usa *.perfil* para ver el nivel de tu alma. 🕯️"
  }
};

export function xpTotal(perfil) {
  const nivel = perfil.level || 1;
  return 50 * nivel * (nivel - 1) + (perfil.xp || 0);
}

export function rankingXp(limite = 10) {
  const lista = [];
  for (const [jid, cuenta] of getAllAccounts().entries()) {
    if (!cuenta.profile) continue;
    const total = xpTotal(cuenta.profile);
    if (total > 0) lista.push({ jid, nivel: cuenta.profile.level || 1, total });
  }
  return lista.sort((a, b) => b.total - a.total).slice(0, limite);
}

export default {
  names: [".xptop", ".topxp", ".niveltop"],
  desc: "Ver los usuarios con más experiencia",
  category: "Economía",
  handler: async ({ reply }) => {
    const E = estilo(ESTILOS);
    const ranking = rankingXp(10);

    if (!ranking.length) return reply({ text: E.vacio });

    const lineas = ranking.map((u, i) => E.fila(E.medallas[i] || `*${i + 1}*`, u.jid, u.nivel, u.total));

    await reply({
      text: tarjeta({ emoji: E.emoji, titulo: E.titulo, relato: E.relato, lineas, tip: E.tip }),
      mentions: ranking.map((u) => u.jid)
    });
  }
};
