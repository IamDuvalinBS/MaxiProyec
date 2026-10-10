import { ownerGacha } from "../../../motores/gacha-owners.js";
import { gachaListo, tarjeta, monto, fmt, CAT } from "../../../motores/gacha-core.js";
import { categoriaPorAlias } from "../../../motores/gacha-categorias.js";
import { resumenGacha, listarPersonajes, contarPersonajes } from "../../../motores/gacha-db.js";
import { encabezado } from "../../../src/economia/estilo.js";

const POR_PAGINA = 20;

export default {
  names: [".gachastats", ".statsgacha", ".gachainfo", ".wachainfo", ".waifuinfo"],
  desc: "Muestra cuántos personajes hay en cada sistema del gacha y permite listarlos (solo owners)",
  category: "Gacha",
  usage: ".gachastats [waifu|pokemon|brawl|snake] [página]",
  handler: ownerGacha(async ({ cleanText, reply }) => {
    await gachaListo;
    const partes = cleanText.split(/\s+/).slice(1).map((x) => x.toLowerCase());
    const categoria = categoriaPorAlias(partes[0]);

    if (categoria) {
      const cat = CAT[categoria];
      const total = contarPersonajes(categoria);
      if (!total) return reply({ text: `📭 No hay personajes cargados en ${cat.singular}.` });

      const paginas = Math.ceil(total / POR_PAGINA);
      const pagina = Math.min(paginas, Math.max(1, parseInt(partes[1], 10) || 1));
      const filas = listarPersonajes(categoria, POR_PAGINA, (pagina - 1) * POR_PAGINA).flatMap((p) => {
        const fuente = categoria === "waifu" && p.serie ? ` · ${p.serie}` : "";
        return [`✦ *${p.nombre}*`, `> · ID :: #${p.id} · ${p.rareza} · ${monto(p.valor)} · ${p.duenos} ${p.duenos === 1 ? "dueño" : "dueños"}${fuente}`];
      });

      return reply({
        text: [
          encabezado(cat.emoji, `LISTA DE ${cat.tituloTop}`),
          "",
          `> Personajes cargados en este sistema: *${fmt(total)}*.`,
          "",
          ...filas,
          "",
          `> Página ${pagina}/${paginas}.${pagina < paginas ? ` Usa *.gachastats ${partes[0]} ${pagina + 1}* para ver la siguiente.` : ""}`
        ].join("\n")
      });
    }

    const { porCategoria, porRareza, reclamados, yandere } = resumenGacha();
    const lineas = [];
    let general = 0;
    for (const clave of Object.keys(CAT)) {
      const total = porCategoria.find((c) => c.categoria === clave)?.n || 0;
      const reclamado = reclamados.find((c) => c.categoria === clave)?.n || 0;
      const rarezas = porRareza.filter((r) => r.categoria === clave).map((r) => `${r.rareza} ${r.n}`).join(" · ");
      general += total;
      lineas.push(`${CAT[clave].emoji} *${CAT[clave].titulo}* ››`);
      lineas.push(`> ${fmt(total)} ${total === 1 ? "personaje" : "personajes"} en total · ${fmt(reclamado)} con dueño.`);
      if (rarezas) lineas.push(`> ${rarezas}`);
    }

    const partes2 = [
      encabezado("📊", "PERSONAJES DEL GACHA"),
      "",
      "> Cantidad de personajes cargados en cada sistema del gacha.",
      "",
      ...lineas,
      "",
      `🧮 *Total general* ›› ${fmt(general)} personajes`
    ];
    if (yandere.length) {
      partes2.push("", "🔎 *Posts de yande.re revisados* ››", ...yandere.map((y) => `> ${y.estado}: ${y.n}`));
    }
    partes2.push("", "> Para ver la lista de un sistema usa *.gachastats <categoría>*: waifu, pokemon, brawl, snake, cod, dragon o clash.");
    return reply({ text: partes2.join("\n") });
  })
};
