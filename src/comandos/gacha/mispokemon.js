import { gachaListo, mostrarColeccion } from "../../../motores/gacha-core.js";
import { contarColeccion, recargarGacha } from "../../../motores/gacha-db.js";
import { revisarMigracion } from "../../../motores/gacha-migracion.js";

const ESPERA_RECARGA_MS = 60 * 1000;
let ultimaRecarga = 0;

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

export default {
  names: [".mispokemon"],
  desc: "Muestra tus Pokémon con su nivel",
  category: "Gacha",
  usage: ".mispokemon [página]",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    await gachaListo;
    const usuario = await buscarUsuario(candidatosDeUsuario(sock, msg, sender));
    await revisarMigracion({ sender: usuario, from, reply }).catch(() => {});
    await mostrarColeccion({
      sock, from, msg, categoria: "pokemon", sender: usuario, cleanText, reply,
      titulo: "Tus Pokémon",
      pista: "🍖 Súbelos de nivel con *.pokecomida* (usa #id para elegir cuál)."
    });
  }
};
