import { config, idCanonico } from "./db.js";
import { esHalloween } from "../src/economia/temas.js";
import { getProfile } from "./profile.js";
import { firmar, recordDe, topDe, rankingDe, limpiarNombre, JUEGOS } from "./juegos-records.js";
import { urlPublica } from "./juegos-api.js";

// Envía un juego HTML:
//  - responde (cita) al mensaje de quien pidió el comando
//  - inyecta el tema (Halloween o normal), el récord guardado en Mongo, el top 5 y el ranking
//  - "variantes": juegos con varios récords (modos) → un pase, récord y top por cada uno
export async function enviarJuego({ sock, from, msg, sender, juego, html, variantes }) {
  if (typeof sock.sendHtml !== "function") throw new Error("este Baileys no tiene sendHtml");
  const ids = Array.isArray(variantes) && variantes.length ? variantes : [juego];
  const uid = idCanonico(sender);
  const t = Date.now();
  const nombre = limpiarNombre(msg?.pushName || getProfile(sender)?.name || "Jugador");

  const filas = await Promise.all(
    ids.map(async (id) => [
      id,
      { f: firmar(id, uid, t), rec: await recordDe(id, uid), top: await topDe(id, 5), menor: JUEGOS[id]?.menor ? 1 : 0 }
    ])
  );
  const v = Object.fromEntries(filas);
  const rk = await rankingDe(ids, 10, uid);
  const main = v[juego] || filas[0][1];
  const bot = String(sock.user?.id || "").split(":")[0].split("@")[0];

  const datos = {
    j: juego,
    t,
    f: main.f,
    rec: main.rec,
    top: main.top,
    menor: main.menor,
    hw: esHalloween() ? 1 : 0,
    rk,
    bot,
    cmd: (config.prefix || ".") + "grecord",
    api: urlPublica(),
    n: nombre,
    v
  };
  const json = JSON.stringify(datos).replace(/</g, "\\u003c");
  const salida = html
    .replaceAll("__FIRMA__", () => config.botNameShort || "MaxiProyec")
    .replace("__DATA__", () => json);
  // 4.º parámetro = mensaje citado → el juego llega como respuesta al comando
  await sock.sendHtml(from, salida, [], msg, {});
}
