import { crearComandoTienda, crearComandoComprar, crearComandoDar } from "../../../motores/gacha-tienda.js";

// ── waifushop.js ──
const cmd_waifushop = (() => {
  return crearComandoTienda({
    categoria: "waifu",
    names: [".waifushop", ".waifutienda"],
    desc: "Muestra la tienda de regalos para tus waifus con sus precios"
  });
})();

// ── waifucomprar.js ──
const cmd_waifucomprar = (() => {
  return crearComandoComprar({
    categoria: "waifu",
    names: [".waifucomprar", ".comprarregalo"],
    desc: "Compra regalos para tus waifus por su número"
  });
})();

// ── waifudar.js ──
const cmd_waifudar = (() => {
  return crearComandoDar({
    categoria: "waifu",
    names: [".waifudar", ".darregalo"],
    desc: "Da un regalo a una waifu para subirla de nivel"
  });
})();

// ── pokecomida.js ──
const cmd_pokecomida = (() => {
  return crearComandoTienda({
    categoria: "pokemon",
    names: [".pokecomida"],
    desc: "Muestra la tienda de comida Pokémon con sus precios"
  });
})();

// ── pokefood.js ──
const cmd_pokefood = (() => {
  return crearComandoComprar({
    categoria: "pokemon",
    names: [".pokefood", ".pokecomprar"],
    desc: "Compra comida Pokémon por su número"
  });
})();

// ── pokedar.js ──
const cmd_pokedar = (() => {
  return crearComandoDar({
    categoria: "pokemon",
    names: [".pokedar", ".pokealimentar"],
    desc: "Da de comer a un Pokémon para subirlo de nivel"
  });
})();

// ── orbes.js ──
const cmd_orbes = (() => {
  return crearComandoTienda({
    categoria: "snake",
    names: [".orbes", ".snakeorbes"],
    desc: "Muestra la tienda de orbes con sus precios"
  });
})();

// ── orbe.js ──
const cmd_orbe = (() => {
  return crearComandoComprar({
    categoria: "snake",
    names: [".orbe", ".comprarorbe"],
    desc: "Compra orbes por su número"
  });
})();

// ── darorbe.js ──
const cmd_darorbe = (() => {
  return crearComandoDar({
    categoria: "snake",
    names: [".darorbe", ".usarorbe"],
    desc: "Usa un orbe para subir de nivel a un Snake"
  });
})();

// ── clashtienda.js ──
const cmd_clashtienda = (() => {
  return crearComandoTienda({
    categoria: "clash",
    names: [".clashtienda"],
    desc: "Muestra la tienda con sus precios"
  });
})();

// ── clashcomprar.js ──
const cmd_clashcomprar = (() => {
  return crearComandoComprar({
    categoria: "clash",
    names: [".clashcomprar"],
    desc: "Compra artículos de la tienda por su número"
  });
})();

// ── clashmejorar.js ──
const cmd_clashmejorar = (() => {
  return crearComandoDar({
    categoria: "clash",
    names: [".clashmejorar"],
    desc: "Usa un artículo para subir de nivel a un personaje"
  });
})();

// ── codtienda.js ──
const cmd_codtienda = (() => {
  return crearComandoTienda({
    categoria: "cod",
    names: [".codtienda"],
    desc: "Muestra la tienda con sus precios"
  });
})();

// ── codcomprar.js ──
const cmd_codcomprar = (() => {
  return crearComandoComprar({
    categoria: "cod",
    names: [".codcomprar"],
    desc: "Compra artículos de la tienda por su número"
  });
})();

// ── codmejorar.js ──
const cmd_codmejorar = (() => {
  return crearComandoDar({
    categoria: "cod",
    names: [".codmejorar"],
    desc: "Usa un artículo para subir de nivel a un personaje"
  });
})();

// ── dragonfood.js ──
const cmd_dragonfood = (() => {
  return crearComandoTienda({
    categoria: "dragon",
    names: [".dragonfood"],
    desc: "Muestra la tienda con sus precios"
  });
})();

// ── dragoncomprar.js ──
const cmd_dragoncomprar = (() => {
  return crearComandoComprar({
    categoria: "dragon",
    names: [".dragoncomprar"],
    desc: "Compra artículos de la tienda por su número"
  });
})();

// ── dragondar.js ──
const cmd_dragondar = (() => {
  return crearComandoDar({
    categoria: "dragon",
    names: [".dragondar"],
    desc: "Usa un artículo para subir de nivel a un personaje"
  });
})();

export default [
  cmd_waifushop,
  cmd_waifucomprar,
  cmd_waifudar,
  cmd_pokecomida,
  cmd_pokefood,
  cmd_pokedar,
  cmd_orbes,
  cmd_orbe,
  cmd_darorbe,
  cmd_clashtienda,
  cmd_clashcomprar,
  cmd_clashmejorar,
  cmd_codtienda,
  cmd_codcomprar,
  cmd_codmejorar,
  cmd_dragonfood,
  cmd_dragoncomprar,
  cmd_dragondar
];
