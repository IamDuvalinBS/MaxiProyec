import { isOwner, normalizarNumero } from "../../../motores/owner.js";
import { funar, desfunar, listarFunados } from "../../../motores/funados.js";
import { aviso, objetivoDe } from "../../grupos/nucleo.js";
import { resolverUsuario } from "../../nucleo/identidad.js";

// .funar <número> (owners): el bot ignora por completo a ese número. .desfunar <número> lo libera. .funados lista.
// También sirve respondiendo a un mensaje o mencionando. Los owners y dueños no se pueden funar.
const EMOJI = "🚫";

async function objetivo({ sock, from, msg, cleanText }) {
  const digitos = cleanText.trim().split(/\s+/).slice(1).join("").replace(/\D/g, "");
  if (digitos.length >= 8 && digitos.length <= 15) return `${normalizarNumero(digitos)}@s.whatsapp.net`;
  const jid = objetivoDe({ msg, cleanText });
  if (!jid) return null;
  try {
    return await resolverUsuario(sock, jid, { grupo: from });
  } catch {
    return jid;
  }
}

const mostrar = (jid) => {
  const base = String(jid).split("@")[0].split(":")[0];
  return String(jid).endsWith("@lid") ? `ID ${base}` : `+${base}`;
};

const accion = (titulo, uso, hacer) => async (ctx) => {
  const { sender, reply } = ctx;
  if (!isOwner(sender)) return reply({ text: aviso(EMOJI, titulo, "Solo los owners pueden usar este comando.") });
  const jid = await objetivo(ctx);
  if (!jid) return reply({ text: aviso(EMOJI, titulo, `Indica el número.\n\n> Ejemplo: *${uso} 5219611234567*\n> También puedes responder a su mensaje o mencionarlo.`) });
  return hacer(ctx, jid);
};

export default [
  {
    names: [".funar"],
    usage: ".funar <número>",
    desc: "Hace que el bot ignore a ese número (solo owners)",
    category: "Owner",
    handler: accion("FUNAR", ".funar", async ({ sender, reply }, jid) => {
      if (isOwner(jid)) return reply({ text: aviso(EMOJI, "FUNAR", "No puedes funar a un owner.") });
      const nuevo = await funar(jid, sender);
      return reply({ text: aviso(EMOJI, "FUNAR", nuevo ? `${mostrar(jid)} fue funado: el bot ya no leerá sus comandos.\n\n> Para liberarlo usa *.desfunar ${String(jid).split("@")[0]}*` : `${mostrar(jid)} ya estaba funado.`) });
    })
  },
  {
    names: [".desfunar", ".unfunar"],
    usage: ".desfunar <número>",
    desc: "Quita el funar a un número (solo owners)",
    category: "Owner",
    handler: accion("DESFUNAR", ".desfunar", async ({ reply }, jid) => {
      const ok = await desfunar(jid);
      return reply({ text: aviso(EMOJI, "DESFUNAR", ok ? `${mostrar(jid)} ya puede usar el bot otra vez.` : `${mostrar(jid)} no estaba funado.`) });
    })
  },
  {
    names: [".funados"],
    usage: ".funados",
    desc: "Lista los números funados (solo owners)",
    category: "Owner",
    handler: async ({ sender, reply }) => {
      if (!isOwner(sender)) return reply({ text: aviso(EMOJI, "FUNADOS", "Solo los owners pueden usar este comando.") });
      const lista = listarFunados();
      return reply({ text: lista.length ? `⧼${EMOJI}⧽ *FUNADOS* (${lista.length})\n\n${lista.map((k, i) => `*${i + 1}.* ${mostrar(k)}`).join("\n")}` : aviso(EMOJI, "FUNADOS", "No hay números funados.") });
    }
  }
];
