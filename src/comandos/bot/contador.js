import { estadisticasGrupo } from "../../../motores/estadisticas.js";
import { getAllAccounts } from "../../../core.js";

const MEDALLAS = ["🥇", "🥈", "🥉"];
const fmt = (n) => n.toLocaleString("es-MX");
const numero = (jid) => jid.split("@")[0];

const nombreDe = (jid) => {
  const n = getAllAccounts().get(jid)?.profile?.name;
  return n || `+${numero(jid)}`;
};

const POR_PAGINA = 15;
const linea = (u, i) => `${MEDALLAS[i] || `${i + 1}.`} ${nombreDe(u.jid)} • ${fmt(u.mensajes)} msm • ${fmt(u.comandos)} cmd`;

export default {
  names: [".contador", ".statsgrupo", ".actividad"],
  desc: "Ver mensajes y comandos del grupo y de cada usuario (.contador, o respondiendo/mencionando a alguien)",
  category: "General",
  usage: ".contador [página] [@usuario]",
  handler: async ({ from, msg, cleanText, reply }) => {
    if (!from.endsWith("@g.us")) return reply({ text: "⚠️ Este comando solo funciona en grupos." });
    const d = await estadisticasGrupo(from, 10);
    if (!d) return reply({ text: "⚠️ Las estadísticas no están disponibles ahora mismo." });

    // ¿preguntan por alguien en concreto? (mención o respuesta a su mensaje)
    const ci = msg.message?.extendedTextMessage?.contextInfo;
    const objetivo = ci?.mentionedJid?.[0] || ci?.participant;
    if (objetivo) {
      const pos = d.usuarios.findIndex((u) => u.jid === objetivo);
      const u = d.usuarios[pos] || { jid: objetivo, mensajes: 0, comandos: 0 };
      const puesto = pos >= 0 ? `\n🏆 Puesto: *#${pos + 1}* de ${d.usuarios.length}` : "";
      return reply({
        text: `👤 *${nombreDe(objetivo)}*\n\n💬 Mensajes: *${fmt(u.mensajes)}*\n⚙️ Comandos: *${fmt(u.comandos)}*${puesto}`,
        mentions: [objetivo]
      });
    }

    const paginas = Math.max(1, Math.ceil(d.usuarios.length / POR_PAGINA));
    const pedida = parseInt(cleanText.trim().split(/\s+/)[1], 10);
    const pagina = Math.min(Math.max(Number.isFinite(pedida) ? pedida : 1, 1), paginas);
    const inicio = (pagina - 1) * POR_PAGINA;
    const lineas = d.usuarios.slice(inicio, inicio + POR_PAGINA).map((u, i) => linea(u, inicio + i));

    const ranking = lineas.length
      ? `👥 *Ranking de usuarios* (${d.usuarios.length}) — Página ${pagina}/${paginas}\n${lineas.join("\n")}`
      : "👥 Todavía no hay mensajes registrados por usuario.";
    const pie = pagina < paginas ? `\n\n➡️ Siguiente: *.contador ${pagina + 1}*` : "";

    if (pagina > 1) return reply({ text: `${ranking}${pie}` });

    return reply({
      text: `📈 *Actividad del grupo*\n\n💬 Mensajes: *${fmt(d.mensajes)}*\n⚙️ Comandos: *${fmt(d.comandos)}*\n\n${ranking}${pie}`
    });
  }
};
