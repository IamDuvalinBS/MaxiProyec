

let libCache;

async function cargarLib() {
  if (libCache !== undefined) return libCache;
  try {
    const mod = await import("@fer2809fl/baileys");
    const lib = mod.default && typeof mod.default === "object" ? { ...mod, ...mod.default } : mod;
    libCache = lib.proto && lib.generateWAMessageFromContent ? lib : null;
  } catch (e) {
    console.log("[botones] @fer2809fl/baileys no disponible: " + e.message);
    libCache = null;
  }
  return libCache;
}

export async function enviarConBoton({ sock, from, msg, texto, footer, foto, boton, mentions = [] }) {
  const lib = await cargarLib();
  if (!lib) return false;

  try {
    let header = { title: "", hasMediaAttachment: false };
    if (foto && lib.prepareWAMessageMedia) {
      try {
        const media = await lib.prepareWAMessageMedia({ image: foto }, { upload: sock.waUploadToServer });
        header = { title: "", hasMediaAttachment: true, imageMessage: media.imageMessage };
      } catch (e) {
        console.log("[botones] No se pudo subir la imagen del encabezado: " + e.message);
      }
    }

    const botones = boton
      ? [
          boton.copiar
            ? {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({ display_text: boton.texto, copy_code: boton.copiar })
              }
            : {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({ display_text: boton.texto, url: boton.url, merchant_url: boton.url })
              }
        ]
      : [];

    const interactiveMessage = {
      body: { text: texto },
      footer: { text: footer },
      header,
      nativeFlowMessage: { buttons: botones, messageParamsJson: "" },
      contextInfo: { mentionedJid: mentions }
    };

    const contenido = lib.proto.Message.fromObject({
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage
        }
      }
    });

    const opciones = { userJid: sock.user?.jid, quoted: msg };
    if (lib.WA_DEFAULT_EPHEMERAL) opciones.ephemeralExpiration = lib.WA_DEFAULT_EPHEMERAL;

    const armado = await lib.generateWAMessageFromContent(from, contenido, opciones);
    await sock.relayMessage(from, armado.message, { messageId: armado.key.id });
    return true;
  } catch (e) {
    console.log("[botones] No se pudo enviar el mensaje con botones: " + e.message);
    return false;
  }
}
