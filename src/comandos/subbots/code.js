import { checkCooldown, getAccount, saveAccount } from "../../../motores/db.js";
import { solicitarCodigo, canonico, mismoNumero, esNumeroValido, soloDigitos } from "../../subbots/gestor.js";
import { encabezado } from "../../economia/estilo.js";
import { enviarConBoton } from "../../../motores/botones.js";

const ESPERA_MS = 30 * 1000;

const ERRORES = {
  sin_mongo: "⚠️ El sistema de subbots no está disponible en este momento. Intenta nuevamente más tarde.",
  ya_existe: "⚠️ Este número ya tiene un subbot vinculado. Usa *.stopsub* si deseas eliminarlo.",
  limite: "⚠️ Se alcanzó el límite de subbots activos. Intenta nuevamente más tarde."
};

function textoCodigo(codigo) {
  return [
    encabezado("✨", "CODE - VINCULACIÓN"),
    "",
    "> Sigue estos pasos para conectar tu socket a través de tú número.",
    "",
    "// Usa *.code* para crear un código, y luego *copea el código.*",
    "",
    "// *Vete a la sección principal de tú WhatsApp* (en la parte donde está tus chats o grupos).",
    "",
    "// Presiona  *⋮* (en la parte superior derecho)",
    "",
    "// Te aparecerá varias opciones, toca *Dispositivos Vinculados.*",
    "",
    "// Toca *Vincular Dispositivo*  - luego *Vincular con el número del teléfono.*",
    "",
    "// Pega el código que copiaste *(primer paso)*",
    "",
    `⧼🔑⧽ *Código*:: \`\`\`${codigo}\`\`\``,
    "> ⏳ El código vence en 2 minutos."
  ].join("\n");
}

export default {
  names: [".code", ".subbot"],
  usage: ".code <tu número>",
  desc: "Genera un código para convertir tu número en un subbot (libre, sin requisitos)",
  category: "Subbots",
  handler: async ({ sock, from, sender, cleanText, msg, reply }) => {
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


    const destino = from;
    const texto = textoCodigo(codigo);

    try {
      await sock.sendMessage(destino, { text: texto }, { quoted: msg });
    } catch {
      await reply({ text: `${texto}\n\n*${codigo}*` });
    }

    await enviarConBoton({
      sock,
      from: destino,
      msg,
      texto: "📋 Si tu WhatsApp lo permite, toca el botón para copiar el código.",
      footer: "Código de vinculación",
      boton: { texto: "Copiar código", copiar: codigo }
    });

    pedido.conectado.then(async (ok) => {
      if (ok === null) return;
      const textoFinal = ok
        ? "✅ Tu subbot quedó conectado. Ya puedes usar los comandos desde tu número. Para eliminarlo usa *.stopsub*."
        : "⚠️ No se completó la vinculación y el código venció. Usa *.code* para intentarlo de nuevo.";
      await sock.sendMessage(destino, { text: textoFinal }).catch(() => {});
    });
  }
};
