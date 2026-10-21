import { tieneAfk, desactivarAfk, textoSalidaAfk } from "./afk.js";
import { botApagado } from "../grupos/estado.js";

// Claves que WhatsApp mete en el mensaje pero que NO son actividad del usuario.
// Ojo: senderKeyDistributionMessage y messageContextInfo suelen venir PRIMERO en el objeto,
// por eso no se puede mirar solo Object.keys(msg.message)[0].
const NO_ES_ACTIVIDAD = new Set([
  "senderKeyDistributionMessage",
  "messageContextInfo",
  "protocolMessage"
]);

function hayActividad(message) {
  return Object.keys(message || {}).some((k) => !NO_ES_ACTIVIDAD.has(k));
}

function textoDe(message) {
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.documentMessage?.caption ||
    message.documentWithCaptionMessage?.message?.documentMessage?.caption ||
    ""
  ).trim();
}

function esComandoAfk(texto, prefijos) {
  const prefijo = [...prefijos].sort((a, b) => b.length - a.length).find((p) => texto.startsWith(p));
  return Boolean(prefijo) && /^\s*afk(\s|$)/i.test(texto.slice(prefijo.length));
}

// Listener independiente: corre ANTES de cualquier filtro del handler principal
// (botones, antilink, bot apagado, etc.), así que nada lo puede saltar.
export function enlazarSalidaAfk(sock, obtenerPrefijos) {
  sock.ev.on("messages.upsert", async (m) => {
    if (m.type !== "notify") return;
    for (const msg of m.messages || []) {
      try {
        await revisarMensaje(sock, msg, obtenerPrefijos());
      } catch (e) {
        console.log("Error en salida automática de AFK: " + e.message);
      }
    }
  });
}

async function revisarMensaje(sock, msg, prefijos) {
  if (!msg?.message || msg.key.fromMe) return;
  if (!hayActividad(msg.message)) return;

  const from = msg.key.remoteJid;
  if (!from) return;
  const esEstado = from === "status@broadcast";
  if (!esEstado && from.endsWith("@broadcast")) return;
  if (from.endsWith("@newsletter")) return;

  const sender = esEstado ? msg.key.participant : (msg.key.participant || from);
  if (!sender || !tieneAfk(sender)) return;

  if (esComandoAfk(textoDe(msg.message), prefijos)) return; // .afk se encarga solo

  const esGrupo = from.endsWith("@g.us");
  if (esGrupo && botApagado(from)) return;

  // se desactiva de forma síncrona (antes de cualquier await) para no pagar dos veces
  const datos = desactivarAfk(sender);

  // el aviso va al chat donde se puso AFK; si es un estado o un AFK viejo, al chat actual
  const destino = esEstado ? datos.chat : from;
  if (!destino) return;
  await sock.sendMessage(
    destino,
    { text: textoSalidaAfk(sender, datos), mentions: [sender] },
    esEstado ? undefined : { quoted: msg }
  );
}
