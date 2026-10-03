import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import { downloadMediaMessage } from "@fer2809fl/baileys";
import { ownerCommand } from "../../../motores/owner.js";
import { encabezado } from "../../economia/estilo.js";

const execFileAsync = promisify(execFile);

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const LIMITE_BYTES = 40 * 1024 * 1024;
const RAICES_PROHIBIDAS = ["auth_info", "auth_info_", "node_modules", ".git", ".env", "cache", "data"];
const ARCHIVOS_RESPALDADOS = [
  "index.js",
  "motores/db.js",
  "src/nucleo/comandos.js",
  "motores/gacha-core.js",
  "src/comandos/descargas/youtube.js",
  "scripts/verificar.mjs",
  ".gitignore"
];

let enCurso = false;

function buscarDocumento(msg, from) {
  const contenido = msg.message || {};
  const propio = contenido.documentMessage || contenido.documentWithCaptionMessage?.message?.documentMessage;
  if (propio) return { objetivo: msg, documento: propio };

  const ctx = contenido.extendedTextMessage?.contextInfo;
  const citado = ctx?.quotedMessage;
  const documento = citado?.documentMessage || citado?.documentWithCaptionMessage?.message?.documentMessage;
  if (!documento) return null;

  return {
    objetivo: { key: { remoteJid: from, id: ctx.stanzaId, participant: ctx.participant }, message: citado },
    documento
  };
}

function normalizar(entrada) {
  const limpia = entrada.replace(/\\/g, "/").replace(/^\.\//, "");
  if (!limpia || limpia.startsWith("/") || /^[a-zA-Z]:/.test(limpia)) return null;
  if (limpia.split("/").some((parte) => parte === "..")) return null;
  return limpia;
}

function recorrer(base, relativa = "") {
  const resultado = [];
  for (const entrada of fs.readdirSync(path.join(base, relativa), { withFileTypes: true })) {
    const siguiente = path.posix.join(relativa, entrada.name);
    if (entrada.isDirectory()) resultado.push(...recorrer(base, siguiente));
    else if (entrada.isFile()) resultado.push(siguiente);
  }
  return resultado;
}

async function ejecutarNode(argumentos) {
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, argumentos, { cwd: RAIZ, timeout: 120000 });
    return { codigo: 0, salida: `${stdout}\n${stderr}` };
  } catch (e) {
    return { codigo: e.code || 1, salida: `${e.stdout || ""}\n${e.stderr || ""}` };
  }
}

function restaurar(respaldos, nuevos) {
  for (const { destino, copia } of respaldos) {
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.copyFileSync(copia, destino);
  }
  for (const destino of nuevos) {
    if (fs.existsSync(destino)) fs.rmSync(destino, { force: true });
  }
}

export default {
  names: [".subirzip", ".subir", ".actualizar"],
  usage: ".subirzip [reiniciar] (respondiendo a un .zip o enviándolo con este comando)",
  desc: "Aplicar un .zip de actualización al bot, con respaldo y verificación (solo owner)",
  category: "Utilidad",
  handler: ownerCommand(async ({ sock, from, msg, cleanText, reply }) => {
    if (enCurso) return reply({ text: "⏳ Ya hay una actualización en curso. Espera a que finalice." });

    const encontrado = buscarDocumento(msg, from);
    if (!encontrado) {
      return reply({ text: "📦 Envía un archivo .zip con *.subirzip* como descripción, o responde a un .zip con *.subirzip*." });
    }

    const nombre = encontrado.documento.fileName || "actualizacion.zip";
    const tamano = Number(encontrado.documento.fileLength || 0);
    if (!/\.zip$/i.test(nombre)) return reply({ text: "⚠️ El archivo debe tener extensión .zip." });
    if (tamano > LIMITE_BYTES) return reply({ text: "⚠️ El archivo supera el límite de 40 MB." });

    const reiniciar = /\breiniciar\b/i.test(cleanText);
    enCurso = true;

    const marca = new Date().toISOString().replace(/[:.]/g, "-");
    const temporal = fs.mkdtempSync(path.join(os.tmpdir(), "subirzip-"));
    const rutaZip = path.join(temporal, "paquete.zip");
    const rutaExtraida = path.join(temporal, "contenido");
    const rutaRespaldo = path.join(RAIZ, ".respaldo-subidas", marca);
    const respaldos = [];
    const nuevos = [];

    try {
      await reply({ text: "⏳ Descargando y revisando el archivo..." });
      const buffer = await downloadMediaMessage(encontrado.objetivo, "buffer", {});
      fs.writeFileSync(rutaZip, buffer);

      const { stdout } = await execFileAsync("unzip", ["-Z1", rutaZip], { maxBuffer: 10 * 1024 * 1024 });
      const entradas = stdout.split("\n").map((linea) => linea.trim()).filter(Boolean);
      if (!entradas.length) throw new Error("El .zip está vacío.");

      for (const entrada of entradas) {
        if (!normalizar(entrada)) throw new Error(`El .zip contiene una ruta no permitida: ${entrada}`);
      }

      const primeras = new Set(entradas.map((e) => normalizar(e).split("/")[0]));
      const todasAnidadas = entradas.every((e) => normalizar(e).includes("/"));
      const carpetaUnica = primeras.size === 1 && todasAnidadas ? [...primeras][0] : null;
      const prefijo = carpetaUnica && !fs.existsSync(path.join(RAIZ, carpetaUnica)) ? `${carpetaUnica}/` : "";

      fs.mkdirSync(rutaExtraida, { recursive: true });
      await execFileAsync("unzip", ["-o", "-q", rutaZip, "-d", rutaExtraida], { maxBuffer: 10 * 1024 * 1024 });

      const archivos = recorrer(rutaExtraida).map((ruta) => ({
        ruta,
        destinoRelativo: prefijo && ruta.startsWith(prefijo) ? ruta.slice(prefijo.length) : ruta
      }));

      const omitidos = [];
      const aplicables = [];
      for (const archivo of archivos) {
        const relativa = normalizar(archivo.destinoRelativo);
        const raiz = relativa ? relativa.split("/")[0] : "";
        if (!relativa || RAICES_PROHIBIDAS.includes(raiz) || raiz.startsWith(".respaldo")) omitidos.push(archivo.destinoRelativo);
        else aplicables.push({ origen: path.join(rutaExtraida, archivo.ruta), relativa });
      }
      if (!aplicables.length) throw new Error("El .zip no contiene archivos aplicables.");

      for (const relativa of ARCHIVOS_RESPALDADOS) {
        const destino = path.join(RAIZ, relativa);
        if (!fs.existsSync(destino)) continue;
        const copia = path.join(rutaRespaldo, relativa);
        fs.mkdirSync(path.dirname(copia), { recursive: true });
        fs.copyFileSync(destino, copia);
        respaldos.push({ destino, copia });
      }

      let reemplazados = 0;
      for (const { origen, relativa } of aplicables) {
        const destino = path.join(RAIZ, relativa);
        if (fs.existsSync(destino)) {
          reemplazados++;
          if (!respaldos.some((r) => r.destino === destino)) {
            const copia = path.join(rutaRespaldo, relativa);
            fs.mkdirSync(path.dirname(copia), { recursive: true });
            fs.copyFileSync(destino, copia);
            respaldos.push({ destino, copia });
          }
        } else {
          nuevos.push(destino);
        }
        fs.mkdirSync(path.dirname(destino), { recursive: true });
        fs.copyFileSync(origen, destino);
      }

      const scripts = aplicables
        .map((a) => a.relativa)
        .filter((r) => /^scripts\/aplicar-parches[\w-]*\.mjs$/.test(r))
        .sort();

      const lineasParches = [];
      for (const script of scripts) {
        const { salida } = await ejecutarNode([path.join(RAIZ, script)]);
        const aplicados = (salida.match(/^APLICADO/gm) || []).length;
        const previos = (salida.match(/^YA ESTABA/gm) || []).length;
        const faltantes = salida.split("\n").filter((l) => l.startsWith("NO ENCONTRADO"));
        lineasParches.push(`✿ *${path.basename(script)}*:: ${aplicados} aplicados, ${previos} ya existentes`);
        for (const f of faltantes) lineasParches.push(`> ⚠️ ${f.replace(/^NO ENCONTRADO\s+/, "")}`);
      }

      let lineaVerificacion = "✿ *Verificación*:: no disponible";
      const verificador = path.join(RAIZ, "scripts", "verificar.mjs");
      if (fs.existsSync(verificador)) {
        const { salida } = await ejecutarNode([verificador]);
        const problemas = salida.split("\n").filter((l) => /^(Sintaxis inválida|Import inexistente)/.test(l) && !l.includes(".respaldo"));
        const sintaxis = problemas.filter((l) => l.startsWith("Sintaxis inválida"));
        if (sintaxis.length) {
          restaurar(respaldos, nuevos);
          throw new Error(`Se revirtieron los cambios por errores de sintaxis:\n${sintaxis.slice(0, 3).join("\n")}`);
        }
        lineaVerificacion = problemas.length
          ? `✿ *Verificación*:: ${problemas.length} advertencias (${problemas[0].slice(0, 80)})`
          : "✿ *Verificación*:: sin problemas";
      }

      const texto = [
        encabezado("📦", "ACTUALIZACIÓN APLICADA"),
        "",
        `> Archivo: *${nombre}*`,
        "",
        `✿ *Nuevos*:: ${nuevos.length}`,
        `✿ *Reemplazados*:: ${reemplazados}`,
        `✿ *Omitidos por seguridad*:: ${omitidos.length}`,
        ...lineasParches,
        lineaVerificacion,
        "",
        `> Respaldo guardado en *.respaldo-subidas/${marca}*.`,
        reiniciar ? "> Reiniciando el bot para cargar los cambios." : "> Reinicia el bot para cargar los cambios, o usa *.subirzip reiniciar* la próxima vez."
      ].join("\n");
      await reply({ text: texto });

      if (reiniciar) setTimeout(() => process.exit(1), 2000);
    } catch (e) {
      console.log(`❌ Error aplicando la actualización: ${e.message}`);
      await reply({ text: `❌ No se pudo aplicar la actualización: ${e.message}` });
    } finally {
      enCurso = false;
      fs.rmSync(temporal, { recursive: true, force: true });
    }
  })
};
