import { getAllAccounts } from "../../../motores/db.js";
import { tarjeta, fmt } from "../../economia/formato.js";

const MEDALLAS = ["🥇", "🥈", "🥉"];

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
    const ranking = rankingXp(10);

    if (!ranking.length) {
      return reply({ text: "⚠️ Todavía no hay usuarios con experiencia registrada." });
    }

    const lineas = ranking.map((u, i) => {
      const puesto = MEDALLAS[i] || `*${i + 1}*`;
      return `${puesto} @${u.jid.split("@")[0]} ››\n> Nivel ${u.nivel} · ${fmt(u.total)} XP en total.`;
    });

    await reply({
      text: tarjeta({
        emoji: "✨",
        titulo: "RANKING DE XP",
        relato: "Las personas con más *experiencia* acumulada en el bot.",
        lineas,
        tip: "Usa *.perfil* para ver tu nivel y tu experiencia."
      }),
      mentions: ranking.map((u) => u.jid)
    });
  }
};
