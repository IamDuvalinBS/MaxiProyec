import { ownerCommand } from "../../../motores/owner.js";
import { textoTrasComando } from "../../grupos/nucleo.js";
import { difundirSubbots, difusionActiva, cancelarDifusion, estadoDifusion } from "../../subbots/difusion.js";

const textoDe = (m) => m?.conversation || m?.extendedTextMessage?.text || m?.imageMessage?.caption || m?.videoMessage?.caption || "";

export default {
  names: [".tagsubs", ".avisosubs", ".tagallsubs"],
  usage: ".tagsubs <mensaje> | .tagsubs -v <mensaje> | .tagsubs estado | .tagsubs stop | responder a un mensaje",
  desc: "Todos los subbots mandan un mensaje (mencionando a todos) en todos los grupos donde estén",
  category: "Owner",
  handler: ownerCommand(async ({ cleanText, msg, reply }) => {
    let resto = textoTrasComando(cleanText);

    if (/^(stop|cancelar|parar)$/i.test(resto)) {
      return reply({ text: cancelarDifusion() ? "🛑 Cancelando: cada subbot se detiene al terminar el grupo en curso." : "⚠️ No hay ningún envío en curso." });
    }
    if (/^(estado|status)$/i.test(resto)) {
      const e = estadoDifusion();
      return reply({ text: e ? `📊 En curso › enviados *${e.enviados}*, fallidos *${e.fallidos}*, grupos encontrados *${e.total}*.` : "📊 No hay ningún envío en curso." });
    }

    const visible = /^-v\b/i.test(resto);   // -v: además de notificar a todos, lista las menciones a la vista
    if (visible) resto = resto.replace(/^-v\s*/i, "");

    const citado = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const texto = resto || textoDe(citado);
    if (!texto) return reply({ text: "⚙️ Uso: *.tagsubs <mensaje>* (o responde a un mensaje de texto).\nAñade *-v* para mostrar la lista de menciones." });
    if (difusionActiva()) return reply({ text: "⏳ Ya hay un envío en curso. Usa *.tagsubs estado* o *.tagsubs stop*." });

    await reply({ text: "📣 Enviando el aviso desde todos los subbots conectados... Te aviso cuando termine (es lento a propósito para evitar baneos)." });

    try {
      const r = await difundirSubbots(texto, {
        visible,
        alProgresar: (e) => reply({ text: `⏳ Progreso › enviados *${e.enviados}*, fallidos *${e.fallidos}*.` })
      });
      const min = Math.max(1, Math.round(r.duracionMs / 60000));
      const lineas = [
        `${r.cancelado ? "🛑" : "✅"} *AVISO ${r.cancelado ? "CANCELADO" : "ENVIADO"}*`,
        "",
        `Subbots:: *${r.subs}*`,
        `Enviados:: *${r.enviados}* de *${r.total}* grupos`,
        `Fallidos:: *${r.fallidos}*`,
        `Duración:: *${min} min*`
      ];
      if (r.errores.length) lineas.push("", "⚠️ *Primeros errores*", ...r.errores.slice(0, 5).map((x) => `• ${x}`));
      await reply({ text: lineas.join("\n") });
    } catch (e) {
      if (e.message === "sin_subbots") return reply({ text: "⚠️ No hay subbots conectados ahora mismo." });
      if (e.message === "ya_en_curso") return reply({ text: "⏳ Ya hay un envío en curso." });
      throw e;
    }
  })
};
