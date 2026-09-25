// motores/juegos-core.js
//
// Motor central de juegos jugables por chat. Un "juego" es solo un objeto
// con estado inicial, una funcion que dibuja ese estado en un canvas y una
// funcion que aplica una accion (lo que la persona toco) sobre ese estado.
// Este archivo NO sabe nada de Gato, Mario, Tetris, etc - eso vive en cada
// archivo dentro de /juegos. Este archivo solo:
//
//   1. Guarda que juegos existen (registrarJuego).
//   2. Guarda la partida activa de cada chat (Map por "from").
//   3. Sabe renderizar cualquier estado a imagen PNG con el mismo marco
//      visual retro/neon para todos los juegos (titulo + cajitas HUD).
//   4. Arma los botones de WhatsApp y sabe que apretar significa que
//      (todo boton de cualquier juego pasa por ".jbtn <juego> <accion>").
//
// WhatsApp (via botones clasicos de Baileys) solo garantiza 3 botones por
// mensaje. Por eso el patron recomendado para moverse es el mismo que ya
// usan Galaga/Mario: cursor + confirmar, es decir botones tipo
// [ "◀", "✅ Confirmar", "▶" ] en vez de un boton por casilla/accion.
//
// Para agregar un juego nuevo: crear /juegos/<nombre>.js siguiendo el
// ejemplo de gato.js (es el mas simple de los cuatro que pediste).

import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import path from "path";
import { fileURLToPath } from "url";

// IMPORTANTE: en Termux (y en la mayoria de servidores Linux "pelados") no
// hay ninguna fuente de sistema instalada. Sin registrar una a mano, Skia
// dibuja los rectangulos/lineas perfecto pero el texto sale INVISIBLE (por
// eso el titulo y las cajitas de HUD se veian vacias). Descarga cualquier
// .ttf (ej "Press Start 2P" de Google Fonts para el look retro) y guardalo
// en assets/fonts/retro.ttf en la raiz del proyecto.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUTA_FUENTE = path.join(__dirname, "../assets/fonts/retro.ttf");
export let FUENTE = "sans-serif"; // si falla el registro, al menos no explota - solo queda sin texto
try {
  GlobalFonts.registerFromPath(RUTA_FUENTE, "RetroFont");
  FUENTE = "RetroFont";
} catch (e) {
  console.log(`⚠️ No se pudo cargar la fuente de juegos (${RUTA_FUENTE}): ${e.message}. El texto de los juegos no se va a ver hasta que la agregues.`);
}

const juegosRegistrados = new Map(); // id -> definicion del juego
const partidasActivas = new Map();   // from (chatId) -> { juegoId, estado, ultimaAccion }

const TIEMPO_INACTIVIDAD_MS = 10 * 60 * 1000; // 10 min sin tocar nada = se borra sola

/**
 * Cada juego se registra UNA vez, al importarse su archivo, con:
 * - id            string corto, ej "gato"
 * - nombre        titulo que se muestra arriba, ej "GATO RETRO"
 * - ancho/alto    tamaño total del lienzo (con HUD incluido)
 * - crearEstado(sender)                  -> estado inicial de una partida nueva
 * - dibujar(ctx, estado, ancho, alto)     -> dibuja SOLO el area de juego (0,0 = esquina del area)
 * - accion(estado, accionId)              -> devuelve el estado nuevo segun el boton tocado
 * - botones(estado)                       -> array de { id, texto }, maximo 3
 * - hud(estado)                           -> array de { etiqueta, valor } para las cajitas de arriba
 * - terminado(estado)                     -> true/false, si la partida termino
 * - mensajeFinal(estado)                  -> texto a mostrar cuando termina
 */
export function registrarJuego(def) {
  juegosRegistrados.set(def.id, def);
}

function limpiarInactivas() {
  const ahora = Date.now();
  for (const [from, partida] of partidasActivas) {
    if (ahora - partida.ultimaAccion > TIEMPO_INACTIVIDAD_MS) partidasActivas.delete(from);
  }
}

// --- Dibuja el marco/HUD comun (mismo estilo para todos los juegos) ---
function dibujarMarco(ctx, ancho, alto, def, estado) {
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, ancho, alto);

  ctx.fillStyle = "#2dfdc5";
  ctx.font = `bold 28px ${FUENTE}`;
  ctx.shadowColor = "#2dfdc5";
  ctx.shadowBlur = 12;
  ctx.fillText(def.nombre, 20, 42);
  ctx.shadowBlur = 0;

  const stats = def.hud ? def.hud(estado) : [];
  let x = ancho - 20;
  for (let i = stats.length - 1; i >= 0; i--) {
    const { etiqueta, valor } = stats[i];
    const texto = String(valor);
    ctx.font = `bold 16px ${FUENTE}`;
    const w = Math.max(80, ctx.measureText(texto).width + 24);
    x -= w;
    ctx.strokeStyle = "#2dfdc5";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 14, w, 46);
    ctx.fillStyle = "#8a8fa3";
    ctx.font = `11px ${FUENTE}`;
    ctx.fillText(etiqueta, x + 10, 31);
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 18px ${FUENTE}`;
    ctx.fillText(texto, x + 10, 51);
    x -= 10;
  }

  ctx.strokeStyle = "#2dfdc5";
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 74, ancho - 40, alto - 110);
}

function renderizarFrame(def, estado) {
  const ancho = def.ancho || 600;
  const alto = def.alto || 700;
  const canvas = createCanvas(ancho, alto);
  const ctx = canvas.getContext("2d");

  dibujarMarco(ctx, ancho, alto, def, estado);

  // el juego dibuja SOLO adentro de su rectangulo, con su propio 0,0
  ctx.save();
  ctx.translate(25, 79);
  ctx.beginPath();
  ctx.rect(0, 0, ancho - 50, alto - 120);
  ctx.clip();
  def.dibujar(ctx, estado, ancho - 50, alto - 120);
  ctx.restore();

  return canvas.toBuffer("image/png");
}

function armarBotonesWA(def, estado) {
  if (def.terminado(estado)) {
    return [{ buttonId: `.jnuevo ${def.id}`, buttonText: { displayText: "🔁 Jugar de nuevo" } }];
  }
  return def.botones(estado).map((b) => ({
    buttonId: `.jbtn ${def.id} ${b.id}`,
    buttonText: { displayText: b.texto },
  }));
}

async function enviarFrame(sock, from, msg, def, estado) {
  const buffer = renderizarFrame(def, estado);
  const terminado = def.terminado(estado);
  const botones = armarBotonesWA(def, estado);
  const turno = !terminado && def.turnoInfo ? def.turnoInfo(estado) : null;

  const contenido = {
    image: buffer,
    caption: terminado ? `🏁 ${def.mensajeFinal(estado)}` : (turno ? turno.texto : ""),
  };
  if (turno && turno.mentions && turno.mentions.length) contenido.mentions = turno.mentions;
  if (botones.length) {
    contenido.footer = terminado ? "" : "🎮 Toca un boton para jugar";
    contenido.buttons = botones;
    contenido.headerType = 4;
  } else if (def.entradaTexto && !terminado) {
    contenido.footer = "✍️ Responde con un numero para jugar";
  }

  await sock.sendMessage(from, contenido, msg ? { quoted: msg } : undefined);
}

/** Arranca una partida nueva del juego `juegoId` en el chat `from`.
 *  `opciones` se le pasa tal cual a `crearEstado` - por ejemplo
 *  { oponente: jid } para desafiar a alguien puntual en vez de al bot. */
export async function iniciarJuego(sock, from, sender, msg, juegoId, opciones = {}) {
  const def = juegosRegistrados.get(juegoId);
  if (!def) return false;
  limpiarInactivas();
  const estado = def.crearEstado(sender, opciones);
  partidasActivas.set(from, { juegoId, estado, ultimaAccion: Date.now() });
  await enviarFrame(sock, from, msg, def, estado);
  return true;
}

/** Procesa un boton tocado (siempre llega como ".jbtn <juegoId> <accionId>"). */
export async function procesarBoton(sock, from, sender, msg, juegoId, accionId) {
  const def = juegosRegistrados.get(juegoId);
  const partida = partidasActivas.get(from);
  if (!def || !partida || partida.juegoId !== juegoId) {
    await sock.sendMessage(
      from,
      { text: "No hay ninguna partida de eso activa. Iniciala de nuevo con el comando." },
      msg ? { quoted: msg } : undefined
    );
    return;
  }
  partida.estado = def.accion(partida.estado, accionId, sender);
  partida.ultimaAccion = Date.now();
  await enviarFrame(sock, from, msg, def, partida.estado);
}

/**
 * Se llama con CUALQUIER mensaje de texto plano (no-comando) antes de
 * mandarlo a la trivia. Si hay una partida activa en `from` cuyo juego
 * acepta texto (def.entradaTexto) y `texto` es una jugada valida de
 * `sender`, la aplica y devuelve true (el llamador no debe seguir
 * procesando ese mensaje como otra cosa). Si no aplica, devuelve false
 * sin tocar nada - así un chat normal con un juego activo no se rompe.
 */
export async function intentarProcesarTexto(sock, from, sender, texto, msg) {
  const partida = partidasActivas.get(from);
  if (!partida) return false;
  const def = juegosRegistrados.get(partida.juegoId);
  if (!def || !def.entradaTexto || !def.validarTexto) return false;

  const accionId = def.validarTexto(partida.estado, texto, sender);
  if (accionId === null || accionId === undefined) return false;

  partida.estado = def.accion(partida.estado, accionId, sender);
  partida.ultimaAccion = Date.now();
  await enviarFrame(sock, from, msg, def, partida.estado);
  return true;
}
