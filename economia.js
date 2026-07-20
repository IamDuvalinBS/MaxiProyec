import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { connectDB, commandRegistry, checkTriviaAnswer } from "./core.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carpetas que NUNCA se leen como si tuvieran comandos (archivos de sistema/datos)
const CARPETAS_EXCLUIDAS = new Set([
  "node_modules", "auth_info", ".git", ".github", "perfiles"
]);

// Descubre automaticamente CUALQUIER carpeta en la raiz del proyecto que
// tenga archivos .js adentro, y la trata como una carpeta de comandos.
// Para agregar una categoria nueva (ej: "juegos/"), solo hay que crear la
// carpeta con sus comandos - no hace falta tocar este archivo para nada.
function descubrirCarpetas() {
  const entradas = fs.readdirSync(__dirname, { withFileTypes: true });
  return entradas
    .filter(e => e.isDirectory() && !e.name.startsWith(".") && !CARPETAS_EXCLUIDAS.has(e.name))
    .map(e => ({ dir: path.join(__dirname, e.name), prefix: `./${e.name}/`, nombre: e.name }));
}

const commandMap = new Map(); // cada nombre/alias -> handler

async function loadCommands() {
  let total = 0;
  const carpetas = descubrirCarpetas();

  for (const { dir, prefix } of carpetas) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));
    for (const file of files) {
      try {
        const mod = await import(`${prefix}${file}`);
        const cmd = mod.default;
        if (!cmd || !cmd.names || !cmd.handler) {
          console.log(`⚠️ Comando invalido en ${prefix}${file}, se salteo.`);
          continue;
        }
        for (const name of cmd.names) {
          commandMap.set(name, cmd.handler);
        }
        commandRegistry.set(cmd.names[0], {
          names: cmd.names,
          desc: cmd.desc || "",
          category: cmd.category || "General",
          usage: cmd.usage || cmd.names[0]
        });
        total++;
      } catch (e) {
        console.log(`❌ ERROR cargando ${prefix}${file}: ${e.message}`);
      }
    }
  }

  const nombresCarpetas = carpetas.map(c => c.nombre).join(", ");
  console.log(`Comandos cargados: ${commandMap.size} (desde ${total} archivos, en carpetas: ${nombresCarpetas})`);
}

connectDB();
const readyPromise = loadCommands();

export async function handleEconomyCommand(sock, from, sender, text, msg) {
  await readyPromise;

  const cleanText = text.trim();
  const cmd = cleanText.toLowerCase().split(/\s+/)[0];
  const handler = commandMap.get(cmd);
  if (!handler) return false;

  const reply = (content) => sock.sendMessage(from, content, { quoted: msg });
  try {
    await handler({ sock, from, sender, cleanText, msg, reply });
  } catch (e) {
    console.log(`❌ ERROR ejecutando el comando "${cmd}": ${e.stack || e.message}`);
    await reply({ text: "❌ Ocurrió un error interno ejecutando ese comando." });
  }
  return true;
}

export { checkTriviaAnswer };
          
