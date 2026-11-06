import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { extraerMediaDeMensaje, esStickerAnimado } from "../../nucleo/sticker.js";
import { correrFfmpeg, conTemporal } from "../../nucleo/ffmpeg.js";

const esWebp = (b) => b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP";

async function aPng(buffer) {
  const img = await loadImage(buffer);
  const lienzo = createCanvas(img.width, img.height);
  lienzo.getContext("2d").drawImage(img, 0, 0);
  return Buffer.from(await lienzo.encode("png"));
}

const LIMITE_CUADROS = 150;

function leerCuadros(buffer) {
  let ancho = 512;
  let alto = 512;
  const cuadros = [];
  let o = 12;
  while (o + 8 <= buffer.length && cuadros.length < LIMITE_CUADROS) {
    const tipo = buffer.toString("ascii", o, o + 4);
    const tam = buffer.readUInt32LE(o + 4);
    const datos = buffer.subarray(o + 8, o + 8 + tam);
    if (tipo === "VP8X" && datos.length >= 10) {
      ancho = datos.readUIntLE(4, 3) + 1;
      alto = datos.readUIntLE(7, 3) + 1;
    } else if (tipo === "ANMF" && datos.length > 16) {
      cuadros.push({
        x: datos.readUIntLE(0, 3) * 2,
        y: datos.readUIntLE(3, 3) * 2,
        ancho: datos.readUIntLE(6, 3) + 1,
        alto: datos.readUIntLE(9, 3) + 1,
        duracion: Math.max(datos.readUIntLE(12, 3), 20) / 1000,
        sinMezcla: Boolean(datos[15] & 0x02),
        limpiar: Boolean(datos[15] & 0x01),
        datos: datos.subarray(16)
      });
    }
    o += 8 + tam + (tam % 2);
  }
  return { ancho, alto, cuadros };
}

function webpDeCuadro(cuadro) {
  const vp8x = Buffer.alloc(18);
  vp8x.write("VP8X", 0, "ascii");
  vp8x.writeUInt32LE(10, 4);
  vp8x[8] = 0x10;
  vp8x.writeUIntLE(cuadro.ancho - 1, 12, 3);
  vp8x.writeUIntLE(cuadro.alto - 1, 15, 3);
  const cuerpo = Buffer.concat([Buffer.from("WEBP", "ascii"), vp8x, cuadro.datos]);
  const cab = Buffer.alloc(8);
  cab.write("RIFF", 0, "ascii");
  cab.writeUInt32LE(cuerpo.length, 4);
  return Buffer.concat([cab, cuerpo]);
}

function aVideo(buffer) {
  return conTemporal("toimg", async (dir) => {
    const { ancho, alto, cuadros } = leerCuadros(buffer);
    if (!cuadros.length) throw new Error("No se encontraron cuadros");

    const lienzo = createCanvas(ancho, alto);
    const ctx = lienzo.getContext("2d");
    const final = createCanvas(ancho, alto);
    const fctx = final.getContext("2d");
    const lista = ["ffconcat version 1.0"];
    let anterior = null;

    for (let i = 0; i < cuadros.length; i++) {
      const c = cuadros[i];
      if (anterior?.limpiar) ctx.clearRect(anterior.x, anterior.y, anterior.ancho, anterior.alto);
      if (c.sinMezcla) ctx.clearRect(c.x, c.y, c.ancho, c.alto);
      ctx.drawImage(await loadImage(webpDeCuadro(c)), c.x, c.y);
      anterior = c;

      fctx.fillStyle = "#ffffff";
      fctx.fillRect(0, 0, ancho, alto);
      fctx.drawImage(lienzo, 0, 0);
      await fs.promises.writeFile(path.join(dir, `f${i}.png`), Buffer.from(await final.encode("png")));
      lista.push(`file 'f${i}.png'`, `duration ${c.duracion.toFixed(3)}`);
    }
    lista.push(`file 'f${cuadros.length - 1}.png'`);
    await fs.promises.writeFile(path.join(dir, "lista.txt"), lista.join("\n"));

    const salida = path.join(dir, "salida.mp4");
    await correrFfmpeg([
      "-f", "concat", "-safe", "0", "-i", path.join(dir, "lista.txt"),
      "-vf", "fps=20,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-an",
      "-movflags", "+faststart",
      salida
    ]);
    return fs.promises.readFile(salida);
  });
}

export default {
  names: [".toimg", ".aimagen", ".tovideo"],
  desc: "Convierte un sticker en imagen (o en video si es animado)",
  category: "Stickers",
  usage: ".toimg (respondiendo a un sticker)",
  handler: async ({ msg, from, sock, reply }) => {
    let media = null;
    try {
      media = await extraerMediaDeMensaje(msg);
    } catch (e) {
      console.log("❌ Error descargando el sticker para .toimg: " + e.message);
      await reply({ text: "❌ No se pudo descargar el sticker. Intenta nuevamente." });
      return;
    }

    if (!media || !esWebp(media.buffer)) {
      await reply({ text: "🖼️ Responde a un sticker con *.toimg* para convertirlo en imagen." });
      return;
    }

    try {
      if (esStickerAnimado(media.buffer)) {
        try {
          const video = await aVideo(media.buffer);
          await sock.sendMessage(from, { video, mimetype: "video/mp4", gifPlayback: true }, { quoted: msg });
          return;
        } catch (e) {
          console.log("[toimg] No se pudo convertir el sticker animado, se manda el primer cuadro: " + e.message);
        }
        await sock.sendMessage(
          from,
          { image: await aPng(media.buffer), caption: "ℹ️ Este sticker es animado y solo pude obtener su primer cuadro." },
          { quoted: msg }
        );
        return;
      }
      await sock.sendMessage(from, { image: await aPng(media.buffer) }, { quoted: msg });
    } catch (e) {
      console.log("❌ Error en .toimg: " + e.message);
      await reply({ text: "❌ No se pudo convertir ese sticker." });
    }
  }
};
