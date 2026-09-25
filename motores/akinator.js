// motores/akinator.js
//
// Las librerías de Node para Akinator (aki-api, akinator-client) quedaron
// rotas contra la protección actual del sitio. Esta versión le habla por
// HTTP a un mini-servicio en Python (akinator_server.py, en la raíz del
// proyecto) que usa la librería "akinator" de Python + "cloudscraper" -
// mucho más robusta esquivando Cloudflare.
//
// A DIFERENCIA de la primera versión de esto: ya NO hace falta abrir una
// segunda terminal a mano. Este archivo arranca "akinator_server.py" solo
// como proceso hijo la primera vez que alguien usa .akinator, y si
// detecta que faltan las dependencias de Python (akinator/flask), las
// instala solo con pip antes de reintentar. Con un simple "node index.js"
// alcanza, para vos y para cualquiera que se baje tu bot.
//
// A diferencia de juegos-core.js (que dibuja un tablero en canvas), el
// juego en sí es 100% texto + una foto al final, asi que tiene su propio
// Map de sesiones activas por chat en vez de compartir el de juegos-core.
//
// Flujo:
//   1. ".akinator" / ".aki"  -> iniciarAkinator() (arranca el servidor
//      Python si hace falta) le pide una partida nueva y manda la
//      primera pregunta.
//   2. Cada mensaje de texto SIN prefijo pasa por procesarTextoAkinator()
//      (enganchado en index.js). Si hay sesion activa en ese chat y el
//      texto es una respuesta valida (numero 1-5, "si", "no", "atras",
//      "rendirse"), la procesa y devuelve true. Si no, devuelve false.
//   3. Cuando Akinator adivina, se muestra el personaje con foto y se
//      espera "si"/"no".
//   4. Si confirma que acertó, se le da plata + xp con cooldown real
//      contra Mongo (mismas funciones que usan .daily / .trabajar).
//
// Nota: si Akinator adivina mal, no intenta seguir adivinando (para eso
// está /exclude en el servidor, que no implementamos acá para mantenerlo
// simple y confiable) - directamente invita a jugar de nuevo.
//
// ⚠️ Una cosa que tuve que adivinar porque no tengo tu profile.js: el
// nombre de la función para sumar XP. intentarSumarXp() prueba varios
// nombres comunes (addXp, sumarXp, addExperience, giveXp, darXp) contra tu
// core.js y si ninguno existe, no rompe nada, solo no suma XP. Pasame
// profile.js si querés que quede con el nombre real.

import { spawn, execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { addToWallet, checkCooldown, formatTime, box, CURRENCY } from "../core.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ_PROYECTO = path.join(__dirname, "..");
const SCRIPT_SERVIDOR = path.join(RAIZ_PROYECTO, "akinator_server.py");

const SERVIDOR = "http://127.0.0.1:5057";
const COOLDOWN_MS = 15 * 60 * 1000;  // 15 min entre premios de akinator
const PREMIO_MIN = 500;
const PREMIO_MAX = 1500;
const XP_GANADA = 15;
const TIEMPO_INACTIVIDAD_MS = 10 * 60 * 1000; // 10 min sin responder = se borra sola

// ── Arranque automático del servidor Python ──────────────────────────────

let procesoServidor = null;
let estadoServidor = "sin-iniciar"; // sin-iniciar | iniciando | listo | error
let promesaInicio = null;
let mensajeError = "";

// Solo funciona en Termux (y sistemas basados en apt, que también tienen
// "pkg" o similar) - si no existe el comando "pkg", esto simplemente
// falla y seguimos con el mensaje de error normal.
function instalarPython() {
  return new Promise((resolve) => {
    console.log("📦 [Akinator] No encontré Python instalado, probando instalarlo con pkg...");
    execFile("pkg", ["install", "-y", "python"], { cwd: RAIZ_PROYECTO }, (err) => {
      resolve(!err);
    });
  });
}

function ejecutarPip() {
  return new Promise((resolve) => {
    console.log("📦 [Akinator] Instalando dependencias de Python (akinator, flask)... puede tardar un poco la primera vez.");
    execFile("pip", ["install", "akinator", "flask", "--break-system-packages"], { cwd: RAIZ_PROYECTO }, (err) => {
      if (!err) return resolve(true);
      execFile("pip", ["install", "akinator", "flask"], { cwd: RAIZ_PROYECTO }, (err2) => {
        resolve(!err2);
      });
    });
  });
}

function intentarSpawn(binario, reintentoTrasInstalar = false) {
  return new Promise((resolve) => {
    const hijo = spawn(binario, [SCRIPT_SERVIDOR], { cwd: RAIZ_PROYECTO });
    let salidaError = "";
    let resuelto = false;

    const marcarListo = () => {
      if (resuelto) return;
      resuelto = true;
      procesoServidor = hijo;
      estadoServidor = "listo";
      resolve(true);
    };

    hijo.stdout.on("data", (d) => {
      if (d.toString().includes("escuchando en")) marcarListo();
    });
    hijo.stderr.on("data", (d) => { salidaError += d.toString(); });

    hijo.on("error", (e) => {
      if (resuelto) return;
      resuelto = true;
      mensajeError = `No encontré el ejecutable "${binario}" (${e.message}). ¿Tenés Python instalado? (pkg install python)`;
      resolve(false);
    });

    hijo.on("exit", (codigo) => {
      if (resuelto) return;
      resuelto = true;
      const faltaModulo = /ModuleNotFoundError|No module named/i.test(salidaError);
      if (faltaModulo && !reintentoTrasInstalar) {
        ejecutarPip().then((ok) => {
          if (!ok) {
            mensajeError = "Faltan instalar dependencias de Python (akinator, flask) y no pude instalarlas solo. Probá vos con: pip install akinator flask";
            return resolve(false);
          }
          intentarSpawn(binario, true).then(resolve);
        });
      } else {
        mensajeError = salidaError.trim().split("\n").slice(-5).join("\n") || `El servidor de Akinator se cerró solo (código ${codigo}).`;
        resolve(false);
      }
    });

    // Si en 1.5s no hubo ni error, ni cierre, ni el aviso de "listo" en
    // stdout, lo damos por arrancado igual (por si el print no llegó a
    // tiempo). Los reintentos de conexión en llamar() cubren el resto.
    setTimeout(() => { if (!resuelto) marcarListo(); }, 1500);
  });
}

async function asegurarServidorAkinator() {
  if (estadoServidor === "listo") return true;
  if (estadoServidor === "error") return false;
  if (promesaInicio) return promesaInicio;

  estadoServidor = "iniciando";
  promesaInicio = (async () => {
    let ok = await intentarSpawn("python3");
    if (!ok && mensajeError.includes("No encontré el ejecutable")) {
      ok = await intentarSpawn("python");
    }
    if (!ok && mensajeError.includes("No encontré el ejecutable")) {
      // Ni "python3" ni "python" existen: probamos instalarlo solo
      // (Termux). Si no hay "pkg" en el sistema, esto no hace nada y
      // seguimos con el error normal.
      const instalado = await instalarPython();
      if (instalado) ok = await intentarSpawn("python3");
    }
    if (!ok) estadoServidor = "error";
    return ok;
  })();

  return promesaInicio;
}

function apagarServidor() {
  if (procesoServidor) procesoServidor.kill();
}
process.on("exit", apagarServidor);
process.on("SIGINT", () => { apagarServidor(); process.exit(); });
process.on("SIGTERM", () => { apagarServidor(); process.exit(); });

// ── Comunicación con el servidor ──────────────────────────────────────────

async function llamar(ruta, body) {
  const ok = await asegurarServidorAkinator();
  if (!ok) throw new Error(mensajeError || "No pude iniciar el servidor de Akinator.");

  for (let intento = 1; ; intento++) {
    try {
      const r = await fetch(`${SERVIDOR}${ruta}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {})
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `Error ${r.status} del servidor de Akinator`);
      return data;
    } catch (e) {
      const conexionRechazada = e.code === "ECONNREFUSED" || e.cause?.code === "ECONNREFUSED";
      if (!conexionRechazada || intento >= 4) throw e;
      await new Promise((res) => setTimeout(res, 800)); // el server puede seguir arrancando
    }
  }
}

// ── Sesiones de juego por chat ────────────────────────────────────────────

const sesiones = new Map(); // from (chatId) -> { id, sender, ultimaActividad, esperandoConfirmacion, guess }

function limpiarInactivas() {
  const ahora = Date.now();
  for (const [from, sesion] of sesiones) {
    if (ahora - sesion.ultimaActividad > TIEMPO_INACTIVIDAD_MS) sesiones.delete(from);
  }
}

function normalizar(texto) {
  return texto
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim().replace(/\s+/g, " ");
}

const MAPA_RESPUESTAS = {
  "1": "si", "si": "si",
  "2": "no", "no": "no",
  "3": "nose", "no se": "nose", "nose": "nose",
  "4": "probablemente", "probablemente": "probablemente",
  "5": "probablementeno", "probablemente no": "probablementeno", "probablementeno": "probablementeno"
};

function interpretarRespuesta(texto) {
  return MAPA_RESPUESTAS[normalizar(texto)]; // undefined si no matchea nada
}

async function enviar(sock, from, msg, contenido) {
  return sock.sendMessage(from, contenido, msg ? { quoted: msg } : undefined);
}

function mensajePregunta(estado) {
  return {
    text: `🔮 *Pregunta ${estado.paso + 1} (${Math.round(estado.progreso)}%)*\n\n${estado.pregunta}\n\n` +
      `1 · Sí\n2 · No\n3 · No sé\n4 · Probablemente\n5 · Probablemente no\n\n` +
      `✎ *atras* para volver · *rendirse* para salir`
  };
}

function mensajeAdivinanza(estado) {
  const texto = `🔮 *Creo que es...*\n\n★ *${estado.nombre}*\n${estado.descripcion || ""}\n\nResponde *si* o *no*`;
  return estado.foto ? { image: { url: estado.foto }, caption: texto } : { text: texto };
}

async function intentarSumarXp(sender) {
  try {
    const core = await import("../core.js");
    const fn = core.addXp || core.sumarXp || core.addExperience || core.giveXp || core.darXp;
    if (typeof fn === "function") {
      fn(sender, XP_GANADA);
      return true;
    }
  } catch (e) {
    console.log(`⚠️ No pude sumar XP de Akinator: ${e.message}`);
  }
  return false;
}

export async function iniciarAkinator(sock, from, sender, msg) {
  limpiarInactivas();
  if (sesiones.has(from)) {
    return enviar(sock, from, msg, {
      text: "🔮 Ya hay una partida de Akinator activa en este chat. Respondé la pregunta, o escribí *rendirse* para cancelarla."
    });
  }

  if (estadoServidor === "iniciando" || estadoServidor === "sin-iniciar") {
    await enviar(sock, from, msg, { text: "🔮 Preparando Akinator, un segundo..." });
  }

  let estado;
  try {
    estado = await llamar("/start");
  } catch (e) {
    console.log(`❌ ERROR iniciando Akinator: ${e.message}`);
    return enviar(sock, from, msg, { text: `❌ No pude iniciar Akinator ahora mismo.\n\n${e.message}` });
  }

  sesiones.set(from, { id: estado.id, sender, ultimaActividad: Date.now(), esperandoConfirmacion: false, guess: null });
  await enviar(sock, from, msg, mensajePregunta(estado));
}

async function resolverAcierto(sock, from, msg, sesion) {
  const guess = sesion.guess;
  const wait = checkCooldown(sesion.sender, "akinator", COOLDOWN_MS);

  if (wait > 0) {
    await enviar(sock, from, msg, { text: box("¡ADIVINÉ! 🎉", [
      `★ Era *${guess.nombre}*`,
      `❁ Me tomó *${guess.paso + 1}* preguntas`,
      `⏳ Ya cobraste tu premio de Akinator hace poco, volvé en *${formatTime(wait)}* para cobrar otro.`
    ]) });
    return;
  }

  const monto = PREMIO_MIN + Math.floor(Math.random() * (PREMIO_MAX - PREMIO_MIN + 1));
  addToWallet(sesion.sender, monto);
  const sumoXp = await intentarSumarXp(sesion.sender);

  const lineas = [
    `★ Era *${guess.nombre}*`,
    `❁ Me tomó *${guess.paso + 1}* preguntas`,
    `🪙 *GANANCIA* ›› +${monto} ${CURRENCY}`
  ];
  if (sumoXp) lineas.push(`✨ *EXPERIENCIA* ›› +${XP_GANADA} Akinator XP`);
  lineas.push(`⏳ *Enfriamiento* ›› ${formatTime(COOLDOWN_MS)}`);

  await enviar(sock, from, msg, { text: box("¡ADIVINÉ! 🎉", lineas) });
}

export async function procesarTextoAkinator(sock, from, sender, texto, msg) {
  limpiarInactivas();
  const sesion = sesiones.get(from);
  if (!sesion) return false;
  if (sesion.sender !== sender) return false; // solo contesta quien arrancó la partida

  const t = normalizar(texto);
  sesion.ultimaActividad = Date.now();

  if (t === "rendirse" || t === "salir" || t === "cancelar") {
    sesiones.delete(from);
    llamar("/cerrar", { id: sesion.id }).catch(() => {});
    await enviar(sock, from, msg, { text: "🔮 Partida de Akinator cancelada." });
    return true;
  }

  if (sesion.esperandoConfirmacion) {
    if (t === "si") {
      await resolverAcierto(sock, from, msg, sesion);
      sesiones.delete(from);
      llamar("/cerrar", { id: sesion.id }).catch(() => {});
      return true;
    }
    if (t === "no") {
      sesiones.delete(from);
      llamar("/cerrar", { id: sesion.id }).catch(() => {});
      await enviar(sock, from, msg, { text: "🔮 Vaya, no acerté 😅. Probá de nuevo con *.akinator*." });
      return true;
    }
    await enviar(sock, from, msg, { text: "✎ Respondé *si* o *no*." });
    return true;
  }

  if (t === "atras") {
    try {
      const estado = await llamar("/atras", { id: sesion.id });
      await enviar(sock, from, msg, mensajePregunta(estado));
    } catch (e) {
      await enviar(sock, from, msg, { text: "❌ No hay pregunta anterior a la cual volver." });
    }
    return true;
  }

  const respuesta = interpretarRespuesta(texto);
  if (respuesta === undefined) return false; // no es una respuesta valida, dejamos que siga a trivia/juegos

  let estado;
  try {
    estado = await llamar("/answer", { id: sesion.id, respuesta });
  } catch (e) {
    console.log(`❌ ERROR en paso de Akinator: ${e.message}`);
    sesiones.delete(from);
    await enviar(sock, from, msg, { text: "❌ Akinator tuvo un error y se canceló la partida, probá de nuevo." });
    return true;
  }

  if (estado.gano) {
    sesion.esperandoConfirmacion = true;
    sesion.guess = estado;
    await enviar(sock, from, msg, mensajeAdivinanza(estado));
    return true;
  }

  if (estado.agotado) {
    sesiones.delete(from);
    await enviar(sock, from, msg, { text: "🔮 Me quedé sin preguntas, no logré adivinarlo 😔. Probá de nuevo con *.akinator*." });
    return true;
  }

  await enviar(sock, from, msg, mensajePregunta(estado));
  return true;
}
