import { getAccount, addToWallet, saveAccount, checkCooldown } from "../../motores/db.js";
import { addXp, getProfile } from "../../motores/profile.js";
import { tarjeta, monto, elegir, entre, textoEspera, avisoNivel } from "./formato.js";

export const trabajosRegistrados = new Map();

export function ejecutarTrabajo(sender, trabajo) {
  const espera = checkCooldown(sender, trabajo.clave, trabajo.cooldownMs);
  if (espera > 0) return { enEspera: true, espera };

  const cuenta = getAccount(sender);
  const falla = trabajo.chanceFallo > 0 && Math.random() < trabajo.chanceFallo;

  if (!falla) {
    const suceso = elegir(trabajo.exitos);
    const ganancia = entre(suceso.min, suceso.max);
    addToWallet(sender, ganancia);
    const xp = Math.max(1, Math.round(ganancia / 10));
    const { leveledUp, newLevel } = addXp(sender, xp);
    return { enEspera: false, exito: true, relato: suceso.texto, monto: ganancia, xp, subioNivel: leveledUp, nivel: newLevel };
  }

  const suceso = elegir(trabajo.fallos);
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

      const enMano = getAccount(sender).wallet;
      if (r.exito) {
        await reply({
          text: tarjeta({
            emoji: trabajo.emoji,
            titulo: trabajo.tituloExito,
            relato: r.relato,
            lineas: [
              `🪙 *Ganancia* ›› +${monto(r.monto)}`,
              `✨ *Experiencia* ›› +${r.xp}`,
              `💰 *En mano* ›› ${monto(enMano)}`
            ],
            tip: "Usa *.dep* para guardar tu dinero."
          })
        });
        if (r.subioNivel) await reply({ text: avisoNivel(r.nivel) });
        return;
      }

      await reply({
        text: tarjeta({
          emoji: trabajo.emojiFallo || "⚠️",
          titulo: trabajo.tituloFallo,
          relato: r.relato,
          lineas: [
            `💸 *Pérdida* ›› -${monto(r.monto)}`,
            `💰 *En mano* ›› ${monto(enMano)}`
          ],
          tip: "Usa *.dep* para guardar tu dinero y protegerlo de futuras pérdidas."
        })
      });
    }
  };
}
