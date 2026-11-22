// Detecta a quién va dirigido un comando: mención (@usuario), respuesta a un mensaje o "@número" escrito a mano.
// Sin imports a propósito: lo usan casi todos los comandos y no debe arrastrar dependencias.

const ENVOLTURAS = [
  "ephemeralMessage",
  "viewOnceMessage",
  "viewOnceMessageV2",
  "viewOnceMessageV2Extension",
  "documentWithCaptionMessage",
  "deviceSentMessage",
  "editedMessage"
];

// Saca el contenido real del mensaje (chats con mensajes temporales, ver una vez, etc.).
export function contenidoDe(msg) {
  let c = msg?.message;
  for (let i = 0; i < 5 && c; i++) {
    const interno = ENVOLTURAS.map((k) => c[k]?.message).find(Boolean);
    if (!interno) break;
    c = interno;
  }
  return c || null;
}

// contextInfo del mensaje (texto, foto con texto, video con texto, etc.). Siempre devuelve un objeto.
export function contextoDe(msg) {
  const c = contenidoDe(msg);
  if (!c) return {};
  if (c.extendedTextMessage?.contextInfo) return c.extendedTextMessage.contextInfo;
  for (const valor of Object.values(c)) {
    if (valor && typeof valor === "object" && valor.contextInfo) return valor.contextInfo;
  }
  return {};
}

export function textoDe(msg) {
  const c = contenidoDe(msg) || {};
  return c.conversation || c.extendedTextMessage?.text || c.imageMessage?.caption || c.videoMessage?.caption || "";
}

// Primera persona etiquetada con @ (o null).
export function jidMencionado(msg) {
  const lista = contextoDe(msg).mentionedJid;
  return (Array.isArray(lista) && lista.find(Boolean)) || null;
}

// Autor del mensaje al que se está respondiendo (o null).
export function jidCitado(msg) {
  const ctx = contextoDe(msg);
  return ctx.quotedMessage && ctx.participant ? ctx.participant : null;
}

// "@5491122334455" escrito a mano (WhatsApp no lo convierte en mención si el contacto no está guardado).
function jidEscrito(msg) {
  const m = textoDe(msg).match(/(?:^|\s)@\+?(\d{8,15})(?=\s|$)/);
  return m ? `${m[1]}@s.whatsapp.net` : null;
}

// Orden: 1) @mención  2) respuesta a un mensaje  3) @número escrito. Si no hay nada, null.
export function jidObjetivo(msg) {
  return jidMencionado(msg) || jidCitado(msg) || jidEscrito(msg) || null;
}
