/**
 * Envío genérico de mensajes interactivos (nativeFlow) para @fer2809fl/baileys.
 * Sirve para cualquier botón: quick_reply, cta_url, cta_copy, cta_call, send_location,
 * cta_reminder, open_webview, single_select... y para carruseles.
 *
 * botones: [{ name: "cta_url", params: { display_text: "Abrir", url: "https://..." } }]
 * Devuelve true si se envió, false si falló.
 */
import crypto from "crypto";

let libreria;

async function cargarLibreria() {
  if (libreria !== undefined) return libreria;
  try {
    const modulo = await import("@fer2809fl/baileys");
    const lib = modulo.default && typeof modulo.default === "object" ? { ...modulo, ...modulo.default } : modulo;
    libreria = lib.proto && lib.generateWAMessageFromContent ? lib : null;
  } catch (e) {
    console.log(`[botones-nativos] La librería de WhatsApp no está disponible: ${e.message}`);
    libreria = null;
  }
  return libreria;
}

// Nodo "biz": sin él, algunos clientes (sobre todo en grupos) muestran "mensaje no compatible".
export const NODO_BIZ = {
  tag: "biz",
  attrs: {},
  content: [{
    tag: "interactive",
    attrs: { type: "native_flow", v: "1" },
    content: [{ tag: "native_flow", attrs: { v: "9", name: "mixed" } }]
  }]
};

async function subirImagen(lib, sock, imagen) {
  if (!imagen || !lib.prepareWAMessageMedia) return null;
  try {
    return await lib.prepareWAMessageMedia({ image: imagen }, { upload: sock.waUploadToServer });
  } catch (e) {
    console.log(`[botones-nativos] No se pudo subir la imagen: ${e.message}`);
    return null;
  }
}

async function retransmitir(lib, sock, from, msg, interactiveMessage) {
  const contenido = {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2,
          messageSecret: crypto.randomBytes(32)
        },
        interactiveMessage
      }
    }
  };
  const armado = await lib.generateWAMessageFromContent(from, contenido, { userJid: sock.user?.id, quoted: msg });
  await sock.relayMessage(from, armado.message, { messageId: armado.key.id, additionalNodes: [NODO_BIZ] });
}

export async function enviarNativeFlow({ sock, from, msg, texto, footer, imagen, botones, mentions = [] }) {
  if (typeof sock.sendMixedButtons === "function") {
    try {
      await sock.sendMixedButtons(from, texto, botones, {
        footer,
        quoted: msg,
        ...(imagen ? { image: imagen } : {}),
        ...(mentions.length ? { mentions, contextInfo: { mentionedJid: mentions } } : {})
      });
      return true;
    } catch (e) {
      console.log(`[botones-nativos] Falló sendMixedButtons: ${e.message}`);
    }
  }

  const lib = await cargarLibreria();
  if (!lib) return false;

  try {
    let header = { title: "", subtitle: "", hasMediaAttachment: false };
    const media = await subirImagen(lib, sock, imagen);
    if (media) header = { title: "", subtitle: "", hasMediaAttachment: true, ...media };

    const interactiveMessage = {
      body: { text: texto },
      footer: { text: footer || "" },
      header,
      nativeFlowMessage: {
        buttons: botones.map((b) => ({ name: b.name, buttonParamsJson: JSON.stringify(b.params || {}) })),
        messageParamsJson: ""
      }
    };
    if (mentions.length) interactiveMessage.contextInfo = { mentionedJid: mentions };

    await retransmitir(lib, sock, from, msg, interactiveMessage);
    return true;
  } catch (e) {
    console.log(`[botones-nativos] No se pudo enviar: ${e.stack || e.message}`);
    return false;
  }
}

const SIGNATURE_B64 =
  "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC44LVZlcmlmaWNhdGlvblNpZ25hdHVyZS5NZXRhZGF0YXcJdgmzQZeb4w==";
const CERT_CHAIN_B64 = [
  "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"
];

const FIRMA_BOT = Buffer.from(SIGNATURE_B64, "base64");
const CADENA_BOT = CERT_CHAIN_B64.map((item) => Buffer.from(item, "base64"));
const JID_BOT = "867051314767696@bot";
const URL_HTML = "https://astabot.hidenplay.net";
const FUENTES_HTML = ["astabot.hidenplay.net", "unpkg.com", "cdn.jsdelivr"];

/**
 * Envía un HTML interactivo embebido (mini-app), igual que los comandos de juego.
 * Devuelve true si se envió y false si no se pudo, para que el llamador ponga su respaldo.
 */
export async function enviarHtmlEmbebido({ sock, from, msg, titulo, html, pestana = "ABRIR", url = URL_HTML, fuentes = FUENTES_HTML }) {
  if (process.env.GACHA_HTML_EMBEBIDO === "0") return false;
  if (!html || !from || typeof sock?.relayMessage !== "function") return false;

  const responseId = `AstaHtml_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const data = {
    response_id: responseId,
    sections: [{
      __typename: "GenAIUnifiedResponseSection",
      view_model: {
        __typename: "GenAISingleLayoutViewModel",
        primitive: { __typename: "GenAIBotProgressStatusPrimitive", title: titulo, is_in_progress: true }
      }
    }],
    embedded_screens: [{
      title: titulo,
      content: [{
        __typename: "FOAIDNixelButtonSheets",
        tabs: [{
          id: "tab_0",
          tab_header: pestana,
          sections: [{
            __typename: "GenAIUnifiedResponseSection",
            view_model: {
              __typename: "GenAISingleLayoutViewModel",
              primitive: { __typename: "GenAIaeacdsnwHtmlPrimitive", payload: html, url, trusted_sources: fuentes }
            }
          }],
          step_entries: []
        }]
      }]
    }]
  };

  const messageId =
    typeof sock.generateMessageTag === "function"
      ? await sock.generateMessageTag()
      : crypto.randomBytes(8).toString("hex").toUpperCase();

  try {
    await sock.relayMessage(
      from,
      {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2,
          botMetadata: {
            messageDisclaimerText: "",
            botResponseId: responseId,
            verificationMetadata: {
              proofs: [{ version: 1, useCase: 1, signature: FIRMA_BOT, certificateChain: CADENA_BOT }]
            }
          }
        },
        botForwardedMessage: {
          message: {
            richResponseMessage: {
              messageType: 1,
              unifiedResponse: { data: Buffer.from(JSON.stringify(data)) },
              contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedAiBotMessageInfo: { botJid: JID_BOT },
                forwardOrigin: 4
              }
            }
          }
        }
      },
      { messageId }
    );
    return true;
  } catch (e) {
    console.log(`[botones-nativos] El HTML embebido falló: ${e.stack || e.message}`);
    return false;
  }
}
/**
 * Tarjeta con botón que abre un HTML publicado. Estilo Meta AI: texto corto + botón.
 * siguiente: texto del comando de la página siguiente, o null.
 */
export async function enviarBotonHtml({ sock, from, msg, texto, footer, titulo, url, siguiente }) {
  if (!url) return false;
  const botones = [
    { name: "cta_url", params: { display_text: "Abrir colección", url, merchant_url: url } }
  ];
  if (siguiente) {
    botones.push({ name: "quick_reply", params: { display_text: "Siguiente ▶", id: siguiente } });
  }
  return enviarNativeFlow({ sock, from, msg, texto, footer: footer || titulo || "", botones });
}
