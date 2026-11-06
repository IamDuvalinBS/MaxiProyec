import { createCanvas, loadImage } from "@napi-rs/canvas";
import { extraerMediaDeMensaje, crearSticker, contextoMeta } from "../../nucleo/sticker.js";
import { envolver } from "../../nucleo/lienzo.js";

const LADO = 512;
const MARGEN = 18;
const FUENTE = '"Impact", "Anton", "Arial Black", "DejaVu Sans", sans-serif';

function dibujarTexto(ctx, texto, abajo) {
  const mayus = texto.toUpperCase();
  const anchoMax = LADO - MARGEN * 2;
  for (let tam = 64; tam >= 20; tam -= 2) {
    ctx.font = `bold ${tam}px ${FUENTE}`;
    const lineas = envolver(ctx, mayus, anchoMax);
    if (lineas.length > 3 && tam > 20) continue;
    const paso = tam * 1.08;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(3, tam / 7);
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#ffffff";
    const alto = lineas.length * paso;
    const inicio = abajo ? LADO - MARGEN - alto : MARGEN - 4;
    lineas.forEach((linea, i) => {
      const y = inicio + i * paso;
      ctx.strokeText(linea, LADO / 2, y);
      ctx.fillText(linea, LADO / 2, y);
    });
    return;
  }
}

export default {
  names: [".smeme", ".meme"],
  desc: "Crea un sticker meme con texto arriba y abajo",
  category: "Stickers",
  usage: ".smeme <arriba> • <abajo> (respondiendo a una imagen)",
  handler: async ({ msg, sender, from, sock, cleanText, reply }) => {
    const resto = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!resto) {
      await reply({ text: "🖼️ Responde a una imagen con *.smeme <arriba> • <abajo>*\n\n> Ejemplo: *.smeme cuando llega el viernes • y no tienes plata*\n> Solo abajo: *.smeme • texto*" });
      return;
    }

    let media = null;
    try {
      media = await extraerMediaDeMensaje(msg);
    } catch (e) {
      console.log("❌ Error descargando la imagen para .smeme: " + e.message);
      await reply({ text: "❌ No se pudo descargar la imagen. Intenta nuevamente." });
      return;
    }

    if (!media || media.segundos > 0) {
      await reply({ text: "🖼️ Responde a una imagen o sticker con *.smeme <arriba> • <abajo>*." });
      return;
    }

    const partes = resto.split("•").map((p) => p.trim());
    const arriba = partes[0] || "";
    const abajo = partes.length > 1 ? partes.slice(1).join(" ").trim() : "";

    try {
      const img = await loadImage(media.buffer);
      const lienzo = createCanvas(LADO, LADO);
      const ctx = lienzo.getContext("2d");
      const escala = Math.max(LADO / img.width, LADO / img.height);
      const w = img.width * escala;
      const h = img.height * escala;
      ctx.drawImage(img, (LADO - w) / 2, (LADO - h) / 2, w, h);
      if (arriba) dibujarTexto(ctx, arriba, false);
      if (abajo) dibujarTexto(ctx, abajo, true);

      const contexto = await contextoMeta({ sock, from, sender, msg });
      const sticker = await crearSticker(Buffer.from(await lienzo.encode("png")), sender, contexto);
      await sock.sendMessage(from, { sticker }, { quoted: msg });
    } catch (e) {
      console.log("❌ Error en .smeme: " + e.message);
      await reply({ text: "❌ No se pudo crear el sticker meme." });
    }
  }
};
