import fs from "fs";
import path from "path";
import { getAccount, saveAccount, getAllAccounts } from "./db.js";

const PERFILES_DIR = "./perfiles";
if (!fs.existsSync(PERFILES_DIR)) fs.mkdirSync(PERFILES_DIR);

export function getProfile(sender) {
  const acc = getAccount(sender);
  if (!acc.profile) {
    acc.profile = {
      name: "",
      birthday: "",
      hobby: "",
      bio: "",
      marriedTo: "",
      marriedSince: "",
      favGame: "",
      gender: "",
      level: 1,
      xp: 0
    };
  }
  if (acc.profile.xp === undefined) acc.profile.xp = 0;
  return acc.profile;
}

// Devuelve el cónyuge de `jid`. Si su perfil no lo tiene anotado pero el del
// otro sí apunta a él, lo recupera y repara el perfil (matrimonio de un solo lado).
export function getConyuge(jid) {
  const p = getProfile(jid);
  if (p.marriedTo) return p.marriedTo;

  for (const [otro, acc] of getAllAccounts()) {
    if (otro !== jid && acc.profile && acc.profile.marriedTo === jid) {
      p.marriedTo = otro;
      p.marriedSince = acc.profile.marriedSince || "";
      saveAccount(jid);
      return otro;
    }
  }
  return "";
}

export function addXp(sender, amount) {
  const p = getProfile(sender);
  p.xp = (p.xp || 0) + amount;
  let required = p.level * 100;
  let leveledUp = false;
  while (p.xp >= required) {
    p.xp -= required;
    p.level += 1;
    leveledUp = true;
    required = p.level * 100;
  }
  saveAccount(sender);
  return { leveledUp, newLevel: p.level, xpGanada: amount };
}

export function pfpPath(sender) {
  const safe = sender.replace(/[^a-zA-Z0-9]/g, "_");
  return path.join(PERFILES_DIR, `${safe}.jpg`);
}

export function recordarNombre(sender, pushName) {
  const p = getProfile(sender);
  if (!p.name && pushName) {
    p.name = pushName;
    saveAccount(sender);
  }
}

export const GENEROS = {
  masculino: { nombre: "Hombre", terminacion: "o" },
  femenino: { nombre: "Mujer", terminacion: "a" },
  gay: { nombre: "Gay", terminacion: "o" },
  lesbiana: { nombre: "Lesbiana", terminacion: "a" }
};

const SINONIMOS_GENERO = {
  hombre: "masculino", masculino: "masculino", varon: "masculino", varón: "masculino", h: "masculino",
  mujer: "femenino", femenino: "femenino", m: "femenino",
  gay: "gay",
  lesbiana: "lesbiana", lesbi: "lesbiana"
};

export function normalizarGenero(texto) {
  return SINONIMOS_GENERO[String(texto || "").trim().toLowerCase()] || "";
}

export function generoDe(jid) {
  const g = getProfile(jid).gender;
  return GENEROS[g] ? g : "";
}

export function nombreGenero(jid) {
  const g = generoDe(jid);
  return g ? GENEROS[g].nombre : "";
}

// "o" / "a" según el género guardado. Sin género devuelve `sinGenero` ("x" en el perfil, "o" en el resto de comandos).
export function terminacionDe(jid, sinGenero = "o") {
  const g = generoDe(jid);
  return g ? GENEROS[g].terminacion : sinGenero;
}

// Plural para una pareja: "as" si ambas son femeninas, "os" si hay algún masculino, y `sinGenero` + "s" si falta algún género.
export function terminacionPareja(a, b, sinGenero = "o") {
  const ta = terminacionDe(a, "");
  const tb = terminacionDe(b, "");
  if (ta === "a" && tb === "a") return "as";
  if (!ta || !tb) return sinGenero + "s";
  return "os";
}
