import { getAccount } from "./db.js";
import { TIENDAS, NIVEL_MAX, alimentar } from "./gacha-niveles.js";
import { tarjeta, monto, CAT, textoStats, gachaListo } from "./gacha-core.js";

export function crearComandoTienda({ categoria, names, desc }) {
  const t = TIENDAS[categoria];
  const cat = CAT[categoria];
  return {
    names, desc, category: "Gacha", usage: `.${t.comando} [nº] [#id]`,
    handler: async ({ sender, cleanText, reply }) => {
      await gachaListo;
      const partes = cleanText.split(/\s+/).slice(1);
      const nTok = partes.find((x) => /^\d+$/.test(x));
      const idTok = partes.find((x) => /^#\d+$/.test(x));

      if (!nTok) {
        const filas = t.items.map((it, i) =>
          `${i + 1}. ${it.emoji} *${it.nombre}* ›› ${monto(it.precio)} · +${it.min}${it.max > it.min ? `–${it.max}` : ""} niveles`);
        return reply({
          text: tarjeta({
            emoji: t.emoji, titulo: `TIENDA · ${t.titulo}`,
            lineas: [
              ...filas, "",
              `💰 *Tenés* ›› ${monto(getAccount(sender).wallet)}`,
              `📈 Nivel máximo ›› ${NIVEL_MAX[categoria]}. La subida es al azar dentro del rango.`,
              "",
              `⚙️ *Comprar* ›› .${t.comando} <nº>`,
              `🎯 *Elegir ${cat.singular}* ›› .${t.comando} <nº> #id`
            ]
          })
        });
      }

      const r = alimentar({ categoria, sender, nItem: parseInt(nTok, 10), charId: idTok ? parseInt(idTok.slice(1), 10) : null });
      if (r.error === "item") return reply({ text: `❌ No existe la opción ${nTok}. Mirá la tienda con *.${t.comando}*.` });
      if (r.error === "sinpersonajes") return reply({ text: `❌ Todavía no tenés ${cat.indef}. Conseguilo con *${cat.rollCmd}* y *${cat.claimCmd}*.` });
      if (r.error === "ajeno") return reply({ text: `❌ No tenés ningún ${cat.singular} con ID ${idTok}.` });
      if (r.error === "maximo") return reply({ text: `🏆 *${r.p.nombre}* ya está en el nivel máximo (${NIVEL_MAX[categoria]}).` });
      if (r.error === "saldo") return reply({ text: `❌ Te faltan ${monto(r.item.precio - getAccount(sender).wallet)} en mano para comprar ${r.item.nombre}.` });

      return reply({
        text: tarjeta({
          emoji: t.emoji, titulo: `${cat.singular.toUpperCase()} MEJORADO`,
          lineas: [
            `👤 *Nombre* ›› ${r.p.nombre} (#${r.p.id})`,
            `${r.item.emoji} *Compraste* ›› ${r.item.nombre} por ${monto(r.item.precio)}`,
            `📊 *Nivel* ›› ${r.antes} → *${r.despues}* (+${r.ganado})`,
            textoStats(r.stats),
            `💰 *Te quedan* ›› ${monto(getAccount(sender).wallet)}`
          ]
        })
      });
    }
  };
}
