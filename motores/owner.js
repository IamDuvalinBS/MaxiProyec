import { config, saveConfig } from "./db.js";

// Owners fijos del bot (formato WhatsApp: numero@s.whatsapp.net). Para sumar otro, agregá su número acá.
const OWNERS_INICIALES = [
  "529613345733@s.whatsapp.net",
  "529613627169@s.whatsapp.net",
  "528719632704@s.whatsapp.net"
];

if (!config.owners) config.owners = [];
for (const jid of OWNERS_INICIALES) {
  if (!config.owners.includes(jid)) config.owners.push(jid);
}

export function isOwner(sender) {
  return (config.owners || []).includes(sender);
}

export async function addOwner(nuevoJid) {
  if (!config.owners) config.owners = [];
  if (config.owners.includes(nuevoJid)) return false;
  config.owners.push(nuevoJid);
  await saveConfig();
  return true;
}

// Envuelve un handler para que SOLO los owners puedan usarlo.
// Uso: handler: ownerCommand(async (ctx) => { ... })
export function ownerCommand(handler) {
  return async (ctx) => {
    if (!isOwner(ctx.sender)) {
      await ctx.reply({ text: "🚫 Este comando solo puede ser utilizado por owners." });
      return;
    }
    return handler(ctx);
  };
}
