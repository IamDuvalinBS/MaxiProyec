import { mejorDe } from "./gacha-db.js";
import { getAccount, addToWallet } from "./db.js";
import { registrarEspera } from "../src/nucleo/espera.js";
import { encabezado } from "../src/economia/estilo.js";
import { TIENE_NIVELES, darFragmentos, estrellasTexto } from "./gacha-niveles.js";
import { monto, arroba, CAT, participanteCitado, textoStats } from "./gacha-core.js";
import { simularBatalla, mensajesDeBatalla } from "./gacha-batalla.js";
import { equipoDe } from "./gacha-equipos.js";
import { registrarActividad } from "./gacha-misiones.js";
import { T } from "./gacha-tema.js";

export { simularCombate } from "./gacha-batalla.js";

const desafios = new Map();
const DESAFIO_MS = 2 * 60 * 1000;
const APUESTA_MINIMA = 100;
const FRAGMENTOS_INDIVIDUAL = 1;
const FRAGMENTOS_EQUIPO = 2;
const claveDesafio = (from, rival) => `${from}:${rival}`;
const esEquipo = (x) => /^equipos?$/i.test(x);

const conNivel = (p) => {
  if (!TIENE_NIVELES(p.categoria)) return p.nombre;
  const estrellas = estrellasTexto(p.estrellas);
  return `${p.nombre} (Nv. ${p.nivel}${estrellas ? ` ${estrellas}` : ""})`;
};

function leerArgumentos(partes) {
  const modoEquipo = partes.some(esEquipo);
  const limpias = partes.filter((x) => x !== "+" && !esEquipo(x));
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
  return { apuesta, charId, modoEquipo };
}

function luchadoresDe(usuario, categoria, charId, modoEquipo) {
  if (modoEquipo) return equipoDe(usuario, categoria).personajes;
  const p = mejorDe(usuario, categoria, charId);
  return p ? [p] : [];
}

function textoAyuda(comando, nombreLuchador) {
  return [
    encabezado("⚔️", T("PVP COMBATE", "DUELO MACABRO")),
    "",
    `✱ Enfrenta a tu ${nombreLuchador} contra otro jugador. Antes de empezar decide qué ${nombreLuchador} usar (ID). Si no eliges ninguno se usará el de mayor nivel que tengas.`,
    "",
    `${encabezado("💭", "¿Cómo utilizar?").replace("```##```", "```#```")}`,
    "",
    "✿ Para desafiar utiliza ::",
    `*.${comando} <@usuario> <apuesta> <ID>*`,
    "",
    "✦ Para una batalla por equipos (hasta 3 contra 3) utiliza ::",
    `*.${comando} <@usuario> <apuesta> equipo*`,
    "",
    "✦ Para aceptar o rechazar una batalla, únicamente escribe:: *AceptarPVP* o *RechazarPVP*",
    "",
    "> Cada personaje usa los poderes que ha desbloqueado por su nivel. Arma tu equipo con *.equipo*.",
    `> El perdedor le paga la apuesta al ganador (mínimo ${monto(APUESTA_MINIMA)}, sale del dinero en mano).`,
    `> Uso *.${comando} <@usuario> <apuesta> <ID>*`
  ].join("\n");
}

function lineasDeBando(simbolo, dueno, filas, luchadores) {
  const lineas = [];
  filas.forEach((fila, i) => {
    const f = luchadores[i];
    lineas.push(`${simbolo} ${arroba(dueno)} ›› *${conNivel(fila)}*`);
    lineas.push(`> ${textoStats({ hp: f.hpMax, atk: f.atk, def: f.def, spe: f.spe })}`);
    const poderes = Object.values(f.poderes).map((p) => p.nombre);
    if (poderes.length) lineas.push(`> ✦ ${poderes.join(" · ")}`);
  });
  return lineas;
}

const resumenDeSalud = (equipo) => equipo.map((f) => `${f.nombre} ${f.hp}/${f.hpMax}`).join(" · ");

async function resolverDesafio({ aceptar, d, sender, charIdRival, categoria, nombreLuchador, replyAcepta }) {
  const cat = CAT[categoria];
  const clave = claveDesafio(d.from, sender);
  const reply = d.reply || replyAcepta;

  if (!aceptar) {
    desafios.delete(clave);
    return reply({ text: T(`🏳️ ${arroba(sender)} rechazó el desafío de ${arroba(d.retador)}.`, `🏳️ ${arroba(sender)} huyó y rechazó el desafío de ${arroba(d.retador)}.`), mentions: [sender, d.retador] });
  }

  const filasR = luchadoresDe(d.retador, categoria, d.charId, d.modoEquipo);
  const filasV = luchadoresDe(sender, categoria, charIdRival, d.modoEquipo);
  if (!filasV.length) {
    return reply({
      text: charIdRival && !d.modoEquipo
        ? `❌ No tienes ningún ${nombreLuchador} con el ID #${charIdRival}.`
        : `❌ No tienes ningún ${nombreLuchador}. Consigue uno con *${cat.rollCmd}* y reclámalo con *${cat.claimCmd}*.`
    });
  }
  if (!filasR.length) {
    desafios.delete(clave);
    return reply({ text: `❌ ${arroba(d.retador)} ya no tiene ese ${nombreLuchador}. Combate cancelado.`, mentions: [d.retador] });
  }
  if (getAccount(d.retador).wallet < d.apuesta || getAccount(sender).wallet < d.apuesta) {
    desafios.delete(clave);
    return reply({ text: "❌ Alguno de los dos ya no tiene dinero en mano para cubrir la apuesta. Combate cancelado." });
  }
  desafios.delete(clave);

  const r = simularBatalla(filasR, filasV);
  const gana = r.ganador === "A" ? d.retador : sender;
  const pierde = r.ganador === "A" ? sender : d.retador;
  const equipoGanador = r.ganador === "A" ? r.equipoA : r.equipoB;
  const mentions = [d.retador, sender];
  const titulo = d.modoEquipo ? T("BATALLA POR EQUIPOS", "BATALLA MACABRA POR EQUIPOS") : T("PVP COMBATE", "DUELO MACABRO");

  await reply({
    text: [
      encabezado("⚔️", titulo),
      "",
      T("> ¡Comienza la batalla! Cada ronda se juega por turnos y ataca primero quien tenga más velocidad. Los poderes se activan solos.", "> ¡Que comience el duelo bajo la luna! Cada ronda se juega por turnos y ataca primero quien tenga más velocidad. Los poderes se activan solos."),
      "",
      ...lineasDeBando("🔴", d.retador, filasR, r.equipoA),
      ...lineasDeBando("🔵", sender, filasV, r.equipoB),
      "",
      `🪙 *Apuesta* ›› ${monto(d.apuesta)}`
    ].join("\n"),
    mentions
  });

  for (const texto of mensajesDeBatalla(r)) await reply({ text: texto });

  addToWallet(pierde, -d.apuesta);
  addToWallet(gana, d.apuesta);
  const fragmentos = d.modoEquipo ? FRAGMENTOS_EQUIPO : FRAGMENTOS_INDIVIDUAL;
  darFragmentos(gana, fragmentos);

  const total = r.rondas.length;
  await reply({
    text: [
      encabezado("🏆", T("RESULTADO DEL COMBATE", "RESULTADO DEL DUELO")),
      "",
      T(`> La batalla terminó en *${total}* ${total === 1 ? "ronda" : "rondas"}.`, `> El duelo terminó en *${total}* ${total === 1 ? "ronda" : "rondas"}.`),
      "",
      `🔴 *Salud final* ›› ${resumenDeSalud(r.equipoA)}`,
      `🔵 *Salud final* ›› ${resumenDeSalud(r.equipoB)}`,
      `🏆 *Ganador* ›› ${arroba(gana)} con *${equipoGanador.map((f) => f.nombre).join(", ")}*`,
      `🪙 *Premio* ›› +${monto(d.apuesta)}`,
      `🧩 *Fragmentos de ascensión* ›› +${fragmentos}`,
      `> Los paga ${arroba(pierde)}.`
    ].join("\n"),
    mentions
  });

  await registrarActividad({
    reply, sender: gana,
    eventos: [{ tipo: "pvp", categoria }, ...(d.modoEquipo ? [{ tipo: "equipo", categoria }] : [])]
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
      return resolverDesafio({ aceptar: sub === "aceptar", d, sender, charIdRival: charId, categoria, nombreLuchador, replyAcepta: reply });
    }

    const rival = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || participanteCitado(msg);
    const { apuesta, charId, modoEquipo } = leerArgumentos(partes);

    if (!rival || !apuesta) return reply({ text: textoAyuda(comando, nombreLuchador) });
    if (rival === sender) return reply({ text: "❌ No puedes desafiarte a ti mismo." });
    if (apuesta < APUESTA_MINIMA) return reply({ text: `❌ La apuesta mínima es ${monto(APUESTA_MINIMA)}.` });

    const luchadores = luchadoresDe(sender, categoria, charId, modoEquipo);
    if (!luchadores.length) {
      return reply({
        text: charId && !modoEquipo
          ? `❌ No tienes ningún ${nombreLuchador} con el ID #${charId}.`
          : `❌ Necesitas al menos un ${nombreLuchador}. Consigue uno con *${cat.rollCmd}* y reclámalo con *${cat.claimCmd}*.`
      });
    }
    if (getAccount(sender).wallet < apuesta) return reply({ text: T(`❌ No tienes ${monto(apuesta)} en mano.`, `❌ No tienes ${monto(apuesta)} en el caldero.`) });
    if (getAccount(rival).wallet < apuesta) return reply({ text: `❌ ${arroba(rival)} no tiene ${monto(apuesta)} en mano.`, mentions: [rival] });

    const desafio = { from, retador: sender, rival, apuesta, charId, modoEquipo, reply, vence: Date.now() + DESAFIO_MS };
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
          charIdRival: m[2] ? parseInt(m[2], 10) : null, categoria, nombreLuchador,
          replyAcepta: (contenido) => ctx.sock.sendMessage(ctx.from, contenido, { quoted: ctx.msg })
        });
        return true;
      }
    });

    const lineasLuchador = modoEquipo
      ? ["🔴 *Equipo* ››", ...luchadores.map((p) => `> · ${conNivel(p)}`)]
      : [`🔴 *Luchador* ›› ${conNivel(luchadores[0])}`];

    return reply({
      text: [
        encabezado("⚔️", modoEquipo ? T("DESAFÍO POR EQUIPOS", "DESAFÍO MACABRO POR EQUIPOS") : T("DESAFÍO PVP", "DESAFÍO MACABRO")),
        "",
        T(`> ${arroba(sender)} desafía a ${arroba(rival)}.`, `> ${arroba(sender)} desafía a ${arroba(rival)} a un duelo nocturno.`),
        "",
        ...lineasLuchador,
        `🪙 *Apuesta* ›› ${monto(apuesta)}`,
        "",
        `> ${arroba(rival)}, escribe *AceptarPVP* o *RechazarPVP* (tienes 2 minutos).`,
        modoEquipo
          ? "> Se usará tu equipo guardado con *.equipo* o, si no tienes uno, tus 3 mejores personajes."
          : "> Si quieres usar un personaje distinto al de mayor nivel, escribe *AceptarPVP <ID>*."
      ].join("\n"),
      mentions: [sender, rival]
    });
  };
}
