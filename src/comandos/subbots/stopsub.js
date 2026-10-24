import { isOwner } from "../../../motores/owner.js";
import { quitarSubbot, canonico, mismoNumero, soloDigitos } from "../../subbots/gestor.js";

export default {
  names: [".stopsub", ".delsub"],
  usage: ".stopsub",
  desc: "Elimina tu subbot y cierra su sesión",
  category: "Subbots",
  handler: async ({ sender, cleanText, reply }) => {
    const resto = cleanText.replace(/^\S+\s*/, "");
    const argumento = soloDigitos(resto) ? canonico(resto) : "";
    const propio = sender.endsWith("@s.whatsapp.net") ? canonico(sender) : null;
    const numero = isOwner(sender) && argumento ? argumento : propio || argumento;

    if (!numero) return reply({ text: "⚙️ Uso: *.stopsub <tu número>*" });
    if (propio && argumento && !mismoNumero(argumento, propio) && !isOwner(sender)) {
      return reply({ text: "⚠️ Solo puedes eliminar tu propio subbot." });
    }

    await reply({ text: "🗑️ Eliminando el subbot y cerrando su sesión..." });
    const existia = await quitarSubbot(numero, { cerrarSesion: true });
    if (!existia) return reply({ text: "⚠️ No hay ningún subbot vinculado a ese número." });
    await reply({ text: "✅ El subbot fue eliminado y su sesión se borró por completo." }).catch(() => {});
  }
};
