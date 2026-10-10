import { gachaListo, arroba, CAT, restanteCooldown } from "../../../motores/gacha-core.js";
import { encabezado } from "../../../src/economia/estilo.js";
import { tiempoLargo } from "../../../src/economia/estilo.js";

const ORDEN = [
  { categoria: "snake", nombre: "Snake" },
  { categoria: "brawler", nombre: "Brawl Stars" },
  { categoria: "pokemon", nombre: "Pokémon" },
  { categoria: "waifu", nombre: "Waifu" },
  { categoria: "cod", nombre: "Call of Duty" },
  { categoria: "dragon", nombre: "Dragon Mania" },
  { categoria: "clash", nombre: "Clash Royale" }
];

export default {
  names: [".rwinfo", ".infogacha"],
  desc: "Muestra el tiempo de espera que te falta para usar cada comando de gacha",
  category: "Gacha",
  usage: ".infogacha | .infogacha @usuario",
  handler: async ({ sender, msg, reply }) => {
    await gachaListo;
    const contexto = msg.message?.extendedTextMessage?.contextInfo;
    const objetivo = contexto?.mentionedJid?.[0] || contexto?.participant || sender;

    const partes = [
      encabezado("⏱️", "Cooldown del Gacha"),
      "",
      `> El tiempo de recarga faltante para los comandos de Gacha. ${arroba(objetivo)}`,
      ""
    ];

    for (const { categoria, nombre } of ORDEN) {
      const restante = restanteCooldown(`roll:${categoria}:${objetivo}`);
      partes.push(`ⴵ ${nombre} » `);
      partes.push(restante > 0 ? `> *En cooldown, ${tiempoLargo(restante)}.*` : "> *Puedes usarlo*");
    }

    partes.push("", "> Usa *.menu Gacha* para ver los otros comandos del Gacha.");
    return reply({ text: partes.join("\n"), mentions: [objetivo] });
  }
};
