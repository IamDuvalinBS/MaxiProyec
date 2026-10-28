import { gachaListo, mostrarColeccion } from "../../../motores/gacha-core.js";
import { crearComandoColeccion } from "../../../motores/gacha-comandos.js";

// ── harem.js ──
const cmd_harem = (() => {
  return {
    names: [".harem", ".miswaifus"],
    desc: "Muestra tu colección de waifus",
    category: "Gacha",
    usage: ".harem [página]",
    handler: async ({ sock, from, msg, sender, cleanText, reply }) => {
      await gachaListo;
      await mostrarColeccion({ sock, from, msg, categoria: "waifu", titulo: "Tu harem", sender, cleanText, reply });
    }
  };
})();

// ── misbrawlers.js ──
const cmd_misbrawlers = (() => {
  return {
    names: [".misbrawlers"],
    desc: "Muestra tus Brawlers con su nivel",
    category: "Gacha",
    usage: ".misbrawlers [página]",
    handler: async ({ sock, from, msg, sender, cleanText, reply }) => {
      await gachaListo;
      await mostrarColeccion({
        sock, from, msg, categoria: "brawler", titulo: "Tus Brawlers", sender, cleanText, reply,
        pista: "⚡ Súbelos de nivel con *.cubitos* y *.subirbrawler* (usa #id para elegir cuál)."
      });
    }
  };
})();

// ── missnakes.js ──
const cmd_missnakes = (() => {
  return {
    names: [".missnakes", ".misgusanitos"],
    desc: "Muestra tus Snakes",
    category: "Gacha",
    usage: ".missnakes [página]",
    handler: async ({ sock, from, msg, sender, cleanText, reply }) => {
      await gachaListo;
      await mostrarColeccion({
        sock, from, msg, categoria: "snake", titulo: "Tus Snakes", sender, cleanText, reply,
        pista: "🔮 Súbelos de nivel con *.orbes* (usa #id para elegir cuál)."
      });
    }
  };
})();

// ── miscartas.js ──
const cmd_miscartas = (() => {
  return crearComandoColeccion({
    categoria: "clash",
    names: [".miscartas"]
  });
})();

// ── miscod.js ──
const cmd_miscod = (() => {
  return crearComandoColeccion({
    categoria: "cod",
    names: [".miscod"]
  });
})();

// ── misdragones.js ──
const cmd_misdragones = (() => {
  return crearComandoColeccion({
    categoria: "dragon",
    names: [".misdragones"]
  });
})();

export default [
  cmd_harem,
  cmd_misbrawlers,
  cmd_missnakes,
  cmd_miscartas,
  cmd_miscod,
  cmd_misdragones
];
