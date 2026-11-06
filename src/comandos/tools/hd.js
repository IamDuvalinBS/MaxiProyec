import fs from "fs";
import path from "path";
import { loadImage } from "@napi-rs/canvas";
import { extraerMediaDeMensaje } from "../../nucleo/sticker.js";
import { correrFfmpeg, conTemporal } from "../../nucleo/ffmpeg.js";
import { encabezado } from "../../economia/estilo.js";
import { limitarEspera } from "../../../motores/herramientas-ui.js";

const FIRMA = "ByDuvalinBS";
const ESPERA_MS = 8000;
const LADO_MAXIMO = 4096;
const esperas = new Map();

const esPng = (b) => b.length > 8 && b[0] === 0x89 && b.toString("ascii", 1, 4) === "PNG";

async function dimensiones(buffer) {
  try {
    const img = await loadImage(buffer);
    return { ancho: img.width, alto: img.height };
  } catch (e) {
    return null;
  }
}

async function mejorar(buffer, factorPedido) {
  const dim = await dimensiones(buffer);
  const factor = dim ? Math.max(1, Math.min(factorPedido, LADO_MAXIMO / Math.max(dim.ancho, dim.alto))) : factorPedido;
  const ancho = dim ? Math.round(dim.ancho * factor) : null;
  const alto = dim ? Math.round(dim.alto * factor) : null;
  const escala = dim ? `scale=${ancho}:${alto}:flags=lanczos` : `scale=iw*${factor}:ih*${factor}:flags=lanczos`;
  const filtro = ["hqdn3d=1.2:1.2:2:2", escala, "unsharp=5:5:1.1:5:5:0.0", "eq=contrast=1.04:saturation=1.1"].join(",");
  const png = esPng(buffer);

  const resultado = await conTemporal("hd", async (dir) => {
    const entrada = path.join(dir, "entrada");
    const salida = path.join(dir, png ? "salida.png" : "salida.jpg");
    await fs.promises.writeFile(entrada, buffer);
    await correrFfmpeg(["-i", entrada, "-frames:v", "1", "-vf", filtro, ...(png ? [] : ["-q:v", "2"]), salida]);
    return fs.promises.readFile(salida);
  });
  return { buffer: resultado, png, original: dim, nuevo: dim ? { ancho, alto } : null };
}

export default {
  names: [".hd", ".remini", ".nitidez"],
  desc: "Aumenta la resolución y la claridad de una imagen",
  category: "Tools",
  usage: ".hd [2-4] [doc] (respondiendo a una imagen)",
  handler: async ({ msg, from, sender, cleanText, sock, reply }) => {
    const args = cleanText.toLowerCase().split(/\s+/).slice(1);
    const factorPedido = Math.min(4, Math.max(2, Number(args.find((a) => /^[2-4]$/.test(a))) || 2));
    const comoDocumento = args.some((a) => ["doc", "documento", "archivo"].includes(a));

    let media = null;
    try {
      media = await extraerMediaDeMensaje(msg);
    } catch (e) {
      console.log("❌ Error descargando la imagen para .hd: " + e.message);
      await reply({ text: "❌ No se pudo descargar la imagen. Intenta enviarla nuevamente." });
      return;
    }

    if (!media || media.segundos > 0) {
      await reply({
        text: `${encabezado("✨", "IMAGEN HD")}\n\nResponde a una imagen con *.hd* para aumentar su claridad.\n\n> Opcional: *.hd 3* para escalar más, *.hd doc* para recibirla como archivo sin compresión.`
      });
      return;
    }

    const falta = limitarEspera(esperas, sender, ESPERA_MS);
    if (falta) {
      await reply({ text: `⏳ Espera ${falta}s antes de volver a usar *.hd*.` });
      return;
    }

    try {
      const r = await mejorar(media.buffer, factorPedido);
      const medidas = r.original && r.nuevo ? `${r.original.ancho}×${r.original.alto} → ${r.nuevo.ancho}×${r.nuevo.alto}` : "Mejorada";
      const caption = `${encabezado("✨", "IMAGEN HD")}\n\n> ${medidas}\n\n${FIRMA}`;
      if (comoDocumento) {
        await sock.sendMessage(
          from,
          { document: r.buffer, mimetype: r.png ? "image/png" : "image/jpeg", fileName: r.png ? "hd.png" : "hd.jpg", caption },
          { quoted: msg }
        );
      } else {
        await sock.sendMessage(from, { image: r.buffer, caption }, { quoted: msg });
      }
    } catch (e) {
      console.log("❌ Error en .hd: " + e.message);
      await reply({ text: "❌ No se pudo mejorar esa imagen." });
    }
  }
};
