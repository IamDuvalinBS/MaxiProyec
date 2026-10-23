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
