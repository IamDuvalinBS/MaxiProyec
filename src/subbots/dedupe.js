const reclamados = new Map();
const VIGENCIA_MS = 120000;
const LIMITE = 400;
const ESPERA_SUB_GRUPO_MS = Number(process.env.ESPERA_SUB_GRUPO_MS) || 1500;
let idsPrincipal = new Set();
let gruposPrincipal = null;

// Números/IDs del bot principal: sirven para saber si un subbot está viendo un chat con el principal.
export function fijarPrincipal(user) {
  idsPrincipal = new Set([user?.id, user?.lid].filter(Boolean).map((j) => String(j).split("@")[0].split(":")[0]));
}

export function fijarGruposPrincipal(lista) {
  gruposPrincipal = lista && lista.length ? new Set(lista) : null;
}

export function principalEstaEn(grupo) {
  return !gruposPrincipal || gruposPrincipal.has(grupo);
}

function limpiar(ahora) {
  if (reclamados.size < LIMITE) return;
  for (const [clave, momento] of reclamados) {
    if (ahora - momento <= VIGENCIA_MS) break;
    reclamados.delete(clave);
  }
}

export function reclamarConteo(msg) {
  const clave = `c|${msg.key.remoteJid}|${msg.key.id}`;
  limpiar(Date.now());
  if (reclamados.has(clave)) return false;
  reclamados.set(clave, Date.now());
  return true;
}

export async function reclamarMensaje(msg, esSub) {
  const clave = `${msg.key.remoteJid}|${msg.key.id}`;
  const claveId = `id|${msg.key.id}`;   // el mismo mensaje tiene el mismo id en el chat del emisor y del receptor
  const ahora = Date.now();
  limpiar(ahora);

  if (!esSub) {
    if (gruposPrincipal && msg.key.remoteJid.endsWith("@g.us")) gruposPrincipal.add(msg.key.remoteJid);
    if (reclamados.has(clave)) return false;
    reclamados.set(clave, ahora);
    if (!msg.key.fromMe) reclamados.set(claveId, ahora);
    return true;
  }

  if (reclamados.has(clave)) return false;
  // Un subbot ve como "fromMe" lo que su dueño escribe; si el bot principal ya recibió ese mismo mensaje (porque el
  // dueño le escribió al bot), el subbot no debe contestarlo también.
  // En el chat propio o con otras personas el principal no ve el mensaje, así que no hace falta esperar.
  const conPrincipal = msg.key.fromMe && idsPrincipal.has(msg.key.remoteJid.split("@")[0].split(":")[0]);
  const esGrupo = msg.key.remoteJid.endsWith("@g.us");
  const espera = conPrincipal || (esGrupo && principalEstaEn(msg.key.remoteJid));
  if (espera) {
    await new Promise((resolver) => setTimeout(resolver, ESPERA_SUB_GRUPO_MS));
    if (reclamados.has(clave) || (msg.key.fromMe && reclamados.has(claveId))) return false;
  }
  reclamados.set(clave, Date.now());
  return true;
}
