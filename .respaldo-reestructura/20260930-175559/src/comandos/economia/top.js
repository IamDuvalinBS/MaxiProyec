import { getAllAccounts } from "../../../motores/db.js";
import { tarjeta, monto } from "../../economia/formato.js";

const MEDALLAS = ["🥇", "🥈", "🥉"];

export default {
  names: [".top", ".ranking"],
  desc: "Ver los usuarios con mayor patrimonio",
  category: "Economía",
  handler: async ({ reply }) => {
    const ranking = [...getAllAccounts().entries()]
      .map(([jid, cuenta]) => ({ jid, total: cuenta.wallet + cuenta.bank, nombre: cuenta.profile?.name }))
      .filter((u) => u.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    if (!ranking.length) {
      return reply({ text: "⚠️ Todavía no hay usuarios con patrimonio registrado." });
    }

    const lineas = ranking.map((u, i) => {
      const etiqueta = MEDALLAS[i] || `${i + 1}.`;
      const nombre = u.nombre || `@${u.jid.split("@")[0]}`;
      return `${etiqueta} ${nombre} ›› ${monto(u.total)}`;
    });

    await reply({
      text: tarjeta({ emoji: "🏆", titulo: "RANKING DE PATRIMONIO", lineas }),
      mentions: ranking.filter((u) => !u.nombre).map((u) => u.jid)
    });
  }
};
