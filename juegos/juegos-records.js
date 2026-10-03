// motores/juegos-records.js
// Records de los juegos HTML + premio en ¥enes cuando superas tu mejor puntaje.
// - En MongoDB solo se guardan DATOS (mejor puntaje por usuario y juego), nunca partidas.
// - El HTML no puede hablar con el bot, asi que al perder muestra un boton/comando
//   ".puntaje <sesion> <puntos>" que el jugador envia. El bot lo valida antes de pagar.
import crypto from "crypto";
import { MongoClient } from "mongodb";
import { addToWallet, CURRENCY } from "./db.js";

// ===== AJUSTA LA ECONOMIA AQUI =====
// tasa: ¥enes por cada punto NUEVO sobre tu record | tope: maximo por cada record
// maxPts(seg): puntos maximos humanamente posibles en `seg` segundos (anti-trampa)
export const JUEGOS = {
  dino:      { nombre: "Dino Run",   tasa: 2,   tope: 5000, maxPts: (s) => 45 * s + 30 },
  neondodge: { nombre: "Neon Dodge", tasa: 2,   tope: 5000, maxPts: (s) => 70 * s + 60 },
  colorrush: { nombre: "Color Rush", tasa: 0.5, tope: 5000, maxPts: (s) => { const n = 3 * s + 3; return 10 * n + n * n * 1.4; } },
};
const VIGENCIA_SESION_MS = 6 * 60 * 60 * 1000;
// ====================================

const sesiones = new Map(); // id -> { sender, juego, t0 }

function limpiarSesiones() {
  const ahora = Date.now();
  for (const [id, s] of sesiones) if (ahora - s.t0 > VIGENCIA_SESION_MS) sesiones.delete(id);
}

export function crearSesion(sender, juego) {
  limpiarSesiones();
  const id = crypto.randomBytes(4).toString("hex");
  sesiones.set(id, { sender, juego, t0: Date.now() });
  return id;
}

let col = null, conexion = null;
async function coleccion() {
  if (col) return col;
  if (!process.env.MONGO_URI) throw new Error("falta MONGO_URI");
  if (!conexion) {
    conexion = (async () => {
      const cliente = new MongoClient(process.env.MONGO_URI, { maxPoolSize: 1 });
      await cliente.connect();
      col = cliente.db("whatsappbot").collection("juegos_records");
      return col;
    })().catch((e) => { conexion = null; throw e; });
  }
  return conexion;
}

// Devuelve { ok, texto }
export async function reclamar(sender, id, puntos) {
  const s = sesiones.get(id);
  if (!s) return { ok: false, texto: "❌ Sesión inválida o vencida. Escribe el comando del juego otra vez." };
  if (s.sender !== sender) return { ok: false, texto: "❌ Esa sesión no es tuya." };
  const cfg = JUEGOS[s.juego];
  const score = Math.floor(Number(puntos));
  if (!cfg || !Number.isFinite(score) || score < 1) return { ok: false, texto: "❌ Puntaje inválido." };
  const seg = (Date.now() - s.t0) / 1000;
  if (score > cfg.maxPts(seg)) return { ok: false, texto: "🚫 Ese puntaje no es posible en el tiempo que llevas jugando." };

  let c;
  try { c = await coleccion(); } catch (e) {
    console.log("[RECORDS] Mongo no disponible: " + e.message);
    return { ok: false, texto: "⚠️ No pude guardar tu récord ahora (base de datos no disponible)." };
  }
  const _id = `${sender}|${s.juego}`;
  const doc = await c.findOne({ _id });
  const anterior = doc?.mejor || 0;
  if (score <= anterior) {
    return { ok: true, texto: `🎮 *${cfg.nombre}*: hiciste ${score}, tu récord sigue en *${anterior}*. ¡Inténtalo otra vez!` };
  }
  const premio = Math.max(1, Math.min(cfg.tope, Math.floor((score - anterior) * cfg.tasa)));
  try {
    await c.updateOne(
      { _id, mejor: anterior },
      { $set: { jid: sender, juego: s.juego, mejor: score, actualizado: new Date() }, $inc: { premios: premio } },
      { upsert: !doc }
    );
  } catch (e) {
    if (e.code === 11000) return { ok: true, texto: "⚠️ Ese récord ya estaba registrado." };
    console.log("[RECORDS] error guardando: " + e.message);
    return { ok: false, texto: "⚠️ No pude guardar tu récord, intenta de nuevo." };
  }
  addToWallet(sender, premio);
  return {
    ok: true,
    texto: `🏆 *¡NUEVO RÉCORD en ${cfg.nombre}!*\n${anterior ? `Antes: ${anterior} → Ahora: *${score}*` : `Primer récord: *${score}* puntos`}\n💰 El bot te dio *${premio.toLocaleString()} ${CURRENCY}*`,
  };
}

// Envia el juego. En grupos lo manda al privado de quien lo pidio.
export async function lanzarJuegoHTML({ sock, from, sender, msg, reply, juego, html }) {
  if (typeof sock.sendHtml !== "function") {
    await reply({ text: "❌ Este Baileys no tiene sendHtml." });
    return;
  }
  const sid = crearSesion(sender, juego);
  const bot = (sock.user?.id || "").split(":")[0].split("@")[0];
  const final = html.replaceAll("__SID__", sid).replaceAll("__BOT__", bot);
  const enGrupo = from.endsWith("@g.us");
  try {
    await sock.sendHtml(enGrupo ? sender : from, final, [], undefined, {});
    if (enGrupo) {
      await reply({ text: `📩 @${sender.split("@")[0]}, te envié *${JUEGOS[juego]?.nombre || juego}* por privado para no interrumpir el grupo.`, mentions: [sender] });
    }
  } catch (e) {
    console.log(`[${juego}] ERROR enviando: ${e.stack}`);
    if (enGrupo) {
      try { await sock.sendHtml(from, final, [], undefined, {}); return; } catch {}
    }
    await sock.sendMessage(from, { text: "❌ No se pudo enviar el juego: " + e.message }, { quoted: msg });
  }
}
