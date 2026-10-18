import { checkCooldown } from "../../../motores/db.js";
import { solicitarCodigo, esSubbot } from "../../subbots/gestor.js";

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

    const argumento = (cleanText.split(/\s+/)[1] || "").replace(/\D/g, "");
    const propio = sender.endsWith("@s.whatsapp.net") ? sender.split("@")[0].split(":")[0] : null;
    const numero = propio || argumento;

    if (!numero || numero.length < 8 || numero.length > 15) {
      return reply({ text: "⚙️ Uso: *.code <tu número con código de país>*\nEjemplo: *.code 5215512345678*" });
    }
    if (propio && argumento && argumento !== propio) {
      return reply({ text: "⚠️ Solo puedes vincular tu propio número." });
    }

    const espera = checkCooldown(sender, "code", ESPERA_MS);
    if (espera > 0) {
      return reply({ text: `⏳ Espera ${Math.ceil(espera / 1000)} segundos antes de solicitar otro código.` });
    }

    let pedido;
    try {
      pedido = await solicitarCodigo(numero, sender);
    } catch (e) {
      return reply({ text: ERRORES[e.message] || "❌ No se pudo generar el código. Intenta nuevamente." });
    }

    let codigo;
    try {
      codigo = await pedido.codigo;
    } catch {
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
