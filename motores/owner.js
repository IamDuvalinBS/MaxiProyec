import fs from "fs";
import path from "path";
import { idCanonico } from "./db.js";

// ════════════════════════════════════════════════════════════════════════════
//  QUIÉN ES QUIÉN
//  • DUEÑOS: el rango más alto. Pueden usar TODO (comandos de dueños y de owners).
//  • OWNERS: rango medio. Pueden usar los comandos de owners, no los exclusivos de dueños.
//  Qué comandos son de dueños y cuáles de owners se elige en: src/comandos/bot/ownermenu.js
//
//  Cada persona se escribe con su ID (el que te muestra .miid). Da igual si lo pones como número
//  (@s.whatsapp.net) o como ID interno (@lid). Los números de México se reconocen con o sin el "1" (521… / 52…).
//  También se pueden agregar sin tocar el código con las líneas de data/duenos.txt, data/owners.txt,
//  o las variables de entorno DUENOS_EXTRA y OWNERS_EXTRA (números separados por coma).
// ════════════════════════════════════════════════════════════════════════════
export const DUENOS = [
  "5219613627169@s.whatsapp.net", // Yo
  "155345393565872@lid",          // Yo (ID interno)
  "573019409307@s.whatsapp.net", // Dueño (tú)
  "188639879372966@lid",         // Dueño (tu ID interno)
  "528719632704@s.whatsapp.net", // Dueño (Amorchito)
  "529613345733@s.whatsapp.net"  // Antiguo owner (¿número del bot?). Bórrala si no debe ser dueño
];

export const OWNERS = [
  // "5210000000000@s.whatsapp.net", // ← aquí van los owners
];

const ARCHIVOS_DUENOS = [path.resolve("./data/duenos.txt")];
const ARCHIVOS_OWNERS = [path.resolve("./data/owners.txt"), path.resolve("./data/owners-gacha.txt")];

// Un mismo número de México llega como 5219611234567 (con el 1 de celular) o como 529611234567 (sin el 1),
// según el chat. Se compara siempre sin ese 1 para que ambos cuenten como la misma persona.
export function normalizarNumero(texto) {
  const n = String(texto || "").replace(/\D/g, "");
  return /^521\d{10}$/.test(n) ? `52${n.slice(3)}` : n;
}

const soloNumero = (jid) => normalizarNumero(String(jid || "").split("@")[0].split(":")[0]);

function numerosExtra(archivos, variable) {
  const nums = [];
  for (const archivo of archivos) {
    try {
      if (fs.existsSync(archivo)) nums.push(...fs.readFileSync(archivo, "utf8").split(/\r?\n/));
    } catch {}
  }
  nums.push(...String(process.env[variable] || "").split(","));
  return nums.map(normalizarNumero).filter(Boolean);
}

function coincide(sender, jids, extras) {
  if (!sender) return false;
  if (jids.includes(sender)) return true;
  const canonico = idCanonico(sender);
  if (jids.some((jid) => idCanonico(jid) === canonico)) return true;
  const n = soloNumero(sender);
  if (!n) return false;
  return jids.some((jid) => soloNumero(jid) === n) || extras.includes(n);
}

export function isDueno(sender) {
  return coincide(sender, DUENOS, numerosExtra(ARCHIVOS_DUENOS, "DUENOS_EXTRA"));
}

// Owner = tiene rango de owner O de dueño (un dueño siempre puede lo que puede un owner).
export function isOwner(sender) {
  return isDueno(sender) || coincide(sender, OWNERS, numerosExtra(ARCHIVOS_OWNERS, "OWNERS_EXTRA"));
}

// "dueno" | "owner" | null
export function rangoDe(sender) {
  if (isDueno(sender)) return "dueno";
  return isOwner(sender) ? "owner" : null;
}

// Envuelve un handler para que SOLO los owners (y dueños) puedan usarlo.
export function ownerCommand(handler) {
  return async (ctx) => {
    if (!isOwner(ctx.sender)) {
      await ctx.reply({ text: "🚫 Este comando solo puede ser utilizado por owners." });
      return;
    }
    return handler(ctx);
  };
}

