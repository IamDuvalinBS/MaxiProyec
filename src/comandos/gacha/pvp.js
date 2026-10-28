import { gachaListo } from "../../../motores/gacha-core.js";
import { crearHandlerPvp } from "../../../motores/gacha-pvp.js";

// ── waifupvp.js ──
const cmd_waifupvp = (() => {
  const pvp = crearHandlerPvp({ categoria: "waifu", comando: "waifupvp", nombreLuchador: "waifu" });

  return {
    names: [".waifupvp"],
    desc: "Desafía a otro usuario con tu waifu: .waifupvp <@usuario> <apuesta> <ID> (también por equipos)",
    category: "Gacha",
    usage: ".waifupvp <@usuario> <apuesta> <ID>",
    handler: async (ctx) => {
      await gachaListo;
      return pvp(ctx);
    }
  };
})();

// ── pokemonpvp.js ──
const cmd_pokemonpvp = (() => {
  const pvp = crearHandlerPvp({ categoria: "pokemon", comando: "pokemonpvp", nombreLuchador: "Pokémon" });

  return {
    names: [".pokemonpvp"],
    desc: "Desafía a otro usuario con tu Pokémon: .pokemonpvp <@usuario> <apuesta> <ID> (el combate se juega por rondas)",
    category: "Gacha",
    usage: ".pokemonpvp <@usuario> <apuesta> <ID>",
    handler: async (ctx) => {
      await gachaListo;
      return pvp(ctx);
    }
  };
})();

// ── brawlstarspvp.js ──
const cmd_brawlstarspvp = (() => {
  const pvp = crearHandlerPvp({ categoria: "brawler", comando: "brawlstarspvp", nombreLuchador: "Brawler" });

  return {
    names: [".brawlstarspvp", ".brawlpvp"],
    desc: "Desafía a otro usuario con tu Brawler: .brawlstarspvp <@usuario> <apuesta> <ID> (el combate se juega por rondas)",
    category: "Gacha",
    usage: ".brawlstarspvp <@usuario> <apuesta> <ID>",
    handler: async (ctx) => {
      await gachaListo;
      return pvp(ctx);
    }
  };
})();

// ── snakepvp.js ──
const cmd_snakepvp = (() => {
  const pvp = crearHandlerPvp({ categoria: "snake", comando: "snakepvp", nombreLuchador: "Snake" });

  return {
    names: [".snakepvp"],
    desc: "Desafía a otro usuario con tu Snake: .snakepvp <@usuario> <apuesta> <ID> (el combate se juega por rondas)",
    category: "Gacha",
    usage: ".snakepvp <@usuario> <apuesta> <ID>",
    handler: async (ctx) => {
      await gachaListo;
      return pvp(ctx);
    }
  };
})();

// ── clashpvp.js ──
const cmd_clashpvp = (() => {
  return {
    names: [".clashpvp"],
    desc: "Desafía a otro usuario con tu carta: .clashpvp <@usuario> <apuesta> <ID> (el combate se juega por rondas)",
    category: "Gacha",
    usage: ".clashpvp <@usuario> <apuesta> <ID>",
    handler: crearHandlerPvp({ categoria: "clash", comando: "clashpvp", nombreLuchador: "carta" })
  };
})();

// ── codpvp.js ──
const cmd_codpvp = (() => {
  return {
    names: [".codpvp"],
    desc: "Desafía a otro usuario con tu ítem de COD: .codpvp <@usuario> <apuesta> <ID> (el combate se juega por rondas)",
    category: "Gacha",
    usage: ".codpvp <@usuario> <apuesta> <ID>",
    handler: crearHandlerPvp({ categoria: "cod", comando: "codpvp", nombreLuchador: "ítem de COD" })
  };
})();

// ── dragonpvp.js ──
const cmd_dragonpvp = (() => {
  return {
    names: [".dragonpvp"],
    desc: "Desafía a otro usuario con tu dragón: .dragonpvp <@usuario> <apuesta> <ID> (el combate se juega por rondas)",
    category: "Gacha",
    usage: ".dragonpvp <@usuario> <apuesta> <ID>",
    handler: crearHandlerPvp({ categoria: "dragon", comando: "dragonpvp", nombreLuchador: "dragón" })
  };
})();

export default [
  cmd_waifupvp,
  cmd_pokemonpvp,
  cmd_brawlstarspvp,
  cmd_snakepvp,
  cmd_clashpvp,
  cmd_codpvp,
  cmd_dragonpvp
];
