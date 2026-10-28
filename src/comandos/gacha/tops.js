import { crearComandoTop } from "../../../motores/gacha-comandos.js";

// ── waifutop.js ──
const cmd_waifutop = (() => {
  return crearComandoTop({
    categoria: "waifu",
    names: [".waifutop", ".rwtop", ".harentop"]
  });
})();

// ── poketop.js ──
const cmd_poketop = (() => {
  return crearComandoTop({
    categoria: "pokemon",
    names: [".poketop", ".pokemontop"]
  });
})();

// ── brawltop.js ──
const cmd_brawltop = (() => {
  return crearComandoTop({
    categoria: "brawler",
    names: [".brawltop", ".bstop"]
  });
})();

// ── snaketop.js ──
const cmd_snaketop = (() => {
  return crearComandoTop({
    categoria: "snake",
    names: [".snaketop"]
  });
})();

// ── clashtop.js ──
const cmd_clashtop = (() => {
  return crearComandoTop({
    categoria: "clash",
    names: [".clashtop"]
  });
})();

// ── codtop.js ──
const cmd_codtop = (() => {
  return crearComandoTop({
    categoria: "cod",
    names: [".codtop"]
  });
})();

// ── dragontop.js ──
const cmd_dragontop = (() => {
  return crearComandoTop({
    categoria: "dragon",
    names: [".dragontop"]
  });
})();

export default [
  cmd_waifutop,
  cmd_poketop,
  cmd_brawltop,
  cmd_snaketop,
  cmd_clashtop,
  cmd_codtop,
  cmd_dragontop
];
