import { mejorDe } from "./gacha-db.js";
import { getAccount, addToWallet } from "./db.js";
import { registrarEspera } from "../src/nucleo/espera.js";
import { encabezado } from "../src/economia/estilo.js";
import { statsEfectivas, TIENE_NIVELES } from "./gacha-niveles.js";
import { monto, arroba, CAT, participanteCitado, textoStats } from "./gacha-core.js";

const EFECTIVIDAD = {
  normal: { rock: .5, ghost: 0, steel: .5 },
  fire: { fire: .5, water: .5, grass: 2, ice: 2, bug: 2, rock: .5, dragon: .5, steel: 2 },
  water: { fire: 2, water: .5, grass: .5, ground: 2, rock: 2, dragon: .5 },
  electric: { water: 2, electric: .5, grass: .5, ground: 0, flying: 2, dragon: .5 },
  grass: { fire: .5, water: 2, grass: .5, poison: .5, ground: 2, flying: .5, bug: .5, rock: 2, dragon: .5, steel: .5 },
  ice: { fire: .5, water: .5, grass: 2, ice: .5, ground: 2, flying: 2, dragon: 2, steel: .5 },
  fighting: { normal: 2, ice: 2, poison: .5, flying: .5, psychic: .5, bug: .5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: .5 },
  poison: { grass: 2, poison: .5, ground: .5, rock: .5, ghost: .5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: .5, poison: 2, flying: 0, bug: .5, rock: 2, steel: 2 },
  flying: { electric: .5, grass: 2, fighting: 2, bug: 2, rock: .5, steel: .5 },
  psychic: { fighting: 2, poison: 2, psychic: .5, dark: 0, steel: .5 },
  bug: { fire: .5, grass: 2, fighting: .5, poison: .5, flying: .5, psychic: 2, ghost: .5, dark: 2, steel: .5, fairy: .5 },
  rock: { fire: 2, ice: 2, fighting: .5, ground: .5, flying: 2, bug: 2, steel: .5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: .5 },
  dragon: { dragon: 2, steel: .5, fairy: 0 },
  dark: { fighting: .5, psychic: 2, ghost: 2, dark: .5, fairy: .5 },
  steel: { fire: .5, water: .5, electric: .5, ice: 2, rock: 2, steel: .5, fairy: 2 },
  fairy: { fire: .5, fighting: 2, poison: .5, dragon: 2, dark: 2, steel: .5 }
};


function efectividad(tipoAtaque, tiposDefensor) {
  let m = 1;
  for (const t of tiposDefensor) m *= EFECTIVIDAD[tipoAtaque]?.[t] ?? 1;
  return m;
}

function prepararLuchador(p) {
  const s = statsEfectivas(p, p.nivel || 1);
  return { nombre: p.nombre, tipos: s.tipos, hpMax: s.hp, hp: s.hp, atk: s.atk, def: s.def, spe: s.spe, nivelCombate: s.nivelCombate };
}

function golpe(a, d) {
  let eff = 1;
  let stab = 1;
  if (a.tipos.length) {
    eff = Math.max(...a.tipos.map((t) => efectividad(t, d.tipos)));
    stab = 1.5;
  }
  const base = (((2 * a.nivelCombate) / 5 + 2) * 70 * a.atk / d.def) / 50 + 2;
  const azar = 0.85 + Math.random() * 0.15;
  const critico = Math.random() < 1 / 16 ? 1.5 : 1;
  const ajuste = a.tipos.length ? 1 : FACTOR_DANO_SIN_TIPOS;
  return { dano: Math.max(1, Math.floor(base * stab * eff * azar * critico * ajuste)), eff, critico: critico > 1 };
}

const MAX_RONDAS = 60;
const FACTOR_DANO_SIN_TIPOS = 0.5;

export function simularCombate(pa, pb) {
  const A = prepararLuchador(pa);
  const B = prepararLuchador(pb);
  const rondas = [];

  while (A.hp > 0 && B.hp > 0 && rondas.length < MAX_RONDAS) {
    const primeroA = A.spe > B.spe || (A.spe === B.spe && Math.random() < 0.5);
    const orden = primeroA ? [[A, B], [B, A]] : [[B, A], [A, B]];
    const eventos = [];
    for (const [atacante, defensor] of orden) {
      if (atacante.hp <= 0 || defensor.hp <= 0) break;
      const g = golpe(atacante, defensor);
      defensor.hp = Math.max(0, defensor.hp - g.dano);
      eventos.push({ atacante: atacante.nombre, defensor: defensor.nombre, dano: g.dano, eff: g.eff, critico: g.critico });
    }
    rondas.push({ eventos, hpA: A.hp, hpB: B.hp });
  }

  let ganador;
  if (A.hp === B.hp) ganador = Math.random() < 0.5 ? "A" : "B";
  else if (A.hp <= 0) ganador = "B";
  else if (B.hp <= 0) ganador = "A";
  else ganador = A.hp / A.hpMax >= B.hp / B.hpMax ? "A" : "B";

  return { ganador, rondas, hpA: A.hp, hpB: B.hp, maxA: A.hpMax, maxB: B.hpMax, luchadorA: A, luchadorB: B };
}

const SEGMENTOS = 8;

function barra(hp, max) {
  const llenos = hp <= 0 ? 0 : Math.max(1, Math.round((hp / max) * SEGMENTOS));
  return "▰".repeat(llenos) + "▱".repeat(SEGMENTOS - llenos);
}

function notaDeGolpe(e) {
  const extra = e.critico ? " 💥 golpe crítico" : e.eff >= 2 ? " ✨ súper efectivo" : e.eff === 0 ? " 🚫 no afecta" : e.eff < 1 ? " 🔻 poco efectivo" : "";
  return `• ${e.atacante} ataca a ${e.defensor} (-${e.dano})${extra}`;
}

function textoRondas(resultado, desde, hasta, nombreA, nombreB, maxA, maxB) {
  const lineas = [encabezado("🥊", desde + 1 === hasta ? `RONDA ${hasta}` : `RONDAS ${desde + 1} A ${hasta}`), ""];
  for (let i = desde; i < hasta; i++) {
    const ronda = resultado.rondas[i];
    if (hasta - desde > 1) lineas.push(`*Ronda ${i + 1}*`);
    ronda.eventos.forEach((e) => lineas.push(notaDeGolpe(e)));
    lineas.push(`❤️ ${nombreA} ${barra(ronda.hpA, maxA)} ${ronda.hpA}/${maxA}`);
    lineas.push(`❤️ ${nombreB} ${barra(ronda.hpB, maxB)} ${ronda.hpB}/${maxB}`);
    lineas.push("");
  }
  return lineas.join("\n").trimEnd();
}

const desafios = new Map();
const DESAFIO_MS = 2 * 60 * 1000;
const APUESTA_MINIMA = 100;
const MAX_MENSAJES_DE_RONDAS = 4;
const claveDesafio = (from, rival) => `${from}:${rival}`;
const conNivel = (p) => (TIENE_NIVELES(p.categoria) ? `${p.nombre} (Nv. ${p.nivel})` : p.nombre);

function leerArgumentos(partes) {
  const limpias = partes.filter((x) => x !== "+");
  const numeros = limpias.filter((x) => /^#?\d+$/.test(x));
  const conGato = numeros.find((x) => x.startsWith("#"));
  let apuesta = null;
  let charId = null;
  if (conGato) {
    charId = parseInt(conGato.slice(1), 10);
    const otro = numeros.find((x) => !x.startsWith("#"));
    apuesta = otro ? parseInt(otro, 10) : null;
  } else {
    apuesta = numeros[0] ? parseInt(numeros[0], 10) : null;
    charId = numeros[1] ? parseInt(numeros[1], 10) : null;
  }
  return { apuesta, charId };
}

function textoAyuda(cat, comando, nombreLuchador) {
  return [
    encabezado("⚔️", "PVP COMBATE"),
    "",
    `✱ Enfrenta a tu ${nombreLuchador} contra otro jugador. Antes de empezar debes decidir qué ${nombreLuchador} usar (ID). Si no eliges ninguno se usará el ${nombreLuchador} de mayor nivel que tengas.`,
    "",
    `${encabezado("💭", "¿Cómo utilizar?").replace("```##```", "```#```")}`,
    "",
    "✿ Para desafiar utiliza ::",
    `*.${comando} <@usuario> <apuesta> <ID>*`,
    "",
    "✦ Para aceptar o rechazar una batalla, únicamente escribe:: *AceptarPVP* o *RechazarPVP*",
    "",
    `> El perdedor le paga la apuesta al ganador (mínimo ${monto(APUESTA_MINIMA)}, sale del dinero en mano).`,
    `> Uso *.${comando} <@usuario> <apuesta> <ID>*`
  ].join("\n");
}

async function resolverDesafio({ aceptar, d, sender, charIdRival, categoria, comando, nombreLuchador, replyAcepta }) {
  const cat = CAT[categoria];
  const clave = claveDesafio(d.from, sender);
  const reply = d.reply || replyAcepta;

  if (!aceptar) {
    desafios.delete(clave);
    return reply({ text: `🏳️ ${arroba(sender)} rechazó el desafío de ${arroba(d.retador)}.`, mentions: [sender, d.retador] });
  }

  const luchaR = mejorDe(d.retador, categoria, d.charId);
  const luchaV = mejorDe(sender, categoria, charIdRival);
  if (!luchaV) {
    return reply({
      text: charIdRival
        ? `❌ No tienes ningún ${nombreLuchador} con el ID #${charIdRival}.`
        : `❌ No tienes ningún ${nombreLuchador}. Consigue uno con *${cat.rollCmd}* y reclámalo con *${cat.claimCmd}*.`
    });
  }
  if (!luchaR) {
    desafios.delete(clave);
    return reply({ text: `❌ ${arroba(d.retador)} ya no tiene ese ${nombreLuchador}. Combate cancelado.`, mentions: [d.retador] });
  }
  if (getAccount(d.retador).wallet < d.apuesta || getAccount(sender).wallet < d.apuesta) {
    desafios.delete(clave);
    return reply({ text: "❌ Alguno de los dos ya no tiene dinero en mano para cubrir la apuesta. Combate cancelado." });
  }
  desafios.delete(clave);

  const r = simularCombate(luchaR, luchaV);
  const gana = r.ganador === "A" ? d.retador : sender;
  const pierde = r.ganador === "A" ? sender : d.retador;
  const luchaGana = r.ganador === "A" ? luchaR : luchaV;
  const mentions = [d.retador, sender];

  await reply({
    text: [
      encabezado("⚔️", "PVP COMBATE"),
      "",
      "> ¡Comienza la batalla! Cada ronda se juega por turnos y ataca primero quien tenga más velocidad.",
      "",
      `🔴 ${arroba(d.retador)} ›› *${conNivel(luchaR)}*`,
      `> ${textoStats({ hp: r.maxA, atk: r.luchadorA.atk, def: r.luchadorA.def, spe: r.luchadorA.spe })}`,
      `🔵 ${arroba(sender)} ›› *${conNivel(luchaV)}*`,
      `> ${textoStats({ hp: r.maxB, atk: r.luchadorB.atk, def: r.luchadorB.def, spe: r.luchadorB.spe })}`,
      "",
      `🪙 *Apuesta* ›› ${monto(d.apuesta)}`
    ].join("\n"),
    mentions
  });

  const total = r.rondas.length;
  const porMensaje = Math.max(3, Math.ceil(total / MAX_MENSAJES_DE_RONDAS));
  for (let desde = 0; desde < total; desde += porMensaje) {
    const hasta = Math.min(total, desde + porMensaje);
    await reply({ text: textoRondas(r, desde, hasta, luchaR.nombre, luchaV.nombre, r.maxA, r.maxB) });
  }

  addToWallet(pierde, -d.apuesta);
  addToWallet(gana, d.apuesta);

  return reply({
    text: [
      encabezado("🏆", "RESULTADO DEL COMBATE"),
      "",
      `> La batalla terminó en *${total}* ${total === 1 ? "ronda" : "rondas"}.`,
      "",
      `❤️ *Salud final* ›› ${luchaR.nombre} ${r.hpA}/${r.maxA} · ${luchaV.nombre} ${r.hpB}/${r.maxB}`,
      `🏆 *Ganador* ›› ${arroba(gana)} con *${luchaGana.nombre}*`,
      `🪙 *Premio* ›› +${monto(d.apuesta)}`,
      `> Los paga ${arroba(pierde)}.`
    ].join("\n"),
    mentions
  });
}

export function crearHandlerPvp({ categoria, comando, nombreLuchador }) {
  const cat = CAT[categoria];
  return async ({ from, sender, cleanText, msg, reply }) => {
    const partes = cleanText.split(/\s+/).slice(1);
    const sub = (partes[0] || "").toLowerCase();

    if (sub === "aceptar" || sub === "rechazar") {
      const d = desafios.get(claveDesafio(from, sender));
      if (!d || d.vence < Date.now()) {
        desafios.delete(claveDesafio(from, sender));
        return reply({ text: "❌ No tienes ningún desafío pendiente en este chat." });
      }
      const { charId } = leerArgumentos(partes.slice(1));
      return resolverDesafio({ aceptar: sub === "aceptar", d, sender, charIdRival: charId, categoria, comando, nombreLuchador, replyAcepta: reply });
    }

    const rival = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || participanteCitado(msg);
    const { apuesta, charId } = leerArgumentos(partes);

    if (!rival || !apuesta) return reply({ text: textoAyuda(cat, comando, nombreLuchador) });
    if (rival === sender) return reply({ text: "❌ No puedes desafiarte a ti mismo." });
    if (apuesta < APUESTA_MINIMA) return reply({ text: `❌ La apuesta mínima es ${monto(APUESTA_MINIMA)}.` });

    const luchador = mejorDe(sender, categoria, charId);
    if (!luchador) {
      return reply({
        text: charId
          ? `❌ No tienes ningún ${nombreLuchador} con el ID #${charId}.`
          : `❌ Necesitas al menos un ${nombreLuchador}. Consigue uno con *${cat.rollCmd}* y reclámalo con *${cat.claimCmd}*.`
      });
    }
    if (getAccount(sender).wallet < apuesta) return reply({ text: `❌ No tienes ${monto(apuesta)} en mano.` });
    if (getAccount(rival).wallet < apuesta) return reply({ text: `❌ ${arroba(rival)} no tiene ${monto(apuesta)} en mano.`, mentions: [rival] });

    const desafio = { from, retador: sender, rival, apuesta, charId, reply, vence: Date.now() + DESAFIO_MS };
    desafios.set(claveDesafio(from, rival), desafio);

    registrarEspera(claveDesafio(from, rival), {
      duracionMs: DESAFIO_MS,
      alResponder: async (texto, ctx) => {
        const m = String(texto || "").trim().toLowerCase().match(/^(aceptarpvp|rechazarpvp)(?:\s+#?(\d+))?$/);
        if (!m) return false;
        const vigente = desafios.get(claveDesafio(from, rival));
        if (!vigente || vigente.vence < Date.now()) return false;
        await resolverDesafio({
          aceptar: m[1] === "aceptarpvp", d: vigente, sender: ctx.sender,
          charIdRival: m[2] ? parseInt(m[2], 10) : null, categoria, comando, nombreLuchador,
          replyAcepta: (contenido) => ctx.sock.sendMessage(ctx.from, contenido, { quoted: ctx.msg })
        });
        return true;
      }
    });

    return reply({
      text: [
        encabezado("⚔️", "DESAFÍO PVP"),
        "",
        `> ${arroba(sender)} desafía a ${arroba(rival)}.`,
        "",
        `🔴 *Luchador* ›› ${conNivel(luchador)}`,
        `🪙 *Apuesta* ›› ${monto(apuesta)}`,
        "",
        `> ${arroba(rival)}, escribe *AceptarPVP* o *RechazarPVP* (tienes 2 minutos).`,
        "> Si quieres usar un personaje distinto al de mayor nivel, escribe *AceptarPVP <ID>*."
      ].join("\n"),
      mentions: [sender, rival]
    });
  };
}
