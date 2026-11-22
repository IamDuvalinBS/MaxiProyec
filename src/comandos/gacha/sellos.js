import { ownerGacha } from "../../../motores/gacha-owners.js";
import { gachaListo, arroba } from "../../../motores/gacha-core.js";
import { darSellos, reiniciarSellos, NOMBRE_SELLOS, EMOJI_SELLO, SELLOS_INICIALES } from "../../../motores/gacha-sellos.js";
import { contextoDe } from "../../nucleo/objetivo.js";

const cmd_darsello = {
  names: [".darsello", ".darsellos"],
  desc: "Da Sellos de Reclamo a un usuario (solo owners)",
  category: "Owner",
  usage: ".darsello <cantidad> @usuario",
  handler: ownerGacha(async ({ cleanText, msg, reply }) => {
    await gachaListo;
    const cantidad = parseInt(cleanText.split(/\s+/)[1], 10);
    const ctx = contextoDe(msg);
    const destino = ctx?.mentionedJid?.[0] || ctx?.participant;
    if (!cantidad || cantidad < 1 || !destino) {
      return reply({ text: "⚙️ Uso: .darsello <cantidad> @usuario (o responde a su mensaje)" });
    }
    const r = darSellos(destino, cantidad);
    return reply({
      text: `${EMOJI_SELLO} Se entregaron *${r.agregados}* ${NOMBRE_SELLOS} a ${arroba(destino)}. Total ›› *${r.total}*.`,
      mentions: [destino]
    });
  })
};

const cmd_reiniciarsellos = {
  names: [".reiniciarsellos", ".resetsellos"],
  desc: "Reinicia los Sellos de Reclamo de todos (solo owners)",
  category: "Owner",
  usage: ".reiniciarsellos [cantidad]",
  handler: ownerGacha(async ({ cleanText, reply }) => {
    await gachaListo;
    const pedido = parseInt(cleanText.split(/\s+/)[1], 10);
    const cantidad = Number.isFinite(pedido) && pedido >= 0 ? pedido : SELLOS_INICIALES;
    const afectados = reiniciarSellos(cantidad);
    return reply({
      text: `${EMOJI_SELLO} Se reiniciaron los ${NOMBRE_SELLOS} de *${afectados}* usuarios a *${cantidad}*. Los usuarios nuevos o sin registro empiezan con *${SELLOS_INICIALES}*.`
    });
  })
};

export default [cmd_darsello, cmd_reiniciarsellos];
