import { respaldarAhora, obtenerEstadoRespaldo, respaldoConfigurado } from "../../../motores/respaldo.js";
import { ownerCommand } from "../../../motores/owner.js";
import { tarjeta } from "../../economia/formato.js";

function formatearFecha(marca) {
  return new Date(marca).toLocaleString("es-MX", { timeZone: "America/Mexico_City" });
}

export default {
  names: [".respaldo", ".respaldar", ".backup"],
  usage: ".respaldo | .respaldo estado",
  desc: "Copiar los datos de MongoDB a la base de respaldo en Turso, o ver el estado del último respaldo (solo owner)",
  category: "Owner",
  handler: ownerCommand(async ({ cleanText, reply }) => {
    if (!respaldoConfigurado()) {
      return reply({ text: "⚠️ El respaldo no está configurado. Faltan las variables *TURSO_URL* y *TURSO_TOKEN*." });
    }

    if (/\bestado\b/i.test(cleanText || "")) {
      const estado = obtenerEstadoRespaldo();
      const ultimo = estado.ultimo;
      const lineas = [`⏱️ *FRECUENCIA::* cada ${estado.minutos} minutos`];
      if (!ultimo) {
        lineas.push("📭 *ÚLTIMO::* todavía no se ha ejecutado");
      } else if (ultimo.ok) {
        lineas.push(
          `📅 *ÚLTIMO::* ${formatearFecha(ultimo.fecha)}`,
          `📦 *DOCUMENTOS::* ${ultimo.total}`,
          `🆕 *NUEVOS::* ${ultimo.nuevos}`,
          `♻️ *ACTUALIZADOS::* ${ultimo.actualizados}`,
          `🗑️ *ELIMINADOS::* ${ultimo.eliminados}`
        );
      } else {
        lineas.push(`📅 *ÚLTIMO::* ${formatearFecha(ultimo.fecha)}`, `❌ *ERROR::* ${ultimo.error}`);
      }
      return reply({
        text: tarjeta({
          emoji: "🗄️",
          titulo: "ESTADO DEL RESPALDO",
          subtitulo: "TURSO",
          lineas,
          tip: "Usa .respaldo para ejecutar un respaldo inmediato."
        })
      });
    }

    await reply({ text: "⏳ Respaldando los datos en Turso, espera un momento..." });

    let resultado;
    try {
      resultado = await respaldarAhora();
    } catch (e) {
      return reply({ text: "❌ No se pudo completar el respaldo: " + e.message });
    }

    if (resultado.omitido) {
      return reply({ text: "⚠️ Ya hay un respaldo o una restauración en curso. Intenta de nuevo en un momento." });
    }

    await reply({
      text: tarjeta({
        emoji: "🗄️",
        titulo: "RESPALDO COMPLETADO",
        subtitulo: "TURSO",
        lineas: [
          `📂 *COLECCIONES::* ${resultado.colecciones}`,
          `📦 *DOCUMENTOS::* ${resultado.total}`,
          `🆕 *NUEVOS::* ${resultado.nuevos}`,
          `♻️ *ACTUALIZADOS::* ${resultado.actualizados}`,
          `🗑️ *ELIMINADOS::* ${resultado.eliminados}`,
          `✅ *SIN CAMBIOS::* ${resultado.sinCambios}`
        ],
        tip: "Solo se copian los documentos que cambiaron desde el último respaldo."
      })
    });
  })
};
