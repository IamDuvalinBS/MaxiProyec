import { reiniciarEsperas } from "../../../motores/db.js";
import { ownerCommand } from "../../../motores/owner.js";
import { trabajosRegistrados } from "../../economia/trabajos.js";
import { limpiarEnfriamientos } from "../../nucleo/espera.js";
import { tarjeta } from "../../economia/formato.js";

const CLAVES_ECONOMIA = ["daily", "semanal", "cofre", "trivia"];

export default {
  names: [".resetesperas", ".resetcd"],
  usage: ".resetesperas",
  desc: "Reiniciar las esperas de economía de todos los usuarios (solo owner)",
  category: "Utilidad",
  handler: ownerCommand(async ({ reply }) => {
    const claves = [...new Set([...CLAVES_ECONOMIA, ...trabajosRegistrados.keys()])];
    const cuentas = reiniciarEsperas(claves);
    limpiarEnfriamientos();

    await reply({
      text: tarjeta({
        emoji: "🧹",
        titulo: "ESPERAS REINICIADAS!",
        relato: "Se reiniciaron las esperas de economía de todos los usuarios.",
        lineas: [`👥 *CUENTAS AFECTADAS::* ${cuentas}`],
        tip: "Los comandos de economía ya pueden utilizarse nuevamente."
      })
    });
  })
};
