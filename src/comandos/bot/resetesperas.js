import { reiniciarEsperas } from "../../../motores/db.js";
import { ownerCommand } from "../../../motores/owner.js";
import { trabajosRegistrados } from "../../economia/trabajos.js";
import { limpiarEnfriamientos } from "../../nucleo/espera.js";
import { tarjeta } from "../../economia/formato-evento.js";
import { estilo } from "../../economia/temas.js";

const ESTILOS = {
  normal: {
    emoji: "🧹",
    titulo: "ESPERAS REINICIADAS!",
    relato: "Se reiniciaron las esperas de economía de todos los usuarios.",
    cuentas: (n) => `👥 *CUENTAS AFECTADAS::* ${n}`,
    tip: "Los comandos de economía ya pueden utilizarse nuevamente."
  },
  halloween: {
    emoji: "🔮",
    titulo: "HECHIZO DE DESPERTAR!",
    relato: "Un conjuro despertó a todos los espíritus: se reiniciaron las esperas de economía de todas las almas. 👻",
    cuentas: (n) => `🧟 *ALMAS AFECTADAS::* ${n}`,
    tip: "Los comandos de economía ya pueden usarse otra vez. ¡Que comience la noche! 🌙"
  }
};

const CLAVES_ECONOMIA = ["daily", "semanal", "cofre", "trivia"];

export default {
  names: [".resetesperas", ".resetcd"],
  usage: ".resetesperas",
  desc: "Reiniciar las esperas de economía de todos los usuarios (solo owner)",
  category: "Owner",
  handler: ownerCommand(async ({ reply }) => {
    const E = estilo(ESTILOS);
    const claves = [...new Set([...CLAVES_ECONOMIA, ...trabajosRegistrados.keys()])];
    const cuentas = reiniciarEsperas(claves);
    limpiarEnfriamientos();

    await reply({
      text: tarjeta({
        emoji: E.emoji,
        titulo: E.titulo,
        relato: E.relato,
        lineas: [E.cuentas(cuentas)],
        tip: E.tip
      })
    });
  })
};
