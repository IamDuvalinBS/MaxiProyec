import fs from "fs";
import path from "path";
import { getAccount, saveAccount } from "./db.js";

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

// Sube experiencia y sube de nivel automaticamente si corresponde.
// Formula: la xp necesaria para el siguiente nivel es: nivel actual * 100
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
