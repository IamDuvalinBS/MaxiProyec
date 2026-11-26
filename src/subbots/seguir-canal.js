import { config } from "../../motores/db.js";

// Hace que cada subbot vinculado siga automáticamente el canal oficial del bot (config.channelLink, el del menú).
// Se intenta una vez por subbot en cada arranque (unos segundos después de conectar); si falla se reintenta
// en la siguiente reconexión, hasta MAX_INTENTOS veces. Seguir un canal que ya se sigue es inofensivo.
const ESPERA_MS = 8000;
const MAX_INTENTOS = 3;
const intentos = new Map();   // numero -> intentos hechos
const hechos = new Set();     // numeros que ya siguen el canal
const enCurso = new Set();
let cache = { codigo: null, jid: null };
let avisado = false;

const codigoDe = (enlace) => String(enlace || "").match(/whatsapp\.com\/channel\/([\w-]+)/i)?.[1] || null;

async function resolverJid(sock, codigo) {
  if (cache.codigo === codigo && cache.jid) return cache.jid;
  const meta = await sock.newsletterMetadata("invite", codigo);
  if (!meta?.id) throw new Error("no se encontró el canal");
  cache = { codigo, jid: meta.id };
  return meta.id;
}

export function seguirCanalAuto(sock, numero) {
  if (hechos.has(numero) || enCurso.has(numero) || (intentos.get(numero) || 0) >= MAX_INTENTOS) return;
  const codigo = codigoDe(config.channelLink);
  if (!codigo) return;
  if (typeof sock.newsletterFollow !== "function" || typeof sock.newsletterMetadata !== "function") {
    if (!avisado) console.log("[subbots] Este Baileys no tiene newsletterFollow: no se puede seguir el canal automáticamente.");
    avisado = true;
    return;
  }
  enCurso.add(numero);
  const t = setTimeout(async () => {
    try {
      await sock.newsletterFollow(await resolverJid(sock, codigo));
      hechos.add(numero);
      console.log(`[subbot ${numero}] sigue el canal del bot`);
    } catch (e) {
      if (/already|subscribed|409|ya /i.test(String(e?.message))) hechos.add(numero);
      else {
        intentos.set(numero, (intentos.get(numero) || 0) + 1);
        console.log(`[subbot ${numero}] no pudo seguir el canal: ${e?.message || e}`);
      }
    } finally {
      enCurso.delete(numero);
    }
  }, ESPERA_MS + Math.floor(Math.random() * 4000));
  t.unref?.();
}
