import { aviso, metadatos, buscarParticipante, buscarBot, enlaceDeGrupo, codigoPropio, numeroDe } from "./nucleo.js";
import { isOwner } from "../../motores/owner.js";

const PATRON_ENLACE = /chat\.whatsapp\.com\/([A-Za-z0-9]{20,24})/i;
const ESPERA_AVISO_MS = 15 * 1000;
const ultimoAviso = new Map();

export async function eliminarEnlace(sock, msg, grupo, sender, texto) {
  const coincidencia = PATRON_ENLACE.exec(texto);
  if (!coincidencia) return false;

  const meta = await metadatos(sock, grupo);
  if (!meta) return false;

  const bot = buscarBot(sock, meta);
  if (!bot || !bot.admin) return false;

  const autor = buscarParticipante(meta, sender);
  if ((autor && autor.admin) || isOwner(sender)) return false;

  if (!codigoPropio(grupo)) await enlaceDeGrupo(sock, grupo);
  if (codigoPropio(grupo) === coincidencia[1]) return false;

  try {
    await sock.sendMessage(grupo, { delete: msg.key });
  } catch (e) {
    return false;
  }

  const ahora = Date.now();
  if (ahora - (ultimoAviso.get(grupo) || 0) > ESPERA_AVISO_MS) {
    ultimoAviso.set(grupo, ahora);
    const texto = aviso("🛡️", "ANTILINK", `Se eliminó un enlace de otro grupo enviado por @${numeroDe(sender)}.\n\n> Los enlaces externos no están permitidos en este grupo.`);
    await sock.sendMessage(grupo, { text: texto, mentions: [sender] }).catch(() => {});
  }
  return true;
}
