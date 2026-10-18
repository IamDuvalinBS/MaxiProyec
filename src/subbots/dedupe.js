const reclamados = new Map();
const VIGENCIA_MS = 120000;
const LIMITE = 400;
const ESPERA_SUB_GRUPO_MS = 1500;

function limpiar(ahora) {
  if (reclamados.size < LIMITE) return;
  for (const [clave, momento] of reclamados) {
    if (ahora - momento > VIGENCIA_MS) reclamados.delete(clave);
  }
}

export async function reclamarMensaje(msg, esSub) {
  const clave = `${msg.key.remoteJid}|${msg.key.id}`;
  const ahora = Date.now();
  limpiar(ahora);

  if (!esSub) {
    if (reclamados.has(clave)) return false;
    reclamados.set(clave, ahora);
    return true;
  }

  if (reclamados.has(clave)) return false;
  if (msg.key.remoteJid.endsWith("@g.us")) {
    await new Promise((resolver) => setTimeout(resolver, ESPERA_SUB_GRUPO_MS));
    if (reclamados.has(clave)) return false;
  }
  reclamados.set(clave, Date.now());
  return true;
}
