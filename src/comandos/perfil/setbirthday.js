import { getProfile } from "../../../motores/profile.js";
import { saveAccount } from "../../../motores/db.js";
import { leerCumple, guardarCumple, textoCumple } from "../../../motores/cumple.js";

export default {
  names: [".setbirthday", ".setbirth", ".setcumple"],
  desc: "Establecer tu fecha de cumpleaños en el perfil",
  category: "Perfil",
  usage: ".setbirthday <DD/MM> o <DD/MM/AA>",
  handler: async ({ sender, cleanText, reply }) => {
    const entrada = cleanText.split(/\s+/)[1];
    const fecha = leerCumple(entrada);
    if (!fecha) {
      return reply({
        text: [
          "⚙️ Uso: *.setbirthday <DD/MM>* o *.setbirthday <DD/MM/AA>*",
          "",
          "Ejemplos:",
          "• *.setbirthday 13/11* (día/mes)",
          "• *.setbirthday 13/11/26* (día/mes/año)",
          "• *.setbirthday 13/11/2026*"
        ].join("\n")
      });
    }
    const guardado = guardarCumple(fecha);
    const p = getProfile(sender);
    p.birthday = guardado;
    await saveAccount(sender);
    await reply({ text: `✅ Cumpleaños actualizado: *${textoCumple(guardado)}*` });
  }
};
