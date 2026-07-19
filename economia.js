import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { connectDB, commandRegistry, checkTriviaAnswer } from "./core.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const carpetas = [
  { dir: path.join(__dirname, "commands"), prefix: "./commands/" },
  { dir: path.join(__dirname, "reacciones"), prefix: "./reacciones/" }
];

const commandMap = new Map(); // cada nombre/alias -> handler

async function loadCommands() {
  let total = 0;
  for (const { dir, prefix } of carpetas) {
    if (!fs.existsSync(dir)) continue;
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
  console.log(`Comandos cargados: ${commandMap.size} (desde ${total} archivos)`);
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
  await handler({ sock, from, sender, cleanText, msg, reply });
  return true;
}

export { checkTriviaAnswer };
