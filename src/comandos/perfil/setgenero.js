import { getProfile, normalizarGenero, GENEROS } from "../../../motores/profile.js";
import { saveAccount } from "../../../motores/db.js";

export default {
  names: [".setgenero", ".setgender"],
  desc: "Establecer tu género en el perfil (hombre, mujer, gay o lesbiana)",
  category: "Perfil",
  usage: ".setgenero <hombre|mujer|gay|lesbiana>",
  handler: async ({ sender, cleanText, reply }) => {
    const entrada = cleanText.split(/\s+/).slice(1).join(" ").trim();
    const genero = normalizarGenero(entrada);
    if (!genero) {
      return reply({
        text: [
          "⚙️ Uso: *.setgenero <opción>*",
          "",
          "Opciones disponibles:",
          "• *hombre* (masculino)",
          "• *mujer* (femenino)",
          "• *gay*",
          "• *lesbiana*",
          "",
          "Ejemplo: *.setgenero mujer*"
        ].join("\n")
      });
    }
    const p = getProfile(sender);
    p.gender = genero;
    await saveAccount(sender);
    await reply({ text: `✅ Género actualizado: *${GENEROS[genero].nombre}*` });
  }
};
