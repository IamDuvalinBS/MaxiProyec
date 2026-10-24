import { estadisticasGrupo } from "../../../motores/estadisticas.js";
import { getAllAccounts } from "../../../core.js";
import { metadatos, limpiarJid } from "../../grupos/nucleo.js";
import { resolverUsuario } from "../../nucleo/identidad.js";

const MEDALLAS = ["🥇", "🥈", "🥉"];
const POR_PAGINA = 15;
const fmt = (n) => n.toLocaleString("es-MX");

// quita símbolos que romperían el *negrita* de WhatsApp y los saltos de línea
const limpiarNombre = (n) => String(n || "").replace(/[*_~`]/g, "").replace(/\s+/g, " ").trim();

const seccion = (emoji, titulo) => `⧼${emoji}⧽ \`\`\`##\`\`\` *${titulo}*`;

// Lista a TODOS los miembros actuales del grupo. Los que no han hablado salen en 0
// y no se guardan en Mongo: solo se arman aquí, al momento, con la lista del grupo.
async function cargarMiembros(sock, from, usuarios) {
  const meta = await metadatos(sock, from);
  if (!meta) return null;
  const propios = [sock.user?.id, sock.user?.lid].filter(Boolean).map(limpiarJid);
  const guardados = new Map(usuarios.map((u) => [u.jid, u]));
  const cuentas = getAllAccounts();
  const miembros = [];

  for (const p of meta.participantes) {
    if (p.ids.some((id) => propios.includes(id))) continue;   // el bot no cuenta
    const resuelto = await resolverUsuario(sock, p.id, { grupo: from }).catch(() => p.id);
    const claves = [...new Set([...p.ids, resuelto])];
    let mensajes = 0, comandos = 0;
    for (const k of claves) {
      const g = guardados.get(k);
      if (g) { mensajes += g.mensajes; comandos += g.comandos; guardados.delete(k); }
    }
    const nombre = claves.map((k) => cuentas.get(k)?.profile?.name).find(Boolean) || `+${resuelto.split("@")[0]}`;
    miembros.push({ jid: resuelto, nombre: limpiarNombre(nombre), mensajes, comandos });
  }
  return miembros.sort((a, b) => b.mensajes - a.mensajes || b.comandos - a.comandos || a.nombre.localeCompare(b.nombre));
}

export default {
  names: [".contador", ".statsgrupo", ".actividad"],
  desc: "Ver mensajes y comandos del grupo y de cada usuario (.contador, .contador 2 o respondiendo/mencionando a alguien)",
  category: "General",
  usage: ".contador [página] [@usuario]",
  handler: async ({ sock, from, msg, cleanText, reply }) => {
    if (!from.endsWith("@g.us")) return reply({ text: "⚠️ Este comando solo funciona en grupos." });
    const d = await estadisticasGrupo(from);
    if (!d) return reply({ text: "⚠️ Las estadísticas no están disponibles ahora mismo." });
    const miembros = await cargarMiembros(sock, from, d.usuarios);
    if (!miembros) return reply({ text: "⚠️ No pude leer los miembros del grupo, intenta de nuevo." });

    // ¿preguntan por alguien en concreto? (mención o respuesta a su mensaje)
    const ci = msg.message?.extendedTextMessage?.contextInfo;
    const objetivo = ci?.mentionedJid?.[0] || ci?.participant;
    if (objetivo) {
      const pos = miembros.findIndex((u) => u.jid === objetivo);
      if (pos < 0) return reply({ text: "⚠️ Esa persona no está en el grupo." });
      const u = miembros[pos];
      return reply({
        text: `${seccion("👤", "ACTIVIDAD DE USUARIO")}\n\n> Usuario: *${u.nombre}*\n> Mensajes: *${fmt(u.mensajes)}*\n> Comandos ejecutados: *${fmt(u.comandos)}*\n> Puesto: *${pos + 1}/${miembros.length}*`
      });
    }

    const paginas = Math.max(1, Math.ceil(miembros.length / POR_PAGINA));
    const pedida = parseInt(cleanText.trim().split(/\s+/)[1], 10);
    const pagina = Math.min(Math.max(Number.isFinite(pedida) ? pedida : 1, 1), paginas);
    const inicio = (pagina - 1) * POR_PAGINA;
    const filas = miembros
      .slice(inicio, inicio + POR_PAGINA)
      .map((u, i) => `${MEDALLAS[inicio + i] || `*${inicio + i + 1}*`} *${u.nombre}* ››\n> ${fmt(u.mensajes)} msm • ${fmt(u.comandos)} cmd`);

    const ranking = `${seccion("🐋", "RANKING - MENSAJES")}\n\n${filas.join("\n")}\n\n> Ranking *${pagina}/${paginas}*${pagina < paginas ? `\n> Siguiente: *.contador ${pagina + 1}*` : ""}`;
    if (pagina > 1) return reply({ text: ranking });

    return reply({
      text: `${seccion("📚", "ACTIVIDAD DEL GRUPO")}\n\n> Mensajes en el grupo: *${fmt(d.mensajes)}*\n> Comandos ejecutados: *${fmt(d.comandos)}*\n\n${ranking}`
    });
  }
};
