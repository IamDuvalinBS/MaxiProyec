import { ownerGacha } from "../../../motores/gacha-owners.js";
import { encabezado } from "../../../src/economia/estilo.js";
import { gachaListo, arroba, CAT } from "../../../motores/gacha-core.js";
import { categoriaPorAlias } from "../../../motores/gacha-categorias.js";
import { darTickets } from "../../../motores/gacha-tickets.js";
import { contextoDe } from "../../nucleo/objetivo.js";

const MAXIMO_POR_ENTREGA = 1000;

export default {
  names: [".darticket", ".dartickets"],
  desc: "Da tickets de una categoría a un usuario (solo owners)",
  category: "Owner",
  usage: ".darticket <categoría> <cantidad> @usuario",
  handler: ownerGacha(async ({ cleanText, msg, reply }) => {
    await gachaListo;
    const partes = cleanText.split(/\s+/).slice(1);
    const categoria = categoriaPorAlias(partes[0]);
    const cantidad = parseInt(partes[1], 10);
    const destino = contextoDe(msg)?.mentionedJid?.[0] || contextoDe(msg)?.participant;

    if (!categoria || !cantidad || cantidad < 1 || !destino) {
      return reply({
        text: [
          encabezado("🎟️", "ENTREGAR TICKETS"),
          "",
          "✱ *Uso* ›› .darticket <categoría> <cantidad> @usuario",
          "✿ *Ejemplo* ›› .darticket Brawl 1 @usuario",
          "",
          "> Categorías disponibles: *waifu*, *pokemon*, *brawl*, *snake*, *cod*, *dragon* y *clash*.",
          "> También puedes responder al mensaje de la persona en lugar de mencionarla."
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
        `> Se entregaron *${cantidad}* ${cantidad === 1 ? "ticket" : "tickets"} de ${cat.plural} a ${arroba(destino)}.`,
        `🎟️ *Total de esa persona* ›› ${total}`
      ].join("\n"),
      mentions: [destino]
    });
  })
};
