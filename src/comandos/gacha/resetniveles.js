import { ownerGacha } from "../../../motores/gacha-owners.js";
import { encabezado } from "../../../src/economia/estilo.js";
import { gachaListo, arroba, fmt, CAT } from "../../../motores/gacha-core.js";
import { categoriaPorAlias } from "../../../motores/gacha-categorias.js";
import { reiniciarNivelesExcepto } from "../../../motores/gacha-db.js";

const PALABRAS_EXCEPTO = ["excepto", "excepcion", "excepción", "menos", "salvo"];

function leerIds(partes) {
  const inicio = partes.findIndex((x) => PALABRAS_EXCEPTO.includes(x));
  if (inicio < 0) return [];
  const ids = [];
  for (const x of partes.slice(inicio + 1)) {
    if (x === "confirmar") break;
    if (x.startsWith("@")) continue;
    for (const trozo of x.replace(/[#{}]/g, "").split(",")) {
      if (/^\d{1,9}$/.test(trozo)) ids.push(Number(trozo));
    }
  }
  return [...new Set(ids)];
}

export default {
  names: [".resetniveles", ".reiniciarniveles"],
  desc: "Reinicia a nivel 0 los personajes de un usuario, salvo los que él mismo subió: .resetniveles todos excepto <ID>, <ID> @usuario (solo owners)",
  category: "Owner",
  usage: ".resetniveles <todos|categorías> excepto <ID>, <ID> @usuario [confirmar]",
  handler: ownerGacha(async ({ cleanText, msg, reply }) => {
    await gachaListo;
    const partes = cleanText.split(/\s+/).slice(1).map((x) => x.toLowerCase());
    const contexto = msg.message?.extendedTextMessage?.contextInfo;
    const usuario = contexto?.mentionedJid?.[0] || contexto?.participant || null;
    const confirmado = partes.includes("confirmar");
    const antesDeExcepto = partes.findIndex((x) => PALABRAS_EXCEPTO.includes(x));
    const zonaCategorias = antesDeExcepto < 0 ? partes : partes.slice(0, antesDeExcepto);
    const categorias = [...new Set(zonaCategorias.flatMap((x) => x.split(",")).map((x) => categoriaPorAlias(x)).filter(Boolean))];
    const ids = leerIds(partes);

    if (!usuario) {
      return reply({
        text: [
          encabezado("🔄", "REINICIAR NIVELES"),
          "",
          "✱ *Uso* ›› .resetniveles todos excepto <ID>, <ID> @usuario",
          "✿ *Ejemplo* ›› .resetniveles todos excepto 120, 3521, 87 @usuario",
          "✿ *Por categorías* ›› .resetniveles pokemon waifu excepto 120, 87 @usuario",
          "",
          "> Deja en *nivel 0* todos los personajes de esa persona, menos los ID que ella indique haber subido por su cuenta.",
          "> En lugar de *todos* puedes escribir una o varias categorías: *waifu*, *pokemon*, *brawl*, *snake*, *cod*, *dragon* y *clash*.",
          "> Sin la palabra *confirmar* solo se muestra una vista previa.",
          "> Las estrellas de ascensión no se tocan."
        ].join("\n")
      });
    }

    const r = reiniciarNivelesExcepto(usuario, ids, { categorias, soloContar: !confirmado });
    const lineas = [
      encabezado("🔄", confirmado ? "NIVELES REINICIADOS" : "VISTA PREVIA"),
      "",
      `👤 *Usuario* ›› ${arroba(usuario)}${categorias.length ? ` (${categorias.map((c) => CAT[c].plural).join(", ")})` : " (todas las categorías)"}`,
      `${confirmado ? "✅" : "➖"} *Personajes ${confirmado ? "reiniciados" : "que se reiniciarían"}* ›› ${fmt(r.reiniciados)}`,
      `📊 *Niveles que se quitan* ›› ${fmt(r.niveles)}`
    ];
    if (r.conservados.length) {
      lineas.push("", "🔒 *Se conservan* ››");
      for (const c of r.conservados) lineas.push(`> · ${c.nombre} (#${c.id}) ›› Nv. ${c.nivel}`);
    }
    if (r.ajenos.length) {
      lineas.push("", `> ⚠️ Esta persona no tiene los ID: ${r.ajenos.map((x) => `#${x}`).join(", ")}. Revisa que estén bien escritos.`);
    }
    if (!ids.length) lineas.push("", "> ⚠️ No indicaste ningún ID a conservar: se reiniciarían *todos* sus personajes.");
    if (!confirmado) lineas.push("", "> Para aplicarlo escribe el mismo comando agregando *confirmar*.");
    return reply({ text: lineas.join("\n"), mentions: [usuario] });
  })
};
