// Parche: el bot principal se reconecta solo si falla al arrancar o se queda colgado en "connecting".
// Uso (dentro de la carpeta del bot):  node parche-principal.mjs
import fs from "fs";
const ruta = "index.js";
let t = fs.readFileSync(ruta, "utf8");
if (t.includes("startBotReal")) { console.log("Ya estaba parchado."); process.exit(0); }

const a = "async function startBot() {\n";
if (!t.includes(a)) { console.log("No encontré startBot(), no se cambió nada."); process.exit(1); }
t = t.replace(a,
`async function startBot() {
  try { await startBotReal(); }
  catch (e) {
    console.log("Error al conectar el principal: " + (e && e.message) + " (reintento en 10 s)");
    isConnecting = false;
    setTimeout(startBot, 10000);
  }
}

async function startBotReal() {
`);

const b = 'console.log("Intentando conectar con WhatsApp...");\n';
if (!t.includes(b)) { console.log("No encontré el punto del vigía, no se cambió nada."); process.exit(1); }
t = t.replace(b, b +
`  // Vigía: si en 90 s no abre ni cierra, se fuerza el cierre para que se reintente.
  const vigia = setTimeout(() => {
    console.log("Sin conexión tras 90 s, reintentando...");
    try { sock.end(new Error("vigía")); } catch {}
  }, 90000);
  sock.ev.on("connection.update", (u) => { if (u.connection === "open" || u.connection === "close") clearTimeout(vigia); });
`);

fs.writeFileSync(ruta, t);
console.log("Parche aplicado a index.js");
