// motores/akinator.js
//
// Usa un Chromium real (headless) que abre akinator.com como lo haría una
// persona: clickea "JUGAR", elige "Personaje", y va clickeando Sí/No/etc.
// en los botones reales de la página - es la única forma que encontramos
// que pasa la protección anti-bot de Akinator (las librerías que solo
// simulan pedidos HTTP no la pasan, sea cual sea la que probemos).
//
// Para cuidar la memoria del teléfono: Chromium se abre recién cuando
// alguien arranca una partida con .akinator, y se cierra del todo apenas
// esa partida termina (gana, se rinde, o se cancela por error) - nunca
// queda prendido de fondo sin usarse.
//
// A diferencia de juegos-core.js (que dibuja un tablero en canvas), esto es
// 100% texto + una foto al final, asi que tiene su propio Map de sesiones
// activas por chat en vez de compartir el de juegos-core.
//
// Selectores reales de akinator.com (confirmados a mano, pueden cambiar si
// el sitio se rediseña):
//   Portada:              a[onclick*="jouer"]                    (botón JUGAR)
//   Selección de tema:    li[onclick*="chooseTheme('1')"]        (Personaje)
//   Pregunta:             #question-label (texto) / #step-info (n° pregunta)
//   Respuestas:           #a_yes #a_no #a_dont_know #a_probably #a_probaly_not
//   Volver atrás:         #a_cancel_answer
//   Bloque de adivinanza: #proposeGameBlock (oculto hasta que hay guess)
//   Nombre/desc/foto:     #name_proposition #description_proposition #img_character
//   Confirmar acierto:    #a_propose_yes / #a_propose_no
//
// ⚠️ Una cosa que tuve que adivinar porque no tengo tu profile.js: el
// nombre de la función para sumar XP. intentarSumarXp() prueba varios
// nombres comunes (addXp, sumarXp, addExperience, giveXp, darXp) contra tu
// core.js y si ninguno existe, no rompe nada, solo no suma XP.

import { execFile } from "node:child_process";
import fs from "node:fs";
import puppeteer from "puppeteer-core";
import { addToWallet, checkCooldown, formatTime, box, CURRENCY } from "../core.js";

const COOLDOWN_MS = 15 * 60 * 1000;  // 15 min entre premios de akinator
const PREMIO_MIN = 500;
const PREMIO_MAX = 1500;
const XP_GANADA = 15;
const TIEMPO_INACTIVIDAD_MS = 10 * 60 * 1000; // 10 min sin responder = se borra sola
const MAX_PASOS = 80;

const SELECTOR_JUGAR = 'a[onclick*="jouer"]';
const SELECTOR_TEMA_PERSONAJE = "li[onclick*=\"chooseTheme('1')\"]";
const SELECTORES_RESPUESTA = {
  si: "#a_yes",
  no: "#a_no",
  nose: "#a_dont_know",
  probablemente: "#a_probably",
  probablementeno: "#a_probaly_not" // sí, tiene ese typo en el sitio real
};

const ARGS_CHROMIUM = [
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--disable-extensions",
  "--disable-background-networking",
  "--disable-sync",
  "--disable-translate",
  "--disable-default-apps",
  "--mute-audio",
  "--renderer-process-limit=1",
  "--single-process",
  "--no-zygote",
  "--js-flags=--max-old-space-size=128"
];

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Ubicar / instalar Chromium ────────────────────────────────────────────

const RUTAS_CANDIDATAS = [
  "/data/data/com.termux/files/usr/bin/chromium-browser", // Termux
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium"
];

function encontrarChromium() {
  return RUTAS_CANDIDATAS.find((ruta) => fs.existsSync(ruta)) || null;
}

// Solo funciona en Termux (o sistemas con "pkg"); si no existe ese
// comando, simplemente no hace nada y seguimos con el error normal.
function instalarChromiumTermux() {
  return new Promise((resolve) => {
    console.log("📦 [Akinator] No encontré Chromium instalado, probando instalarlo (puede tardar unos minutos)...");
    execFile("pkg", ["install", "-y", "x11-repo"], () => {
      execFile("pkg", ["install", "-y", "chromium"], { timeout: 5 * 60 * 1000 }, (err) => {
        resolve(!err);
      });
    });
  });
}

let rutaChromiumCacheada = null; // solo cacheamos la ubicación, no el proceso

// Abre un Chromium NUEVO para esta partida puntual. Se cierra del todo al
// terminar la partida (ver cerrarSesion). No se comparte entre partidas.
async function lanzarNavegador() {
  if (!rutaChromiumCacheada) rutaChromiumCacheada = encontrarChromium();
  if (!rutaChromiumCacheada) {
    const instalado = await instalarChromiumTermux();
    if (instalado) rutaChromiumCacheada = encontrarChromium();
  }
  if (!rutaChromiumCacheada) {
    throw new Error("No encontré Chromium instalado. En Termux: pkg install x11-repo && pkg install chromium");
  }
  return puppeteer.launch({ executablePath: rutaChromiumCacheada, headless: true, args: ARGS_CHROMIUM });
}

// ── Interacción con la página real de Akinator ────────────────────────────

async function esperarQueResuelvaCloudflare(pagina, maxSegundos = 25) {
  for (let i = 0; i < maxSegundos; i++) {
    const titulo = await pagina.title().catch(() => "");
    if (!titulo.toLowerCase().includes("just a moment")) return;
    await esperar(1000);
  }
}

async function abrirNuevaPartida(navegador) {
  const pagina = await navegador.newPage();
  const uaOriginal = await navegador.userAgent();
  await pagina.setUserAgent(uaOriginal.replace("HeadlessChrome", "Chrome"));
  await pagina.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  // No necesitamos ver imágenes/fuentes/video, solo el link de la foto al
  // final - esto baja bastante el uso de memoria y de red.
  await pagina.setRequestInterception(true);
  pagina.on("request", (req) => {
    const tipo = req.resourceType();
    if (tipo === "image" || tipo === "media" || tipo === "font") req.abort();
    else req.continue();
  });

  await pagina.goto("https://es.akinator.com", { waitUntil: "domcontentloaded", timeout: 45000 });
  await esperarQueResuelvaCloudflare(pagina);
  await pagina.waitForSelector(SELECTOR_JUGAR, { timeout: 20000 });
  await pagina.click(SELECTOR_JUGAR);

  await esperarQueResuelvaCloudflare(pagina, 25);
  await pagina.waitForSelector(SELECTOR_TEMA_PERSONAJE, { timeout: 20000 });
  await pagina.click(SELECTOR_TEMA_PERSONAJE);

  await esperarQueResuelvaCloudflare(pagina, 25);
  await pagina.waitForSelector("#question-label", { timeout: 20000 });
  return pagina;
}

async function leerPregunta(pagina) {
  return pagina.evaluate(() => ({
    pregunta: document.querySelector("#question-label")?.textContent?.trim() || "",
    paso: parseInt(document.querySelector("#step-info")?.textContent || "1", 10)
  }));
}

async function estaListoParaAdivinar(pagina) {
  return pagina.evaluate(() => {
    const bloque = document.querySelector("#proposeGameBlock");
    return !!bloque && window.getComputedStyle(bloque).display !== "none";
  });
}

async function leerAdivinanza(pagina) {
  return pagina.evaluate(() => {
    const nombre = document.querySelector("#name_proposition")?.textContent?.trim() || "";
    const descripcion = document.querySelector("#description_proposition")?.textContent?.trim() || "";
    let foto = document.querySelector("#img_character img")?.src || "";
    if (!foto) {
      const div = document.querySelector("#img_character");
      const bg = div ? window.getComputedStyle(div).backgroundImage : "";
      const match = /url\((['"]?)(.*?)\1\)/.exec(bg || "");
      foto = match ? match[2] : "";
    }
    return { nombre, descripcion, foto };
  });
}

async function esperarActualizacion(pagina, pasoAnterior) {
  await pagina.waitForFunction(
    (pasoAnterior) => {
      const bloque = document.querySelector("#proposeGameBlock");
      if (bloque && window.getComputedStyle(bloque).display !== "none") return true;
      const pasoActual = parseInt(document.querySelector("#step-info")?.textContent || "0", 10);
      return pasoActual !== pasoAnterior;
    },
    { timeout: 15000 },
    pasoAnterior
  );
}

// ── Sesiones de juego por chat ────────────────────────────────────────────
// Cada sesión tiene SU PROPIO Chromium (navegador), no uno compartido.

const sesiones = new Map(); // from (chatId) -> { navegador, pagina, sender, ultimaActividad, esperandoConfirmacion, guess }

async function cerrarSesion(from) {
  const sesion = sesiones.get(from);
  if (!sesion) return;
  sesiones.delete(from);
  await sesion.navegador.close().catch(() => {});
}

async function limpiarInactivas() {
  const ahora = Date.now();
  for (const [from, sesion] of sesiones) {
    if (ahora - sesion.ultimaActividad > TIEMPO_INACTIVIDAD_MS) {
      await cerrarSesion(from);
    }
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
    text: `🔮 *Pregunta ${estado.paso}*\n\n${estado.pregunta}\n\n` +
      `1 · Sí\n2 · No\n3 · No sé\n4 · Probablemente\n5 · Probablemente no\n\n` +
      `✎ *atras* para volver · *rendirse* para salir`
  };
}

function mensajeAdivinanza(guess) {
  const texto = `🔮 *Creo que es...*\n\n★ *${guess.nombre}*\n${guess.descripcion || ""}\n\nResponde *si* o *no*`;
  return guess.foto ? { image: { url: guess.foto }, caption: texto } : { text: texto };
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
  await limpiarInactivas();
  if (sesiones.has(from)) {
    return enviar(sock, from, msg, {
      text: "🔮 Ya hay una partida de Akinator activa en este chat. Respondé la pregunta, o escribí *rendirse* para cancelarla."
    });
  }

  const mensajePreparando = await sock.sendMessage(from, { text: "🔮 Preparando Akinator, un segundo..." }, msg ? { quoted: msg } : undefined);

  let navegador;
  try {
    navegador = await lanzarNavegador();
  } catch (e) {
    console.log(`❌ ERROR iniciando Akinator: ${e.message}`);
    return sock.sendMessage(from, { text: `❌ No pude iniciar Akinator ahora mismo.\n\n${e.message}`, edit: mensajePreparando.key });
  }

  let pagina;
  try {
    pagina = await abrirNuevaPartida(navegador);
  } catch (e) {
    console.log(`❌ ERROR abriendo partida de Akinator: ${e.message}`);
    await navegador.close().catch(() => {});
    return sock.sendMessage(from, { text: `❌ No pude conectar con Akinator ahora mismo. Probá de nuevo en un rato.\n\n${e.message}`, edit: mensajePreparando.key });
  }

  const estado = await leerPregunta(pagina);
  sesiones.set(from, { navegador, pagina, sender, ultimaActividad: Date.now(), esperandoConfirmacion: false, guess: null });

  await sock.sendMessage(from, { ...mensajePregunta(estado), edit: mensajePreparando.key });
}

async function resolverAcierto(sock, from, msg, sesion) {
  const guess = sesion.guess;
  const wait = checkCooldown(sesion.sender, "akinator", COOLDOWN_MS);

  await sesion.pagina.click("#a_propose_yes").catch(() => {});

  if (wait > 0) {
    await enviar(sock, from, msg, { text: box("¡ADIVINÉ! 🎉", [
      `★ Era *${guess.nombre}*`,
      `⏳ Ya cobraste tu premio de Akinator hace poco, volvé en *${formatTime(wait)}* para cobrar otro.`
    ]) });
    return;
  }

  const monto = PREMIO_MIN + Math.floor(Math.random() * (PREMIO_MAX - PREMIO_MIN + 1));
  addToWallet(sesion.sender, monto);
  const sumoXp = await intentarSumarXp(sesion.sender);

  const lineas = [
    `★ Era *${guess.nombre}*`,
    `🪙 *GANANCIA* ›› +${monto} ${CURRENCY}`
  ];
  if (sumoXp) lineas.push(`✨ *EXPERIENCIA* ›› +${XP_GANADA} Akinator XP`);
  lineas.push(`⏳ *Enfriamiento* ›› ${formatTime(COOLDOWN_MS)}`);

  await enviar(sock, from, msg, { text: box("¡ADIVINÉ! 🎉", lineas) });
}

export async function procesarTextoAkinator(sock, from, sender, texto, msg) {
  await limpiarInactivas();
  const sesion = sesiones.get(from);
  if (!sesion) return false;
  if (sesion.sender !== sender) return false; // solo contesta quien arrancó la partida

  const t = normalizar(texto);
  sesion.ultimaActividad = Date.now();

  if (t === "rendirse" || t === "salir" || t === "cancelar") {
    await cerrarSesion(from);
    await enviar(sock, from, msg, { text: "🔮 Partida de Akinator cancelada." });
    return true;
  }

  if (sesion.esperandoConfirmacion) {
    if (t === "si") {
      await resolverAcierto(sock, from, msg, sesion);
      await cerrarSesion(from);
      return true;
    }
    if (t === "no") {
      await sesion.pagina.click("#a_propose_no").catch(() => {});
      await cerrarSesion(from);
      await enviar(sock, from, msg, { text: "🔮 Vaya, no acerté 😅. Probá de nuevo con *.akinator*." });
      return true;
    }
    await enviar(sock, from, msg, { text: "✎ Respondé *si* o *no*." });
    return true;
  }

  if (t === "atras") {
    try {
      const antes = await leerPregunta(sesion.pagina);
      await sesion.pagina.click("#a_cancel_answer");
      await esperarActualizacion(sesion.pagina, antes.paso);
      const estado = await leerPregunta(sesion.pagina);
      await enviar(sock, from, msg, mensajePregunta(estado));
    } catch (e) {
      await enviar(sock, from, msg, { text: "❌ No hay pregunta anterior a la cual volver." });
    }
    return true;
  }

  const respuesta = interpretarRespuesta(texto);
  if (respuesta === undefined) return false; // no es una respuesta valida, dejamos que siga a trivia/juegos

  const selector = SELECTORES_RESPUESTA[respuesta];
  let pasoAnterior;
  try {
    pasoAnterior = (await leerPregunta(sesion.pagina)).paso;
    await sesion.pagina.click(selector);
    await esperarActualizacion(sesion.pagina, pasoAnterior);
  } catch (e) {
    console.log(`❌ ERROR en paso de Akinator: ${e.message}`);
    await cerrarSesion(from);
    await enviar(sock, from, msg, { text: "❌ Akinator tuvo un error y se canceló la partida, probá de nuevo." });
    return true;
  }

  const listoParaAdivinar = await estaListoParaAdivinar(sesion.pagina);
  if (listoParaAdivinar) {
    const guess = await leerAdivinanza(sesion.pagina);
    sesion.esperandoConfirmacion = true;
    sesion.guess = guess;
    await enviar(sock, from, msg, mensajeAdivinanza(guess));
    return true;
  }

  const estado = await leerPregunta(sesion.pagina);
  if (estado.paso >= MAX_PASOS) {
    await cerrarSesion(from);
    await enviar(sock, from, msg, { text: "🔮 Me quedé sin preguntas, no logré adivinarlo 😔. Probá de nuevo con *.akinator*." });
    return true;
  }

  await enviar(sock, from, msg, mensajePregunta(estado));
  return true;
}

// Por si el bot entero se cierra con una partida activa, no dejar Chromium
// huérfano corriendo en segundo plano.
function apagarTodo() {
  for (const sesion of sesiones.values()) sesion.navegador.close().catch(() => {});
}
process.on("exit", apagarTodo);
process.on("SIGINT", () => { apagarTodo(); process.exit(); });
process.on("SIGTERM", () => { apagarTodo(); process.exit(); });
      
