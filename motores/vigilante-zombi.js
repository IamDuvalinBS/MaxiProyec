const REVISION_MS = 30000;
const SILENCIO_MAX_MS = 150000;
const PING_CADA_MS = 90000;
const PING_ESPERA_MS = 20000;
const SIN_ABRIR_MAX_MS = 120000;
const BUFFER_ATASCADO_MS = 60000;

function conTiempo(promesa, ms) {
  return Promise.race([promesa, new Promise((_, no) => setTimeout(() => no(new Error("sin respuesta")), ms))]);
}

export function vigilarVida(sock, etiqueta, reconectar) {
  const creado = Date.now();
  let abierto = false;
  let ultimaFrame = Date.now();
  let ultimoPing = 0;
  let pingsFallidos = 0;
  let bufferDesde = 0;
  let pingEnCurso = false;
  let terminado = false;

  const marcar = () => { ultimaFrame = Date.now(); };
  try { if (typeof sock.ws?.on === "function") sock.ws.on("frame", marcar); } catch {}

  sock.ev.on("connection.update", (u) => {
    if (u.connection === "open") { abierto = true; marcar(); }
    if (u.connection === "close") terminar();
  });

  function terminar() {
    terminado = true;
    clearInterval(reloj);
  }

  function pedirReconexion(motivo) {
    if (terminado) return;
    terminar();
    console.log(`[vigilante] (${etiqueta}) sesión zombie: ${motivo}. Reconectando...`);
    Promise.resolve(reconectar(motivo)).catch((e) => console.log(`[vigilante] error al reconectar: ${e.message}`));
  }

  const reloj = setInterval(async () => {
    if (terminado) return;
    const ahora = Date.now();

    if (!abierto) {
      if (ahora - creado > SIN_ABRIR_MAX_MS) pedirReconexion("la conexión nunca llegó a abrir");
      return;
    }

    if (ahora - ultimaFrame > SILENCIO_MAX_MS) return pedirReconexion(`sin tráfico de WhatsApp hace ${Math.round((ahora - ultimaFrame) / 1000)}s`);

    try {
      if (typeof sock.ev.isBuffering === "function" && sock.ev.isBuffering()) {
        if (!bufferDesde) bufferDesde = ahora;
        if (ahora - bufferDesde > BUFFER_ATASCADO_MS) {
          if (typeof sock.ev.flush === "function") { try { sock.ev.flush(); } catch {} }
          if (ahora - bufferDesde > BUFFER_ATASCADO_MS * 2) return pedirReconexion("eventos atascados en el búfer");
        }
      } else {
        bufferDesde = 0;
      }
    } catch {}

    if (!pingEnCurso && ahora - ultimoPing > PING_CADA_MS) {
      ultimoPing = ahora;
      pingEnCurso = true;
      try {
        await conTiempo(sock.query({ tag: "iq", attrs: { to: "s.whatsapp.net", type: "get", xmlns: "w:p" }, content: [{ tag: "ping" }] }), PING_ESPERA_MS);
        pingsFallidos = 0;
        marcar();
      } catch {
        pingsFallidos++;
        if (pingsFallidos >= 2) pedirReconexion("el ping a WhatsApp no responde");
      } finally {
        pingEnCurso = false;
      }
    }
  }, REVISION_MS);
  if (reloj.unref) reloj.unref();
}
