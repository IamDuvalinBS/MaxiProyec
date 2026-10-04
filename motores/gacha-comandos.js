import { encabezado } from "../src/economia/estilo.js";
import { gachaListo, arroba, fmt, CAT, bloquesDePersonajeParaTicket } from "./gacha-core.js";
import { topColeccionistas } from "./gacha-db.js";
import { ticketsDe, usarTicket } from "./gacha-tickets.js";

const MEDALLAS = ["🥇", "🥈", "🥉"];

export function crearComandoTop({ categoria, names }) {
  const cat = CAT[categoria];
  return {
    names,
    desc: `Muestra a las 10 personas con más ${cat.unidades} en todo el bot`,
    category: "Gacha",
    usage: cat.topCmd,
    handler: async ({ reply }) => {
      await gachaListo;
      const top = topColeccionistas(categoria, 10);
      if (!top.length) return reply({ text: `⚠️ Todavía no hay usuarios con ${cat.unidades} en el bot.` });

      const filas = top.map((u, i) => {
        const puesto = MEDALLAS[i] || `*${i + 1}*`;
        return `${puesto} ${arroba(u.usuario)} ››\n> ${fmt(u.cantidad)} ${cat.unidades} en el bot.`;
      });

      return reply({
        text: [
          encabezado(cat.emojiTop, "RANKING GLOBAL"),
          "",
          `> La cantidad *global* de las personas con más ${cat.unidades} en el bot.`,
          "",
          ...filas,
          "",
          `> Usa *${cat.coleccionCmd}* para ver tu propia colección.`
        ].join("\n"),
        mentions: top.map((u) => u.usuario)
      });
    }
  };
}

export function crearComandoTicket({ categoria, names }) {
  const cat = CAT[categoria];
  return {
    names,
    desc: `Usa un ticket para obtener ${cat.indef} eligiendo su ID: ${cat.ticketCmd} <ID>`,
    category: "Gacha",
    usage: `${cat.ticketCmd} <ID>`,
    handler: async ({ sender, cleanText, reply }) => {
      await gachaListo;
      const token = cleanText.split(/\s+/)[1] || "";
      const tickets = ticketsDe(sender, categoria);

      if (!/^#?\d+$/.test(token)) {
        return reply({
          text: [
            encabezado("🎟️", `TICKETS - ${cat.tituloTop}`),
            "",
            `> Un ticket te permite obtener ${cat.indef} eligiendo su ID. Se consiguen al azar, con una probabilidad baja, cada vez que usas *${cat.rollCmd}*.`,
            "",
            `🎟️ *Tus tickets* ›› ${tickets}`,
            "",
            `> Uso *${cat.ticketCmd} <ID>*`,
            `> Consulta los ID de tus ${cat.unidades} con *${cat.coleccionCmd}*.`
          ].join("\n")
        });
      }

      const charId = parseInt(token.replace("#", ""), 10);
      const r = usarTicket({ sender, categoria, charId });

      if (r.error === "sinticket") return reply({ text: `❌ No tienes tickets de ${cat.plural}. Se consiguen al azar usando *${cat.rollCmd}*.` });
      if (r.error === "noexiste") return reply({ text: `❌ No existe ${cat.indef} con el ID #${charId}.` });
      if (r.error === "repetido") return reply({ text: `📦 Ya tienes a *${r.personaje.nombre}*. El ticket no se gastó.` });
      if (r.error === "ocupado") {
        return reply({
          text: `🔒 *${r.personaje.nombre}* ya pertenece a ${arroba(r.duenos[0])}. Los tickets de ${cat.plural} solo sirven con personajes que no tengan dueño. El ticket no se gastó.`,
          mentions: [r.duenos[0]]
        });
      }

      const cabecera = [
        encabezado("🎟️", "TICKET USADO"),
        "",
        `> ${arroba(sender)} usó un ticket y obtuvo a *${r.personaje.nombre}*.`,
        `> Te quedan ${r.restantes} ${r.restantes === 1 ? "ticket" : "tickets"} de ${cat.plural}.`
      ].join("\n");
      return reply({ text: [cabecera, ...bloquesDePersonajeParaTicket(r.personaje)].join("\n\n"), mentions: [sender] });
    }
  };
}
