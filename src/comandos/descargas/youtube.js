import fs from "fs";
import {
  resolverLinkYoutube,
  obtenerInfoYoutube,
  buscarVideosYoutube,
  descargarAudioConProveedores,
  descargarVideoConProveedores
} from "../../descargas/youtube-engine.js";
import { descargarBuffer } from "../../descargas/core.js";
import { registrarEspera } from "../../nucleo/espera.js";
import { enviarConBotonesRapidos } from "../../../motores/botones-rapidos.js";
import { reenviarCacheado, guardarMedioEnviado } from "../../../motores/cache-medios.js";
import { encabezado, mencion } from "../../economia/estilo.js";
import {
  tarjetaDescarga,
  tarjetaFormato,
  tarjetaUso,
  tarjetaError,
  campo,
  duracionLarga,
  fechaCorta,
  etiquetasComoHashtags
} from "../../descargas/tarjetas.js";

const DURACION_ESPERA_MS = 5 * 60 * 1000;
const ZW = "\u200b";

// Misma técnica que .kiss: lienzo 640x360, fondo difuso hecho con la propia imagen y la imagen completa centrada
// (así cualquier formato, incluso Shorts verticales, cabe en la previa sin recortarse).
async function crearMiniaturaPrevia(buffer) {
  try {
    const { createCanvas, loadImage } = await import("@napi-rs/canvas");
    const img = await loadImage(buffer);
    const W = 640;
    const H = 360;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    const chico = createCanvas(32, 18);
    chico.getContext("2d").drawImage(img, 0, 0, 32, 18);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(chico, 0, 0, W, H);
    const s = Math.min(W / img.width, H / img.height);
    const w = Math.round(img.width * s);
    const h = Math.round(img.height * s);
    ctx.drawImage(img, Math.round((W - w) / 2), Math.round((H - h) / 2), w, h);
    return canvas.toBuffer("image/jpeg", 70);
  } catch (e) {
    console.log(`[youtube] No se pudo armar la previa de la miniatura: ${e.message}`);
    return null;
  }
}
const PIE_DE_PAGINA = "Pᴏᴡᴇʀᴇᴅ Bʏ • ItsDuva";

export async function enviarDescarga({ sock, from, msg, link, esAudio }) {
  const responder = (contenido) => sock.sendMessage(from, contenido, { quoted: msg });
  const claveCache = `yt:${esAudio ? "audio" : "video"}:${link}`;
  if (await reenviarCacheado(sock, from, claveCache, msg)) return;

  await responder({
    text: [
      encabezado("⏳", esAudio ? "DESCARGANDO AUDIO" : "DESCARGANDO VIDEO"),
      "",
      "> Procesando la solicitud. Esto puede tardar unos segundos."
    ].join("\n")
  });

  try {
    if (esAudio) {
      const audio = await descargarAudioConProveedores(link);
      guardarMedioEnviado(claveCache, await responder({ audio, mimetype: "audio/mpeg", ptt: false }));
    } else {
      const video = await descargarVideoConProveedores(link);
      if (Buffer.isBuffer(video)) {
        guardarMedioEnviado(claveCache, await responder({ video, mimetype: "video/mp4" }));
      } else {
        // Pesa más que el límite de video de WhatsApp: se manda como documento, leyendo del disco (sin cargarlo en RAM).
        try {
          guardarMedioEnviado(claveCache, await responder({
            document: { url: video.ruta },
            mimetype: "video/mp4",
            fileName: video.nombre,
            caption: `🎬 Video de ${video.pesoMB.toFixed(1)}MB enviado como documento por su tamaño.`
          }));
        } finally {
          try { fs.unlinkSync(video.ruta); } catch (err) {}
        }
      }
    }
  } catch (e) {
    await responder({ text: tarjetaError(`No se pudo descargar el ${esAudio ? "audio" : "video"}.`, e.message) });
  }
}

function tarjetaResultados(consulta, resultados, sender) {
  const partes = [
    encabezado("🔎", "YOUTUBE SEARCH"),
    "",
    `> Petición solicitada por ${mencion(sender)}.`,
    "",
    campo("💭", "Búsqueda", consulta),
    ""
  ];
  resultados.forEach((video, indice) => {
    partes.push(`*${indice + 1}.* ${video.titulo}`);
    partes.push(`> ⏳ ${video.duracion} · 📆 ${video.fecha}`);
    partes.push(`> 🔗 ${video.url}`);
    partes.push("");
  });
  partes.push("> Usa *.play <enlace>* para descargar el video que prefieras.");
  return partes.join("\n");
}

export default {
  names: [".play", ".yt", ".ytsearch", ".buscaryt"],
  usage: ".play <enlace o nombre> | .ytsearch <búsqueda>",
  desc: "'.play' busca un video y permite elegir audio o video con botones; '.ytsearch' lista los primeros 10 resultados",
  category: "Descargas",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const partes = cleanText.trim().split(/\s+/);
    const comando = partes[0].toLowerCase();
    const consulta = partes.slice(1).join(" ");
    const esListado = comando === ".ytsearch" || comando === ".buscaryt";

    if (!consulta) {
      return reply({
        text: esListado
          ? tarjetaUso({ comando: ".ytsearch <búsqueda>", ejemplo: ".ytsearch historias de terror" })
          : tarjetaUso({
              comando: ".play <nombre o enlace>",
              ejemplo: ".play https://youtu.be/xxxxxxxxxxx",
              nota: "Después de la búsqueda podrás elegir entre audio y video."
            }),
        mentions: [sender]
      });
    }

    await reply({
      text: tarjetaDescarga({
        emoji: "🔎",
        titulo: esListado ? "YOUTUBE SEARCH" : "YOUTUBE DOWNLOAD",
        sender,
        campos: [campo("💭", "Búsqueda", consulta)],
        nota: "Buscando en YouTube. Esto puede tardar unos segundos."
      }),
      mentions: [sender]
    });

    if (esListado) {
      let resultados;
      try {
        resultados = await buscarVideosYoutube(consulta, 10);
      } catch (e) {
        return reply({ text: tarjetaError("No se pudo completar la búsqueda.", e.message) });
      }
      if (resultados.length === 0) {
        return reply({ text: tarjetaError("No se encontraron resultados para esa búsqueda.") });
      }

      const texto = tarjetaResultados(consulta, resultados, sender);
      const primera = resultados[0];
      if (primera.miniatura) await reply({ image: { url: primera.miniatura }, caption: texto, mentions: [sender] });
      else await reply({ text: texto, mentions: [sender] });
      return;
    }

    let link;
    let info;
    try {
      link = await resolverLinkYoutube(consulta);
      info = await obtenerInfoYoutube(link);
    } catch (e) {
      return reply({ text: tarjetaError("No se pudo obtener la información del video.", e.message) });
    }

    const texto = tarjetaDescarga({
      emoji: "📺",
      titulo: "YOUTUBE DOWNLOAD",
      sender,
      campos: [
        campo("💭", "Título", info.titulo),
        campo("⏳", "Duración", duracionLarga(info.duracionSeg)),
        campo("👁️", "Vistas", info.vistas),
        campo("🐋", "Hashtags", etiquetasComoHashtags(info.etiquetas)),
        campo("📆", "Fecha - publicación", fechaCorta(info.fecha)),
        campo("📚", "Canal", info.canal),
        campo("🔗", "Link del video", info.enlace)
      ]
    });

    registrarEspera(`${from}:${sender}`, {
      duracionMs: DURACION_ESPERA_MS,
      alResponder: async (respuesta, ctx) => {
        const opcion = respuesta.trim();
        if (opcion !== "1" && opcion !== "2") return false;
        await enviarDescarga({ sock: ctx.sock, from: ctx.from, msg: ctx.msg, link, esAudio: opcion === "1" });
        return true;
      }
    });

    let miniatura;
    try {
      miniatura = info.miniatura ? await descargarBuffer(info.miniatura) : undefined;
    } catch (e) {
      miniatura = undefined;
    }

    // 1) La miniatura como foto
    if (miniatura) {
      try {
        await reply({ image: miniatura });
      } catch (e) {
        console.log(`[youtube] No se pudo enviar la miniatura como foto: ${e.message}`);
      }
    }

    // 2) La tarjeta de información con la miniatura en la previa (como .kiss), sin mostrar el link
    const previa = miniatura ? await crearMiniaturaPrevia(miniatura) : null;
    const mensaje = { text: previa ? `${texto}\n\n${ZW}` : texto, mentions: [sender] };
    if (previa) {
      mensaje.linkPreview = {
        "matched-text": ZW,
        "canonical-url": info.enlace,
        title: info.titulo,
        description: `${info.canal} · ${PIE_DE_PAGINA}`,
        jpegThumbnail: previa
      };
    }
    await reply(mensaje);

    const enviado = await enviarConBotonesRapidos({
      sock,
      from,
      msg,
      texto: tarjetaFormato(),
      footer: PIE_DE_PAGINA,
      botones: [
        { texto: "🎵 Audio", id: `.ytaudio ${link}` },
        { texto: "🎬 Video", id: `.ytvideo ${link}` }
      ],
      mentions: [sender]
    });

    if (!enviado) await reply({ text: tarjetaFormato() });
  }
};
        
