import { ownerGacha } from "../../../motores/gacha-owners.js";
import { encabezado } from "../../../src/economia/estilo.js";
import { gachaListo, arroba, CAT } from "../../../motores/gacha-core.js";
import { categoriaPorAlias } from "../../../motores/gacha-categorias.js";
import { darTickets } from "../../../motores/gacha-tickets.js";

const MAXIMO_POR_ENTREGA = 1000;

export default {
  names: [".darticket", ".dartickets"],
  desc: "Entrega tickets de un gacha a un usuario: .darticket <cantidad> + <categoría> <@usuario o respondiendo su mensaje> (solo owners)",
  category: "Gacha",
  usage: ".darticket <cantidad> + <categoría> <@usuario>",
  handler: ownerGacha(async ({ cleanText, msg, reply }) => {
    await gachaListo;
    const fichas = cleanText.split(/\s+/).slice(1).filter((x) => x !== "+" && !x.startsWith("@"));
    const cantidad = parseInt(fichas.find((x) => /^\d+$/.test(x)), 10);
    const categoria = fichas.map(categoriaPorAlias).find(Boolean);
    const contexto = msg.message?.extendedTextMessage?.contextInfo;
    const destino = contexto?.mentionedJid?.[0] || contexto?.participant;

    if (!categoria || !cantidad || cantidad < 1 || !destino) {
      return reply({
        text: [
          encabezado("🎟️", "ENTREGAR TICKETS"),
          "",
          "> Entrega tickets de un gacha a un usuario. La categoría indica en qué gacha recibirá los tickets.",
          "",
          "✱ *Uso* ›› .darticket <cantidad> + <categoría> <@usuario>",
          "✿ *Ejemplo* ›› .darticket 2 + brawl @usuario",
          "",
          "> Categorías: *waifu*, *pokemon*, *brawl* y *snake*.",
          "> En lugar de mencionar, también puedes responder al mensaje de la persona."
        ].join("\n")
      });
    }
    if (cantidad > MAXIMO_POR_ENTREGA) {
      return reply({ text: `❌ Solo se pueden entregar hasta ${MAXIMO_POR_ENTREGA} tickets por comando.` });
    }

    const cat = CAT[categoria];
    const total = darTickets(destino, categoria, cantidad);
    return reply({
      text: [
        encabezado("🎟️", "TICKETS ENTREGADOS"),
        "",
        `> Se ${cantidad === 1 ? "entregó" : "entregaron"} *${cantidad}* ${cantidad === 1 ? "ticket" : "tickets"} de ${cat.plural} a ${arroba(destino)}.`,
        `🎟️ *Total de esa persona* ›› ${total}`
      ].join("\n"),
      mentions: [destino]
    });
  })
};
