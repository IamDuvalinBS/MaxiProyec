import { respaldarAhora, obtenerEstadoRespaldo, respaldoConfigurado } from "../../../motores/respaldo.js";
import { ownerCommand } from "../../../motores/owner.js";
import { tarjeta } from "../../economia/formato-evento.js";
import { estilo } from "../../economia/temas.js";

const ESTILOS = {
  normal: {
    emoji: "🗄️",
    tituloEstado: "ESTADO DEL RESPALDO",
    tituloListo: "RESPALDO COMPLETADO",
    frecuencia: (m) => `⏱️ *FRECUENCIA::* cada ${m} minutos`,
    nunca: "📭 *ÚLTIMO::* todavía no se ha ejecutado",
    fecha: (f) => `📅 *ÚLTIMO::* ${f}`,
    documentos: (n) => `📦 *DOCUMENTOS::* ${n}`,
    nuevos: (n) => `🆕 *NUEVOS::* ${n}`,
    actualizados: (n) => `♻️ *ACTUALIZADOS::* ${n}`,
    eliminados: (n) => `🗑️ *ELIMINADOS::* ${n}`,
    error: (e) => `❌ *ERROR::* ${e}`,
    colecciones: (n) => `📂 *COLECCIONES::* ${n}`,
    sinCambios: (n) => `✅ *SIN CAMBIOS::* ${n}`,
    tipEstado: "Usa .respaldo para ejecutar un respaldo inmediato.",
    tipListo: "Solo se copian los documentos que cambiaron desde el último respaldo.",
    esperando: "⏳ Respaldando los datos en Turso, espera un momento..."
  },
  halloween: {
    emoji: "🪦",
    tituloEstado: "ESTADO DEL RESPALDO MACABRO",
    tituloListo: "ALMAS RESGUARDADAS",
    frecuencia: (m) => `🕰️ *FRECUENCIA::* cada ${m} minutos`,
    nunca: "📭 *ÚLTIMO::* todavía no se ha ejecutado el ritual",
    fecha: (f) => `📅 *ÚLTIMO RITUAL::* ${f}`,
    documentos: (n) => `📜 *PERGAMINOS::* ${n}`,
    nuevos: (n) => `🆕 *NUEVOS::* ${n}`,
    actualizados: (n) => `🔮 *ACTUALIZADOS::* ${n}`,
    eliminados: (n) => `💀 *ELIMINADOS::* ${n}`,
    error: (e) => `☠️ *MALDICIÓN::* ${e}`,
    colecciones: (n) => `🏚️ *COLECCIONES::* ${n}`,
    sinCambios: (n) => `🕸️ *SIN CAMBIOS::* ${n}`,
    tipEstado: "Usa .respaldo para ejecutar un ritual de respaldo inmediato. 🕯️",
    tipListo: "Solo se guardan los pergaminos que cambiaron desde el último ritual. 🦇",
    esperando: "⏳ 🔮 Resguardando las almas en Turso, espera un momento..."
  }
};

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

    const E = estilo(ESTILOS);

    if (/\bestado\b/i.test(cleanText || "")) {
      const estado = obtenerEstadoRespaldo();
      const ultimo = estado.ultimo;
      const lineas = [E.frecuencia(estado.minutos)];
      if (!ultimo) {
        lineas.push(E.nunca);
      } else if (ultimo.ok) {
        lineas.push(
          E.fecha(formatearFecha(ultimo.fecha)),
          E.documentos(ultimo.total),
          E.nuevos(ultimo.nuevos),
          E.actualizados(ultimo.actualizados),
          E.eliminados(ultimo.eliminados)
        );
      } else {
        lineas.push(E.fecha(formatearFecha(ultimo.fecha)), E.error(ultimo.error));
      }
      return reply({
        text: tarjeta({
          emoji: E.emoji,
          titulo: E.tituloEstado,
          subtitulo: "TURSO",
          lineas,
          tip: E.tipEstado
        })
      });
    }

    await reply({ text: E.esperando });

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
        emoji: E.emoji,
        titulo: E.tituloListo,
        subtitulo: "TURSO",
        lineas: [
          E.colecciones(resultado.colecciones),
          E.documentos(resultado.total),
          E.nuevos(resultado.nuevos),
          E.actualizados(resultado.actualizados),
          E.eliminados(resultado.eliminados),
          E.sinCambios(resultado.sinCambios)
        ],
        tip: E.tipListo
      })
    });
  })
};
