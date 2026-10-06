
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import path from "path";
import { fileURLToPath } from "url";

// IMPORTANTE: en Termux (y en la mayoria de servidores Linux "pelados") no
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUTA_FUENTE = path.join(__dirname, "../assets/fonts/retro.ttf");
export let FUENTE = "sans-serif";
try {
  GlobalFonts.registerFromPath(RUTA_FUENTE, "RetroFont");
  FUENTE = "RetroFont";
} catch (e) {
  console.log(`⚠️ No se pudo cargar la fuente de juegos (${RUTA_FUENTE}): ${e.message}. El texto de los juegos no se va a ver hasta que la agregues.`);
}

const juegosRegistrados = new Map();
const partidasActivas = new Map();

const TIEMPO_INACTIVIDAD_MS = 10 * 60 * 1000;

export function registrarJuego(def) {
  juegosRegistrados.set(def.id, def);
}

function limpiarInactivas() {
  const ahora = Date.now();
  for (const [from, partida] of partidasActivas) {
    if (ahora - partida.ultimaAccion > TIEMPO_INACTIVIDAD_MS) partidasActivas.delete(from);
  }
}

function dibujarMarco(ctx, ancho, alto, def, estado) {
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, ancho, alto);

  ctx.fillStyle = "#2dfdc5";
  ctx.font = `28px ${FUENTE}`;
  ctx.shadowColor = "#2dfdc5";
  ctx.shadowBlur = 12;
  ctx.fillText(def.nombre, 20, 42);
  ctx.shadowBlur = 0;

  const stats = def.hud ? def.hud(estado) : [];
  let x = ancho - 20;
  for (let i = stats.length - 1; i >= 0; i--) {
    const { etiqueta, valor } = stats[i];
    const texto = String(valor);
    ctx.font = `16px ${FUENTE}`;
    const w = Math.max(80, ctx.measureText(texto).width + 24);
    x -= w;
    ctx.strokeStyle = "#2dfdc5";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 14, w, 46);
    ctx.fillStyle = "#8a8fa3";
    ctx.font = `11px ${FUENTE}`;
    ctx.fillText(etiqueta, x + 10, 31);
    ctx.fillStyle = "#ffffff";
    ctx.font = `18px ${FUENTE}`;
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
  if (def.terminado(estado)) return [];
  return def.botones(estado).map((b) => ({
    buttonId: `.jbtn ${def.id} ${b.id}`,
    buttonText: { displayText: b.texto },
  }));
}

async function enviarFrame(sock, from, msg, def, estado, extraFinal) {
  const buffer = renderizarFrame(def, estado);
  const terminado = def.terminado(estado);
  const botones = armarBotonesWA(def, estado);
  const turno = !terminado && def.turnoInfo ? def.turnoInfo(estado) : null;

  const mentions = new Set();
  if (turno && turno.mentions) turno.mentions.forEach((j) => mentions.add(j));

  let caption = terminado
    ? `🏁 ${def.mensajeFinal(estado)}`
    : (turno ? turno.texto : "");
  if (terminado && extraFinal) {
    if (extraFinal.lineas && extraFinal.lineas.length) caption += `\n${extraFinal.lineas.join("\n")}`;
    if (extraFinal.mentions) extraFinal.mentions.forEach((j) => mentions.add(j));
  }
  if (terminado) caption += "\n\nEscribí el comando de nuevo para jugar otra vez.";

  const contenido = { image: buffer, caption };
  if (mentions.size) contenido.mentions = [...mentions];
  if (botones.length) {
    contenido.footer = "🎮 Toca un boton para jugar";
    contenido.buttons = botones;
    contenido.headerType = 4;
  } else if (def.entradaTexto && !terminado) {
    contenido.footer = "✍️ Responde con un numero para jugar";
  }

  await sock.sendMessage(from, contenido, msg ? { quoted: msg } : undefined);
}

export async function iniciarJuego(sock, from, sender, msg, juegoId, opciones = {}) {
  const def = juegosRegistrados.get(juegoId);
  if (!def) return false;
  limpiarInactivas();
  const estado = def.crearEstado(sender, opciones, msg);
  partidasActivas.set(from, { juegoId, estado, ultimaAccion: Date.now() });
  await enviarFrame(sock, from, msg, def, estado);
  return true;
}

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
  const yaEstabaTerminado = def.terminado(partida.estado);
  partida.estado = def.accion(partida.estado, accionId, sender, msg);
  partida.ultimaAccion = Date.now();

  let extraFinal = null;
  if (!yaEstabaTerminado && def.terminado(partida.estado) && def.alGanar) {
    extraFinal = await def.alGanar(partida.estado, sender, msg);
  }
  await enviarFrame(sock, from, msg, def, partida.estado, extraFinal);
}

export async function intentarProcesarTexto(sock, from, sender, texto, msg) {
  const partida = partidasActivas.get(from);
  if (!partida) return false;
  const def = juegosRegistrados.get(partida.juegoId);
  if (!def || !def.entradaTexto || !def.validarTexto) return false;

  const accionId = def.validarTexto(partida.estado, texto, sender);
  if (accionId === null || accionId === undefined) return false;

  // disparar def.alGanar() una sola vez (dar premio, etc) - no en cada frame
  const yaEstabaTerminado = def.terminado(partida.estado);
  partida.estado = def.accion(partida.estado, accionId, sender, msg);
  partida.ultimaAccion = Date.now();

  let extraFinal = null;
  if (!yaEstabaTerminado && def.terminado(partida.estado) && def.alGanar) {
    extraFinal = await def.alGanar(partida.estado, sender, msg);
  }

  await enviarFrame(sock, from, msg, def, partida.estado, extraFinal);
  return true;
}
