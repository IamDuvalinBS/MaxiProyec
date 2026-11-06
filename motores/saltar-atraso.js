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

const DEPURAR = process.env.DEPURAR_ATRASO === "1";
let vistos = 0;

function confirmar(sock, nodo) {
  const a = nodo.attrs;
  const ack = { tag: "ack", attrs: { id: a.id, to: a.from, class: "message" } };
  if (a.participant) ack.attrs.participant = a.participant;
  if (a.recipient) ack.attrs.recipient = a.recipient;
  Promise.resolve(sock.sendNode(ack)).catch(() => {});
}

// Reemplaza los oyentes de "CB:message*" de Baileys por versiones que revisan el mensaje antes de descifrarlo.
export function saltarAtrasoViejo(sock, etiqueta = "principal") {
  if (!ACTIVO) return;
  const ws = sock && sock.ws;
  if (!ws || typeof ws.eventNames !== "function") {
    console.log(`[atraso] (${etiqueta}) no se pudo activar: sock.ws no es un emisor de eventos`);
    return;
  }
  let envueltos = 0;
  for (const evento of ws.eventNames()) {
    if (typeof evento !== "string" || !evento.startsWith("CB:message")) continue;
    const originales = ws.listeners(evento);
    ws.removeAllListeners(evento);
    for (const original of originales) {
      envueltos++;
      ws.on(evento, (nodo, ...resto) => {
        try {
          if (DEPURAR && vistos < 10 && nodo && nodo.attrs) {
            vistos++;
            console.log(`[atraso] visto ${evento} attrs=${JSON.stringify({ ...nodo.attrs, from: undefined, participant: undefined })}`);
          }
          if (esViejoDelAtraso(nodo)) {
            if (evento === "CB:message") {
              confirmar(sock, nodo);
              resumir(Math.round(Date.now() / 1000 - Number(nodo.attrs.t)));
            }
            return;
          }
        } catch (e) {
          console.log("[atraso] error, se deja pasar el mensaje: " + e.message);
        }
        return original(nodo, ...resto);
      });
    }
  }
  console.log(`[atraso] (${etiqueta}) activo, oyentes enganchados: ${envueltos}`);
}
