import { isOwner } from "../../motores/owner.js";

export const ERROR_PREMIUM = "PREMIUM_BLOQUEADO";
export const MENSAJE_PREMIUM = "💎 Este sticker es *premium*. No se puede descargar ni convertir.";

export const esPremium = (stickerMessage) => Number(stickerMessage?.premium) > 0;

// Solo los owners (o el propio bot) pueden descargar stickers premium.
export function puedeDescargarPremium(msg, sender) {
  if (msg?.key?.fromMe) return true;
  const quien = sender || msg?.key?.participant || msg?.key?.remoteJid;
  return isOwner(quien);
}

export function exigirAccesoPremium(stickerMessage, msg, sender) {
  if (esPremium(stickerMessage) && !puedeDescargarPremium(msg, sender)) {
    throw new Error(ERROR_PREMIUM);
  }
}
