// motores/akinator.js
//
// Motor de Akinator. A diferencia de juegos-core.js (que dibuja un tablero
// en canvas), Akinator es 100% texto + una foto al final, asi que tiene su
// propio Map de sesiones activas por chat en vez de compartir el de
// juegos-core.
//
// Flujo:
//   1. ".akinator" / ".aki"  -> iniciarAkinator() crea la sesion y manda
//      la primera pregunta.
//   2. Cada mensaje de texto SIN prefijo pasa por procesarTextoAkinator()
//      (se engancha en index.js). Si hay sesion activa en ese chat y el
//      texto es una respuesta valida (numero 1-5, "si", "no", "atras",
//      "rendirse"), la procesa y devuelve true. Si no hay sesion o el
//      texto no aplica, devuelve false para que el mensaje siga su camino
//      normal (juegos-core / trivia).
//   3. Al llegar a un % de progreso alto, se le pide la adivinanza a la
//      API y se muestra el personaje con foto, esperando "si"/"no".
//   4. Si confirma que acerto, se le da plata + xp con cooldown real
//      contra Mongo (mismas funciones que usan .daily / .trabajar).
//
// ⚠️ OJO - dos cosas que tuve que adivinar porque no tengo esos archivos:
//   - La funcion para sumar XP: no se el nombre exacto que usa tu
//     profile.js, asi que intentarSumarXp() prueba varios nombres comunes
//     (addXp, sumarXp, addExperience, giveXp, darXp) y si ninguno existe,
//     simplemente no suma XP (no rompe nada, pero avisa por consola).
//     Si me pasas profile.js te dejo esto con el nombre real.
//   - El metodo para pedir la adivinanza a aki-api cambia segun la
//     version instalada (win() en unas, answer() en otras) - intentarAdivinar()
//     prueba las dos.

import akiApiPkg from "aki-api";
import { addToWallet, checkCooldown, formatTime, box, CURRENCY } from "../core.js";

const { Aki } = akiApiPkg;

const REGION = "es";                 // preguntas/respuestas en español
const UMBRAL_PROGRESO = 80;          // % de confianza para intentar adivinar
const MAX_PASOS = 80;                // por si el progreso nunca llega al umbral
const COOLDOWN_MS = 15 * 60 * 1000;  // 15 min entre premios de akinator
const PREMIO_MIN = 500;
const PREMIO_MAX = 1500;
const XP_GANADA = 15;
const TIEMPO_INACTIVIDAD_MS = 10 * 60 * 1000; // 10 min sin responder = se borra sola

const sesiones = new Map(); // from (chatId) -> sesion

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
  "1": 0, "si": 0,
  "2": 1, "no": 1,
  "3": 2, "no se": 2, "nose": 2,
  "4": 3, "probablemente": 3,
  "5": 4, "probablemente no": 4, "probablementeno": 4
};

function interpretarRespuesta(texto) {
  const t = normalizar(texto);
  return Object.prototype.hasOwnProperty.call(MAPA_RESPUESTAS, t) ? MAPA_RESPUESTAS[t] : null;
}

async function enviar(sock, from, msg, contenido) {
  return sock.sendMessage(from, contenido, msg ? { quoted: msg } : undefined);
}

function mensajePregunta(sesion) {
  const progreso = Math.round(Number(sesion.aki.progress) || 0);
  return {
    text: `🔮 *Pregunta ${sesion.pasos} (${progreso}%)*\n\n${sesion.aki.question}\n\n` +
      `1 · Sí\n2 · No\n3 · No sé\n4 · Probablemente\n5 · Probablemente no\n\n` +
      `✎ *atras* para volver · *rendirse* para salir`
  };
}

function mensajeAdivinanza(guess) {
  const foto = guess.absolute_picture_path || guess.picture_path || guess.photo;
  const texto = `🔮 *Creo que es...*\n\n★ *${guess.name}*\n${guess.description || ""}\n\nResponde *si* o *no*`;
  return foto ? { image: { url: foto }, caption: texto } : { text: texto };
}

// Prueba win() y answer() porque distintas versiones de aki-api usan uno
// u otro para devolver el personaje adivinado.
async function intentarAdivinar(aki) {
  if (typeof aki.win === "function") {
    await aki.win();
  } else if (typeof aki.answer === "function") {
    await aki.answer();
  }
  if (Array.isArray(aki.answers)) return aki.answers;
  if (Array.isArray(aki.guesses)) return aki.guesses;
  return [];
}

// Best-effort: prueba nombres comunes de función de XP en tu core.js.
// Si ninguno existe no revienta nada, solo no suma XP.
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

  const aki = new Aki({ region: REGION });
  try {
    await aki.start();
  } catch (e) {
    console.log(`❌ ERROR iniciando Akinator: ${e.message}`);
    return enviar(sock, from, msg, { text: "❌ No pude conectar con Akinator ahora mismo, intentá de nuevo en un rato." });
  }

  const sesion = {
    aki, sender, pasos: 1, ultimaActividad: Date.now(),
    esperandoConfirmacion: false, listaGuesses: [], indiceGuess: 0
  };
  sesiones.set(from, sesion);
  await enviar(sock, from, msg, mensajePregunta(sesion));
}

async function resolverAcierto(sock, from, msg, sesion) {
  const guess = sesion.listaGuesses[sesion.indiceGuess];
  const wait = checkCooldown(sesion.sender, "akinator", COOLDOWN_MS);

  if (wait > 0) {
    await enviar(sock, from, msg, { text: box("¡ADIVINÉ! 🎉", [
      `★ Era *${guess.name}*`,
      `❁ Me tomó *${sesion.pasos}* preguntas`,
      `⏳ Ya cobraste tu premio de Akinator hace poco, volvé en *${formatTime(wait)}* para cobrar otro.`
    ]) });
    return;
  }

  const monto = PREMIO_MIN + Math.floor(Math.random() * (PREMIO_MAX - PREMIO_MIN + 1));
  addToWallet(sesion.sender, monto);
  const sumoXp = await intentarSumarXp(sesion.sender);

  const lineas = [
    `★ Era *${guess.name}*`,
    `❁ Me tomó *${sesion.pasos}* preguntas`,
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
    await enviar(sock, from, msg, { text: "🔮 Partida de Akinator cancelada." });
    return true;
  }

  if (sesion.esperandoConfirmacion) {
    if (t === "si") {
      await resolverAcierto(sock, from, msg, sesion);
      sesiones.delete(from);
      return true;
    }
    if (t === "no") {
      sesion.indiceGuess++;
      const siguiente = sesion.listaGuesses[sesion.indiceGuess];
      if (siguiente) {
        await enviar(sock, from, msg, mensajeAdivinanza(siguiente));
      } else {
        sesiones.delete(from);
        await enviar(sock, from, msg, { text: "🔮 No logré adivinar tu personaje esta vez 😔. Probá de nuevo con *.akinator*." });
      }
      return true;
    }
    await enviar(sock, from, msg, { text: "✎ Respondé *si* o *no*." });
    return true;
  }

  if (t === "atras") {
    try {
      await sesion.aki.back();
      sesion.pasos = Math.max(1, sesion.pasos - 1);
      await enviar(sock, from, msg, mensajePregunta(sesion));
    } catch (e) {
      await enviar(sock, from, msg, { text: "❌ No hay pregunta anterior a la cual volver." });
    }
    return true;
  }

  const indice = interpretarRespuesta(texto);
  if (indice === null) return false; // no es una respuesta valida, dejamos que siga a trivia/juegos

  try {
    await sesion.aki.step(indice);
  } catch (e) {
    console.log(`❌ ERROR en paso de Akinator: ${e.message}`);
    sesiones.delete(from);
    await enviar(sock, from, msg, { text: "❌ Akinator tuvo un error y se canceló la partida, probá de nuevo." });
    return true;
  }
  sesion.pasos++;

  const progreso = Math.round(Number(sesion.aki.progress) || 0);
  const pasoActual = sesion.aki.currentStep ?? sesion.pasos;
  if (progreso >= UMBRAL_PROGRESO || pasoActual >= MAX_PASOS) {
    const lista = await intentarAdivinar(sesion.aki);
    if (lista.length > 0) {
      sesion.listaGuesses = lista;
      sesion.indiceGuess = 0;
      sesion.esperandoConfirmacion = true;
      await enviar(sock, from, msg, mensajeAdivinanza(lista[0]));
      return true;
    }
  }

  await enviar(sock, from, msg, mensajePregunta(sesion));
  return true;
}
