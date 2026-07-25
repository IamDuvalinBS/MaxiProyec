import { config, saveConfig } from "./db.js";

// Numero inicial del dueño del bot (formato WhatsApp: numero@s.whatsapp.net)
const OWNER_INICIAL = "529613345733@s.whatsapp.net";

if (!config.owners) config.owners = [OWNER_INICIAL];
if (!config.owners.includes(OWNER_INICIAL)) config.owners.push(OWNER_INICIAL);

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
