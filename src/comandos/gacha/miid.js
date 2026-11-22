import { esOwnerGacha, numeroDe } from "../../../motores/gacha-owners.js";
import { tarjeta } from "../../../motores/gacha-core.js";
import { candidatosDeUsuario } from "../../../motores/gacha-usuario.js";
import { rangoDe } from "../../../motores/owner.js";
import { resolverUsuario, lidsDe, lidDeNumero } from "../../nucleo/identidad.js";
import { metadatos, buscarParticipanteResuelto, limpiarJid } from "../../grupos/nucleo.js";
import { contextoDe } from "../../nucleo/objetivo.js";

const PN = "@s.whatsapp.net";
const esLid = (jid) => String(jid).endsWith("@lid");
const esPN = (jid) => String(jid).endsWith(PN);

// Junta todos los IDs conocidos de una persona: número (@s.whatsapp.net) y LID (@lid).
async function juntarIds({ sock, from, base, extra = [] }) {
  const ids = new Set([base, ...extra].filter(Boolean).map(limpiarJid));

  const pn = await resolverUsuario(sock, base, { grupo: from }).catch(() => base);
  if (pn) ids.add(limpiarJid(pn));

  for (const id of [...ids]) {
    if (esPN(id)) {
      for (const lid of lidsDe(id)) ids.add(lid);
      const lid = await lidDeNumero(sock, id);
      if (lid) ids.add(lid);
    }
  }

  if (from?.endsWith("@g.us")) {
    try {
      const meta = await metadatos(sock, from);
      for (const id of ids) {
        const participante = await buscarParticipanteResuelto(sock, from, meta, id);
        if (participante) {
          participante.ids.forEach((x) => ids.add(x));
          break;
        }
      }
    } catch {}
  }

  const lista = [...ids].filter((id) => !id.endsWith("@g.us") && !id.endsWith("@broadcast"));
  return {
    numeros: lista.filter(esPN),
    lids: lista.filter(esLid),
    otros: lista.filter((id) => !esPN(id) && !esLid(id))
  };
}

export default {
  names: [".miid", ".whoami"],
  usage: ".miid [@usuario]",
  desc: "Muestra tu ID de WhatsApp o el de otra persona",
  category: "Gacha",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const ctx = contextoDe(msg) || {};
    const arg = String(cleanText || "").trim().split(/\s+/).slice(1).join("").replace(/\D/g, "");
    const mencionado = ctx.mentionedJid?.[0];
    const citado = ctx.participant;
    const escrito = arg.length >= 8 ? `${arg}${PN}` : null;

    const base = mencionado || citado || escrito || sender;
    const esPropio = base === sender;
    const extra = esPropio ? candidatosDeUsuario(sock, msg, sender) : [];

    const { numeros, lids, otros } = await juntarIds({ sock, from, base, extra });
    const todos = [...numeros, ...lids, ...otros];
    const num = numeroDe(numeros[0] || base);
    const owner = todos.some((id) => esOwnerGacha(id));
    const rango = todos.some((id) => rangoDe(id) === "dueno") ? "Dueño 💎" : todos.some((id) => rangoDe(id) === "owner") ? "Owner 👑" : "Usuario";

    const lineas = [`🆔 *${esPropio ? "Tu ID" : "ID"}* ›› ${numeros[0] || base}`];
    if (numeros.length > 1) lineas.push(`🆔 *Otros números* ›› ${numeros.slice(1).join(", ")}`);
    lineas.push(
      lids.length
        ? `🧬 *ID interno (@lid)* ›› ${lids.join(", ")}`
        : "🧬 *ID interno (@lid)* ›› no lo conozco todavía"
    );
    if (otros.length) lineas.push(`🔗 *Otros IDs* ›› ${otros.join(", ")}`);
    lineas.push(`🔢 *Número* ›› ${num}`, `🏅 *Rango* ›› ${rango}`, `👑 *Owner del gacha* ›› ${owner ? "Sí ✅" : "No ❌"}`);

    if (esPropio && !owner) {
      lineas.push("", "Si eres owner, en Termux (dentro de la carpeta del bot) ejecuta:", `echo "${num}" >> data/owners-gacha.txt`, "y ya funciona, sin reiniciar.");
    }
    return reply({ text: tarjeta({ emoji: "🪪", titulo: esPropio ? "MI ID" : "ID DE USUARIO", lineas }) });
  }
};
