import { gachaListo, CAT, tarjeta } from "../../../motores/gacha-core.js";
import { PASES, reclamarPase, paseReclamado } from "../../../motores/gacha-pases.js";

export default {
  names: [".pase", ".pases", ".reclamarpase"],
  desc: "Reclama un pase de gacha con su código: .pase CÓDIGO (los códigos están en la sección Pases de la página)",
  category: "Gacha",
  usage: ".pase CÓDIGO",
  handler: async ({ cleanText, sender, reply }) => {
    await gachaListo;
    const codigo = String(cleanText || "").trim().split(/\s+/).slice(1).join("");

    if (!codigo) {
      return reply({
        text: tarjeta({
          emoji: "🎫",
          titulo: "PASES",
          lineas: [
            ...PASES.map((p) => `${p.emoji} *${p.nombre}* ›› ${paseReclamado(sender, p) ? "Reclamado ✅" : "Disponible 🎁"}`),
            "",
            "✱ *Uso* ›› .pase CÓDIGO"
          ],
          tip: "Los códigos están en la sección Pases de la página."
        })
      });
    }

    const r = reclamarPase(sender, codigo);
    if (r.error === "nocodigo") {
      return reply({ text: "❌ Ese código no existe. Revísalo en la sección Pases de la página." });
    }
    if (r.error === "repetido") {
      return reply({ text: `⚠️ Ya reclamaste el *${r.pase.nombre}*. Solo se puede una vez por persona.` });
    }

    const cat = CAT[r.pase.categoria];
    return reply({
      text: tarjeta({
        emoji: r.pase.emoji,
        titulo: "PASE RECLAMADO",
        lineas: [
          `🎫 *Pase* ›› ${r.pase.nombre}`,
          `🎟️ *Tickets recibidos* ›› ${r.pase.tickets}`,
          `🎟️ *Total de ${cat.plural}* ›› ${r.total}`
        ],
        tip: `Usa tus tickets con *${cat.ticketCmd}*.`
      })
    });
  }
};
