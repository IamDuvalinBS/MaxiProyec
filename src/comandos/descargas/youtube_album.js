import fs from "fs";
import { buscarAlbumesYoutube } from "../../descargas/youtube-engine.js";
import { descargarAlbumComoZip } from "../../descargas/album-engine.js";
import { descargarBuffer } from "../../descargas/core.js";
import { registrarEspera } from "../../nucleo/espera.js";
import { delayAleatorio, simularEscritura } from "../../../motores/antiban.js";
import { reenviarCacheado, guardarMedioEnviado } from "../../../motores/cache-medios.js";
import { encabezado, mencion } from "../../economia/estilo.js";
import {
  tarjetaDescarga,
  tarjetaUso,
  tarjetaError,
  campo
} from "../../descargas/tarjetas.js";

const DURACION_ESPERA_MS = 5 * 60 * 1000;
const PIE_DE_PAGINA = "Pᴏᴡᴇʀᴇᴅ Bʏ • ItsDuva";
const ALBUMES_A_MOSTRAR = 3;

// ───────────────── Descarga del álbum ─────────────────
// Solo se baja un álbum a la vez: cuida la RAM y el procesador del teléfono.
let ALBUM_EN_CURSO = false;

async function enviarAlbum({ sock, from, msg, album }) {
  const responder = (contenido) => sock.sendMessage(from, contenido, { quoted: msg });
  const claveCache = `yt:album:${album.id}`;

  if (await reenviarCacheado(sock, from, claveCache, msg)) return;

  if (ALBUM_EN_CURSO) {
    await responder({
      text: tarjetaError("Ya hay un álbum descargándose. Espera a que termine e inténtalo de nuevo.")
    });
    return;
  }

  ALBUM_EN_CURSO = true;
  let zip = null;

  try {
    await responder({
      text: [
        encabezado("⏳", "DESCARGANDO ÁLBUM"),
        "",
        campo("🧸", "Artista / Compositor", album.artista),
        campo("🫯", "Nombre de álbum", album.nombre),
        campo("🔈", "Canciones totales", `${album.pistas.length} canciones`),
        "",
        "> Procesando el álbum. Esto puede tardar varios minutos; no envíes otra solicitud mientras tanto."
      ].join("\n")
    }).catch(() => {});

    zip = await descargarAlbumComoZip(album);

    let nota = "";
    if (zip.fallidas.length > 0) {
      nota = `\n\n⚠️ No se pudieron descargar ${zip.fallidas.length} canción(es): ${zip.fallidas.slice(0, 5).join(", ")}${zip.fallidas.length > 5 ? "…" : ""}`;
    }

    const enviado = await responder({
      document: { url: zip.ruta },
      mimetype: "application/zip",
      fileName: zip.nombre,
      caption: `🎶 ${album.nombre} — ${album.artista}\n${zip.agregadas} canciones · ${zip.pesoMB.toFixed(1)}MB${nota}`
    });

    // Un álbum incompleto no se guarda en caché para poder reintentarlo completo.
    if (zip.fallidas.length === 0) guardarMedioEnviado(claveCache, enviado);
  } catch (e) {
    await responder({
      text: tarjetaError("No se pudo descargar el álbum.", e.message)
    });
  } finally {
    ALBUM_EN_CURSO = false;
    if (zip) {
      try {
        fs.unlinkSync(zip.ruta);
      } catch (err) {}
    }
  }
}

// ───────────────── Botones (mismo sistema que .play) ─────────────────
// sock.sendMixedButtons + un listener propio que escucha el toque del botón (no depende del router).

const BOTONES_ACTIVOS = new Map(); // id del botón -> { album, expira }
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
        if (!id || !id.startsWith("album|")) continue;

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

        await enviarAlbum({ sock, from: chat, msg: m, album: entrada.album });
      } catch (e) {
        console.log(`[play2] Error al procesar el botón: ${e.stack || e.message}`);
      }
    }
  });
}

function registrarBoton(album) {
  const ahora = Date.now();
  for (const [k, v] of BOTONES_ACTIVOS) if (v.expira <= ahora) BOTONES_ACTIVOS.delete(k);

  const id = `album|${ahora.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  BOTONES_ACTIVOS.set(id, { album, expira: ahora + VIDA_BOTONES_MS });
  return id;
}

function recortar(texto, maximo) {
  const t = String(texto || "").trim();
  return t.length > maximo ? `${t.slice(0, maximo - 1)}…` : t;
}

async function enviarTarjetaConBotones({ sock, from, msg, sender, albumes, texto, miniatura }) {
  if (typeof sock.sendMixedButtons !== "function") {
    console.log("[play2] El socket no tiene sendMixedButtons: la librería instalada no es tu fork @fer2809fl/baileys (7.0.6+).");
    return null;
  }

  escucharBotones(sock);

  const botones = albumes.map((album, indice) => ({
    name: "quick_reply",
    params: {
      display_text: `${indice + 1}. ${recortar(album.artista, 18)}`,
      id: registrarBoton(album)
    }
  }));

  const extra = {
    footer: PIE_DE_PAGINA,
    quoted: msg,
    mentions: [sender],
    // Algunas versiones de sendMixedButtons ignoran "mentions" y solo leen contextInfo: se manda también por aquí.
    contextInfo: { mentionedJid: [sender] }
  };

  if (miniatura) extra.image = miniatura;

  try {
    return await sock.sendMixedButtons(from, texto, botones, extra);
  } catch (e) {
    console.log(`[play2] Falló el envío con botones: ${e.stack || e.message}`);
    return null;
  }
}

function tarjetaAlbumes(albumes, sender) {
  const partes = [
    encabezado("🌻", "YOUTUBE 2 DOWNLOAD"),
    "",
    `> Petición solicitada por ${mencion(sender)}.`,
    "",
    encabezado("🌟", "ÁLBUMES QUE COINCIDEN"),
    ""
  ];

  for (const album of albumes) {
    partes.push(campo("🧸", "Artista / Compositor", album.artista));
    partes.push(campo("🫯", "Nombre de álbum", album.nombre));
    partes.push(campo("🔈", "Canciones totales", `${album.pistas.length} canciones`));
    partes.push("");
  }

  partes.push(encabezado("⚙️", "SELECCIONA EL ÁLBUM"));
  partes.push("");
  albumes.forEach((album, indice) => partes.push(`*[${album.artista}]::* ${indice + 1}`));
  partes.push("");
  partes.push("> Usa los botones para elegir el álbum que realmente deseas para descargar.");

  return partes.join("\n");
}

export default {
  names: [".play2", ".album"],
  usage: ".play2 <álbum> [artista]",
  desc: "Busca álbumes en YouTube Music, te deja elegir con botones y envía todas las canciones en un solo archivo ZIP",
  category: "Descargas",

  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const consulta = cleanText.trim().split(/\s+/).slice(1).join(" ");

    if (!consulta) {
      return reply({
        text: tarjetaUso({
          comando: ".play2 <álbum> [artista]",
          ejemplo: ".play2 Un verano sin ti Bad Bunny",
          nota: "Te mostraré los álbumes que coincidan y podrás elegir cuál descargar. Se envía todo en un solo archivo ZIP."
        }),
        mentions: [sender]
      });
    }

    const aviso = reply({
      text: tarjetaDescarga({
        emoji: "🔎",
        titulo: "YOUTUBE 2 DOWNLOAD",
        sender,
        campos: [campo("💭", "Búsqueda", consulta)],
        nota: "Buscando álbumes en YouTube Music. Esto puede tardar unos segundos."
      }),
      mentions: [sender]
    }).catch(() => {});

    const busqueda = buscarAlbumesYoutube(consulta, ALBUMES_A_MOSTRAR);
    busqueda.catch(() => {});

    await aviso;

    let albumes;

    try {
      albumes = await busqueda;
    } catch (e) {
      return reply({
        text: tarjetaError("No se pudo completar la búsqueda de álbumes.", e.message)
      });
    }

    if (albumes.length === 0) {
      return reply({
        text: tarjetaError("No se encontraron álbumes con ese nombre. Prueba agregando el nombre del artista.")
      });
    }

    // La portada del primer resultado acompaña la tarjeta (igual que la miniatura en .play).
    let miniatura;

    try {
      miniatura = albumes[0].miniatura ? await descargarBuffer(albumes[0].miniatura) : undefined;
    } catch (e) {
      miniatura = undefined;
    }

    const texto = tarjetaAlbumes(albumes, sender);

    // Respaldo: si no usan los botones, también se puede responder con el número del álbum.
    registrarEspera(`${from}:${sender}`, {
      duracionMs: DURACION_ESPERA_MS,
      alResponder: async (respuesta, ctx) => {
        const opcion = Number(respuesta.trim());

        if (!Number.isInteger(opcion) || opcion < 1 || opcion > albumes.length) return false;

        await enviarAlbum({
          sock: ctx.sock,
          from: ctx.from,
          msg: ctx.msg,
          album: albumes[opcion - 1]
        });

        return true;
      }
    });

    await delayAleatorio(300, 900);
    await simularEscritura(sock, from, 800 + Math.floor(Math.random() * 1200));

    const enviado = await enviarTarjetaConBotones({
      sock,
      from,
      msg,
      sender,
      albumes,
      texto,
      miniatura
    });

    if (enviado) return;

    // ── Respaldo sin botones: foto + texto, o solo texto ──
    const textoSinBotones = `${texto}\n\n> También puedes responder con el número del álbum (1, 2 o 3).`;

    if (miniatura) {
      try {
        await reply({
          image: miniatura,
          caption: textoSinBotones,
          mentions: [sender]
        });
        return;
      } catch (e) {
        console.log(`[play2] No se pudo enviar la foto con la información: ${e.message}`);
      }
    }

    await reply({
      text: textoSinBotones,
      mentions: [sender]
    });
  }
};
