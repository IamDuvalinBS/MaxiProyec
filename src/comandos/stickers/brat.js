import { crearSticker, contextoMeta, esStickerAnimado } from "../../nucleo/sticker.js";
import {
  crearBratImagen,
  crearBratAnimado,
  resolverColor,
  palabrasBrat,
  NOMBRES_COLORES,
  MAX_PALABRAS_BRAT,
  MAX_CARACTERES_BRAT
} from "../../nucleo/brat.js";
import { encabezado } from "../../economia/estilo.js";
import { textoCitado, limitarEspera } from "../../../motores/herramientas-ui.js";

const ESPERA_ESTATICO_MS = 4000;
const ESPERA_ANIMADO_MS = 10000;
const esperasEstatico = new Map();
const esperasAnimado = new Map();

function leerPeticion(cleanText, msg) {
  const resto = cleanText.split(/\s+/).slice(1).join(" ");
  const partes = resto.split("•").map((p) => p.trim());
  const color = partes.length > 1 ? resolverColor(partes[partes.length - 1]) : null;
  const propio = color ? partes.slice(0, -1).join(" ").trim() : resto.trim();
  const texto = propio || textoCitado(msg);
  return { texto, color: color || "verde" };
}

function ayuda(comando, animado) {
  return (
    `${encabezado("💚", animado ? "BRAT ANIMADO" : "BRAT")}\n\n` +
    `Escribe un texto o responde a un mensaje con *${comando}* para crear el sticker.\n\n` +
    `> Ejemplo: *${comando} ya no me hables*\n` +
    `> Con color: *${comando} ya no me hables • rosa*\n` +
    `> Colores: ${NOMBRES_COLORES.join(", ")}`
  );
}

const enviar = async ({ sock, from, msg, sender, buffer }) => {
  const contexto = await contextoMeta({ sock, from, sender, msg });
  const sticker = await crearSticker(buffer, sender, contexto);
  await sock.sendMessage(from, { sticker, isAnimated: esStickerAnimado(sticker) }, { quoted: msg });
};

const brat = {
  names: [".brat"],
  desc: "Crea un sticker con tu texto en formato brat",
  category: "Stickers",
  usage: ".brat <texto> [• color]",
  handler: async ({ cleanText, from, sender, msg, sock, reply }) => {
    const { texto, color } = leerPeticion(cleanText, msg);
    if (!texto) {
      await reply({ text: ayuda(".brat", false) });
      return;
    }
    if (texto.length > MAX_CARACTERES_BRAT) {
      await reply({ text: `❌ El texto es muy largo. Máximo ${MAX_CARACTERES_BRAT} caracteres.` });
      return;
    }
    const falta = limitarEspera(esperasEstatico, sender, ESPERA_ESTATICO_MS);
    if (falta) {
      await reply({ text: `⏳ Espera ${falta}s antes de volver a usar *.brat*.` });
      return;
    }
    try {
      await enviar({ sock, from, msg, sender, buffer: await crearBratImagen(texto, color) });
    } catch (e) {
      console.log("❌ Error creando .brat: " + e.message);
      await reply({ text: "❌ No se pudo crear el sticker brat." });
    }
  }
};

const bratv = {
  names: [".bratv", ".bratvid"],
  desc: "Crea un sticker brat animado, palabra por palabra",
  category: "Stickers",
  usage: ".bratv <texto> [• color]",
  handler: async ({ cleanText, from, sender, msg, sock, reply }) => {
    const { texto, color } = leerPeticion(cleanText, msg);
    if (!texto) {
      await reply({ text: ayuda(".bratv", true) });
      return;
    }
    if (texto.length > MAX_CARACTERES_BRAT || palabrasBrat(texto).length > MAX_PALABRAS_BRAT) {
      await reply({ text: `❌ El texto es muy largo. Máximo ${MAX_PALABRAS_BRAT} palabras para el sticker animado.` });
      return;
    }
    const falta = limitarEspera(esperasAnimado, sender, ESPERA_ANIMADO_MS);
    if (falta) {
      await reply({ text: `⏳ Espera ${falta}s antes de volver a usar *.bratv*.` });
      return;
    }
    try {
      await enviar({ sock, from, msg, sender, buffer: await crearBratAnimado(texto, color) });
    } catch (e) {
      console.log("❌ Error creando .bratv: " + e.message);
      await reply({ text: "❌ No se pudo crear el sticker brat animado." });
    }
  }
};

export default [brat, bratv];
