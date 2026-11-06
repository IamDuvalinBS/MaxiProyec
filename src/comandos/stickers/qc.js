import { createCanvas, loadImage } from "@napi-rs/canvas";
import { crearSticker, contextoMeta, descargarBuffer, claveMeta } from "../../nucleo/sticker.js";
import { envolver, rectRedondeado } from "../../nucleo/lienzo.js";
import { getAllAccounts } from "../../../motores/db.js";
import { getProfile } from "../../../motores/profile.js";
import { textoCitado, limitarEspera } from "../../../motores/herramientas-ui.js";

const ANCHO = 512;
const AVATAR = 72;
const MAX_CARACTERES = 280;
const ESPERA_MS = 4000;
const COLORES_NOMBRE = ["#53bdeb", "#ff8a8a", "#7be495", "#ffd166", "#c792ea", "#f78fb3", "#4dd0e1", "#ffab70"];
const FUENTE = '"Roboto", "Noto Sans", "DejaVu Sans", sans-serif';
const esperas = new Map();

const colorDe = (clave) => COLORES_NOMBRE[[...clave].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORES_NOMBRE.length];

function nombreDe(jid, sender, msg) {
  const numero = claveMeta(jid);
  if (jid === sender) return getProfile(sender).name || msg?.pushName || numero;
  return getAllAccounts().get(jid)?.profile?.name || numero;
}

async function avatarDe(sock, jid, nombre) {
  try {
    const url = await sock.profilePictureUrl(jid, "image");
    if (url) return await loadImage(await descargarBuffer(url));
  } catch (e) {}
  const lienzo = createCanvas(AVATAR, AVATAR);
  const ctx = lienzo.getContext("2d");
  ctx.fillStyle = colorDe(claveMeta(jid));
  ctx.fillRect(0, 0, AVATAR, AVATAR);
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 38px ${FUENTE}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(([...String(nombre)][0] || "?").toUpperCase(), AVATAR / 2, AVATAR / 2 + 2);
  return lienzo;
}

async function dibujarCita({ nombre, texto, avatar, color }) {
  const relleno = 18;
  const anchoBurbuja = ANCHO - AVATAR - 28;
  const anchoTexto = anchoBurbuja - relleno * 2;
  const medida = createCanvas(10, 10).getContext("2d");
  medida.font = `28px ${FUENTE}`;
  const lineas = envolver(medida, texto, anchoTexto);
  const alto = relleno * 2 + 34 + lineas.length * 36;

  const lienzo = createCanvas(ANCHO, alto + 20);
  const ctx = lienzo.getContext("2d");
  const x0 = AVATAR + 18;
  const y0 = 10;

  ctx.save();
  ctx.beginPath();
  ctx.arc(AVATAR / 2 + 4, y0 + AVATAR / 2, AVATAR / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(avatar, 4, y0, AVATAR, AVATAR);
  ctx.restore();

  ctx.fillStyle = "#202c33";
  rectRedondeado(ctx, x0, y0, anchoBurbuja, alto, 22);
  ctx.fill();

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = color;
  ctx.font = `bold 26px ${FUENTE}`;
  let nombreMostrado = nombre;
  while (nombreMostrado.length > 3 && ctx.measureText(nombreMostrado).width > anchoTexto) nombreMostrado = nombreMostrado.slice(0, -2) + "…";
  ctx.fillText(nombreMostrado, x0 + relleno, y0 + relleno);

  ctx.fillStyle = "#e9edef";
  ctx.font = `28px ${FUENTE}`;
  lineas.forEach((linea, i) => ctx.fillText(linea, x0 + relleno, y0 + relleno + 38 + i * 36));
  return Buffer.from(await lienzo.encode("png"));
}

export default {
  names: [".qc", ".quote", ".cita"],
  desc: "Crea un sticker de cita con el texto de un mensaje",
  category: "Stickers",
  usage: ".qc <texto> | .qc (respondiendo a un mensaje de texto)",
  handler: async ({ msg, sender, from, sock, cleanText, reply }) => {
    const info = msg.message?.extendedTextMessage?.contextInfo;
    const propio = cleanText.split(/\s+/).slice(1).join(" ").trim();
    const citado = textoCitado(msg);
    const texto = (propio || citado).slice(0, MAX_CARACTERES);

    if (!texto) {
      await reply({ text: "💬 Responde a un mensaje con *.qc* o escribe *.qc <texto>* para crear un sticker de cita." });
      return;
    }

    const falta = limitarEspera(esperas, sender, ESPERA_MS);
    if (falta) {
      await reply({ text: `⏳ Espera ${falta}s antes de volver a usar *.qc*.` });
      return;
    }

    try {
      const autor = !propio && citado ? info?.participant || (from.endsWith("@g.us") ? sender : from) : sender;
      const nombre = nombreDe(autor, sender, msg);
      const avatar = await avatarDe(sock, autor, nombre);
      const imagen = await dibujarCita({ nombre, texto, avatar, color: colorDe(claveMeta(autor)) });
      const contexto = await contextoMeta({ sock, from, sender, msg });
      const sticker = await crearSticker(imagen, sender, contexto);
      await sock.sendMessage(from, { sticker }, { quoted: msg });
    } catch (e) {
      console.log("❌ Error en .qc: " + e.message);
      await reply({ text: "❌ No se pudo crear el sticker de cita." });
    }
  }
};
