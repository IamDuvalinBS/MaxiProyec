import { tarjeta, fmt } from "../../economia/formato-evento.js";
import { trabajosRegistrados } from "../../economia/trabajos.js";
import {
  resumenOficios, rachasDeVictorias, bonoVictorias, nivelOficio, bonoOficioPct,
  REPS_POR_NIVEL, NIVEL_OFICIO_MAX, BONO_OFICIO_POR_NIVEL, VICTORIAS_PARA_RACHA
} from "../../economia/carrera.js";

const nombreDe = (trabajo) => {
  const base = trabajo.names[0].slice(1);
  return base.charAt(0).toUpperCase() + base.slice(1);
};

export default {
  names: [".oficios", ".maestria", ".oficio"],
  usage: ".oficios",
  desc: "Tu maestría en cada trabajo: cuanto más lo repites, más paga",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const reps = resumenOficios(sender);
    const rachas = rachasDeVictorias(sender);
    const lista = [...trabajosRegistrados.values()]
      .map((t) => ({ t, n: reps[t.clave] || 0 }))
      .sort((a, b) => b.n - a.n);

    const lineas = lista.map(({ t, n }) => {
      const nivel = nivelOficio(n);
      const progreso = nivel >= NIVEL_OFICIO_MAX
        ? "nivel máximo"
        : `faltan ${fmt((nivel + 1) * REPS_POR_NIVEL - n)} para Nv ${nivel + 1}`;
      const racha = rachas[t.clave] || 0;
      const extra = racha >= VICTORIAS_PARA_RACHA ? `\n> 🔥 Racha de victorias: ${racha} (+${bonoVictorias(racha)}% extra)` : racha ? `\n> 🔥 Racha de victorias: ${racha}` : "";
      return `${t.emoji} *${nombreDe(t)}* ›› Nv ${nivel} (+${bonoOficioPct(n)}%) · ${fmt(n)} veces · ${progreso}${extra}`;
    });

    await reply({
      text: tarjeta({
        emoji: "🔁",
        titulo: "TUS OFICIOS",
        relato: `Cada ${REPS_POR_NIVEL} veces que repites un trabajo, subes su nivel y paga +${BONO_OFICIO_POR_NIVEL}% más (hasta Nv ${NIVEL_OFICIO_MAX}). Si ganas ${VICTORIAS_PARA_RACHA} veces seguidas el mismo trabajo, empieza una racha de victorias con ganancia extra.`,
        lineas,
        tip: ["La racha de victorias solo sube con el comando individual (no con *.allw*).", "Tu sueldo semanal y tus faltas están en *.sueldo*."]
      })
    });
  }
};
