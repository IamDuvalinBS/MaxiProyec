import { topComandos } from "../../../motores/estadisticas.js";

const MEDALLAS = ["🥇", "🥈", "🥉", "✨", "🌟", "💫", "🔥", "⚡", "💎", "🎯"];
const TITULO = "📊 Top 10 Comandos Más Usados";

const porcentaje = (usos, total) => Math.round((usos / total) * 100);

const textoRespaldo = ({ top, total }) => {
  const maximo = top[0].usos;
  const lineas = top.map((c, i) => {
    const llenos = Math.max(1, Math.round((c.usos / maximo) * 10));
    return `${MEDALLAS[i]} *${c._id}* — ${porcentaje(c.usos, total)}% (${c.usos})\n${"█".repeat(llenos)}${"░".repeat(10 - llenos)}`;
  });
  return `${TITULO}\n\n${lineas.join("\n\n")}`;
};

export default {
  names: [".topcomandos", ".topcmd"],
  desc: "Ver los 10 comandos más usados del bot",
  category: "General",
  handler: async ({ sock, from, reply }) => {
    const datos = await topComandos(10);
    if (!datos || !datos.top.length) return reply({ text: "⚠️ Todavía no hay comandos registrados." });

    try {
      await sock.relayMessage(from, {
        pollResultSnapshotMessage: {
          name: TITULO,
          pollVotes: datos.top.map((c, i) => ({
            optionName: `${MEDALLAS[i]} ${c._id} — ${porcentaje(c.usos, datos.total)}%`,
            optionVoteCount: c.usos
          }))
        }
      }, {});
    } catch {
      await reply({ text: textoRespaldo(datos) });
    }
  }
};
  
