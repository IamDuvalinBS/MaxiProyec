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

/**
 * Carrusel: tarjetas deslizables.
 * tarjetas: [{ titulo, texto, footer, imagen, botones: [{ name, params }] }]
 */
export async function enviarCarrusel({ sock, from, msg, texto, footer, tarjetas }) {
  const lib = await cargarLibreria();
  if (!lib) return false;

  try {
    const cards = [];
    for (const t of tarjetas) {
      const media = await subirImagen(lib, sock, t.imagen);
      cards.push({
        header: media
          ? { title: t.titulo || "", subtitle: "", hasMediaAttachment: true, ...media }
          : { title: t.titulo || "", subtitle: "", hasMediaAttachment: false },
        body: { text: t.texto || "" },
        footer: { text: t.footer || "" },
        nativeFlowMessage: {
          buttons: (t.botones || []).map((b) => ({ name: b.name, buttonParamsJson: JSON.stringify(b.params || {}) })),
          messageParamsJson: ""
        }
      });
    }

    const interactiveMessage = {
      body: { text: texto || "" },
      footer: { text: footer || "" },
      header: { title: "", subtitle: "", hasMediaAttachment: false },
      carouselMessage: { cards, messageVersion: 1 }
    };

    await retransmitir(lib, sock, from, msg, interactiveMessage);
    return true;
  } catch (e) {
    console.log(`[botones-nativos] No se pudo enviar el carrusel: ${e.stack || e.message}`);
    return false;
  }
}
