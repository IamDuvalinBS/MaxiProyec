// Salta el atraso que WhatsApp reenvía al reconectar: los mensajes marcados como "offline" y con más antigüedad que el
// límite se confirman (ack) sin descifrarlos, así no se forma la fila y lo nuevo se responde enseguida.
// Se apaga con SALTAR_ATRASO=0. El límite es el mismo que usa index.js (MAX_ANTIGUEDAD_MENSAJE_SEG, 60 s por defecto).
const ACTIVO = process.env.SALTAR_ATRASO !== "0";
const LIMITE_MS = (Number(process.env.MAX_ANTIGUEDAD_MENSAJE_SEG) || 60) * 1000;

let saltados = 0;
let maxEdad = 0;
let temporizador = null;

function resumir(edadSeg) {
  saltados++;
  if (edadSeg > maxEdad) maxEdad = edadSeg;
  if (temporizador) return;
  temporizador = setTimeout(() => {
    console.log(`[atraso] ${saltados} mensajes viejos saltados sin descifrar (más antiguo: ${maxEdad}s)`);
    saltados = 0;
    maxEdad = 0;
    temporizador = null;
  }, 5000);
}

function esViejoDelAtraso(nodo) {
  const a = nodo && nodo.attrs;
  if (!a || nodo.tag !== "message" || a.offline === undefined) return false;
  if (a.category === "peer") return false;            // mensajes entre dispositivos propios (claves de sincronización)
  const t = Number(a.t);
  if (!t) return false;
  return Date.now() - t * 1000 > LIMITE_MS;
}

export function saltarAtrasoViejo(sock) {
  if (!ACTIVO || !sock || !sock.ws || typeof sock.ws.emit !== "function") return;
  const emitir = sock.ws.emit.bind(sock.ws);
  sock.ws.emit = (evento, ...args) => {
    try {
      if (typeof evento === "string" && evento.startsWith("CB:message")) {
        const nodo = args[0];
        if (esViejoDelAtraso(nodo)) {
          if (evento === "CB:message") {   // un mismo mensaje se emite con varios nombres: se confirma una sola vez
            const a = nodo.attrs;
            const ack = { tag: "ack", attrs: { id: a.id, to: a.from, class: "message" } };
            if (a.participant) ack.attrs.participant = a.participant;
            if (a.recipient) ack.attrs.recipient = a.recipient;
            sock.sendNode(ack).catch(() => {});
            resumir(Math.round(Date.now() / 1000 - Number(a.t)));
          }
          return true;                     // no llega al descifrado de Baileys
        }
      }
    } catch (e) {
      console.log("[atraso] error, se deja pasar el mensaje: " + e.message);
    }
    return emitir(evento, ...args);
  };
}
