import { personajeAleatorio } from "../../../motores/gacha-db.js";
import { asegurarBrawlers, sincronizarBrawlers } from "../../../motores/gacha-brawl.js";
import { hacerRoll, gachaListo } from "../../../motores/gacha-core.js";
import { esOwnerGacha } from "../../../motores/gacha-owners.js";

const COOLDOWN_MS = 10 * 60 * 1000;

export default {
  names: [".brawlstars", ".brawl"],
  desc: "Genera un Brawler al azar para reclamar con .claim (cada 10 minutos)",
  category: "Gacha",
  usage: ".brawlstars",
  handler: async ({ from, sender, cleanText, reply }) => {
    await gachaListo;

    if (cleanText.split(/\s+/)[1]?.toLowerCase() === "actualizar") {
      if (!esOwnerGacha(sender)) return reply({ text: "🚫 Solo los owners pueden actualizar la lista de brawlers." });
      try {
        const r = await sincronizarBrawlers();
        return reply({ text: `✅ Brawlers sincronizados. Total en la API: ${r.total}. Nuevos: ${r.nuevos}.` });
      } catch (e) {
        console.log("[gacha] Brawlify (actualizar):", e.message);
        return reply({ text: `❌ No pude consultar Brawlify: ${e.message}` });
      }
    }

    try {
      await asegurarBrawlers();
    } catch (e) {
      console.log("[gacha] Brawlify (cargar):", e.message);
      return reply({ text: `❌ No pude cargar los brawlers desde Brawlify: ${e.message}` });
    }

    await hacerRoll({
      categoria: "brawler",
      obtener: async () => personajeAleatorio("brawler"),
      reply, sender, from,
      cooldownMs: COOLDOWN_MS,
      titulo: "BRAWLER",
      textoVacio: "❌ No hay brawlers cargados todavía."
    });
  }
};
