import { estadisticasGrupo } from "../../../motores/estadisticas.js";

const MEDALLAS = ["🥇", "🥈", "🥉", "✨", "🌟", "💫", "🔥", "⚡", "💎", "🎯"];
const fmt = (n) => n.toLocaleString("es-MX");

export default {
  names: [".contador", ".statsgrupo", ".actividad"],
  desc: "Ver los mensajes y comandos totales de este grupo y sus comandos más usados",
  category: "General",
  handler: async ({ sock, from, reply }) => {
    if (!from.endsWith("@g.us")) return reply({ text: "⚠️ Este comando solo funciona en grupos." });
    const d = await estadisticasGrupo(from, 10);
    if (!d) return reply({ text: "⚠️ Las estadísticas no están disponibles ahora mismo." });

    const resumen = `📈 *Actividad del grupo*\n\n💬 Mensajes: *${fmt(d.mensajes)}*\n⚙️ Comandos usados: *${fmt(d.comandos)}*`;
    if (!d.top.length) return reply({ text: `${resumen}\n\nTodavía no hay comandos registrados en este grupo.` });

    const total = d.comandos || 1;
    const pct = (u) => Math.round((u / total) * 100);
    try {
      await reply({ text: resumen });
      await sock.relayMessage(from, {
        pollResultSnapshotMessage: {
          name: "📊 Top comandos de este grupo",
          pollVotes: d.top.map((c, i) => ({ optionName: `${MEDALLAS[i]} ${c.nombre} — ${pct(c.usos)}%`, optionVoteCount: c.usos }))
        }
      }, {});
    } catch {
      const max = d.top[0].usos;
      const lineas = d.top.map((c, i) => {
        const llenos = Math.max(1, Math.round((c.usos / max) * 10));
        return `${MEDALLAS[i]} *${c.nombre}* — ${pct(c.usos)}% (${c.usos})\n${"█".repeat(llenos)}${"░".repeat(10 - llenos)}`;
      });
      await reply({ text: `📊 *Top comandos de este grupo*\n\n${lineas.join("\n\n")}` });
    }
  }
};
