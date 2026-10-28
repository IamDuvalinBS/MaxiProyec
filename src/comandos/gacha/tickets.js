import { crearComandoTicket } from "../../../motores/gacha-comandos.js";

// ── ticket.js ──
const cmd_ticket = (() => {
  return crearComandoTicket({
    categoria: "waifu",
    names: [".ticket", ".ticketwaifu"]
  });
})();

// ── ticketpoke.js ──
const cmd_ticketpoke = (() => {
  return crearComandoTicket({
    categoria: "pokemon",
    names: [".ticketpoke", ".ticketpokemon"]
  });
})();

// ── ticketbs.js ──
const cmd_ticketbs = (() => {
  return crearComandoTicket({
    categoria: "brawler",
    names: [".ticketbs", ".ticketbrawl"]
  });
})();

// ── ticketsnake.js ──
const cmd_ticketsnake = (() => {
  return crearComandoTicket({
    categoria: "snake",
    names: [".ticketsnake"]
  });
})();

// ── ticketcr.js ──
const cmd_ticketcr = (() => {
  return crearComandoTicket({
    categoria: "clash",
    names: [".ticketcr"]
  });
})();

// ── ticketcod.js ──
const cmd_ticketcod = (() => {
  return crearComandoTicket({
    categoria: "cod",
    names: [".ticketcod"]
  });
})();

// ── ticketdragon.js ──
const cmd_ticketdragon = (() => {
  return crearComandoTicket({
    categoria: "dragon",
    names: [".ticketdragon"]
  });
})();

export default [
  cmd_ticket,
  cmd_ticketpoke,
  cmd_ticketbs,
  cmd_ticketsnake,
  cmd_ticketcr,
  cmd_ticketcod,
  cmd_ticketdragon
];
