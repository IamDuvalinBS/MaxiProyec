import { restaurarDesdeRespaldo, respaldoConfigurado } from "../../../motores/respaldo.js";
import { ownerCommand } from "../../../motores/owner.js";
import { tarjeta } from "../../economia/formato.js";

export default {
  names: [".restaurar", ".restore"],
  usage: ".restaurar confirmar",
  desc: "Restaurar en MongoDB los datos guardados en la base de respaldo de Turso (solo owner)",
  category: "Owner",
  handler: ownerCommand(async ({ cleanText, reply }) => {
    if (!respaldoConfigurado()) {
      return reply({ text: "⚠️ El respaldo no está configurado. Faltan las variables *TURSO_URL* y *TURSO_TOKEN*." });
    }

    if (!/\bconfirmar\b/i.test(cleanText || "")) {
      return reply({
        text:
          "⚠️ Este comando sobrescribe en MongoDB los documentos que existen en el respaldo de Turso.\n\n" +
          "> Para continuar escribe: *.restaurar confirmar*"
      });
    }

    await reply({ text: "⏳ Restaurando los datos desde Turso, espera un momento..." });

    let resumen;
    try {
      resumen = await restaurarDesdeRespaldo();
    } catch (e) {
      return reply({ text: "❌ No se pudo restaurar el respaldo: " + e.message });
    }

    const lineas = Object.entries(resumen).map(([coleccion, cantidad]) => `📂 *${coleccion.toUpperCase()}::* ${cantidad}`);

    await reply({
      text: tarjeta({
        emoji: "♻️",
        titulo: "RESTAURACIÓN COMPLETADA",
        subtitulo: "TURSO",
        lineas,
        tip: "Los datos ya fueron cargados de nuevo en MongoDB y en la memoria del bot."
      })
    });
  })
};
