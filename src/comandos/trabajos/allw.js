import { getAccount } from "../../../motores/db.js";
import { trabajosRegistrados, ejecutarTrabajo, vistaDe } from "../../economia/trabajos.js";
import { tarjeta, monto, montoConSigno, avisoNivel } from "../../economia/formato-evento.js";
import { estilo } from "../../economia/temas.js";

const ESTILOS = {
  normal: {
    emoji: "📋",
    titulo: "RESUMEN DE TRABAJOS",
    todosEnEspera: "⏳ Todos los trabajos se encuentran en espera. Intenta nuevamente más tarde.",
    relato: (n) => `Se completaron ${n} trabajos disponibles en esta ocasión.`,
    balance: (n) => `📊 *BALANCE::* ${montoConSigno(n)}`,
    experiencia: (n) => `✨ *EXPERIENCIA::* +${n}`,
    tip: (cartera) => `Tu cartera ahora tiene *${monto(cartera)}*.`
  },
  halloween: {
    emoji: "📜",
    titulo: "RESUMEN DE LA NOCHE EMBRUJADA",
    todosEnEspera: "⏳ 🕸️ Todos los espíritus siguen dormidos. Intenta nuevamente más tarde. 🦇",
    relato: (n) => `Se completaron ${n} trabajos embrujados durante esta noche. 🌙`,
    balance: (n) => `🔮 *BALANCE MACABRO::* ${montoConSigno(n)}`,
    experiencia: (n) => `🦇 *EXPERIENCIA::* +${n}`,
    tip: (cartera) => `Tu caldero ahora guarda *${monto(cartera)}*. 🧙‍♀️`
  }
};

function nombreDe(trabajo) {
  const base = trabajo.names[0].slice(1);
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export default {
  names: [".allw", ".todostrabajos"],
  desc: "Reclamar todos los trabajos disponibles (respeta cada espera)",
  category: "Trabajos",
  handler: async ({ sender, reply }) => {
    const E = estilo(ESTILOS);
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
      const vista = vistaDe(trabajo);
      lineas.push(`${r.exito ? vista.emoji : vista.emojiFallo || "⚠️"} *${nombreDe(trabajo)}* ›› ${montoConSigno(delta)}`);
    }

    if (!realizados) {
      return reply({ text: E.todosEnEspera });
    }

    await reply({
      text: tarjeta({
        emoji: E.emoji,
        titulo: E.titulo,
        relato: E.relato(realizados),
        lineas: [...lineas, "", E.balance(balance), E.experiencia(xpTotal)],
        tip: E.tip(getAccount(sender).wallet)
      })
    });
    if (nivel) await reply({ text: avisoNivel(nivel) });
  }
};
