import { ownerGacha } from "../../../motores/gacha-owners.js";
import { gachaListo, tarjeta, monto, CAT } from "../../../motores/gacha-core.js";
import { resumenGacha, listarPersonajes, contarPersonajes } from "../../../motores/gacha-db.js";

const ALIAS = {
  waifu: "waifu", waifus: "waifu", rw: "waifu",
  pokemon: "pokemon", poke: "pokemon", pokemons: "pokemon",
  brawl: "brawler", brawlstars: "brawler", brawler: "brawler", brawlers: "brawler",
  snake: "snake", snakes: "snake"
};
const POR_PAGINA = 20;

export default {
  names: [".rwinfo", ".wachainfo", ".gachainfo", ".waifuinfo"],
  desc: "Estadísticas y lista de personajes del gacha (solo owners)",
  category: "Gacha",
  usage: ".rwinfo [waifu|pokemon|brawl|snake] [página]",
  handler: ownerGacha(async ({ cleanText, reply }) => {
    await gachaListo;
    const partes = cleanText.split(/\s+/).slice(1).map((x) => x.toLowerCase());
    const categoria = ALIAS[partes[0]];

    // ---- lista de una categoría ----
    if (categoria) {
      const total = contarPersonajes(categoria);
      if (!total) return reply({ text: `📭 No hay personajes cargados en ${CAT[categoria].singular}.` });
      const paginas = Math.ceil(total / POR_PAGINA);
      const pagina = Math.min(paginas, Math.max(1, parseInt(partes[1], 10) || 1));
      const filas = listarPersonajes(categoria, POR_PAGINA, (pagina - 1) * POR_PAGINA).map((p) => {
        const fuente = categoria === "waifu" ? ` — ${p.serie}` : "";
        return `#${p.id} *${p.nombre}*${fuente} · ${p.rareza} · ${monto(p.valor)} · 👥${p.duenos}`;
      });
      return reply({
        text: tarjeta({
          emoji: CAT[categoria].emoji, titulo: `LISTA · ${CAT[categoria].singular.toUpperCase()}`,
          lineas: [`📚 *Total* ›› ${total}`, "", ...filas, "", `📄 Página ${pagina}/${paginas} · .rwinfo ${partes[0]} <página>`]
        })
      });
    }

    // ---- resumen general ----
    const { porCategoria, porRareza, reclamados, yandere } = resumenGacha();
    const lineas = [];
    for (const clave of Object.keys(CAT)) {
      const total = porCategoria.find((c) => c.categoria === clave)?.n || 0;
      const recl = reclamados.find((c) => c.categoria === clave)?.n || 0;
      const rarezas = porRareza.filter((r) => r.categoria === clave).map((r) => `${r.rareza} ${r.n}`).join(" · ");
      lineas.push(`${CAT[clave].emoji} *${CAT[clave].singular}* ›› ${total} (${recl} con dueño)`);
      if (rarezas) lineas.push(`   ${rarezas}`);
    }
    if (yandere.length) {
      lineas.push("", "🔎 *Posts de yande.re revisados*", ...yandere.map((y) => `• ${y.estado}: ${y.n}`));
    }
    lineas.push("", "📋 Lista completa: *.rwinfo waifu*, *.rwinfo pokemon*, *.rwinfo brawl*, *.rwinfo snake*");
    return reply({ text: tarjeta({ emoji: "📊", titulo: "INFO DEL GACHA", lineas }) });
  })
};
