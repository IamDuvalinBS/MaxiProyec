import { checkCooldown, getAccount, saveAccount } from "../../../motores/db.js";
import { solicitarCodigo, esSubbot, canonico, mismoNumero, esNumeroValido, soloDigitos } from "../../subbots/gestor.js";

const ESPERA_MS = 2 * 60 * 1000;

const ERRORES = {
  sin_mongo: "⚠️ El sistema de subbots no está disponible en este momento. Intenta nuevamente más tarde.",
  ya_existe: "⚠️ Este número ya tiene un subbot vinculado. Usa *.stopsub* si deseas eliminarlo.",
  limite: "⚠️ Se alcanzó el límite de subbots activos. Intenta nuevamente más tarde."
};

export default {
  names: [".code", ".subbot"],
  usage: ".code",
  desc: "Genera un código para convertir tu número en un subbot",
  category: "Subbots",
  handler: async ({ sock, from, sender, cleanText, msg, reply }) => {
    if (esSubbot(sock)) return reply({ text: "⚠️ Este comando solo puede utilizarse desde el bot principal." });

    // Acepta "+52 1 55 1234 5678", "(55) 1234-5678", 5215512345678, 525512345678, etc.
    const argumento = canonico(cleanText.replace(/^\S+\s*/, ""));
    // Con el sistema nuevo de WhatsApp (LID / usuarios) el remitente puede no traer número: en ese caso se pide.
    const propio = sender.endsWith("@s.whatsapp.net") ? canonico(sender) : null;
    const numero = propio || argumento;

    if (!numero || !esNumeroValido(numero)) {
      const sinNumero = sender.endsWith("@lid") ? "\n\nℹ️ Tu cuenta usa el sistema nuevo de WhatsApp y no puedo ver tu número automáticamente, escríbelo tú." : "";
      return reply({ text: "⚙️ Uso: *.code <tu número>*\nEjemplos: *.code 5512345678*, *.code 525512345678* o *.code 5215512345678*" + sinNumero });
    }
    if (propio && soloDigitos(cleanText.replace(/^\S+\s*/, "")) && !mismoNumero(argumento, propio)) {
      return reply({ text: "⚠️ Solo puedes vincular tu propio número." });
    }

    const espera = checkCooldown(sender, "code", ESPERA_MS);
    if (espera > 0) {
      return reply({ text: `⏳ Espera ${Math.ceil(espera / 1000)} segundos antes de solicitar otro código.` });
    }
    const liberarEspera = () => {   // si falla, no se castiga con 2 minutos de espera
      try { getAccount(sender).cooldowns.code = 0; saveAccount(sender); } catch {}
    };

    let pedido;
    try {
      pedido = await solicitarCodigo(numero, sender);
    } catch (e) {
      liberarEspera();
      return reply({ text: ERRORES[e.message] || "❌ No se pudo generar el código. Verifica que el número esté bien escrito e intenta nuevamente." });
    }

    let codigo;
    try {
      codigo = await pedido.codigo;
    } catch {
      liberarEspera();
      return reply({ text: "❌ No se pudo generar el código. Intenta nuevamente." });
    }

    const privado = from.endsWith("@g.us") ? sender : from;
    const instrucciones = [
      "🤖 *CÓDIGO DE SUBBOT*",
      "",
      "1. Abre WhatsApp en el número que vas a vincular.",
      "2. Ve a *Dispositivos vinculados* › *Vincular con el número de teléfono*.",
      "3. Escribe el código que te envío en el siguiente mensaje.",
      "",
      "⏳ El código vence en 2 minutos."
    ].join("\n");

    try {
      await sock.sendMessage(privado, { text: instrucciones });
      await sock.sendMessage(privado, { text: codigo });
      if (privado !== from) await reply({ text: "📩 Te envié el código de vinculación por privado." });
    } catch {
      await reply({ text: `${instrucciones}\n\n*${codigo}*` });
    }

    pedido.conectado.then(async (ok) => {
      const texto = ok
        ? "✅ Tu subbot quedó conectado. Ya puedes usar los comandos desde tu número. Para eliminarlo usa *.stopsub*."
        : "⚠️ No se completó la vinculación y el código venció. Usa *.code* para intentarlo de nuevo.";
      await sock.sendMessage(privado, { text: texto }).catch(() => {});
    });
  }
};
