import { gachaListo } from "../../../motores/gacha-core.js";
import { revisarMigracion, avisarMigracion, resolverMigracion } from "../../../motores/gacha-migracion.js";

export default {
  names: [".migrar", ".ajusteniveles"],
  desc: "Elige qué hacer con los niveles que bajaron en el ajuste (monedas o niveles)",
  category: "Gacha",
  usage: ".migrar <monedas|niveles>",
  handler: async ({ from, sender, cleanText, reply }) => {
    await gachaListo;
    const arg = String(cleanText.split(/\s+/)[1] || "").toLowerCase();
    const opcion = ["monedas", "moneda", "1"].includes(arg) ? "monedas" : ["niveles", "nivel", "2"].includes(arg) ? "niveles" : null;
    if (!opcion) {
      if (await revisarMigracion({ sender, from, reply, forzar: true })) return;
      return reply({ text: "✅ No tienes ajustes de niveles pendientes." });
    }
    await revisarMigracion({ sender, from, reply: async () => {} });
    const r = resolverMigracion(sender, opcion);
    return reply({ text: r || "✅ No tienes ajustes de niveles pendientes.", mentions: [sender] });
  }
};
