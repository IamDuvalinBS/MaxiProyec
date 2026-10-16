import { ownerGacha } from "../../../motores/gacha-owners.js";
import {
  VARIANTES, LIMITE_TEXTO_CLAIM, PREFIJO_CLAIM, resolverVariante, listaVariantes, guardarClaim
} from "../../../motores/gacha-claim.js";

const USO = [
  "⚙️ Uso: *.setclaim <texto> • <variante>*",
  "",
  "> Cambia el texto que aparece al reclamar un personaje de esa variante. El inicio *#✿* se mantiene fijo.",
  "> Variables opcionales: *{user}*, *{personaje}* y *{variante}*.",
  "",
  "Ejemplos:",
  "*.setclaim Este personaje ahora es mío • Pokemon*",
  "*.setclaim {user} reclamó a {personaje} • Waifus*",
  "*.setclaim reset • Pokemon*",
  "",
  `Variantes: ${listaVariantes()}.`,
  "Usa *todos* como variante para aplicar el cambio a todas."
].join("\n");

export default {
  names: [".setclaim"],
  usage: ".setclaim <texto> • <variante>",
  desc: "Cambiar el mensaje de reclamación de cada gacha (solo owner)",
  category: "Gacha",
  handler: ownerGacha(async ({ cleanText, reply }) => {
    const resto = cleanText.replace(/^\S+\s*/, "").trim();
    const m = resto.match(/^([\s\S]*?)\s*[•|]\s*([^•|]+)$/);
    if (!m) return reply({ text: USO });

    const texto = m[1].trim();
    const categoria = resolverVariante(m[2]);
    if (!categoria) return reply({ text: `❌ No reconozco la variante *${m[2].trim()}*.\n\nVariantes: ${listaVariantes()}.` });
    if (!texto) return reply({ text: USO });

    const nombre = categoria === "todos" ? "todas las variantes" : VARIANTES[categoria].nombre;

    if (/^(reset|restablecer|default)$/i.test(texto)) {
      await guardarClaim(categoria, null);
      return reply({ text: `✅ Se restableció el mensaje de reclamación de *${nombre}*.` });
    }

    if (texto.length > LIMITE_TEXTO_CLAIM) {
      return reply({ text: `❌ El mensaje es demasiado largo. El máximo es de ${LIMITE_TEXTO_CLAIM} caracteres.` });
    }

    await guardarClaim(categoria, texto);
    return reply({ text: `✅ Mensaje de reclamación de *${nombre}* actualizado:\n\n${PREFIJO_CLAIM}${texto}` });
  })
};
