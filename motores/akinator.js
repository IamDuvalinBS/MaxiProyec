// motores/akinator.js
//
// Motor de Akinator, usando la librería "akinator-client" (no "aki-api" -
// esa quedó rota porque Akinator le agregó proteccion Cloudflare a su web
// y aki-api usa axios, que Cloudflare detecta y bloquea con 403).
//
// A diferencia de juegos-core.js (que dibuja un tablero en canvas), esto es
// 100% texto + una foto al final, asi que tiene su propio Map de sesiones
// activas por chat en vez de compartir el de juegos-core.
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
//   3. Cuando Akinator adivina (result.won), se muestra el personaje con
//      foto y se espera "si"/"no".
//   4. Si confirma que acerto, se le da plata + xp con cooldown real
//      contra Mongo (mismas funciones que usan .daily / .trabajar).
//
// ⚠️ Sobre el "no, no era ese personaje": akinator-client tiene un
// continue() para seguir intentando, pero la libreria misma avisa que ESO
// necesita una API key de ScraperAPI (o un proxy con IP fija tipo
// navegador real) porque justo esa parte (/exclude) es la que Cloudflare
// sigue bloqueando. Si no tenés eso configurado, lo mas simple (y lo que
// recomienda la propia libreria) es arrancar una partida nueva en vez de
// intentar seguir la misma. Por eso, si el personaje no era el correcto,
// esto cancela la partida y te invita a jugar de nuevo con .akinator.
//
// ⚠️ Otra cosa que tuve que adivinar porque no tengo tu profile.js: el
// nombre de la funcion para sumar XP. intentarSumarXp() prueba varios
// nombres comunes (addXp, sumarXp, addExperience, giveXp, darXp) contra tu
// core.js y si ninguno existe, no rompe nada, solo no suma XP. Pasame
// profile.js si querés que quede con el nombre real.

import { AkinatorClient, Themes, Answers } from "akinator-client";
import { addToWallet, checkCooldown, formatTime, box, CURRENCY } from "../core.js";

const IDIOMA = "es";                 // preguntas/respuestas en español
const COOLDOWN_MS = 15 * 60 * 1000;  // 15 min entre premios de akinator
const PREMIO_MIN = 500;
const PREMIO_MAX = 1500;
const XP_GANADA = 15;
const TIEMPO_INACTIVIDAD_MS = 10 * 60 * 1000; // 10 min sin responder = se borra sola

const sesiones = new Map(); // from (chatId) -> { client, sender, ultimaActividad }

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
  "1": Answers.Yes, "si": Answers.Yes,
  "2": Answers.No, "no": Answers.No,
  "3": Answers.IDontKnow, "no se": Answers.IDontKnow, "nose": Answers.IDontKnow,
  "4": Answers.Probably, "probablemente": Answers.Probably,
  "5": Answers.ProbablyNot, "probablemente no": Answers.ProbablyNot, "probablementeno": Answers.ProbablyNot
};

function interpretarRespuesta(texto) {
  return MAPA_RESPUESTAS[normalizar(texto)]; // undefined si no matchea nada
}

async function enviar(sock, from, msg, contenido) {
  return sock.sendMessage(from, contenido, msg ? { quoted: msg } : undefined);
}

function mensajePregunta(client) {
  const progreso = Math.round(Number(client.progression) || 0);
  return {
    text: `🔮 *Pregunta ${client.step + 1} (${progreso}%)*\n\n${client.question}\n\n` +
      `1 · Sí\n2 · No\n3 · No sé\n4 · Probablemente\n5 · Probablemente no\n\n` +
      `✎ *atras* para volver · *rendirse* para salir`
  };
}

function mensajeAdivinanza(win) {
  const texto = `🔮 *Creo que es...*\n\n★ *${win.name}*\n${win.description || ""}\n\nResponde *si* o *no*`;
  return win.pictureUrl ? { image: { url: win.pictureUrl }, caption: texto } : { text: texto };
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

  const client = new AkinatorClient({ language: IDIOMA, theme: Themes.Character });
  try {
    await client.start();
  } catch (e) {
    console.log(`❌ ERROR iniciando Akinator: ${e.message}`);
    return enviar(sock, from, msg, { text: "❌ No pude conectar con Akinator ahora mismo, intentá de nuevo en un rato." });
  }

  sesiones.set(from, { client, sender, ultimaActividad: Date.now() });
  await enviar(sock, from, msg, mensajePregunta(client));
}

async function resolverAcierto(sock, from, msg, sesion) {
  const { client, sender } = sesion;
  const win = client.winResult;
  const wait = checkCooldown(sender, "akinator", COOLDOWN_MS);

  try {
    await client.submitWin();
  } catch (e) {
    console.log(`⚠️ No pude confirmar el win en Akinator: ${e.message}`);
  }

  if (wait > 0) {
    await enviar(sock, from, msg, { text: box("¡ADIVINÉ! 🎉", [
      `★ Era *${win.name}*`,
      `❁ Me tomó *${client.step + 1}* preguntas`,
      `⏳ Ya cobraste tu premio de Akinator hace poco, volvé en *${formatTime(wait)}* para cobrar otro.`
    ]) });
    return;
  }

  const monto = PREMIO_MIN + Math.floor(Math.random() * (PREMIO_MAX - PREMIO_MIN + 1));
  addToWallet(sender, monto);
  const sumoXp = await intentarSumarXp(sender);

  const lineas = [
    `★ Era *${win.name}*`,
    `❁ Me tomó *${client.step + 1}* preguntas`,
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
  const { client } = sesion;

  if (t === "rendirse" || t === "salir" || t === "cancelar") {
    sesiones.delete(from);
    await enviar(sock, from, msg, { text: "🔮 Partida de Akinator cancelada." });
    return true;
  }

  if (client.won) {
    if (t === "si") {
      await resolverAcierto(sock, from, msg, sesion);
      sesiones.delete(from);
      return true;
    }
    if (t === "no") {
      sesiones.delete(from);
      await enviar(sock, from, msg, { text: "🔮 Vaya, no acerté 😅. Probá de nuevo con *.akinator*." });
      return true;
    }
    await enviar(sock, from, msg, { text: "✎ Respondé *si* o *no*." });
    return true;
  }

  if (t === "atras") {
    try {
      await client.back();
      await enviar(sock, from, msg, mensajePregunta(client));
    } catch (e) {
      await enviar(sock, from, msg, { text: "❌ No hay pregunta anterior a la cual volver." });
    }
    return true;
  }

  const respuesta = interpretarRespuesta(texto);
  if (respuesta === undefined) return false; // no es una respuesta valida, dejamos que siga a trivia/juegos

  let resultado;
  try {
    resultado = await client.answer(respuesta);
  } catch (e) {
    console.log(`❌ ERROR en paso de Akinator: ${e.message}`);
    sesiones.delete(from);
    await enviar(sock, from, msg, { text: "❌ Akinator tuvo un error y se canceló la partida, probá de nuevo." });
    return true;
  }

  if (resultado.won) {
    await enviar(sock, from, msg, mensajeAdivinanza(client.winResult));
    return true;
  }

  if (resultado.ko) {
    sesiones.delete(from);
    await enviar(sock, from, msg, { text: "🔮 Me quedé sin preguntas, no logré adivinarlo 😔. Probá de nuevo con *.akinator*." });
    return true;
  }

  await enviar(sock, from, msg, mensajePregunta(client));
  return true;
}
