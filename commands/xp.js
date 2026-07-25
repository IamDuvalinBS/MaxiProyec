import { getAccount, addToWallet, saveAccount, checkCooldown, CURRENCY } from "./db.js";
import { box, formatTime } from "./ui.js";
import { getProfile, addXp } from "./profile.js";

// runWorkOnce hace el calculo puro (cooldown + premio/perdida + XP) sin mandar mensajes.
// La usan tanto el comando individual (workCommand) como el .allw para reclamar todo junto.
export function runWorkOnce(sender, { key, cooldownMs, minReward, maxReward, riesgo, frases }) {
  const wait = checkCooldown(sender, key, cooldownMs);
  if (wait > 0) return { onCooldown: true, wait };

  const acc = getAccount(sender);
  const exito = !riesgo || Math.random() > riesgo.chanceFallo;

  if (exito) {
    const pool = frases && frases.exito;
    let fraseTexto, min, max;
    if (pool && typeof pool[0] === "object") {
      const item = pool[Math.floor(Math.random() * pool.length)];
      fraseTexto = item.text;
      min = item.min;
      max = item.max;
    } else {
      fraseTexto = null;
      min = minReward;
      max = maxReward;
    }
    const gano = Math.floor(Math.random() * (max - min + 1)) + min;
    addToWallet(sender, gano);

    // XP automatica: 1 XP cada 10 de plata ganada (minimo 1).
    const xpGanada = Math.max(1, Math.round(gano / 10));
    const { leveledUp, newLevel } = addXp(sender, xpGanada);

    return { onCooldown: false, exito: true, monto: gano, fraseTexto, xpGanada, leveledUp, newLevel };
  } else {
    const poolFallo = frases && frases.fallo;
    let fraseTexto, perdio;
    if (poolFallo && typeof poolFallo[0] === "object") {
      const item = poolFallo[Math.floor(Math.random() * poolFallo.length)];
      fraseTexto = item.text;
      perdio = Math.min(acc.wallet, Math.floor(Math.random() * (item.max - item.min + 1)) + item.min);
    } else {
      fraseTexto = null;
      perdio = riesgo.perdidaTotal
        ? acc.wallet
        : Math.min(acc.wallet, Math.floor(Math.random() * riesgo.maxPerdida) + riesgo.minPerdida);
    }
    acc.wallet -= perdio;
    saveAccount(sender);
    return { onCooldown: false, exito: false, monto: perdio, fraseTexto, xpGanada: 0, leveledUp: false, newLevel: getProfile(sender).level };
  }
}

export function workCommand(opts) {
  const handler = async ({ sender, reply }) => {
    const r = runWorkOnce(sender, opts);
    const { frases } = opts;

    if (r.onCooldown) {
      return reply({ text: `⏳ Ya usaste este comando. Esperá *${formatTime(r.wait)}*.` });
    }
    if (r.exito) {
      const frase = r.fraseTexto || frases.exito[Math.floor(Math.random() * frases.exito.length)];
      let texto = opts.renderExito
        ? opts.renderExito({ frase, monto: r.monto, xp: r.xpGanada })
        : box(frases.titulo, [frase, `🪙 GANASTE  ›› *${r.monto} ${CURRENCY}*`, `✨ XP  ›› *+${r.xpGanada}*`]);
      texto = texto.replace(/EXPERIENCIA\*?\s*››\s*`?\+0`?/i, `EXPERIENCIA* ›› \`+${r.xpGanada}\``);
      await reply({ text: texto });
      if (r.leveledUp) {
        await reply({ text: `🎉 *¡SUBISTE DE NIVEL!* Ahora sos nivel *${r.newLevel}*` });
      }
    } else {
      const frase = r.fraseTexto || frases.fallo[Math.floor(Math.random() * frases.fallo.length)];
      const texto = opts.renderFallo
        ? opts.renderFallo({ frase, monto: r.monto, xp: 0 })
        : box(frases.tituloFallo || frases.titulo, [frase, `💸 PERDISTE  ›› *${r.monto} ${CURRENCY}*`]);
      await reply({ text: texto });
    }
  };
  handler.config = opts;
  return handler;
    }

