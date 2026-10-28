import { COOLDOWN_TIRADA_MS } from "../../../motores/gacha-config.js";
import { personajeAleatorio, personajeAleatorioPonderado } from "../../../motores/gacha-db.js";
import { hacerRoll, gachaListo, crearComandoClaim } from "../../../motores/gacha-core.js";
import { pokemonAleatorio } from "../../../motores/gacha-pokemon.js";
import { asegurarBrawlers, sincronizarBrawlers } from "../../../motores/gacha-brawl.js";
import { esOwnerGacha } from "../../../motores/gacha-owners.js";
import { asegurarSnakes, PESOS_SNAKE } from "../../../motores/gacha-snake.js";
import { crearComandoTirada } from "../../../motores/gacha-comandos.js";
import { asegurarClash, sincronizarClash } from "../../../motores/gacha-catalogos.js";

// ── rw.js ──
const cmd_rw = (() => {
  const COOLDOWN_MS = COOLDOWN_TIRADA_MS;

  return {
    names: [".rw", ".rollwaifu"],
    desc: "Genera una waifu al azar para reclamar con .claim (cada 20 minutos)",
    category: "Gacha",
    handler: async ({ from, sender, reply }) => {
      await gachaListo;
      await hacerRoll({
        categoria: "waifu",
        obtener: async () => personajeAleatorio("waifu", { soloLibres: true }),
        reply, sender, from,
        cooldownMs: COOLDOWN_MS,
        textoVacio: "❌ Todavía no hay waifus en la base. Un owner tiene que usar *.yanderandom* para cargar algunas."
      });
    }
  };
})();

// ── claim.js ──
const cmd_claim = (() => {
  return crearComandoClaim({
    categoria: "waifu",
    names: [".claim", ".c", ".reclamar"],
    desc: "Reclama la waifu generada con .rw"
  });
})();

// ── pokemon.js ──
const cmd_pokemon = (() => {
  const COOLDOWN_MS = COOLDOWN_TIRADA_MS;

  return {
    names: [".pokemon"],
    desc: "Genera un Pokémon al azar para reclamar con .atrapar (cada 20 minutos)",
    category: "Gacha",
    handler: async ({ from, sender, reply }) => {
      await gachaListo;
      await hacerRoll({
        categoria: "pokemon",
        obtener: pokemonAleatorio,
        reply, sender, from,
        cooldownMs: COOLDOWN_MS,
        textoVacio: "❌ No pude consultar PokeAPI ahora mismo, prueba de nuevo en un momento."
      });
    }
  };
})();

// ── atrapar.js ──
const cmd_atrapar = (() => {
  return crearComandoClaim({
    categoria: "pokemon",
    names: [".atrapar", ".catch"],
    desc: "Atrapa el Pokémon generado con .pokemon"
  });
})();

// ── brawlstars.js ──
const cmd_brawlstars = (() => {
  const COOLDOWN_MS = COOLDOWN_TIRADA_MS;

  return {
    names: [".brawlstars", ".brawl"],
    desc: "Genera un Brawler al azar para reclamar con .drop (cada 20 minutos)",
    category: "Gacha",
    usage: ".brawlstars",
    handler: async ({ from, sender, cleanText, reply }) => {
      await gachaListo;

      if (cleanText.split(/\s+/)[1]?.toLowerCase() === "actualizar") {
        if (!esOwnerGacha(sender)) return reply({ text: "🚫 Solo los owners pueden actualizar la lista de brawlers." });
        try {
          const r = await sincronizarBrawlers();
          return reply({ text: `✅ Brawlers sincronizados. Total en la API: ${r.total}. Nuevos: ${r.nuevos}.` });
        } catch (e) {
          console.log("[gacha] Brawlify (actualizar):", e.message);
          return reply({ text: `❌ No pude consultar Brawlify: ${e.message}` });
        }
      }

      try {
        await asegurarBrawlers();
      } catch (e) {
        console.log("[gacha] Brawlify (cargar):", e.message);
        return reply({ text: `❌ No pude cargar los brawlers desde Brawlify: ${e.message}` });
      }

      await hacerRoll({
        categoria: "brawler",
        obtener: async () => personajeAleatorio("brawler"),
        reply, sender, from,
        cooldownMs: COOLDOWN_MS,
        textoVacio: "❌ No hay brawlers cargados todavía."
      });
    }
  };
})();

// ── drop.js ──
const cmd_drop = (() => {
  return crearComandoClaim({
    categoria: "brawler",
    names: [".drop"],
    desc: "Reclama el brawler generado con .brawlstars"
  });
})();

// ── snake.js ──
const cmd_snake = (() => {
  const COOLDOWN_MS = COOLDOWN_TIRADA_MS;

  return {
    names: [".snake", ".gusanito"],
    desc: "Genera un gusanito (skin de Snake) al azar para adoptar con .adoptar (cada 20 minutos)",
    category: "Gacha",
    handler: async ({ from, sender, reply }) => {
      await gachaListo;
      await asegurarSnakes();
      await hacerRoll({
        categoria: "snake",
        obtener: async () => personajeAleatorioPonderado("snake", PESOS_SNAKE),
        reply, sender, from,
        cooldownMs: COOLDOWN_MS,
        textoVacio: "❌ No hay skins cargadas todavía."
      });
    }
  };
})();

// ── adoptar.js ──
const cmd_adoptar = (() => {
  return crearComandoClaim({
    categoria: "snake",
    names: [".adoptar"],
    desc: "Adopta el gusanito generado con .snake"
  });
})();

// ── clashroyale.js ──
const cmd_clashroyale = (() => {
  return crearComandoTirada({
    categoria: "clash",
    names: [".clashroyale", ".cr"],
    asegurar: asegurarClash,
    sincronizar: sincronizarClash,
    textoVacio: "❌ No se pudieron cargar las cartas de Clash Royale. Inténtalo de nuevo en un momento."
  });
})();

// ── desbloquear.js ──
const cmd_desbloquear = (() => {
  return crearComandoClaim({
    categoria: "clash",
    names: [".desbloquear"],
    desc: "Reclama el personaje que apareció en la última tirada de este gacha"
  });
})();

// ── callofduty.js ──
const cmd_callofduty = (() => {
  return crearComandoTirada({
    categoria: "cod",
    names: [".callofduty", ".cod"],
    textoVacio: "❌ Todavía no hay ítems de Call of Duty cargados. Un owner tiene que usar *.cargarcod buscar operators* para encontrar la categoría de la wiki y *.cargarcod <categoría> <tipo>* para cargarla."
  });
})();

// ── equipar.js ──
const cmd_equipar = (() => {
  return crearComandoClaim({
    categoria: "cod",
    names: [".equipar"],
    desc: "Reclama el personaje que apareció en la última tirada de este gacha"
  });
})();

// ── dragon.js ──
const cmd_dragon = (() => {
  return crearComandoTirada({
    categoria: "dragon",
    names: [".dragon", ".dragonmania"],
    textoVacio: "❌ Todavía no hay dragones cargados. Un owner tiene que usar *.cargardragones* para importarlos."
  });
})();

// ── criar.js ──
const cmd_criar = (() => {
  return crearComandoClaim({
    categoria: "dragon",
    names: [".criar"],
    desc: "Reclama el personaje que apareció en la última tirada de este gacha"
  });
})();

export default [
  cmd_rw,
  cmd_claim,
  cmd_pokemon,
  cmd_atrapar,
  cmd_brawlstars,
  cmd_drop,
  cmd_snake,
  cmd_adoptar,
  cmd_clashroyale,
  cmd_desbloquear,
  cmd_callofduty,
  cmd_equipar,
  cmd_dragon,
  cmd_criar
];
