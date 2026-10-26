import { checkCooldown, getAccount, saveAccount } from "../../../motores/db.js";
import { solicitarCodigo, esSubbot, permisoCode, registrarUsoCode, canonico, mismoNumero, esNumeroValido, soloDigitos } from "../../subbots/gestor.js";
import { encabezado } from "../../economia/estilo.js";
import { enviarConBoton } from "../../../motores/botones.js";

const ESPERA_MS = 2 * 60 * 1000;

const ERRORES = {
  sin_mongo: "⚠️ El sistema de subbots no está disponible en este momento. Intenta nuevamente más tarde.",
  ya_existe: "⚠️ Este número ya tiene un subbot vinculado. Usa *.stopsub* si deseas eliminarlo.",
  limite: "⚠️ Se alcanzó el límite de subbots activos. Intenta nuevamente más tarde."
};

function textoBloqueo(permiso) {
  const lineas = [encabezado("🔒", "CODE - MISIÓN"), ""];
  if (permiso.motivo === "sin_vinculo") {
    lineas.push(
      "> Para pedir un código debes completar una misión en la página de nuestro patrocinador.",
      "",
      "// Entra a la página e inicia sesión.",
      "",
      "// Ve a *Mi perfil* › *Mi WhatsApp*, genera tu código y envíame *.vincular CÓDIGO*.",
      "",
      "// Entra a *Misiones*, completa tu misión y vuelve a usar *.code*."
    );
  } else if (permiso.motivo === "sin_mision") {
    lineas.push(
      "> Todavía no tienes una misión asignada.",
      "",
      "// Entra a *Misiones* en la página: ahí te sale tu misión del día. Complétala y vuelve a usar *.code*."
    );
  } else if (permiso.motivo === "mision") {
    lineas.push(
      `> Misión *${permiso.mi.nivel}*: ${permiso.mi.txt}`,
      "",
      `// Llevas *${Math.min(permiso.prog, permiso.mi.meta)}/${permiso.mi.meta}*.`,
      "",
      "// Completa la misión en la página y vuelve a usar *.code*."
    );
  } else if (permiso.motivo === "cooldown") {
    const h = Math.floor(permiso.resta / 3600000), m = Math.ceil((permiso.resta % 3600000) / 60000);
    lineas.push(
      "> Ya pediste un código hace poco.",
      "",
      `// Podrás pedir otro en *${h > 0 ? h + " h " : ""}${m} min*, con una misión distinta.`
    );
  } else if (permiso.motivo === "sin_pagina") {
    lineas.push("> La conexión con la página no está activa ahora mismo, así que no puedo revisar tu misión. Intenta más tarde.");
  } else {
    lineas.push("> No pude revisar tu misión en este momento. Intenta de nuevo en un momento.");
  }
  return lineas.join("\n");
}

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
  desc: "Genera un código para convertir tu número en un subbot (requiere completar la misión de la página)",
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

    const permiso = await permisoCode(sender);
    if (!permiso.ok) return reply({ text: textoBloqueo(permiso) });

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

    if (permiso.via === "mision") registrarUsoCode(permiso.uid, permiso.mision);   // la misión se gasta al entregar el código

    const privado = from.endsWith("@g.us") ? sender : from;
    const texto = textoCodigo(codigo);
    const enviado = await enviarConBoton({
      sock,
      from: privado,
      msg: privado === from ? msg : undefined,
      texto,
      footer: "Código de vinculación",
      boton: { texto: "Copiar código", copiar: codigo }
    });

    if (!enviado) {
      try {
        await sock.sendMessage(privado, { text: texto });
        await sock.sendMessage(privado, { text: codigo });
      } catch {
        return reply({ text: `${texto}\n\n*${codigo}*` });
      }
    }
    if (privado !== from) await reply({ text: "📩 Te envié el código de vinculación por privado." });

    pedido.conectado.then(async (ok) => {
      const textoFinal = ok
        ? "✅ Tu subbot quedó conectado. Ya puedes usar los comandos desde tu número. Para eliminarlo usa *.stopsub*."
        : "⚠️ No se completó la vinculación y el código venció. Usa *.code* para intentarlo de nuevo.";
      await sock.sendMessage(privado, { text: textoFinal }).catch(() => {});
    });
  }
};
