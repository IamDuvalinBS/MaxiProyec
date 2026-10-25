import { addToWallet } from "../../../motores/db.js";
import { ownerGacha } from "../../../motores/gacha-owners.js";
import { duplicadosGacha, limpiarDuplicadosGacha } from "../../../motores/gacha-db.js";
import { gachaListo } from "../../../motores/gacha-core.js";

export default {
  names: [".duplicados"],
  desc: "Owner: muestra o limpia los personajes con más de un dueño",
  category: "Gacha",
  usage: ".duplicados [limpiar]",
  handler: ownerGacha(async ({ cleanText, reply }) => {
    await gachaListo;
    const lista = duplicadosGacha();
    if (!lista.length) return reply({ text: "✅ No hay personajes con más de un dueño." });

    if (cleanText.split(/\s+/)[1]?.toLowerCase() === "limpiar") {
      const { quitados, reembolsos } = limpiarDuplicadosGacha();
      for (const [usuario, monto] of reembolsos) addToWallet(usuario, monto);
      return reply({ text: `🧹 Listo: se quitaron *${quitados}* copias repetidas.\nSe quedó con el personaje quien tenía más nivel (o el primero en reclamarlo) y a los demás se les devolvió su valor en monedas.` });
    }

    const por = new Map();
    for (const d of lista) por.set(d.personaje.categoria, (por.get(d.personaje.categoria) || 0) + 1);
    const resumen = [...por].map(([c, n]) => `> ${c} ›› ${n}`).join("\n");
    const ejemplos = lista.slice(0, 8).map((d) => `• ${d.personaje.nombre} (#${d.personaje.id}) ›› ${d.quitar.length + 1} dueños`).join("\n");
    return reply({ text: `🔎 *Personajes con varios dueños:* ${lista.length}\n${resumen}\n\n${ejemplos}\n\nUsa *.duplicados limpiar* para dejar un solo dueño (se queda quien tenga más nivel; a los demás se les devuelve el valor en monedas).` });
  })
};
