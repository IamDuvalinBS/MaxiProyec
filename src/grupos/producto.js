import crypto from "crypto";

let libreria;

async function cargarLibreria() {
  if (libreria !== undefined) return libreria;
  for (const nombre of ["@fer2809fl/baileys", "@whiskeysockets/baileys"]) {
    try {
      const modulo = await import(nombre);
      const lib = modulo.default && typeof modulo.default === "object" ? { ...modulo, ...modulo.default } : modulo;
      if (lib.proto && lib.generateWAMessageFromContent && lib.prepareWAMessageMedia) {
        libreria = lib;
        return libreria;
      }
    } catch (e) {
      continue;
    }
  }
  libreria = null;
  return libreria;
}

/**
 * Manda un mensaje con formato de "producto" (tarjeta de cuenta de empresa):
 * imagen grande arriba con el título, y debajo el texto completo.
 * Devuelve true si se envió, false si no (para usar un respaldo).
 */
export async function enviarProducto(sock, jid, { imagen, titulo, descripcion = "", texto, footer = "", mentions = [], quoted }) {
  const lib = await cargarLibreria();
  if (!lib || !Buffer.isBuffer(imagen)) return false;

  try {
    const media = await lib.prepareWAMessageMedia({ image: imagen }, { upload: sock.waUploadToServer });

    const interactiveMessage = {
      body: { text: texto },
      footer: { text: footer },
      header: {
        title: titulo,
        hasMediaAttachment: true,
        productMessage: {
          product: {
            productImage: media.imageMessage,
            productId: String(Date.now()),
            title: titulo,
            description: descripcion,
            currencyCode: "USD",
            priceAmount1000: 0,
            retailerId: titulo,
            url: "",
            productImageCount: 1
          },
          businessOwnerJid: "0@s.whatsapp.net"
        }
      },
      nativeFlowMessage: { buttons: [] },
      contextInfo: { mentionedJid: mentions }
    };

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

    const armado = await lib.generateWAMessageFromContent(jid, contenido, { userJid: sock.user?.id, quoted });
    await sock.relayMessage(jid, armado.message, { messageId: armado.key.id });
    return true;
  } catch (e) {
    console.log(`No se pudo enviar el mensaje tipo producto: ${e.stack || e.message}`);
    return false;
  }
}
