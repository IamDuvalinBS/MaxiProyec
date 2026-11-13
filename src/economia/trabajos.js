import { getAccount, addToWallet, saveAccount, checkCooldown } from "../../motores/db.js";
import { addXp, getProfile } from "../../motores/profile.js";
import { tarjeta, monto, elegir, entre, textoEspera, avisoNivel } from "./formato-evento.js";
import { esHalloween, estilo } from "./temas.js";
import { registrarTrabajo, bonosDeGanancia } from "./carrera.js";

export const trabajosRegistrados = new Map();

// Líneas de carrera que se repiten igual en todos los eventos.
const LINEAS_CARRERA = {
  racha: (n, pct) => `🔥 *Racha de victorias* ›› ${n} seguidas (+${pct}% extra)`,
  rachaPerdida: (n) => `💔 *Racha perdida* ›› llevabas ${n} victorias seguidas`,
  faltas: (c) => `🚫 *Faltas* ›› ${c.faltas} esta semana (-${c.descuento}% a tu sueldo). ¡Trabaja a diario!`
};

// Una victoria es no fallar. En los trabajos que no pueden fallar, es una buena paga (mitad superior de su rango).
function esVictoria(trabajo, base) {
  if (trabajo.chanceFallo > 0) return true;
  const umbral = (Math.min(...trabajo.exitos.map((e) => e.min)) + Math.max(...trabajo.exitos.map((e) => e.max))) / 2;
  return base >= umbral;
}

// Líneas extra de la tarjeta de un trabajo (racha de victorias y faltas). .allw no las usa.
export function lineasDeCarrera(r) {
  const c = r.carrera;
  const lineas = [];
  if (c.rachaVictorias >= 2 && r.exito) lineas.push(LINEAS_CARRERA.racha(c.rachaVictorias, r.bonoRacha));
  if (c.rachaPerdida) lineas.push(LINEAS_CARRERA.rachaPerdida(c.rachaPerdida));
  if (c.faltas) lineas.push(LINEAS_CARRERA.faltas(c));
  return lineas;
}

// Textos de las tarjetas que son iguales para todos los trabajos.
const ESTILOS_TARJETA = {
  normal: {
    ganancia: (n) => `🪙 *Ganancia* ›› +${monto(n)}`,
    experiencia: (n) => `✨ *Experiencia* ›› +${n}`,
    enMano: (n) => `💰 *En mano* ›› ${monto(n)}`,
    perdida: (n) => `💸 *Pérdida* ›› -${monto(n)}`,
    jornada: (c) => `📅 *Jornada* ›› ${c.diaNuevo ? `Día ${c.racha} de racha` : "Trabajo de hoy sumado"}${c.pagado ? ` · +${monto(c.pagado)} a tu sueldo` : " · tope diario de sueldo alcanzado"}`,
    oficio: (c) => `🔁 *Maestría* ›› ¡Subiste al nivel ${c.nivelOficio} en este oficio!`,
    tipExito: "Usa *.dep* para guardar tu dinero.",
    tipFallo: "Usa *.dep* para guardar tu dinero y protegerlo de futuras pérdidas."
  },
  halloween: {
    ganancia: (n) => `🎃 *Botín* ›› +${monto(n)}`,
    experiencia: (n) => `🔮 *Experiencia* ›› +${n}`,
    enMano: (n) => `🧙‍♀️ *En el caldero* ›› ${monto(n)}`,
    perdida: (n) => `💀 *Pérdida* ›› -${monto(n)}`,
    jornada: (c) => `📅 *Jornada* ›› ${c.diaNuevo ? `Día ${c.racha} de racha` : "Trabajo de hoy sumado"}${c.pagado ? ` · +${monto(c.pagado)} a tu sueldo` : " · tope diario de sueldo alcanzado"}`,
    oficio: (c) => `🔁 *Maestría* ›› ¡Subiste al nivel ${c.nivelOficio} en este oficio!`,
    tipExito: "Usa *.dep* para esconder tus calabazas en la cripta. ⚰️",
    tipFallo: "Usa *.dep* para esconder tus calabazas en la cripta y protegerlas de futuras maldiciones. 👻"
  }
};

export function estiloTarjetaTrabajo() {
  return estilo(ESTILOS_TARJETA);
}

// Devuelve el trabajo con la presentación del evento activo.
// SOLO cambian textos y emojis (se emparejan por posición): los rangos de
// ganancia, el riesgo y la espera salen siempre de la definición normal.
export function vistaDe(trabajo) {
  const h = esHalloween() ? trabajo.halloween : null;
  if (!h) return trabajo;
  return {
    ...trabajo,
    emoji: h.emoji ?? trabajo.emoji,
    tituloExito: h.tituloExito ?? trabajo.tituloExito,
    tituloFallo: h.tituloFallo ?? trabajo.tituloFallo,
    emojiFallo: h.emojiFallo ?? trabajo.emojiFallo,
    exitos: trabajo.exitos.map((suceso, i) => ({ ...suceso, texto: h.exitos?.[i] ?? suceso.texto })),
    fallos: trabajo.fallos.map((suceso, i) => ({ ...suceso, texto: h.fallos?.[i] ?? suceso.texto }))
  };
}

// conRacha=false (.allw): no suma, no rompe y no usa la racha de victorias.
export function ejecutarTrabajo(sender, trabajo, { conRacha = true } = {}) {
  const espera = checkCooldown(sender, trabajo.clave, trabajo.cooldownMs);
  if (espera > 0) return { enEspera: true, espera };

  const cuenta = getAccount(sender);
  const falla = trabajo.chanceFallo > 0 && Math.random() < trabajo.chanceFallo;
  const vista = vistaDe(trabajo);

  if (!falla) {
    const suceso = elegir(vista.exitos);
    const base = entre(suceso.min, suceso.max);
    const victoria = esVictoria(trabajo, base);
    // Extras sobre la paga: maestría del oficio (+2% por nivel) y racha de victorias (solo con el comando individual).
    const bonos = bonosDeGanancia(sender, trabajo.clave, { victoria, conRacha });
    const ganancia = Math.round(base * bonos.multiplicador);
    addToWallet(sender, ganancia);
    const xp = Math.max(1, Math.round(ganancia / 10));
    const { leveledUp, newLevel } = addXp(sender, xp);
    const carrera = registrarTrabajo(sender, trabajo.clave, { victoria, conRacha });
    return { enEspera: false, exito: true, relato: suceso.texto, monto: ganancia, xp, subioNivel: leveledUp, nivel: newLevel, carrera, bonoRacha: bonos.racha };
  }

  const suceso = elegir(vista.fallos);
  const perdida = Math.min(cuenta.wallet, entre(suceso.min, suceso.max));
  cuenta.wallet -= perdida;
  saveAccount(sender);
  const carrera = registrarTrabajo(sender, trabajo.clave, { victoria: false, conRacha });
  return { enEspera: false, exito: false, relato: suceso.texto, monto: perdida, xp: 0, subioNivel: false, nivel: getProfile(sender).level, carrera };
}

export function crearTrabajo(def) {
  const trabajo = { chanceFallo: 0, fallos: [], ...def };
  if (trabajo.chanceFallo > 0 && trabajo.fallos.length === 0) {
    throw new Error(`El trabajo "${trabajo.clave}" tiene riesgo de fallo pero no define fallos.`);
  }
  trabajosRegistrados.set(trabajo.clave, trabajo);

  return {
    names: trabajo.names,
    desc: trabajo.desc,
    category: "Trabajos",
    handler: async ({ sender, reply }) => {
      const r = ejecutarTrabajo(sender, trabajo);
      if (r.enEspera) return reply({ text: textoEspera(r.espera) });

      const E = estiloTarjetaTrabajo();
      const vista = vistaDe(trabajo);
      const enMano = getAccount(sender).wallet;
      if (r.exito) {
        await reply({
          text: tarjeta({
            emoji: vista.emoji,
            titulo: vista.tituloExito,
            relato: r.relato,
            lineas: [E.ganancia(r.monto), E.experiencia(r.xp), E.enMano(enMano), E.jornada(r.carrera), ...(r.carrera.subioOficio ? [E.oficio(r.carrera)] : []), ...lineasDeCarrera(r)],
            tip: E.tipExito
          })
        });
        if (r.subioNivel) await reply({ text: avisoNivel(r.nivel) });
        return;
      }

      await reply({
        text: tarjeta({
          emoji: vista.emojiFallo || "⚠️",
          titulo: vista.tituloFallo,
          relato: r.relato,
          lineas: [E.perdida(r.monto), E.enMano(enMano), E.jornada(r.carrera), ...lineasDeCarrera(r)],
          tip: E.tipFallo
        })
      });
    }
  };
}
