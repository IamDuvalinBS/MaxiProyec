import fs from "fs";
import path from "path";
import { config, saveConfig } from "./db.js";

// Owners fijos del bot (formato WhatsApp: numero@s.whatsapp.net).
const OWNERS_INICIALES = [
  "529613345733@s.whatsapp.net",
  "529613627169@s.whatsapp.net",
  "528719632704@s.whatsapp.net",
  "155345393565872@lid"
];

// Owners extra SIN tocar el código: un número por línea en data/owners.txt (o data/owners-gacha.txt).
// Sirve también para los IDs internos @lid que WhatsApp usa en algunos grupos (mirá el tuyo con .miid).
// Se lee en cada consulta, así que no hace falta reiniciar el bot.
//   Ejemplo (Termux, dentro de la carpeta del bot):  echo "123456789012345" >> data/owners.txt
const ARCHIVOS_EXTRA = [path.resolve("./data/owners.txt"), path.resolve("./data/owners-gacha.txt")];

// "5216...:12@s.whatsapp.net" / "12345@lid" -> solo los dígitos del número
const soloNumero = (jid) => String(jid || "").split("@")[0].split(":")[0].replace(/\D/g, "");

function numerosExtra() {
  const nums = [];
  for (const archivo of ARCHIVOS_EXTRA) {
    try {
      if (fs.existsSync(archivo)) nums.push(...fs.readFileSync(archivo, "utf8").split(/\r?\n/));
    } catch {}
  }
  nums.push(...String(process.env.OWNERS_EXTRA || "").split(","));
  return nums.map((x) => x.replace(/\D/g, "")).filter(Boolean);
}

if (!config.owners) config.owners = [];
for (const jid of OWNERS_INICIALES) {
  if (!config.owners.includes(jid)) config.owners.push(jid);
}

export function isOwner(sender) {
  const lista = config.owners || [];
  if (lista.includes(sender)) return true;
  const n = soloNumero(sender);
  if (!n) return false;
  // mismo número aunque cambie el sufijo de dispositivo (":12") o el dominio
  if (lista.some((jid) => soloNumero(jid) === n)) return true;
  return numerosExtra().includes(n);
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
