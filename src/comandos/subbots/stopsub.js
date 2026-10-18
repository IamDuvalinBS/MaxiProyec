import { isOwner } from "../../../motores/owner.js";
import { quitarSubbot } from "../../subbots/gestor.js";

export default {
  names: [".stopsub", ".delsub"],
  usage: ".stopsub",
  desc: "Elimina tu subbot y cierra su sesión",
  category: "Subbots",
  handler: async ({ sender, cleanText, reply }) => {
    const argumento = (cleanText.split(/\s+/)[1] || "").replace(/\D/g, "");
    const propio = sender.endsWith("@s.whatsapp.net") ? sender.split("@")[0].split(":")[0] : null;
    const numero = isOwner(sender) && argumento ? argumento : propio || argumento;

    if (!numero) return reply({ text: "⚙️ Uso: *.stopsub <tu número con código de país>*" });
    if (propio && argumento && argumento !== propio && !isOwner(sender)) {
      return reply({ text: "⚠️ Solo puedes eliminar tu propio subbot." });
    }

    await reply({ text: "🗑️ Eliminando el subbot y cerrando su sesión..." });
    const existia = await quitarSubbot(numero, { cerrarSesion: true });
    if (!existia) return reply({ text: "⚠️ No hay ningún subbot vinculado a ese número." });
    await reply({ text: "✅ El subbot fue eliminado y su sesión se borró por completo." }).catch(() => {});
  }
};
