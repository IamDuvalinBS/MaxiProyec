import { metadatos, buscarBot, buscarParticipante } from "./nucleo.js";
import { usuarioEnLista } from "./estado.js";
import { isOwner } from "../../motores/owner.js";

// Borra el mensaje de un usuario silenciado con .ban. Devuelve true si lo pudo borrar.
// WhatsApp no permite silenciar a un solo miembro, así que el bot (siendo admin) le borra lo que escriba.
export async function borrarSiSilenciado(sock, msg, from, sender) {
  if (!usuarioEnLista(from, "silenciados", sender) || isOwner(sender)) return false;
  const meta = await metadatos(sock, from);
  if (!meta) return false;
  const bot = buscarBot(sock, meta);
  if (!bot || !bot.admin) return false;
  const participante = buscarParticipante(meta, sender);
  if (participante && participante.admin) return false;
  try {
    await sock.sendMessage(from, { delete: msg.key });
    return true;
  } catch (e) {
    return false;
  }
}

const avisos = new Map();

// Usuario con .banbot: no puede usar el bot en ese grupo. Avisa como máximo una vez por minuto.
export async function bloqueadoDelBot(sock, msg, from, sender, avisar = true) {
  if (!from.endsWith("@g.us") || msg.key.fromMe) return false;
  if (!usuarioEnLista(from, "sinBot", sender) || isOwner(sender)) return false;
  const clave = `${from}:${String(sender).split("@")[0]}`;
  const ahora = Date.now();
  if (avisar && (avisos.get(clave) || 0) < ahora - 60000) {
    avisos.set(clave, ahora);
    sock.sendMessage(from, { text: "🚫 Un admin te quitó el acceso al bot en este grupo." }, { quoted: msg }).catch(() => {});
  }
  return true;
}
