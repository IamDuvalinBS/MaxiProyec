import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { connectDB, commandRegistry, checkTriviaAnswer } from "./core.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsDir = path.join(__dirname, "commands");

const commandMap = new Map(); // cada nombre/alias -> handler

async function loadCommands() {
  const files = fs.readdirSync(commandsDir).filter(f => f.endsWith(".js"));
  for (const file of files) {
    const mod = await import(`./commands/${file}`);
    const cmd = mod.default;
    if (!cmd || !cmd.names || !cmd.handler) {
      console.log(`⚠️ Comando invalido en ${file}, se salteo.`);
      continue;
    }
    for (const name of cmd.names) {
      commandMap.set(name, cmd.handler);
    }
    // Se registra una sola vez por comando (para el .menu), usando el primer nombre como key
    commandRegistry.set(cmd.names[0], {
      names: cmd.names,
      desc: cmd.desc || "",
      category: cmd.category || "General",
      usage: cmd.usage || cmd.names[0]
    });
  }
  console.log(`Comandos cargados: ${commandMap.size} (desde ${files.length} archivos)`);
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
