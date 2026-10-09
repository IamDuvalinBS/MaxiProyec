/**
 * Envío de mensajes con botones de respuesta rápida para @fer2809fl/baileys (7.0.7+).
 * Misma firma que antes: enviarConBotonesRapidos({ sock, from, msg, texto, footer, botones,
 * mentions, imagen, vistaPrevia, esperar }) -> true si se envió, false si falló.
 *
 * Camino principal: sock.sendMessage(jid, { interactiveButtons }) del fork, que arma el mensaje
 * igual que el propio fork (con messageSecret, el quoted bien resuelto y el nodo biz).
 * Respaldo: armado manual con generateWAMessageFromContent + relayMessage (también con messageSecret).
 */
import crypto from "crypto";

let libreria;

async function cargarLibreria() {
  if (libreria !== undefined) return libreria;

  try {
    const modulo = await import("@fer2809fl/baileys");
    const lib = modulo.default && typeof modulo.default === "object"
      ? { ...modulo, ...modulo.default }
      : modulo;

    libreria = lib.proto && lib.generateWAMessageFromContent ? lib : null;
  } catch (e) {
    console.log(`[botones-rapidos] La librería de WhatsApp no está disponible: ${e.message}`);
    libreria = null;
  }

  return libreria;
}

function armarContextInfo(mentions, vistaPrevia) {
  const contextInfo = {};

  if (mentions?.length) contextInfo.mentionedJid = mentions;

  if (vistaPrevia) {
    contextInfo.externalAdReply = {
      title: vistaPrevia.title,
      body: vistaPrevia.body,
      mediaType: 1,
      thumbnail: vistaPrevia.thumbnail,
      renderLargerThumbnail: false,
      showAdAttribution: false,
      sourceUrl: vistaPrevia.sourceUrl
    };
  }

  return Object.keys(contextInfo).length ? contextInfo : undefined;
}

export async function enviarConBotonesRapidos({
  sock,
  from,
  msg,
  texto,
  footer,
  botones,
  mentions = [],
  imagen,
  vistaPrevia,
  esperar
}) {
  const contextInfo = armarContextInfo(mentions, vistaPrevia);

  // ── 1) Camino principal: método nativo del fork ──
  if (typeof sock.sendQuickReplyButtons === "function") {
    try {
      if (esperar) {
        try { await esperar; } catch (e) {}
      }

      const extra = {
        footer,
        quoted: msg,
        preview: false,
        ...(imagen ? { image: imagen } : {}),
        ...(contextInfo ? { contextInfo } : {})
      };

      await sock.sendQuickReplyButtons(
        from,
        texto,
        botones.map((b) => ({ text: b.texto, id: b.id })),
        extra
      );

      return true;
    } catch (e) {
      console.log(`[botones-rapidos] Falló sendQuickReplyButtons: ${e.stack || e.message}`);
    }
  }

  // ── 2) Respaldo: armado manual ──
  const lib = await cargarLibreria();
  if (!lib) return false;

  try {
    let header = { title: "", subtitle: "", hasMediaAttachment: false };

    if (imagen && lib.prepareWAMessageMedia) {
      try {
        const media = await lib.prepareWAMessageMedia(
          { image: imagen },
          { upload: sock.waUploadToServer }
        );

        header = { title: "", subtitle: "", hasMediaAttachment: true, ...media };
      } catch (e) {
        console.log(`[botones-rapidos] No se pudo subir la foto del encabezado: ${e.message}`);
      }
    }

    const interactiveMessage = {
      body: { text: texto },
      footer: { text: footer || "" },
      header,
      nativeFlowMessage: {
        buttons: botones.map((boton) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({
            display_text: boton.texto,
            id: boton.id
          })
        }))
      }
    };

    if (contextInfo) interactiveMessage.contextInfo = contextInfo;

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

    // Baileys guarda el usuario en sock.user.id (no existe sock.user.jid)
    const armado = await lib.generateWAMessageFromContent(from, contenido, {
      userJid: sock.user?.id,
      quoted: msg
    });

    if (esperar) {
      try { await esperar; } catch (e) {}
    }

    await sock.relayMessage(from, armado.message, {
      messageId: armado.key.id
    });

    return true;
  } catch (e) {
    console.log(`[botones-rapidos] No se pudo enviar el mensaje con botones: ${e.stack || e.message}`);
    return false;
  }
}
