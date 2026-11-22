import fs from "fs";
import path from "path";
import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import { ownerCommand } from "../../../motores/owner.js";
import { guardarCuentasPendientes } from "../../../motores/db.js";
import { guardarKarma } from "../../../motores/karma.js";
import { tarjeta } from "../../economia/formato.js";
import { enviarNativeFlow } from "../../../motores/botones-nativos.js";
import { ajusteBot } from "../../../motores/ajustes-bot.js";

const execFileAsync = promisify(execFile);
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const CODIGO_REINICIO = 42;
const LIMITE_SALIDA = 1500;

let enCurso = false;

async function correr(comando, args, tiempoMs = 120000) {
  const { stdout, stderr } = await execFileAsync(comando, args, {
    cwd: RAIZ,
    timeout: tiempoMs,
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }
  });
  return `${stdout}${stderr}`.trim();
}

const MAX_LISTA = 12;

const lista = (items) => {
  if (!items.length) return ["• Ninguno"];
  const visibles = items.slice(0, MAX_LISTA).map((i) => `> 📄 [${i}]`);
  if (items.length > MAX_LISTA) visibles.push(`> … y ${items.length - MAX_LISTA} más`);
  return visibles;
};

// Saca el nombre del comando (".algo") de un archivo de src/comandos; si no lo encuentra usa el nombre del archivo.
function nombreComando(archivo) {
  try {
    const codigo = fs.readFileSync(path.join(RAIZ, archivo), "utf8");
    const m = codigo.match(/names:\s*\[\s*["'`]([^"'`]+)["'`]/);
    if (m) return m[1];
  } catch {}
  return path.basename(archivo, path.extname(archivo));
}

const esComando = (f) => /^src\/comandos\/.+\.js$/.test(f) && !path.basename(f).startsWith("_") && !f.includes("/_lib/");

const recortar = (texto) => (texto.length > LIMITE_SALIDA ? `…${texto.slice(-LIMITE_SALIDA)}` : texto);

const supervisado = () => process.env.MAXI_SUPERVISADO === "1";

async function reiniciar() {
  try {
    await guardarCuentasPendientes();
  } catch (e) {
    console.log(`❌ No se pudieron guardar las cuentas antes de reiniciar: ${e.message}`);
  }
  try {
    await guardarKarma();
  } catch (e) {
    console.log(`❌ No se pudo guardar el karma antes de reiniciar: ${e.message}`);
  }

  if (!supervisado()) {
    // El bot no se inició con npm start: se lanza una copia nueva (espera 3 s a que esta se cierre y libere el puerto).
    try {
      const hijo = spawn("sh", ["-c", "sleep 3; exec node index.js"], {
        cwd: RAIZ,
        detached: true,
        stdio: "inherit",
        env: process.env
      });
      hijo.unref();
    } catch (e) {
      console.log(`❌ No se pudo lanzar la copia nueva del bot: ${e.message}`);
    }
    setTimeout(() => process.exit(0), 1000);
    return;
  }

  setTimeout(() => process.exit(CODIGO_REINICIO), 1000);
}

export default {
  names: [".update", ".actualizar", ".reiniciar"],
  usage: ".update | .update reiniciar",
  desc: "Actualizar el bot desde GitHub (git pull) y reiniciarlo (solo owner)",
  category: "Utilidad",
  handler: ownerCommand(async ({ sock, from, msg, cleanText, reply }) => {
    if (enCurso) return reply({ text: "⏳ Ya hay una actualización en curso." });
    enCurso = true;

    try {
      const [comando, opcion = ""] = cleanText.trim().toLowerCase().split(/\s+/);
      const soloReiniciar = comando === ".reiniciar" || opcion === "reiniciar";
      let cambios = [];

      if (!soloReiniciar) {
        await reply({ text: "🔄 Buscando actualizaciones en GitHub…" });

        const antes = (await correr("git", ["rev-parse", "HEAD"])).trim();
        try {
          await correr("git", ["pull", "--ff-only"]);
        } catch (e) {
          return reply({
            text: tarjeta({
              emoji: "❌",
              titulo: "NO SE PUDO ACTUALIZAR",
              relato: "Git no pudo traer los cambios. Puede haber archivos modificados en el bot o un problema de conexión.",
              lineas: [`\`\`\`${recortar(String(e.stderr || e.message))}\`\`\``],
              tip: "El bot sigue encendido con la versión actual."
            })
          });
        }
        const despues = (await correr("git", ["rev-parse", "HEAD"])).trim();

        if (antes === despues) {
          return reply({
            text: tarjeta({
              emoji: "✅",
              titulo: "TODO AL DÍA",
              relato: "El bot ya tiene la última versión, no hay nada que actualizar.",
              tip: "Usa *.update reiniciar* si solo quieres reiniciarlo."
            })
          });
        }

        const filas = (await correr("git", ["diff", "--name-status", "--no-renames", antes, despues])).split("\n").filter(Boolean);
        const eliminados = [];
        for (const fila of filas) {
          const [estado, ...resto] = fila.split("\t");
          const archivo = resto.join("\t");
          if (estado === "D") eliminados.push(archivo);
          else cambios.push(archivo);
        }

        for (const archivo of cambios.filter((f) => f.endsWith(".js") && fs.existsSync(path.join(RAIZ, f)))) {
          try {
            await correr("node", ["--check", archivo], 30000);
          } catch (e) {
            return reply({
              text: tarjeta({
                emoji: "⛔",
                titulo: "ACTUALIZACIÓN CON ERRORES",
                relato: `El archivo *${archivo}* trae errores de sintaxis, por eso no se reinició el bot.`,
                lineas: [`\`\`\`${recortar(String(e.stderr || e.message))}\`\`\``],
                tip: "El bot sigue encendido con la versión anterior cargada en memoria."
              })
            });
          }
        }

        if (cambios.some((f) => f === "package.json" || f === "package-lock.json")) {
          await reply({ text: "📦 Cambiaron las dependencias, instalando…" });
          try {
            await correr("npm", ["install", "--no-audit", "--no-fund"], 5 * 60 * 1000);
          } catch (e) {
            return reply({ text: `❌ Falló *npm install*:\n\`\`\`${recortar(String(e.stderr || e.message))}\`\`\`` });
          }
        }

        const comandos =[...new Set(cambios.filter(esComando).map(nombreComando))];
        const texto = tarjeta({
          emoji: "✅",
          titulo: "UPDATE COMPLETADO",
          lineas: [
            `🛠️ *${cambios.length}* ${cambios.length === 1 ? "archivo nuevo/actualizado" : "archivos nuevos/actualizados"}`,
            `🗑️ *${eliminados.length}* ${eliminados.length === 1 ? "archivo eliminado" : "archivos eliminados"}`,
            "",
            "📄 *DOCUMENTOS EDITADOS:*",
            ...lista(cambios),
            "",
            "🗑️ *DOCUMENTOS ELIMINADOS:*",
            ...lista(eliminados),
            "",
            "🧩 *COMANDOS EDITADOS:*",
            ...(comandos.length ? comandos.map((c) => `• ${c}`) : ["• Ninguno"])
          ]
        });

        const enviado = await enviarNativeFlow({
          sock,
          from,
          msg,
          texto,
          footer: ajusteBot("botNameShort"),
          botones: [{ name: "quick_reply", params: { display_text: "🔄 Reiniciar", id: ".update reiniciar" } }]
        });
        if (!enviado) await reply({ text: `${texto}\n\n> Usa *.update reiniciar* para aplicar los cambios.` });
        return;
      }

      await reply({
        text: tarjeta({
          emoji: "🔁",
          titulo: "REINICIANDO BOT",
          relato: "Reiniciando el bot, vuelvo en unos segundos."
        })
      });
      await reiniciar();
    } catch (e) {
      console.log(`❌ Error en .update: ${e.message}`);
      await reply({ text: `❌ Error actualizando: ${e.message}` });
    } finally {
      enCurso = false;
    }
  })
};

const esLanzador = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (esLanzador) {
  const lanzar = () => {
    const hijo = spawn(process.execPath, ["index.js"], {
      cwd: RAIZ,
      stdio: "inherit",
      env: { ...process.env, MAXI_SUPERVISADO: "1" }
    });
    hijo.on("exit", (codigo, senal) => {
      if (codigo === CODIGO_REINICIO) {
        console.log("Reiniciando el bot...");
        setTimeout(lanzar, 2000);
        return;
      }
      console.log(`El bot se detuvo (${senal || `código ${codigo}`}).`);
      process.exit(codigo ?? 1);
    });
  };
  lanzar();
      }
