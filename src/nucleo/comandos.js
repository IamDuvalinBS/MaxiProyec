import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { connectDB, commandRegistry, simularEscritura, delayAleatorio, comandoEstaBaneado } from "../../core.js";
import { enviarConCache, reenviarCacheado, guardarRelay, registrarMedio, claveDeDescarga } from "../../motores/cache-medios.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CARPETAS_EXCLUIDAS = new Set([
  "node_modules", "auth_info", "perfiles", "motores", "kamijs", "assets", "photo", "src", "scripts"
]);

const comandos = new Map();
const categoriaDeComando = new Map();

function descubrirCarpetas() {
  const carpetas = [];
  for (const entrada of fs.readdirSync(RAIZ, { withFileTypes: true })) {
    if (!entrada.isDirectory() || entrada.name.startsWith(".") || CARPETAS_EXCLUIDAS.has(entrada.name)) continue;
    carpetas.push(path.join(RAIZ, entrada.name));
  }
  const base = path.join(RAIZ, "src", "comandos");
  if (fs.existsSync(base)) {
    for (const entrada of fs.readdirSync(base, { withFileTypes: true })) {
      if (entrada.isDirectory()) carpetas.push(path.join(base, entrada.name));
    }
  }
  return carpetas;
}

async function cargarComandos() {
  let total = 0;
  const carpetas = descubrirCarpetas();

  for (const carpeta of carpetas) {
    const archivos = fs.readdirSync(carpeta).filter((f) => f.endsWith(".js"));
    for (const archivo of archivos) {
      const ruta = path.join(carpeta, archivo);
      const relativa = path.relative(RAIZ, ruta);
      try {
        const modulo = await import(pathToFileURL(ruta).href);
        const cmd = modulo.default;
        if (!cmd || !cmd.names || !cmd.handler) {
          console.log(`⚠️ Comando inválido en ${relativa}, se omitió.`);
          continue;
        }
        const categoria = cmd.category || "General";
        for (const nombre of cmd.names) {
          if (comandos.has(nombre)) console.log(`⚠️ El comando ${nombre} está repetido (${relativa}).`);
          comandos.set(nombre, cmd.handler);
          categoriaDeComando.set(nombre, categoria);
        }
        commandRegistry.set(cmd.names[0], {
          names: cmd.names,
          desc: cmd.desc || "",
          category: cmd.category || "General",
          usage: cmd.usage || cmd.names[0]
        });
        total++;
      } catch (e) {
        console.log(`❌ ERROR cargando ${relativa}: ${e.message}`);
      }
    }
  }

  console.log(`Comandos cargados: ${comandos.size} (desde ${total} archivos, en ${carpetas.length} carpetas)`);
}

connectDB();
const cargaLista = cargarComandos();

const COMANDOS_PROTEGIDOS = new Set([".banear", ".desbanear", ".baneos"]);

const historialComandos = new Map();

function debeEsperarPorSpam(sender) {
  const ahora = Date.now();
  const historial = (historialComandos.get(sender) || []).filter((t) => ahora - t < 10000);
  historial.push(ahora);
  historialComandos.set(sender, historial);
  return historial.length > 10;
}

export async function manejarComando(sock, from, sender, text, msg) {
  await cargaLista;

  const cleanText = text.trim();
  const comando = cleanText.toLowerCase().split(/\s+/)[0];
  const handler = comandos.get(comando);
  if (!handler) return false;

  let capturados = null;

  const reply = async (contenido) => {
    await delayAleatorio(300, 900);
    await simularEscritura(sock, from, 800 + Math.floor(Math.random() * 1200));
    const enviado = await enviarConCache(sock, from, contenido, msg);
    if (capturados) registrarMedio(capturados, enviado);
    return enviado;
  };

  if (!COMANDOS_PROTEGIDOS.has(comando) && comandoEstaBaneado(comando, categoriaDeComando.get(comando))) {
    await reply({ text: "🚫 Este comando está desactivado por ahora." });
    return true;
  }

  if (debeEsperarPorSpam(sender)) {
    await delayAleatorio(4000, 8000);
  }

  const claveDescarga = claveDeDescarga(categoriaDeComando.get(comando), comando, cleanText);
  if (claveDescarga && (await reenviarCacheado(sock, from, claveDescarga, msg))) return true;
  if (claveDescarga) capturados = [];

  try {
    await handler({ sock, from, sender, cleanText, msg, reply });
    if (claveDescarga && capturados.length) guardarRelay(claveDescarga, capturados);
  } catch (e) {
    console.log(`❌ ERROR ejecutando el comando "${comando}": ${e.stack || e.message}`);
    await reply({ text: "❌ Ocurrió un error interno ejecutando ese comando." });
  }
  return true;
}
