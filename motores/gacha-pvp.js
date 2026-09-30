import { mejorDe } from "./gacha-db.js";
import { getAccount, addToWallet } from "./db.js";
import { statsEfectivas, TIENE_NIVELES } from "./gacha-niveles.js";
import { tarjeta, monto, arroba, CAT, participanteCitado } from "./gacha-core.js";

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
  let eff = 1, stab = 1;
  if (a.tipos.length) {
    eff = Math.max(...a.tipos.map((t) => efectividad(t, d.tipos)));
    stab = 1.5;
  }
  const base = (((2 * a.nivelCombate) / 5 + 2) * 70 * a.atk / d.def) / 50 + 2;
  const azar = 0.85 + Math.random() * 0.15;
  const critico = Math.random() < 1 / 16 ? 1.5 : 1;
  return { dano: Math.max(1, Math.floor(base * stab * eff * azar * critico)), eff, critico: critico > 1 };
}

export function simularCombate(pa, pb) {
  const A = prepararLuchador(pa);
  const B = prepararLuchador(pb);
  const notas = [];
  let rondas = 0;
  while (A.hp > 0 && B.hp > 0 && rondas < 60) {
    rondas++;
    const primeroA = A.spe > B.spe || (A.spe === B.spe && Math.random() < 0.5);
    const orden = primeroA ? [[A, B], [B, A]] : [[B, A], [A, B]];
    for (const [atacante, defensor] of orden) {
      if (atacante.hp <= 0 || defensor.hp <= 0) break;
      const g = golpe(atacante, defensor);
      defensor.hp = Math.max(0, defensor.hp - g.dano);
      if (rondas <= 3 || g.critico || g.eff !== 1) {
        const extra = g.critico ? " 💥 ¡crítico!" : g.eff >= 2 ? " ✨ súper efectivo" : g.eff === 0 ? " 🚫 no afecta" : g.eff < 1 ? " 🔻 poco efectivo" : "";
        if (notas.length < 6) notas.push(`• ${atacante.nombre} golpea a ${defensor.nombre} (-${g.dano})${extra}`);
      }
    }
  }
  const gana = A.hp === B.hp ? (Math.random() < 0.5 ? "A" : "B") : (A.hp > B.hp ? "A" : "B");
  return { ganador: gana, rondas, notas, hpA: A.hp, hpB: B.hp, maxA: A.hpMax, maxB: B.hpMax };
}

const desafios = new Map();
const DESAFIO_MS = 2 * 60 * 1000;
const APUESTA_MINIMA = 100;
const claveDesafio = (from, rival) => `${from}:${rival}`;
const conNivel = (p) => (TIENE_NIVELES(p.categoria) ? `${p.nombre} (Nv.${p.nivel})` : p.nombre);

export function crearHandlerPvp({ categoria, comando, nombreLuchador }) {
  const cat = CAT[categoria];
  return async ({ from, sender, cleanText, msg, reply }) => {
    const partes = cleanText.split(/\s+/).slice(1);
    const sub = (partes[0] || "").toLowerCase();
    const idTok = partes.find((x) => /^#\d+$/.test(x));
    const charId = idTok ? parseInt(idTok.slice(1), 10) : null;

    if (sub === "aceptar" || sub === "rechazar") {
      const clave = claveDesafio(from, sender);
      const d = desafios.get(clave);
      if (!d || d.vence < Date.now()) {
        desafios.delete(clave);
        return reply({ text: "❌ No tenés ningún desafío pendiente en este chat." });
      }
      if (sub === "rechazar") {
        desafios.delete(clave);
        return reply({ text: `🏳️ ${arroba(sender)} rechazó el desafío de ${arroba(d.retador)}.`, mentions: [sender, d.retador] });
      }

      const luchaR = mejorDe(d.retador, categoria, d.charId);
      const luchaV = mejorDe(sender, categoria, charId);
      if (!luchaV) {
        return reply({ text: charId
          ? `❌ No tenés ningún ${nombreLuchador} con ID #${charId}.`
          : `❌ No tenés ningún ${nombreLuchador}. Conseguí uno con *${cat.rollCmd}* y *${cat.claimCmd}*.` });
      }
      if (!luchaR) return reply({ text: `❌ ${arroba(d.retador)} ya no tiene ese ${nombreLuchador}.`, mentions: [d.retador] });
      if (getAccount(d.retador).wallet < d.apuesta || getAccount(sender).wallet < d.apuesta) {
        desafios.delete(clave);
        return reply({ text: "❌ Alguno de los dos ya no tiene saldo en mano para cubrir la apuesta. Combate cancelado." });
      }
      desafios.delete(clave);

      const r = simularCombate(luchaR, luchaV);
      const gana = r.ganador === "A" ? d.retador : sender;
      const pierde = r.ganador === "A" ? sender : d.retador;
      const luchaGana = r.ganador === "A" ? luchaR : luchaV;

      addToWallet(pierde, -d.apuesta);
      addToWallet(gana, d.apuesta);

      return reply({
        text: tarjeta({
          emoji: cat.emoji, titulo: "COMBATE PVP",
          lineas: [
            `🥊 ${arroba(d.retador)} (*${conNivel(luchaR)}*) vs ${arroba(sender)} (*${conNivel(luchaV)}*)`,
            "",
            ...r.notas,
            "",
            `⏱️ *Rondas* ›› ${r.rondas}`,
            `❤️ *HP final* ›› ${luchaR.nombre} ${r.hpA}/${r.maxA} · ${luchaV.nombre} ${r.hpB}/${r.maxB}`,
            `🏆 *Ganador* ›› ${arroba(gana)} con *${luchaGana.nombre}*`,
            `🪙 *Premio* ›› +${monto(d.apuesta)} (los paga ${arroba(pierde)})`
          ]
        }),
        mentions: [d.retador, sender]
      });
    }

    const rival = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || participanteCitado(msg);
    const apuesta = parseInt(partes.find((x) => /^\d+$/.test(x)) || "", 10);

    if (!rival || !apuesta) {
      return reply({
        text: tarjeta({
          emoji: cat.emoji, titulo: "COMBATE PVP",
          lineas: [
            `⚙️ *Desafiar* ›› .${comando} @usuario <apuesta> [#id]`,
            `✅ *Aceptar* ›› .${comando} aceptar [#id]`,
            `🏳️ *Rechazar* ›› .${comando} rechazar`,
            "",
            `Pelea tu ${nombreLuchador} contra el del rival (por defecto el de mayor nivel; con #id elegís cuál). Las estadísticas dependen del nivel y la rareza. El perdedor le paga la apuesta al ganador (mínimo ${APUESTA_MINIMA}, sale del dinero en mano).`
          ]
        })
      });
    }
    if (rival === sender) return reply({ text: "❌ No podés desafiarte a vos mismo." });
    if (apuesta < APUESTA_MINIMA) return reply({ text: `❌ La apuesta mínima es ${monto(APUESTA_MINIMA)}.` });
    if (!mejorDe(sender, categoria, charId)) {
      return reply({ text: charId
        ? `❌ No tenés ningún ${nombreLuchador} con ID #${charId}.`
        : `❌ Necesitás al menos un ${nombreLuchador}. Conseguí uno con *${cat.rollCmd}* y *${cat.claimCmd}*.` });
    }
    if (getAccount(sender).wallet < apuesta) return reply({ text: `❌ No tenés ${monto(apuesta)} en mano.` });
    if (getAccount(rival).wallet < apuesta) return reply({ text: `❌ ${arroba(rival)} no tiene ${monto(apuesta)} en mano.`, mentions: [rival] });

    desafios.set(claveDesafio(from, rival), { retador: sender, rival, apuesta, charId, vence: Date.now() + DESAFIO_MS });
    return reply({
      text: tarjeta({
        emoji: cat.emoji, titulo: "DESAFÍO PVP",
        lineas: [
          `⚔️ ${arroba(sender)} desafía a ${arroba(rival)}`,
          `🪙 *Apuesta* ›› ${monto(apuesta)}`,
          "",
          `${arroba(rival)}, respondé con *.${comando} aceptar* o *.${comando} rechazar* (2 min).`
        ]
      }),
      mentions: [sender, rival]
    });
  };
}
