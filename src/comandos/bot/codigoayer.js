import path from "path";
import { isOwner } from "../../../motores/owner.js";
import { buscarArchivos } from "../../../motores/codigo-rico.js";
import {
  SUFIJO, listarRespaldos, elegirRespaldo, horaDeRespaldo, hacerRespaldo, fechaLocal
} from "../../../motores/respaldo-codigo.js";

const MIME = { ".js": "text/javascript", ".mjs": "text/javascript", ".cjs": "text/javascript", ".json": "application/json", ".html": "text/html", ".css": "text/css", ".md": "text/markdown" };

export default {
  names: [".ayer", ".codigoayer", ".backupcodigo"],
  usage: ".ayer <archivo> [días] | .ayer lista",
  desc: "Te manda el archivo tal como estaba hace 1 día (o los días que digas), por si algo se rompe al editar",
  category: "Owner",
  handler: async ({ sock, from, msg, sender, cleanText, reply }) => {
    if (!isOwner(sender)) return reply({ text: "🚫 Este comando solo puede ser utilizado por owners." });

    const fichas = cleanText.split(/\s+/).slice(1).filter(Boolean);

    if (!fichas.length || fichas[0].toLowerCase() === "lista") {
      const lista = listarRespaldos();
      if (!lista.length) {
        await hacerRespaldo().catch(() => {});
        return reply({ text: "🗂️ Todavía no había respaldos; acabo de crear el de hoy. Mañana ya podrás pedir la versión de ayer con *.ayer <archivo>*." });
      }
      const filas = lista.slice().reverse().map((f) => `• ${f}${f === fechaLocal() ? " (hoy)" : ""} — ${horaDeRespaldo(f)}`);
      return reply({ text: `🗂️ *Respaldos del código* (uno por día)\n${filas.join("\n")}\n\n> Uso: *.ayer <archivo> [días]*. Ejemplo: *.ayer gacha-core* o *.ayer gacha-core 2*.` });
    }

    let dias = 1;
    if (fichas.length > 1 && /^\d+$/.test(fichas[fichas.length - 1])) dias = Number(fichas.pop());
    const consulta = fichas.join(" ");

    const respaldo = elegirRespaldo(dias);
    if (!respaldo) {
      await hacerRespaldo().catch(() => {});
      return reply({ text: "🗂️ Todavía no había respaldos; acabo de crear el de hoy. Mañana ya podrás pedir la versión de ayer." });
    }

    const hallados = buscarArchivos(consulta, { base: respaldo.dir, sufijo: SUFIJO });
    if (!hallados.length) return reply({ text: `❌ No hay ningún archivo *${consulta}* en el respaldo del ${respaldo.fecha}. Puede que no existiera todavía ese día.` });
    if (hallados.length > 1) {
      const lista = hallados.slice(0, 12).map((r) => `• ${r}`).join("\n");
      return reply({ text: `🔎 Hay ${hallados.length} archivos parecidos, escribe la ruta completa:\n${lista}${hallados.length > 12 ? "\n…" : ""}` });
    }

    const rel = hallados[0];
    const abs = path.join(respaldo.dir, rel + SUFIJO);
    const aviso = respaldo.aproximado
      ? `\n⚠️ Aún no hay un respaldo de hace ${dias} día(s); este es el más antiguo disponible.`
      : "";
    try {
      await sock.sendMessage(
        from,
        {
          document: { url: abs },
          mimetype: MIME[path.extname(rel).toLowerCase()] || "text/plain",
          fileName: path.basename(rel),
          caption: `🗂️ *${rel}* — versión del ${respaldo.fecha} (${horaDeRespaldo(respaldo.fecha)}).${aviso}\n> Para restaurarlo, reemplaza el archivo en *${path.dirname(rel) === "." ? "la carpeta principal" : path.dirname(rel) + "/"}*.`
        },
        { quoted: msg }
      );
    } catch (e) {
      await reply({ text: `❌ No pude enviar el respaldo: ${e.message}` });
    }
  }
};
