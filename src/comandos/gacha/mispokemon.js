import axios from "axios";
import { gachaListo, mostrarColeccion, monto } from "../../../motores/gacha-core.js";
import { coleccionDe, contarColeccion, recargarGacha } from "../../../motores/gacha-db.js";
import { statsEfectivas, nivelMaxDe } from "../../../motores/gacha-niveles.js";
import { tipoEs } from "../../../motores/gacha-pokemon.js";
import { getProfile } from "../../../motores/profile.js";
import { htmlPokedex } from "../../../motores/pokedex-html.js";
import { esHalloween } from "../../economia/temas.js";
import { revisarMigracion } from "../../../motores/gacha-migracion.js";

const TOTAL_DEX = 1025;
const POR_PARTE = 36;
const FIRMA = "Powered By ItsDuva";
const ESPERA_RECARGA_MS = 60 * 1000;
const SPRITE = (dex) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dex}.png`;

const cacheSprites = new Map();
let ultimaRecarga = 0;

async function spriteDe(dex) {
  if (cacheSprites.has(dex)) return cacheSprites.get(dex);
  try {
    const { data } = await axios.get(SPRITE(dex), { responseType: "arraybuffer", timeout: 8000 });
    const uri = "data:image/png;base64," + Buffer.from(data).toString("base64");
    cacheSprites.set(dex, uri);
    return uri;
  } catch {
    return "";
  }
}

async function spritesDe(lista) {
  const salida = [];
  for (let i = 0; i < lista.length; i += 8) {
    salida.push(...await Promise.all(lista.slice(i, i + 8).map((c) => spriteDe(c.clave))));
  }
  return salida;
}

const limpiarJid = (jid) => (typeof jid === "string" ? jid.replace(/:\d+(?=@)/, "") : "");

function candidatosDeUsuario(sock, msg, sender) {
  const k = msg?.key || {};
  const crudos = k.fromMe
    ? [sender, sock.user?.id, sock.user?.lid, sock.user?.jid]
    : [sender, k.participant, k.participantAlt, k.participantPn, k.remoteJidAlt, k.remoteJid];
  return [...new Set(crudos.map(limpiarJid).filter((j) => j && !j.endsWith("@g.us") && !j.endsWith("@broadcast")))];
}

function elegirUsuario(candidatos) {
  let mejor = { usuario: candidatos[0], n: 0 };
  for (const usuario of candidatos) {
    const { n } = contarColeccion(usuario, "pokemon");
    if (n > mejor.n) mejor = { usuario, n };
  }
  return mejor;
}

async function buscarUsuario(candidatos) {
  let mejor = elegirUsuario(candidatos);
  if (mejor.n) return mejor.usuario;

  if (Date.now() - ultimaRecarga > ESPERA_RECARGA_MS) {
    ultimaRecarga = Date.now();
    try {
      await recargarGacha();
      mejor = elegirUsuario(candidatos);
    } catch (e) {
      console.log("[mispokemon] no se pudo recargar el gacha: " + e.message);
    }
  }
  if (!mejor.n) console.log("[mispokemon] sin Pokémon para: " + candidatos.join(", "));
  return mejor.usuario;
}

const respaldoTexto = ({ usuario, cleanText, reply }) =>
  mostrarColeccion({
    categoria: "pokemon", titulo: "Tus Pokémon", sender: usuario, cleanText, reply,
    pista: "🍖 Súbelos de nivel con *.pokecomida* (usa #id para elegir cuál)."
  });

export default {
  names: [".mispokemon"],
  desc: "Muestra tu Pokédex con tus Pokémon, su nivel y sus estadísticas",
  category: "Gacha",
  usage: ".mispokemon [parte]",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    await gachaListo;
    const usuario = await buscarUsuario(candidatosDeUsuario(sock, msg, sender));
    await revisarMigracion({ sender: usuario, from, reply }).catch(() => {});
    if (esHalloween()) return mostrarColeccion({ sock, from, msg, categoria: "pokemon", sender: usuario, cleanText, reply });
    const todos = coleccionDe(usuario, "pokemon", 100000, 0);
    if (!todos.length || typeof sock.sendHtml !== "function") {
      return respaldoTexto({ usuario, cleanText, reply });
    }

    try {
      const partes = Math.ceil(todos.length / POR_PARTE);
      const parte = Math.min(partes, Math.max(1, parseInt(cleanText.split(/\s+/)[1], 10) || 1));
      const trozo = todos.slice((parte - 1) * POR_PARTE, parte * POR_PARTE);
      const sprites = await spritesDe(trozo);

      const conteoRareza = new Map();
      for (const c of todos) conteoRareza.set(c.rareza, (conteoRareza.get(c.rareza) || 0) + 1);

      const datos = {
        nombre: msg?.pushName || getProfile(usuario).name || "Entrenador",
        n: todos.length,
        totalDex: TOTAL_DEX,
        valorTxt: monto(todos.reduce((a, c) => a + c.valor, 0)),
        rarezas: [...conteoRareza].map(([n, c]) => ({ n, c })),
        parte,
        partes,
        porParte: POR_PARTE,
        firma: FIRMA,
        items: trozo.map((c, i) => {
          const st = statsEfectivas(c, c.nivel);
          return {
            id: c.id,
            dex: Number(c.clave),
            nombre: c.nombre,
            nivel: c.nivel,
            max: nivelMaxDe("pokemon", c.estrellas),
            estrellas: c.estrellas || 0,
            rareza: c.rareza,
            tipos: (c.stats?.tipos || []).map((k) => ({ k, n: tipoEs(k) })),
            st: { hp: st.hp, atk: st.atk, def: st.def, spe: st.spe },
            img: sprites[i]
          };
        })
      };

      await sock.sendHtml(from, htmlPokedex(datos), [], msg, {});
    } catch (e) {
      console.log("[mispokemon] ERROR: " + e.stack);
      await respaldoTexto({ usuario, cleanText, reply });
    }
  }
};
