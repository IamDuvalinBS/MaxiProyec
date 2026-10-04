import { getAccount } from "./db.js";
import { encabezado } from "../src/economia/estilo.js";
import { TIENDAS, NIVEL_MAX, comidaDe, comprarComida, darComida } from "./gacha-niveles.js";
import { monto, CAT, textoStats, gachaListo } from "./gacha-core.js";

const entero = (texto) => (/^\d+$/.test(texto || "") ? parseInt(texto, 10) : null);
const identificador = (texto) => (/^#?\d+$/.test(texto || "") ? parseInt(String(texto).replace("#", ""), 10) : null);

function textoNiveles(n) {
  return `+${n} ${n === 1 ? "nivel" : "niveles"}`;
}

export function crearComandoTienda({ categoria, names, desc }) {
  const t = TIENDAS[categoria];
  return {
    names, desc, category: "Gacha", usage: t.comandoTienda,
    handler: async ({ sender, reply }) => {
      await gachaListo;
      const lineas = [encabezado(t.emoji, `SHOP - ${t.titulo}`), ""];

      t.items.forEach((item, i) => {
        const tiene = comidaDe(sender, categoria, i + 1);
        lineas.push(`${item.emoji} *${i + 1}. ${item.nombre}* ›› *${monto(item.precio)}*`);
        lineas.push(`> Cantidad 1 = ${textoNiveles(item.niveles)}. Tienes ${tiene}.`);
      });

      lineas.push(
        "",
        `⛁ *DINERO*:: ${monto(getAccount(sender).wallet)}`,
        `✿ *Nivel Max.*:: ${NIVEL_MAX[categoria]} Niveles`,
        "",
        `> Para comprar usa *${t.comandoComprar} <número> [cantidad]*.`,
        `> Para usar lo que compraste en un personaje usa *${t.comandoDar} <número> [ID]*.`
      );
      return reply({ text: lineas.join("\n") });
    }
  };
}

export function crearComandoComprar({ categoria, names, desc }) {
  const t = TIENDAS[categoria];
  return {
    names, desc, category: "Gacha", usage: `${t.comandoComprar} <número> [cantidad]`,
    handler: async ({ sender, cleanText, reply }) => {
      await gachaListo;
      const partes = cleanText.split(/\s+/).slice(1);
      const nItem = entero(partes[0]);
      const cantidad = entero(partes[1]) || 1;

      if (!nItem) {
        return reply({
          text: `❌ Indica el número del artículo que deseas comprar. Ejemplo: *${t.comandoComprar} 1*. Consulta la lista con *${t.comandoTienda}*.`
        });
      }

      const r = comprarComida({ categoria, sender, nItem, cantidad });
      if (r.error === "item") {
        return reply({ text: `❌ No existe el artículo ${nItem}. Consulta la lista con *${t.comandoTienda}*.` });
      }
      if (r.error === "saldo") {
        const faltante = r.total - getAccount(sender).wallet;
        return reply({ text: `❌ Te faltan *${monto(faltante)}* en mano para comprar ${cantidad} × ${r.item.nombre}. Usa *.retirar* para sacar dinero del banco.` });
      }

      return reply({
        text: [
          encabezado(t.emoji, "COMPRA REALIZADA"),
          "",
          `${r.item.emoji} *Compraste* ›› ${r.cantidad} × ${r.item.nombre}`,
          `> Pagaste ${monto(r.total)}.`,
          `🎒 *Ahora tienes* ›› ${r.tiene}`,
          `⛁ *Dinero en mano* ›› ${monto(getAccount(sender).wallet)}`,
          "",
          `> Úsalo con *${t.comandoDar} ${nItem} [ID]*. Si no indicas el ID se elige el personaje de mayor nivel.`
        ].join("\n")
      });
    }
  };
}

export function crearComandoDar({ categoria, names, desc }) {
  const t = TIENDAS[categoria];
  const cat = CAT[categoria];
  return {
    names, desc, category: "Gacha", usage: `${t.comandoDar} <número> [ID] [cantidad]`,
    handler: async ({ sender, cleanText, reply }) => {
      await gachaListo;
      const partes = cleanText.split(/\s+/).slice(1);
      const nItem = entero(partes[0]);
      const charId = identificador(partes[1]);
      const cantidad = entero(partes[2]) || 1;

      if (!nItem) {
        return reply({
          text: [
            encabezado(t.emoji, `USAR ${t.nombre.toUpperCase()}`),
            "",
            `> Sube de nivel ${cat.al} ${cat.singular} que elijas con ${t.plural} que ya hayas comprado.`,
            "",
            `✱ *Uso* ›› ${t.comandoDar} <número> [ID] [cantidad]`,
            `✿ *Ejemplo* ›› ${t.comandoDar} 1 #25`,
            "",
            `> Si no indicas el ID se usa ${cat.art} ${cat.singular} de mayor nivel.`,
            `> Para comprar ${t.plural} usa *${t.comandoComprar} <número>*.`
          ].join("\n")
        });
      }

      const r = darComida({ categoria, sender, nItem, charId, cantidad });
      if (r.error === "item") return reply({ text: `❌ No existe el artículo ${nItem}. Consulta la lista con *${t.comandoTienda}*.` });
      if (r.error === "sinpersonajes") return reply({ text: `❌ Todavía no tienes ${cat.indef}. Consíguelo con *${cat.rollCmd}* y *${cat.claimCmd}*.` });
      if (r.error === "ajeno") return reply({ text: `❌ No tienes ${cat.indef} con el ID #${charId}.` });
      if (r.error === "maximo") return reply({ text: `🏆 *${r.p.nombre}* ya está en el nivel máximo (${NIVEL_MAX[categoria]}).` });
      if (r.error === "sincomida") {
        return reply({ text: `❌ No tienes ${r.item.nombre}. Cómpralo con *${t.comandoComprar} ${nItem}*.` });
      }

      return reply({
        text: [
          encabezado(t.emoji, `${cat.singular.toUpperCase()} MEJORADO`),
          "",
          `✍🏻 *Nombre* ›› ${r.p.nombre} (#${r.p.id})`,
          `${r.item.emoji} *Usaste* ›› ${r.unidades} × ${r.item.nombre}`,
          `📊 *Nivel* ›› ${r.antes} → *${r.despues}* (${textoNiveles(r.ganado)})`,
          textoStats(r.stats),
          `🎒 *Te quedan* ›› ${r.restantes}`
        ].join("\n")
      });
    }
  };
}
