import crypto from "crypto";

let libreria;

async function cargarLibreria() {
  if (libreria !== undefined) return libreria;
  try {
    const modulo = await import("@fer2809fl/baileys");
    const lib = modulo.default && typeof modulo.default === "object" ? { ...modulo, ...modulo.default } : modulo;
    libreria = lib.proto && lib.generateWAMessageFromContent ? lib : null;
  } catch (e) {
    console.log(`[lista] La librería de WhatsApp no está disponible: ${e.message}`);
    libreria = null;
  }
  return libreria;
}

export async function enviarLista({ sock, from, msg, texto, footer, imagen, boton = "📋 Lista", secciones, mentions = [] }) {
  const params = {
    title: boton,
    sections: secciones.map((s) => ({
      title: s.titulo,
      rows: s.filas.map((f) => ({ header: "", title: f.titulo, description: f.descripcion || "", id: f.id }))
    }))
  };

  if (typeof sock.sendMixedButtons === "function") {
    try {
      await sock.sendMixedButtons(from, texto, [{ name: "single_select", params }], {
        footer,
        quoted: msg,
        ...(imagen ? { image: imagen } : {}),
        ...(mentions.length ? { mentions, contextInfo: { mentionedJid: mentions } } : {})
      });
      return true;
    } catch (e) {
      console.log(`[lista] Falló sendMixedButtons: ${e.stack || e.message}`);
    }
  }

  const lib = await cargarLibreria();
  if (!lib) return false;

  try {
    let header = { title: "", subtitle: "", hasMediaAttachment: false };
    if (imagen && lib.prepareWAMessageMedia) {
      try {
        const media = await lib.prepareWAMessageMedia({ image: imagen }, { upload: sock.waUploadToServer });
        header = { title: "", subtitle: "", hasMediaAttachment: true, ...media };
      } catch (e) {
        console.log(`[lista] No se pudo subir la imagen del encabezado: ${e.message}`);
      }
    }

    const interactiveMessage = {
      body: { text: texto },
      footer: { text: footer || "" },
      header,
      nativeFlowMessage: {
        buttons: [{ name: "single_select", buttonParamsJson: JSON.stringify(params) }],
        messageParamsJson: ""
      }
    };
    if (mentions.length) interactiveMessage.contextInfo = { mentionedJid: mentions };

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
    await sock.relayMessage(from, armado.message, { messageId: armado.key.id });
    return true;
  } catch (e) {
    console.log(`[lista] No se pudo enviar la lista: ${e.stack || e.message}`);
    return false;
  }
}
