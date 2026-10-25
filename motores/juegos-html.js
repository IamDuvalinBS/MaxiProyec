import { config, idCanonico } from "./db.js";
import { esHalloween } from "../src/economia/temas.js";
import { firmar, recordDe, topDe, JUEGOS } from "./juegos-records.js";

// Envía un juego HTML:
//  - responde (cita) al mensaje de quien pidió el comando
//  - inyecta el tema (Halloween o normal), el récord guardado en Mongo y el top 5
export async function enviarJuego({ sock, from, msg, sender, juego, html, variantes }) {
  if (typeof sock.sendHtml !== "function") throw new Error("este Baileys no tiene sendHtml");
  const def = JUEGOS[juego];
  const uid = idCanonico(sender);
  const t = Date.now();
  const [rec, top] = await Promise.all([recordDe(juego, uid), topDe(juego, 5)]);
  // juegos con varios récords (modos): una firma, récord y top por cada variante
  let v;
  if (Array.isArray(variantes) && variantes.length) {
    const filas = await Promise.all(variantes.map(async (id) => [id, { f: firmar(id, uid, t), rec: await recordDe(id, uid), top: await topDe(id, 5) }]));
    v = Object.fromEntries(filas);
  }
  const bot = String(sock.user?.id || "").split(":")[0].split("@")[0];
  const datos = {
    j: juego,
    t,
    f: firmar(juego, uid, t),
    hw: esHalloween() ? 1 : 0,
    rec,
    top,
    bot,
    menor: def?.menor ? 1 : 0,
    cmd: (config.prefix || ".") + "grecord",
    v
  };
  const json = JSON.stringify(datos).replace(/</g, "\\u003c");
  const salida = html
    .replaceAll("__FIRMA__", () => config.botNameShort || "MaxiProyec")
    .replace("__DATA__", () => json);
  // 4.º parámetro = mensaje citado → el juego llega como respuesta al comando
  await sock.sendHtml(from, salida, [], msg, {});
}
