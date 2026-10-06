import { getAccount } from "../../../motores/db.js";
import { trabajosRegistrados, ejecutarTrabajo } from "../../economia/trabajos.js";
import { tarjeta, monto, montoConSigno, avisoNivel } from "../../economia/formato.js";

function nombreDe(trabajo) {
  const base = trabajo.names[0].slice(1);
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export default {
  names: [".allw", ".todostrabajos"],
  desc: "Reclamar todos los trabajos disponibles (respeta cada espera)",
  category: "Trabajos",
  handler: async ({ sender, reply }) => {
    const lineas = [];
    let balance = 0;
    let xpTotal = 0;
    let nivel = null;
    let realizados = 0;

    for (const trabajo of trabajosRegistrados.values()) {
      const r = ejecutarTrabajo(sender, trabajo);
      if (r.enEspera) continue;
      realizados++;
      const delta = r.exito ? r.monto : -r.monto;
      balance += delta;
      xpTotal += r.xp;
      if (r.subioNivel) nivel = r.nivel;
      lineas.push(`${r.exito ? trabajo.emoji : trabajo.emojiFallo || "⚠️"} *${nombreDe(trabajo)}* ›› ${montoConSigno(delta)}`);
    }

    if (!realizados) {
      return reply({ text: "⏳ Todos los trabajos se encuentran en espera. Intenta nuevamente más tarde." });
    }

    await reply({
      text: tarjeta({
        emoji: "📋",
        titulo: "RESUMEN DE TRABAJOS",
        relato: `Se completaron ${realizados} trabajos disponibles en esta ocasión.`,
        lineas: [
          ...lineas,
          "",
          `📊 *Balance total* ›› ${montoConSigno(balance)}`,
          `✨ *Experiencia* ›› +${xpTotal}`,
          `💰 *En mano* ›› ${monto(getAccount(sender).wallet)}`
        ]
      })
    });
    if (nivel) await reply({ text: avisoNivel(nivel) });
  }
};
