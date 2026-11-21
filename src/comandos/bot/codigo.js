import fs from "fs";
import path from "path";
import { isOwner } from "../../../motores/owner.js";
import { RAIZ, buscarArchivos, leerArchivoTexto, enviarCodigo } from "../../../motores/codigo-rico.js";

export default {
  names: [".codigo", ".vercodigo", ".verarchivo"],
  usage: ".codigo <archivo> [parte] [texto]",
  desc: "Ver el código de cualquier archivo del bot, esté en la carpeta que esté (ej: .codigo gacha-core)",
  category: "Owner",
  handler: async ({ sock, from, msg, sender, cleanText, reply }) => {
    if (!isOwner(sender)) return reply({ text: "🚫 Este comando solo puede ser utilizado por owners." });

    const fichas = cleanText.split(/\s+/).slice(1).filter(Boolean);
    const forzarTexto = fichas.some((f) => f.toLowerCase() === "texto");
    const limpias = fichas.filter((f) => f.toLowerCase() !== "texto");
    let parte = 1;
    if (limpias.length > 1 && /^\d+$/.test(limpias[limpias.length - 1])) parte = Number(limpias.pop());
    const consulta = limpias.join(" ");

    if (!consulta) {
      return reply({ text: "📄 Uso: *.codigo <archivo>*\n> Ejemplos: *.codigo gacha-core*, *.codigo motores/owner.js*, *.codigo gacha-core 2* (parte 2), *.codigo gacha-core texto* (sin formato rico)." });
    }

    const hallados = buscarArchivos(consulta);
    if (!hallados.length) return reply({ text: `❌ No encontré ningún archivo que coincida con *${consulta}*.` });
    if (hallados.length > 1) {
      const lista = hallados.slice(0, 12).map((r) => `• ${r}`).join("\n");
      return reply({ text: `🔎 Hay ${hallados.length} archivos parecidos, escribe la ruta completa:\n${lista}${hallados.length > 12 ? "\n…" : ""}` });
    }

    const rel = hallados[0];
    const abs = path.join(RAIZ, rel);
    try {
      const { texto, demasiadoGrande, bytes } = leerArchivoTexto(abs);
      if (demasiadoGrande) {
        await reply({ text: `📦 *${rel}* pesa ${(bytes / 1024).toFixed(0)} KB, es demasiado para mostrarlo en pantalla. Te lo mando como archivo.` });
        await sock.sendMessage(from, { document: { url: abs }, mimetype: "text/plain", fileName: path.basename(rel) }, { quoted: msg });
        return;
      }
      await enviarCodigo({ sock, from, reply, rutaRel: rel, texto, desdeParte: parte, forzarTexto });
    } catch (e) {
      await reply({ text: `❌ No pude leer *${rel}*: ${e.message}` });
    }
  }
};
