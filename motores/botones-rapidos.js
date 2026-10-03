let libreria;

async function cargarLibreria() {
  if (libreria !== undefined) return libreria;
  try {
    const modulo = await import("@fer2809fl/baileys");
    const lib = modulo.default && typeof modulo.default === "object" ? { ...modulo, ...modulo.default } : modulo;
    libreria = lib.proto && lib.generateWAMessageFromContent ? lib : null;
  } catch (e) {
    console.log(`[botones-rapidos] La librería de WhatsApp no está disponible: ${e.message}`);
    libreria = null;
  }
  return libreria;
}

export async function enviarConBotonesRapidos({ sock, from, msg, texto, footer, botones, mentions = [] }) {
  const lib = await cargarLibreria();
  if (!lib) return false;

  try {
    const interactiveMessage = {
      body: { text: texto },
      footer: { text: footer },
      header: { title: "", hasMediaAttachment: false },
      nativeFlowMessage: {
        buttons: botones.map((boton) => ({
          name: "quick_reply",
          buttonParamsJson: JSON.stringify({ display_text: boton.texto, id: boton.id })
        })),
        messageParamsJson: ""
      },
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
    console.log(`[botones-rapidos] No se pudo enviar el mensaje con botones: ${e.message}`);
    return false;
  }
}
