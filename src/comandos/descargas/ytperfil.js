import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import { obtenerCliente } from "../../descargas/youtube-engine.js";
import { descargarBuffer } from "../../descargas/core.js";
import { enviarDescarga } from "./youtube.js";
import { registrarEspera } from "../../nucleo/espera.js";
import { addToWallet, getAccount } from "../../../motores/db.js";
import { monto } from "../../economia/formato-evento.js";
import { campo, tarjetaDescarga, tarjetaUso, tarjetaError } from "../../descargas/tarjetas.js";

const execFileAsync = promisify(execFile);

// ───────────────────────── Ajustes ─────────────────────────
const PIE_DE_PAGINA = "Pᴏᴡᴇʀᴇᴅ Bʏ • ItsDuva";
const PREMIO_MIN = 1000;               // ¥enes mínimos por buscar un youtuber
const PREMIO_MAX = 5000;               // ¥enes máximos
const ESPERA_PREMIO_MS = 5 * 60 * 1000;          // entre premios (de cualquier canal)
const ESPERA_MISMO_CANAL_MS = 24 * 60 * 60 * 1000; // el mismo canal solo da premio 1 vez al día
const VIDA_BOTONES_MS = 15 * 60 * 1000;
const DURACION_ESPERA_MS = 5 * 60 * 1000;

// ───────────────────────── Utilidades ─────────────────────────
function textoDe(valor) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "string") return valor;
  if (typeof valor.text === "string") return valor.text;
  if (typeof valor.simpleText === "string") return valor.simpleText;
  return null;
}

// Junta todos los textos de un objeto de youtubei.js (sin ciclos, con límite).
function juntarTextos(raiz, max = 600) {
  const textos = [];
  const visto = new Set();
  const claveIgnorada = /url|thumbnail|image|avatar|banner|endpoint|command|icon/i;
  const ir = (nodo, prof) => {
    if (textos.length >= max || prof > 9 || nodo === null || nodo === undefined) return;
    if (typeof nodo === "string") {
      if (nodo.length <= 400 && !/^https?:\/\//i.test(nodo)) textos.push(nodo);
      return;
    }
    if (typeof nodo === "number") { textos.push(String(nodo)); return; }
    if (typeof nodo !== "object" || visto.has(nodo)) return;
    visto.add(nodo);
    if (Array.isArray(nodo)) { for (const x of nodo) ir(x, prof + 1); return; }
    for (const [k, v] of Object.entries(nodo)) {
      if (claveIgnorada.test(k)) continue;
      ir(v, prof + 1);
    }
  };
  try { ir(raiz, 0); } catch (e) {}
  return textos;
}

const primero = (textos, regex, grupo = 1) => {
  for (const t of textos) {
    const m = t.match(regex);
    if (m) return (m[grupo] || m[0]).trim();
  }
  return null;
};

function idDeVideo(item, prof = 0) {
  if (!item || typeof item !== "object" || prof > 3) return null;
  const candidatos = [
    item.video_id, item.id, item.content_id, item.entity_id,
    item.on_tap_endpoint?.payload?.videoId,
    item.endpoint?.payload?.videoId,
    item.navigation_endpoint?.payload?.videoId
  ];
  for (const c of candidatos) {
    if (typeof c === "string" && /^[\w-]{11}$/.test(c)) return c;
  }
  return item.content ? idDeVideo(item.content, prof + 1) : null;
}

function datosDeItem(item) {
  const id = idDeVideo(item);
  if (!id) return null;
  const nodo = item.content && !item.title ? item.content : item;
  const titulo =
    textoDe(nodo.title) ||
    textoDe(nodo.headline) ||
    textoDe(nodo.overlay_metadata?.primary_text) ||
    "Sin título";
  const publicado = textoDe(nodo.published) || null;
  const vistas =
    textoDe(nodo.short_view_count) ||
    textoDe(nodo.view_count) ||
    textoDe(nodo.views) ||
    textoDe(nodo.overlay_metadata?.secondary_text) ||
    null;
  return { id, titulo, publicado, vistas };
}

function agrandarAvatar(url) {
  if (!url) return null;
  let u = url.startsWith("//") ? `https:${url}` : url;
  u = u.replace(/=s\d+(-[^=?]*)?$/i, "=s800-c-k-c0x00ffffff-no-rj");
  return u;
}

// ───────────────────────── Tipo de YouTuber (aproximado) ─────────────────────────
const TIPOS = [
  ["VTuber", /vtuber|v-tuber|live2d|hololive|nijisanji|avatar virtual/i],
  ["Gamer / Streamer", /gaming|gamer|gameplay|minecraft|fortnite|roblox|free ?fire|brawl|let'?s play|jugando|speedrun|streamer|walkthrough|pokemon|pokémon/i],
  ["Música", /music|música|musica|official video|lyrics|letra|remix|\bcover\b|canción|cancion|vevo|\bmv\b/i],
  ["Anime / Animación", /anime|animaci[oó]n|animation|manga|\bamv\b|fnf|friday night funkin/i],
  ["Humor / Entretenimiento", /humor|memes?|comedia|risa|reacci[oó]n|\breact\b|broma|sketch|challenge|reto/i],
  ["Tecnología", /tecnolog|\btech\b|review|unboxing|celular|smartphone|programaci[oó]n|android|iphone|gadget/i],
  ["Educativo", /tutorial|aprende|curso|educaci|clase|ciencia|historia|explicaci[oó]n/i],
  ["Cocina", /receta|cocina|recipe|comida|food/i],
  ["Vlogs / Estilo de vida", /vlog|lifestyle|rutina|viaje|travel|storytime/i],
  ["Deportes / Fitness", /f[uú]tbol|deporte|sports|\bnba\b|gym|fitness|entrenamiento/i],
  ["Noticias", /noticias|\bnews\b|pol[ií]tica/i]
];

function adivinarTipo(texto) {
  let mejor = null;
  let puntos = 0;
  for (const [nombre, regex] of TIPOS) {
    const g = new RegExp(regex.source, "gi");
    const n = (texto.match(g) || []).length;
    if (n > puntos) { puntos = n; mejor = nombre; }
  }
  return mejor || "Variado";
}

// ───────────────────────── Resolver canal ─────────────────────────
async function resolverCanalId(yt, entrada) {
  const q = entrada.trim().replace(/^<|>$/g, "");

  const idDirecto = q.match(/(UC[\w-]{22})/);
  if (idDirecto) return idDirecto[1];

  // Si mandan un link de un video/short, se toma el canal de ese video.
  const video = q.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/);
  if (video) {
    const info = await yt.getBasicInfo(video[1]);
    const id = info?.basic_info?.channel_id || info?.basic_info?.channel?.id;
    if (id) return id;
  }

  // URL de canal o @usuario
  const urls = [];
  if (/^https?:\/\//i.test(q)) urls.push(q);
  else if (q.startsWith("@")) urls.push(`https://www.youtube.com/${q}`);
  else urls.push(`https://www.youtube.com/@${q.replace(/\s+/g, "")}`);

  for (const u of urls) {
    try {
      const r = await yt.resolveURL(u);
      const id = r?.payload?.browseId;
      if (id && id.startsWith("UC")) return id;
    } catch (e) {}
  }

  // Búsqueda por nombre
  const res = await yt.search(q, { type: "channel" });
  const lista = res?.channels ?? (res?.results || []).filter((r) => /channel/i.test(r?.type || ""));
  for (const c of lista || []) {
    const id = c?.id || c?.author?.id || c?.channel_id || c?.content_id;
    if (typeof id === "string" && id.startsWith("UC")) return id;
  }

  throw new Error("No encontré ningún canal con ese nombre.");
}

// ───────────────────────── Últimos videos / shorts ─────────────────────────
async function ultimoConYoutubei(canal, tipo) {
  const pestana = tipo === "short" ? await canal.getShorts() : await canal.getVideos();
  let items = [];
  try { items = pestana.videos || []; } catch (e) {}
  if (!items.length) {
    try { items = pestana.current_tab?.content?.contents || []; } catch (e) {}
  }
  for (const item of items) {
    const d = datosDeItem(item);
    if (d) return d;
  }
  return null;
}

// Respaldo con yt-dlp (si está instalado): lista plana, solo el primer elemento.
async function ultimoConYtdlp(canalId, tipo) {
  try {
    const url = `https://www.youtube.com/channel/${canalId}/${tipo === "short" ? "shorts" : "videos"}`;
    const { stdout } = await execFileAsync("yt-dlp", [
      "--quiet", "--no-warnings", "--flat-playlist", "--playlist-items", "1",
      ...(process.env.YTDLP_COOKIES && fs.existsSync(process.env.YTDLP_COOKIES) ? ["--cookies", process.env.YTDLP_COOKIES] : []),
      "--print", "%(id)s\t%(title)s",
      url
    ], { timeout: 45000, maxBuffer: 1024 * 1024 });
    const [id, ...resto] = stdout.trim().split("\n")[0].split("\t");
    if (/^[\w-]{11}$/.test(id || "")) return { id, titulo: resto.join("\t") || "Sin título", publicado: null, vistas: null };
  } catch (e) {}
  return null;
}

async function ultimo(canal, canalId, tipo) {
  try {
    const d = await ultimoConYoutubei(canal, tipo);
    if (d) return d;
  } catch (e) {
    console.log(`[ytperfil] youtubei no pudo leer los ${tipo}s: ${String(e.message).split("\n")[0]}`);
  }
  return ultimoConYtdlp(canalId, tipo);
}

// ───────────────────────── Perfil del canal ─────────────────────────
async function obtenerPerfil(entrada) {
  const yt = await obtenerCliente();
  const canalId = await resolverCanalId(yt, entrada);
  const canal = await yt.getChannel(canalId);

  const [acerca, ultimoVideo, ultimoShort] = await Promise.all([
    canal.getAbout().catch(() => null),
    ultimo(canal, canalId, "video"),
    ultimo(canal, canalId, "short")
  ]);

  const meta = canal.metadata || {};
  const textosHeader = juntarTextos(canal.header);
  const textosAcerca = acerca ? juntarTextos(acerca) : [];
  const todos = [...textosHeader, ...textosAcerca];

  const nombre = textoDe(meta.title) || textoDe(canal.header?.author?.name) || primero(textosHeader, /^(.{2,60})$/) || "Desconocido";
  const handle =
    (String(meta.vanity_channel_url || "").match(/@[\w.\-]+/) || [])[0] ||
    primero(todos, /(@[\w.\-]{3,})/) ||
    null;

  const subs = primero(todos, /(\d[\d.,]*\s?(?:mil millones|millones|mil|[KMB])?)\s*(?:de\s+)?(?:suscriptor|subscriber)/i);
  const videos = primero(todos, /^(\d[\d.,]*\s?(?:mil|[KM])?)\s*(?:v[ií]deos?)$/i) || primero(todos, /(\d[\d.,]*\s?(?:mil|[KM])?)\s*v[ií]deos?\b/i);
  const vistas = primero(todos, /(\d[\d.,]*)\s*(?:visualizaciones|vistas|views)/i);
  const creado = primero(textosAcerca, /(?:se uni[oó] el|joined)\s*(.+)$/i);

  const descripcion = (meta.description || "").replace(/\s+/g, " ").trim();
  const muestra = [nombre, descripcion, ultimoVideo?.titulo, ultimoShort?.titulo].filter(Boolean).join(" ");

  const avatar = agrandarAvatar(
    meta.avatar?.[0]?.url ||
    canal.header?.author?.best_thumbnail?.url ||
    canal.header?.author?.thumbnails?.[0]?.url ||
    null
  );

  return {
    id: canalId,
    nombre,
    handle,
    subs,
    videos,
    vistas,
    creado,
    descripcion: descripcion.length > 140 ? `${descripcion.slice(0, 137)}...` : descripcion,
    tipo: adivinarTipo(muestra),
    avatar,
    ultimoVideo,
    ultimoShort,
    enlace: handle ? `https://www.youtube.com/${handle}` : `https://www.youtube.com/channel/${canalId}`
  };
}

// ───────────────────────── Premio en ¥enes ─────────────────────────
function darPremio(sender, canalId) {
  const cuenta = getAccount(sender);
  const ahora = Date.now();
  const claveCanal = `ytperfil:${canalId}`;

  const falta = (clave, ms) => Math.max(0, (cuenta.cooldowns[clave] || 0) + ms - ahora);
  const faltaGlobal = falta("ytperfil", ESPERA_PREMIO_MS);
  const faltaCanal = falta(claveCanal, ESPERA_MISMO_CANAL_MS);

  if (faltaGlobal > 0) return { ganado: 0, motivo: `Puedes ganar otra recompensa en ${Math.ceil(faltaGlobal / 60000)} min.` };
  if (faltaCanal > 0) return { ganado: 0, motivo: "Este canal ya te dio recompensa hoy; prueba con otro youtuber." };

  const ganado = PREMIO_MIN + Math.floor(Math.random() * (PREMIO_MAX - PREMIO_MIN + 1));
  cuenta.cooldowns.ytperfil = ahora;
  cuenta.cooldowns[claveCanal] = ahora;
  addToWallet(sender, ganado); // también guarda los cooldowns
  return { ganado, cartera: getAccount(sender).wallet };
}

// ───────────────────────── Tarjeta ─────────────────────────
function armarTarjeta({ perfil, sender, premio, conBotones }) {
  const campos = [
    campo("👤", "Nombre", perfil.nombre),
    campo("🔖", "Usuario", perfil.handle || "No disponible"),
    campo("👥", "Suscriptores", perfil.subs || "Ocultos / no disponible"),
    perfil.videos ? campo("🎞️", "Videos subidos", perfil.videos) : null,
    campo("👁️", "Vistas acumuladas", perfil.vistas || "No disponible"),
    perfil.creado ? campo("📅", "Canal creado", perfil.creado) : null,
    campo("🎭", "Tipo de YouTuber", perfil.tipo),
    perfil.descripcion ? campo("📝", "Descripción", perfil.descripcion) : null,
    perfil.ultimoVideo
      ? campo("🎬", "Último video", `${perfil.ultimoVideo.titulo}${perfil.ultimoVideo.publicado ? ` · ${perfil.ultimoVideo.publicado}` : ""}`)
      : campo("🎬", "Último video", "No tiene videos"),
    perfil.ultimoShort
      ? campo("🩳", "Último short", `${perfil.ultimoShort.titulo}${perfil.ultimoShort.publicado ? ` · ${perfil.ultimoShort.publicado}` : ""}`)
      : campo("🩳", "Último short", "No tiene shorts"),
    campo("🔗", "Canal", perfil.enlace)
  ].filter(Boolean);

  const lineas = [];
  if (premio.ganado > 0) {
    lineas.push(`🪙 *RECOMPENSA::* +${monto(premio.ganado)}`);
    lineas.push(`⛁ *CARTERA::* ${monto(premio.cartera)}`);
  }

  const notas = [];
  if (premio.ganado === 0 && premio.motivo) notas.push(`🪙 ${premio.motivo}`);
  if (conBotones && (perfil.ultimoVideo || perfil.ultimoShort)) notas.push("Toca un botón para descargar.");
  if (!conBotones) {
    const opciones = [];
    if (perfil.ultimoShort) opciones.push("*1* = último short");
    if (perfil.ultimoVideo) opciones.push("*2* = último video");
    if (opciones.length) notas.push(`Responde con: ${opciones.join(" · ")}`);
  }

  return [
    tarjetaDescarga({ emoji: "📺", titulo: "PERFIL DE YOUTUBE", sender, campos }),
    lineas.length ? `\n${lineas.join("\n")}` : "",
    notas.length ? `\n${notas.map((n) => `> ${n}`).join("\n")}` : ""
  ].join("");
}

// ───────────────────────── Botones (mismo método que .play) ─────────────────────────
const BOTONES_ACTIVOS = new Map(); // id -> { link, expira }
const SOCKETS_ESCUCHANDO = new WeakSet();
const MENSAJES_PROCESADOS = new Set();

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
        if (!id || !id.startsWith("ytp|")) continue;

        if (m.key.id) {
          if (MENSAJES_PROCESADOS.has(m.key.id)) continue;
          MENSAJES_PROCESADOS.add(m.key.id);
          if (MENSAJES_PROCESADOS.size > 500) MENSAJES_PROCESADOS.delete(MENSAJES_PROCESADOS.values().next().value);
        }

        const chat = m.key.remoteJid;
        const entrada = BOTONES_ACTIVOS.get(id);
        if (!entrada || entrada.expira <= Date.now()) {
          BOTONES_ACTIVOS.delete(id);
          await sock.sendMessage(chat, { text: "⌛ Este botón ya expiró. Vuelve a usar *.ytperfil*." }, { quoted: m });
          continue;
        }

        await enviarDescarga({ sock, from: chat, msg: m, link: entrada.link, esAudio: false });
      } catch (e) {
        console.log(`[ytperfil] Error al procesar el botón: ${e.stack || e.message}`);
      }
    }
  });
}

function registrarBoton(link, clave) {
  const ahora = Date.now();
  for (const [k, v] of BOTONES_ACTIVOS) if (v.expira <= ahora) BOTONES_ACTIVOS.delete(k);
  const id = `ytp|${clave}|${ahora.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  BOTONES_ACTIVOS.set(id, { link, expira: ahora + VIDA_BOTONES_MS });
  return id;
}

const linkVideo = (id) => `https://www.youtube.com/watch?v=${id}`;
const linkShort = (id) => `https://www.youtube.com/shorts/${id}`;

async function enviarConBotones({ sock, from, msg, sender, texto, imagen, perfil }) {
  if (typeof sock.sendMixedButtons !== "function") {
    console.log("[ytperfil] El socket no tiene sendMixedButtons (se usa el respaldo sin botones).");
    return null;
  }
  escucharBotones(sock);

  const botones = [];
  if (perfil.ultimoShort) {
    botones.push({ name: "quick_reply", params: { display_text: "🩳 Último short", id: registrarBoton(linkShort(perfil.ultimoShort.id), "s") } });
  }
  if (perfil.ultimoVideo) {
    botones.push({ name: "quick_reply", params: { display_text: "🎬 Último video", id: registrarBoton(linkVideo(perfil.ultimoVideo.id), "v") } });
  }
  if (!botones.length) return null;

  const extra = {
    footer: PIE_DE_PAGINA,
    quoted: msg,
    mentions: [sender],
    contextInfo: { mentionedJid: [sender] }
  };
  if (imagen) extra.image = imagen;

  try {
    return await sock.sendMixedButtons(from, texto, botones, extra);
  } catch (e) {
    console.log(`[ytperfil] Falló el envío con botones: ${e.stack || e.message}`);
    return null;
  }
}

// ───────────────────────── Comando ─────────────────────────
export default {
  names: [".ytperfil", ".ytcanal", ".canalyt"],
  usage: ".ytperfil <nombre, @usuario o enlace del canal>",
  desc: "Muestra el perfil de un youtuber con botones para descargar su último short y su último video, y te da ¥enes",
  category: "Descargas",

  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const consulta = cleanText.trim().split(/\s+/).slice(1).join(" ").trim();

    if (!consulta) {
      return reply({
        text: tarjetaUso({
          comando: ".ytperfil <canal>",
          ejemplo: ".ytperfil chuymineR",
          nota: "Acepta el nombre, el @usuario o el enlace del canal (o de cualquier video suyo). Cada búsqueda te puede dar ¥enes."
        }),
        mentions: [sender]
      });
    }

    const aviso = reply({
      text: tarjetaDescarga({
        emoji: "🔎",
        titulo: "PERFIL DE YOUTUBE",
        sender,
        campos: [campo("💭", "Canal", consulta)],
        nota: "Buscando el canal. Esto puede tardar unos segundos."
      }),
      mentions: [sender]
    }).catch(() => {});

    let perfil;
    try {
      perfil = await obtenerPerfil(consulta);
    } catch (e) {
      await aviso;
      return reply({
        text: tarjetaError("No se pudo obtener el perfil del canal.", String(e.message).split("\n")[0])
      });
    }
    await aviso;

    let imagen;
    if (perfil.avatar) {
      try { imagen = await descargarBuffer(perfil.avatar); } catch (e) { imagen = undefined; }
    }

    const premio = darPremio(sender, perfil.id);

    const enviado = await enviarConBotones({
      sock, from, msg, sender, imagen, perfil,
      texto: armarTarjeta({ perfil, sender, premio, conBotones: true })
    });
    if (enviado) return;

    // ── Respaldo sin botones: foto + texto y se responde 1 o 2 ──
    const textoRespaldo = armarTarjeta({ perfil, sender, premio, conBotones: false });

    if (perfil.ultimoShort || perfil.ultimoVideo) {
      registrarEspera(`${from}:${sender}`, {
        tipo: "ytperfil",
        duracionMs: DURACION_ESPERA_MS,
        alResponder: async (respuesta, ctx) => {
          const opcion = respuesta.trim();
          const link =
            opcion === "1" && perfil.ultimoShort ? linkShort(perfil.ultimoShort.id) :
            opcion === "2" && perfil.ultimoVideo ? linkVideo(perfil.ultimoVideo.id) :
            null;
          if (!link) return false;
          await enviarDescarga({ sock: ctx.sock, from: ctx.from, msg: ctx.msg, link, esAudio: false });
          return true;
        }
      });
    }

    if (imagen) {
      try {
        await reply({ image: imagen, caption: textoRespaldo, mentions: [sender] });
        return;
      } catch (e) {
        console.log(`[ytperfil] No se pudo enviar la foto: ${e.message}`);
      }
    }
    await reply({ text: textoRespaldo, mentions: [sender] });
  }
};
