import crypto from "crypto";

const LIBRERIAS = ["@fer2809fl/baileys", "@whiskeysockets/baileys"];

let libCache;

async function cargarLib() {
  if (libCache !== undefined) return libCache;
  libCache = null;
  for (const nombre of LIBRERIAS) {
    try {
      const mod = await import(nombre);
      const lib = mod.default && typeof mod.default === "object" ? { ...mod, ...mod.default } : mod;
      if (lib.proto && lib.generateWAMessageFromContent) {
        libCache = lib;
        break;
      }
    } catch (e) {
      console.log(`[botones] ${nombre} no disponible: ${e.message}`);
    }
  }
  return libCache;
}

export const NODO_BIZ = {
  tag: "biz",
  attrs: {},
  content: [{
    tag: "interactive",
    attrs: { type: "native_flow", v: "1" },
    content: [{ tag: "native_flow", attrs: { v: "9", name: "mixed" } }]
  }]
};

const convertir = (b) =>
  b.copiar
    ? { name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: b.texto, copy_code: b.copiar }) }
    : { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: b.texto, url: b.url, merchant_url: b.url }) };

async function armarEncabezado(lib, sock, { video, gif, foto }) {
  const vacio = { title: "", subtitle: "", hasMediaAttachment: false };
  if (video && lib.prepareWAMessageMedia) {
    const media = await lib.prepareWAMessageMedia({ video, gifPlayback: !!gif }, { upload: sock.waUploadToServer });
    return { ...vacio, hasMediaAttachment: true, videoMessage: media.videoMessage };
  }
  if (foto && lib.prepareWAMessageMedia) {
    try {
      const media = await lib.prepareWAMessageMedia({ image: foto }, { upload: sock.waUploadToServer });
      return { ...vacio, hasMediaAttachment: true, imageMessage: media.imageMessage };
    } catch (e) {
      console.log("[botones] No se pudo subir la imagen del encabezado: " + e.message);
    }
  }
  return vacio;
}

export async function enviarConBoton({ sock, from, msg, texto, footer, foto, video, gif, boton, lista, mentions = [] }) {
  const lib = await cargarLib();
  if (!lib) return false;

  try {
    const header = await armarEncabezado(lib, sock, { video, gif, foto });
    const botones = (Array.isArray(lista) && lista.length ? lista : boton ? [boton] : []).map(convertir);

    const interactiveMessage = {
      body: { text: texto },
      footer: { text: footer || "" },
      header,
      nativeFlowMessage: { buttons: botones, messageParamsJson: "" }
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
    await sock.relayMessage(from, armado.message, { messageId: armado.key.id, additionalNodes: [NODO_BIZ] });
    return true;
  } catch (e) {
    console.log("[botones] No se pudo enviar el mensaje con botones: " + (e.stack || e.message));
    return false;
  }
}
