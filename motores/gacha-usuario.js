import { recargarGacha } from "./gacha-db.js";

const ESPERA_RECARGA_MS = 60 * 1000;
let ultimaRecarga = 0;

const limpiarJid = (jid) => (typeof jid === "string" ? jid.replace(/:\d+(?=@)/, "") : "");

export function candidatosDeUsuario(sock, msg, sender) {
  const k = msg?.key || {};
  const crudos = k.fromMe
    ? [sender, sock.user?.id, sock.user?.lid, sock.user?.jid]
    : [sender, k.participant, k.participantAlt, k.participantPn, k.remoteJidAlt, k.remoteJid];
  return [...new Set(crudos.map(limpiarJid).filter((j) => j && !j.endsWith("@g.us") && !j.endsWith("@broadcast")))];
}

function elegir(candidatos, contar) {
  let mejor = { usuario: candidatos[0], n: 0 };
  for (const usuario of candidatos) {
    const n = contar(usuario);
    if (n > mejor.n) mejor = { usuario, n };
  }
  return mejor;
}

export async function buscarUsuarioConDatos(candidatos, contar, etiqueta = "gacha") {
  let mejor = elegir(candidatos, contar);
  if (mejor.n) return mejor.usuario;

  if (Date.now() - ultimaRecarga > ESPERA_RECARGA_MS) {
    ultimaRecarga = Date.now();
    try {
      await recargarGacha();
      mejor = elegir(candidatos, contar);
    } catch (e) {
      console.log(`[${etiqueta}] no se pudo recargar el gacha: ${e.message}`);
    }
  }
  return mejor.usuario;
}
