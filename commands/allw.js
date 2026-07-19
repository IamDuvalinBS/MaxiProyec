import { runWorkOnce, formatTime, box, CURRENCY } from "../core.js";

import trabajar from "./trabajar.js";
import minar from "./minar.js";
import crimen from "./crimen.js";
import explorar from "./explorar.js";
import mazmorra from "./mazmorra.js";
import espiar from "./espiar.js";
import vendedor from "./vendedor.js";
import migajear from "./migajear.js";
import influencer from "./influencer.js";
import youtuber from "./youtuber.js";
import superalbanil from "./superalbanil.js";
import ninero from "./ninero.js";
import uber from "./uber.js";

// Comandos tipo "trabajo" (usan runWorkOnce con su misma config real, no numeros copiados)
const TRABAJOS = [
  { emoji: "👷", nombre: "Trabajar", cmd: trabajar },
  { emoji: "⛏️", nombre: "Minar", cmd: minar },
  { emoji: "🕵️", nombre: "Crimen", cmd: crimen },
  { emoji: "🗺️", nombre: "Explorar", cmd: explorar },
  { emoji: "🏰", nombre: "Mazmorra", cmd: mazmorra },
  { emoji: "🕶️", nombre: "Espiar", cmd: espiar },
  { emoji: "🌭", nombre: "Vendedor", cmd: vendedor },
  { emoji: "🙏", nombre: "Migajear", cmd: migajear },
  { emoji: "📱", nombre: "Influencer", cmd: influencer },
  { emoji: "🎥", nombre: "Youtuber", cmd: youtuber },
  { emoji: "🧱", nombre: "Superalbañil", cmd: superalbanil },
  { emoji: "🍼", nombre: "Niñero", cmd: ninero },
  { emoji: "🚕", nombre: "Uber", cmd: uber }
  // .daily, .semanal, .cofre y .trivia quedan AFUERA a proposito (se reclaman aparte)
];

export default {
  names: [".allw", ".workall", ".trabajartodo"],
  desc: "Reclama automáticamente todos los trabajos disponibles (respeta cada cooldown)",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const lineas = [];
    let totalGanado = 0;
    let totalPerdido = 0;

    for (const t of TRABAJOS) {
      const r = runWorkOnce(sender, t.cmd.handler.config);
      if (r.onCooldown) {
        lineas.push(`${t.emoji} *${t.nombre}* ›› ⏳ en espera (${formatTime(r.wait)})`);
      } else if (r.exito) {
        totalGanado += r.monto;
        lineas.push(`${t.emoji} *${t.nombre}* ›› +${r.monto} ${CURRENCY}`);
      } else {
        totalPerdido += r.monto;
        lineas.push(`${t.emoji} *${t.nombre}* ›› -${r.monto} ${CURRENCY} (fallaste)`);
      }
    }

    const neto = totalGanado - totalPerdido;
    lineas.push("┋");
    lineas.push(`📊 *NETO TOTAL* ›› ${neto >= 0 ? "+" : ""}${neto} ${CURRENCY}`);

    await reply({ text: box("¡RECLAMO TOTAL!", lineas) });
  }
};
