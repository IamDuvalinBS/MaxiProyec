import fs from "fs";
import path from "path";
import { isOwner } from "./owner.js";

const NUMEROS_FIJOS = ["529613345733", "529613627169", "528719632704", "155345393565872"];
const ARCHIVO = path.resolve("./data/owners-gacha.txt");

export const numeroDe = (jid) => String(jid || "").split("@")[0].split(":")[0].replace(/\D/g, "");

function numerosExtra() {
  const lista = [];
  try {
    if (fs.existsSync(ARCHIVO)) lista.push(...fs.readFileSync(ARCHIVO, "utf8").split(/\r?\n/));
  } catch {}
  lista.push(...String(process.env.GACHA_OWNERS || "").split(","));
  return lista.map((x) => x.replace(/\D/g, "")).filter(Boolean);
}

export function esOwnerGacha(sender) {
  try { if (isOwner(sender)) return true; } catch {}
  const n = numeroDe(sender);
  return !!n && (NUMEROS_FIJOS.includes(n) || numerosExtra().includes(n));
}

export function ownerGacha(handler) {
  return async (ctx) => {
    if (!esOwnerGacha(ctx.sender)) {
      return ctx.reply({ text: "🚫 Este comando solo puede ser utilizado por owners.\n\nSi sos owner, consulta tu ID con *.miid*." });
    }
    return handler(ctx);
  };
}
