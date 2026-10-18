import { getAccount, addToWallet, saveAccount, checkCooldown } from "../../motores/db.js";
import { addXp, getProfile } from "../../motores/profile.js";
import { tarjeta, monto, elegir, entre, textoEspera, avisoNivel } from "./formato-evento.js";
import { esHalloween, estilo } from "./temas.js";

export const trabajosRegistrados = new Map();

// Textos de las tarjetas que son iguales para todos los trabajos.
const ESTILOS_TARJETA = {
  normal: {
    ganancia: (n) => `🪙 *Ganancia* ›› +${monto(n)}`,
    experiencia: (n) => `✨ *Experiencia* ›› +${n}`,
    enMano: (n) => `💰 *En mano* ›› ${monto(n)}`,
    perdida: (n) => `💸 *Pérdida* ›› -${monto(n)}`,
    tipExito: "Usa *.dep* para guardar tu dinero.",
    tipFallo: "Usa *.dep* para guardar tu dinero y protegerlo de futuras pérdidas."
  },
  halloween: {
    ganancia: (n) => `🎃 *Botín* ›› +${monto(n)}`,
    experiencia: (n) => `🔮 *Experiencia* ›› +${n}`,
    enMano: (n) => `🧙‍♀️ *En el caldero* ›› ${monto(n)}`,
    perdida: (n) => `💀 *Pérdida* ›› -${monto(n)}`,
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

export function ejecutarTrabajo(sender, trabajo) {
  const espera = checkCooldown(sender, trabajo.clave, trabajo.cooldownMs);
  if (espera > 0) return { enEspera: true, espera };

  const cuenta = getAccount(sender);
  const falla = trabajo.chanceFallo > 0 && Math.random() < trabajo.chanceFallo;
  const vista = vistaDe(trabajo);

  if (!falla) {
    const suceso = elegir(vista.exitos);
    const ganancia = entre(suceso.min, suceso.max);
    addToWallet(sender, ganancia);
    const xp = Math.max(1, Math.round(ganancia / 10));
    const { leveledUp, newLevel } = addXp(sender, xp);
    return { enEspera: false, exito: true, relato: suceso.texto, monto: ganancia, xp, subioNivel: leveledUp, nivel: newLevel };
  }

  const suceso = elegir(vista.fallos);
  const perdida = Math.min(cuenta.wallet, entre(suceso.min, suceso.max));
  cuenta.wallet -= perdida;
  saveAccount(sender);
  return { enEspera: false, exito: false, relato: suceso.texto, monto: perdida, xp: 0, subioNivel: false, nivel: getProfile(sender).level };
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
            lineas: [E.ganancia(r.monto), E.experiencia(r.xp), E.enMano(enMano)],
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
          lineas: [E.perdida(r.monto), E.enMano(enMano)],
          tip: E.tipFallo
        })
      });
    }
  };
}
