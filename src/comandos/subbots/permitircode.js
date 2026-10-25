import { ownerCommand } from "../../../motores/owner.js";
import { permitirCode, quitarPermisoCode, permitidosCode, canonico, soloDigitos } from "../../subbots/gestor.js";

// Da (o quita) permiso para usar SOLO .code. No convierte a la persona en owner ni le abre otros comandos de owner.
const nombreDe = (id) => (id.endsWith("@lid") ? "@" + id.split("@")[0] : "+" + soloDigitos(id));

function objetivo(msg, cleanText) {
  const raiz = msg.message || {};
  const contenido = raiz.ephemeralMessage?.message || raiz.viewOnceMessage?.message || raiz;
  const ci = Object.values(contenido).find((v) => v && typeof v === "object" && v.contextInfo)?.contextInfo;
  const mencionado = ci?.mentionedJid?.[0] || ci?.participant;
  if (mencionado) return mencionado.endsWith("@s.whatsapp.net") ? canonico(mencionado) + "@s.whatsapp.net" : mencionado.split(":")[0];
  const n = canonico(cleanText.replace(/^\S+\s*/, ""));
  return n.length >= 8 && n.length <= 15 ? n + "@s.whatsapp.net" : null;
}

export default {
  names: [".permitircode", ".quitarcode", ".listacode"],
  usage: ".permitircode <@usuario | número> | .quitarcode <@usuario | número> | .listacode",
  desc: "Dar o quitar permiso para pedir .code (solo ese comando, no es owner)",
  category: "Owner",
  handler: ownerCommand(async ({ cleanText, msg, reply }) => {
    const comando = cleanText.toLowerCase().split(/\s+/)[0];

    if (comando === ".listacode") {
      const lista = permitidosCode();
      return reply({ text: lista.length ? `🔑 *PERMISO PARA .CODE*\n\n${lista.map((x) => `• ${nombreDe(x)}`).join("\n")}` : "🔑 Nadie tiene permiso extra para usar *.code*." });
    }

    const id = objetivo(msg, cleanText);
    if (!id) return reply({ text: `⚙️ Uso: *${comando} <@usuario | número>* (también puedes responder a su mensaje).` });

    if (comando === ".quitarcode") {
      return reply({ text: (await quitarPermisoCode(id)) ? `✅ A *${nombreDe(id)}* ya no se le permite usar *.code*.` : `⚠️ *${nombreDe(id)}* no tenía ese permiso.` });
    }
    await reply({ text: (await permitirCode(id)) ? `✅ *${nombreDe(id)}* ahora puede usar *.code* sin cumplir misiones. No tiene otros permisos de owner.` : `⚠️ *${nombreDe(id)}* ya tenía permiso.` });
  })
};
