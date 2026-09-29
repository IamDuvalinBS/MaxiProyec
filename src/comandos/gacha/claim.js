import { reclamar } from "../../../motores/gacha-db.js";
import {
  gachaListo, buscarPendiente, cerrarPendiente, idMensajeCitado, tarjeta, monto, arroba
} from "../../../motores/gacha-core.js";

export default {
  names: [".claim", ".c", ".reclamar"],
  desc: "Reclama el último personaje generado (respondiendo al mensaje o justo después del roll)",
  category: "Gacha",
  handler: async ({ from, sender, msg, reply }) => {
    await gachaListo;
    const pendiente = buscarPendiente(from, idMensajeCitado(msg), sender);
    if (!pendiente) return reply({ text: "❌ No hay nada para reclamar ahora (pasaron los 30 segundos o ya fue reclamado)." });
    if (pendiente.exclusivo && pendiente.dueno !== sender) {
      return reply({ text: `🔒 Este roll es de ${arroba(pendiente.dueno)}, solo esa persona puede reclamarlo.`, mentions: [pendiente.dueno] });
    }

    const p = pendiente.personaje;
    const resultado = reclamar(sender, p);
    if (resultado === "ocupado") {
      cerrarPendiente(pendiente.id);
      return reply({ text: "💨 Alguien fue más rápido, ya la reclamaron." });
    }
    if (resultado === "repetido") {
      cerrarPendiente(pendiente.id);
      return reply({ text: `📦 Ya tenés a *${p.nombre}*.` });
    }

    cerrarPendiente(pendiente.id);
    await reply({
      text: tarjeta({
        emoji: "🎉", titulo: "¡RECLAMADO!",
        lineas: [
          `👤 ${arroba(sender)} se quedó con *${p.nombre}*`,
          `✨ *Rareza* ›› ${p.rareza}`,
          `💴 *Valor* ›› ${monto(p.valor)}`
        ]
      }),
      mentions: [sender]
    });
  }
};
