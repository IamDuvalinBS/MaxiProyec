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
import { delayAleatorio, simularEscritura } from "../../../motores/antiban.js";
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
const PIE_DE_PAGINA = "Pᴏᴡᴇʀᴇᴅ Bʏ • ItsDuva";

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
    console.log(`[play2] No se pudo armar la previa de la miniatura: ${e.message}`);
    return null;
  }
}

export async function enviarDescarga({ sock, from, msg, link, esAudio }) {
  const responder = (contenido) => sock.sendMessage(from, contenido, { quoted: msg });
  const claveCache = `yt:${esAudio ? "audio" : "video"}:${link}`;

  if (await reenviarCacheado(sock, from, claveCache, msg)) return;

  const aviso = responder({
    text: [
      encabezado("⏳", esAudio ? "DESCARGANDO AUDIO" : "DESCARGANDO VIDEO"),
      "",
      "> Procesando la solicitud. Esto puede tardar unos segundos."
    ].join("\n")
  }).catch(() => {});

  try {
    if (esAudio) {
      const audio = await descargarAudioConProveedores(link);
      await aviso;
      guardarMedioEnviado(claveCache, await responder({
        audio,
        mimetype: "audio/mpeg",
        ptt: false
      }));
    } else {
      const video = await descargarVideoConProveedores(link);
      await aviso;

      if (Buffer.isBuffer(video)) {
        guardarMedioEnviado(claveCache, await responder({
          video,
          mimetype: "video/mp4"
        }));
      } else {
        try {
          guardarMedioEnviado(claveCache, await responder({
            document: { url: video.ruta },
            mimetype: "video/mp4",
            fileName: video.nombre,
            caption: `🎬 Video de ${video.pesoMB.toFixed(1)}MB enviado como documento por su tamaño.`
          }));
        } finally {
          try {
            fs.unlinkSync(video.ruta);
          } catch (err) {}
        }
      }
    }
  } catch (e) {
    await aviso;
    await responder({
      text: tarjetaError(
        `No se pudo descargar el ${esAudio ? "audio" : "video"}.`,
        e.message
      )
    });
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

  partes.push("> Usa *.play2 <enlace>* para descargar el video que prefieras.");
  return partes.join("\n");
}

// ───────────────── Botones 🎵 Audio / 🎬 Video (compatible con 7.0.6 y 7.0.7) ─────────────────
// Usa sock.sendQuickReplyButtons (existe desde 7.0.6) y un listener propio que escucha el
// toque del botón, así no depende de sendActionButtons ni del router.

const BOTONES_ACTIVOS = new Map(); // id del botón -> { link, esAudio, expira }
const SOCKETS_ESCUCHANDO = new WeakSet();
const MENSAJES_PROCESADOS = new Set();
const VIDA_BOTONES_MS = 10 * 60 * 1000;

function desenvolver(message) {
  let m = message;
  for (let i = 0; i < 6 && m; i++) {
    const interno =
      m.ephemeralMessage?.message ||
      m.viewOnceMessage?.message ||
      m.viewOnceMessageV2?.message ||
      m.viewOnceMessageV2Extension?.message ||
      m.documentWithCaptionMessage?.message ||
      m.editedMessage?.message;
    if (!interno) break;
    m = interno;
  }
  return m;
}

function leerIdDeBoton(message) {
  const m = desenvolver(message);
  if (!m) return null;

  const nf = m.interactiveResponseMessage?.nativeFlowResponseMessage;
  if (nf) {
    try {
      const p = JSON.parse(nf.paramsJson || "{}");
      return p.id ?? p.selectedRowId ?? null;
    } catch (e) {
      return null;
    }
  }

  if (m.buttonsResponseMessage) return m.buttonsResponseMessage.selectedButtonId ?? null;
  if (m.templateButtonReplyMessage) return m.templateButtonReplyMessage.selectedId ?? null;
  return null;
}

function escucharBotones(sock) {
  if (!sock?.ev?.on || SOCKETS_ESCUCHANDO.has(sock.ev)) return;
  SOCKETS_ESCUCHANDO.add(sock.ev);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const m of messages || []) {
      try {
        if (!m?.message || m.key?.fromMe) continue;

        const id = leerIdDeBoton(m.message);
        if (!id || !id.startsWith("play2|")) continue;

        const entrada = BOTONES_ACTIVOS.get(id);
        const chat = m.key.remoteJid;

        if (m.key.id) {
          if (MENSAJES_PROCESADOS.has(m.key.id)) continue;
          MENSAJES_PROCESADOS.add(m.key.id);
          if (MENSAJES_PROCESADOS.size > 500) {
            MENSAJES_PROCESADOS.delete(MENSAJES_PROCESADOS.values().next().value);
          }
        }

        if (!entrada || entrada.expira <= Date.now()) {
          BOTONES_ACTIVOS.delete(id);
          await sock.sendMessage(
            chat,
            { text: "⌛ Este botón ya expiró. Vuelve a usar *.play2*." },
            { quoted: m }
          );
          continue;
        }

        await enviarDescarga({
          sock,
          from: chat,
          msg: m,
          link: entrada.link,
          esAudio: entrada.esAudio
        });
      } catch (e) {
        console.log(`[play2] Error al procesar el botón: ${e.stack || e.message}`);
      }
    }
  });
}

function registrarBoton(link, esAudio) {
  const ahora = Date.now();
  for (const [k, v] of BOTONES_ACTIVOS) if (v.expira <= ahora) BOTONES_ACTIVOS.delete(k);

  const id = `play2|${esAudio ? "a" : "v"}|${ahora.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  BOTONES_ACTIVOS.set(id, { link, esAudio, expira: ahora + VIDA_BOTONES_MS });
  return id;
}

/**
 * Envía la tarjeta con los botones 🎵 Audio / 🎬 Video.
 * Devuelve el mensaje enviado, o null si falló (el error se imprime en consola).
 */
async function enviarTarjetaConBotones({ sock, from, msg, sender, link, info, texto, miniatura, previa }) {
  if (typeof sock.sendQuickReplyButtons !== "function") {
    console.log("[play2] El socket no tiene sendQuickReplyButtons: la librería instalada no es tu fork @fer2809fl/baileys (7.0.6+).");
    return null;
  }

  escucharBotones(sock);

  const extra = {
    footer: PIE_DE_PAGINA,
    quoted: msg,
    mentions: [sender],
    preview: false // evita que el fork arme otra vista previa por el link del texto
  };

  if (miniatura) extra.image = miniatura;

  if (previa) {
    extra.contextInfo = {
      externalAdReply: {
        title: info.titulo,
        body: `${info.canal} · ${PIE_DE_PAGINA}`,
        mediaType: 1,
        thumbnail: previa,
        sourceUrl: info.enlace,
        showAdAttribution: false,
        renderLargerThumbnail: false
      }
    };
  }

  try {
    return await sock.sendQuickReplyButtons(
      from,
      texto,
      [
        { text: "🎵 Audio", id: registrarBoton(link, true) },
        { text: "🎬 Video", id: registrarBoton(link, false) }
      ],
      extra
    );
  } catch (e) {
    console.log(`[play2] Falló el envío con botones: ${e.stack || e.message}`);
    return null;
  }
}

export default {
  names: [".play2", ".yt2", ".ytsearch2", ".buscaryt2"],
  usage: ".play2 <enlace o nombre> | .ytsearch2 <búsqueda>",
  desc: "'.play2' busca un video y permite elegir audio o video con botones; '.ytsearch2' lista los primeros 10 resultados",
  category: "Descargas",

  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const partes = cleanText.trim().split(/\s+/);
    const comando = partes[0].toLowerCase();
    const consulta = partes.slice(1).join(" ");
    const esListado = comando === ".ytsearch2" || comando === ".buscaryt2";

    if (!consulta) {
      return reply({
        text: esListado
          ? tarjetaUso({
              comando: ".ytsearch2 <búsqueda>",
              ejemplo: ".ytsearch2 historias de terror"
            })
          : tarjetaUso({
              comando: ".play2 <nombre o enlace>",
              ejemplo: ".play2 https://youtu.be/xxxxxxxxxxx",
              nota: "Después de la búsqueda podrás elegir entre audio y video."
            }),
        mentions: [sender]
      });
    }

    const aviso = reply({
      text: tarjetaDescarga({
        emoji: "🔎",
        titulo: esListado ? "YOUTUBE SEARCH" : "YOUTUBE DOWNLOAD",
        sender,
        campos: [campo("💭", "Búsqueda", consulta)],
        nota: "Buscando en YouTube. Esto puede tardar unos segundos."
      }),
      mentions: [sender]
    }).catch(() => {});

    // ───────────────────────────── .ytsearch2 ─────────────────────────────
    if (esListado) {
      const busqueda = buscarVideosYoutube(consulta, 10);
      busqueda.catch(() => {});
      await aviso;

      let resultados;

      try {
        resultados = await busqueda;
      } catch (e) {
        return reply({
          text: tarjetaError("No se pudo completar la búsqueda.", e.message)
        });
      }

      if (resultados.length === 0) {
        return reply({
          text: tarjetaError("No se encontraron resultados para esa búsqueda.")
        });
      }

      const texto = tarjetaResultados(consulta, resultados, sender);
      const primera = resultados[0];

      if (primera.miniatura) {
        await reply({
          image: { url: primera.miniatura },
          caption: texto,
          mentions: [sender]
        });
      } else {
        await reply({ text: texto, mentions: [sender] });
      }

      return;
    }

    // ───────────────────────────── .play2 ─────────────────────────────
    const preparar = (async () => {
      const link = await resolverLinkYoutube(consulta);
      const info = await obtenerInfoYoutube(link);
      let miniatura;

      try {
        miniatura = info.miniatura
          ? await descargarBuffer(info.miniatura)
          : undefined;
      } catch (e) {
        miniatura = undefined;
      }

      const previa = miniatura
        ? await crearMiniaturaPrevia(miniatura)
        : null;

      return { link, info, miniatura, previa };
    })();

    preparar.catch(() => {});

    await aviso;

    const pausa = (async () => {
      await delayAleatorio(300, 900);
      await simularEscritura(
        sock,
        from,
        800 + Math.floor(Math.random() * 1200)
      );
    })();

    pausa.catch(() => {});

    let link;
    let info;
    let miniatura;
    let previa;

    try {
      ({ link, info, miniatura, previa } = await preparar);
    } catch (e) {
      return reply({
        text: tarjetaError(
          "No se pudo obtener la información del video.",
          e.message
        )
      });
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

    // Respaldo: si no usan los botones, también se puede responder 1 (audio) o 2 (video).
    registrarEspera(`${from}:${sender}`, {
      duracionMs: DURACION_ESPERA_MS,
      alResponder: async (respuesta, ctx) => {
        const opcion = respuesta.trim();

        if (opcion !== "1" && opcion !== "2") return false;

        await enviarDescarga({
          sock: ctx.sock,
          from: ctx.from,
          msg: ctx.msg,
          link,
          esAudio: opcion === "1"
        });

        return true;
      }
    });

    const textoCompleto = `${texto}\n\n${tarjetaFormato()}`;

    await pausa;

    const enviado = await enviarTarjetaConBotones({
      sock,
      from,
      msg,
      sender,
      link,
      info,
      texto: textoCompleto,
      miniatura,
      previa
    });

    if (enviado) return;

    // ── Respaldo sin botones: foto + texto, o solo texto ──
    if (miniatura) {
      try {
        await reply({
          image: miniatura,
          caption: textoCompleto,
          mentions: [sender]
        });
        return;
      } catch (e) {
        console.log(`[play2] No se pudo enviar la foto con la información: ${e.message}`);
      }
    }

    await reply({
      text: textoCompleto,
      mentions: [sender]
    });
  }
};
