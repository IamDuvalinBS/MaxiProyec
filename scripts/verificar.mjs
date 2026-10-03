import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IGNORAR = new Set(["node_modules", ".git", "auth_info", "perfiles"]);
const IMPORTS = /(?:import|export)\s[^;]*?from\s+["'](\.[^"']+)["']|import\(\s*["'](\.[^"']+)["']\s*\)/g;

function listar(dir) {
  const archivos = [];
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORAR.has(entrada.name) || entrada.name.startsWith(".")) continue;
    const ruta = path.join(dir, entrada.name);
    if (entrada.isDirectory()) archivos.push(...listar(ruta));
    else if (entrada.name.endsWith(".js") || entrada.name.endsWith(".mjs")) archivos.push(ruta);
  }
  return archivos;
}

let errores = 0;
for (const archivo of listar(RAIZ)) {
  const relativa = path.relative(RAIZ, archivo);
  try {
    execFileSync(process.execPath, ["--check", archivo], { stdio: "pipe" });
  } catch (e) {
    errores++;
    console.log(`Sintaxis inválida: ${relativa}\n${e.stderr}`);
    continue;
  }
  if (relativa.startsWith("scripts")) continue;
  const codigo = fs.readFileSync(archivo, "utf8");
  for (const coincidencia of codigo.matchAll(IMPORTS)) {
    const destino = path.resolve(path.dirname(archivo), coincidencia[1] || coincidencia[2]);
    if (!fs.existsSync(destino)) {
      errores++;
      console.log(`Import inexistente en ${relativa}: ${coincidencia[1] || coincidencia[2]}`);
    }
  }
}

if (errores) {
  console.log(`\n${errores} problema(s) encontrado(s).`);
  process.exit(1);
}
console.log("Verificación completada sin problemas.");
