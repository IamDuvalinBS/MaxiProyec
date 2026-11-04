import { registrarBeso } from "../../../motores/db.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { enviarProducto } from "../../grupos/producto.js";

const HEADERS = { "User-Agent": "MaxiProyecBot/1.0 (WhatsApp bot, contacto en GitHub IamDuvalinBS)" };
const HEADERS_NAV = { "User-Agent": "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36", Accept: "application/json,image/*,*/*" };
const PAUSA_CAIDA = 15 * 60 * 1000;
let caidoHasta = 0;
const FIRMA = "Pᴏᴡᴇʀᴇᴅ Bʏ • ItsDuva";
const MIN_RESERVA = 10;
const RECUERDA_USADAS = 40;

const EXCLUIDOS = new Set(["comic", "monochrome", "greyscale", "sketch", "lineart", "4koma", "2koma", "multiple_views", "split_screen", "chibi", "manga"]);

const FUENTES = [
  { tags: "kiss screencap", paginas: 4 },
  { tags: "kiss ratio:>1.4", paginas: 12 }
];

const pool = [];
const usadas = [];
let cargando = null;

const esBeso = (p) => {
  const tags = p.tag_string_general.split(" ");
  const pareja = tags.includes("1boy") && tags.includes("1girl");
  const noHetero = tags.some((t) => /yaoi|yuri|2boys|2girls|multiple|otoko|crossdress|genderswap|trap|androgynous|futanari/.test(t));
  const raro = tags.some((t) => t.includes("kiss") && /cheek|forehead|hand|blow|neck|foot|imminent|almost|incoming|interrupt/.test(t));
  const feo = tags.some((t) => EXCLUIDOS.has(t));
  return pareja && !noHetero && !raro && !feo;
};

const buscarPagina = async (tags, pagina) => {
  try {
    const res = await fetch(`https://safebooru.donmai.us/posts.json?tags=${encodeURIComponent(tags)}&limit=100&page=${pagina}`, { headers: HEADERS_NAV, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const todos = (await res.json()).filter((p) => p.rating === "g" && p.large_file_url && /jpg|jpeg|png|webp/.test(p.file_ext) && p.tag_string_general.split(" ").includes("kiss"));
    const buenos = todos.filter((p) => p.tag_count_character > 0 && esBeso(p));
    const base = buenos.length ? buenos : todos.filter(esBeso);
    const ancha = base.filter((p) => p.image_width / p.image_height >= 1.4);
    const conOjos = ancha.filter((p) => p.tag_string_general.split(" ").includes("closed_eyes"));
    return conOjos.length >= 5 ? conOjos : ancha;
  } catch (e) {
    if (Date.now() >= caidoHasta) console.log(`kiss: Safebooru falló (${e.message}); uso el respaldo por 15 min`);
    caidoHasta = Date.now() + PAUSA_CAIDA;
    return [];
  }
};

const rellenar = async () => {
  if (Date.now() < caidoHasta) return;
  const trabajos = FUENTES.flatMap((f) => [...new Set(Array.from({ length: 2 }, () => 1 + Math.floor(Math.random() * f.paginas)))].map((n) => buscarPagina(f.tags, n)));
  const posts = (await Promise.all(trabajos)).flat();
  for (const p of posts) {
    if (usadas.includes(p.id) || pool.some((x) => x.id === p.id)) continue;
    pool.push({ id: p.id, url: p.large_file_url });
  }
};

const recargar = () => (cargando ??= rellenar().finally(() => { cargando = null; }));

const siguiente = async () => {
  if (Date.now() < caidoHasta && !pool.length) return undefined;
  for (let i = 0; i < 3 && !pool.length && Date.now() >= caidoHasta; i++) await recargar();
  const [elegido] = pool.splice(Math.floor(Math.random() * pool.length), 1);
  if (!elegido) return undefined;
  usadas.push(elegido.id);
  if (usadas.length > RECUERDA_USADAS) usadas.shift();
  console.log(`kiss: post ${elegido.id} (reserva: ${pool.length})`);
  if (pool.length < MIN_RESERVA && Date.now() >= caidoHasta) recargar();
  return elegido;
};

const dibujar = (img) => {
  const W = 800;
  const H = 450;
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
  return canvas.toBuffer("image/jpeg", 78);
};

const bajarImagen = async (url) => {
  let ultimoError;
  for (const headers of [HEADERS, HEADERS_NAV, {}]) {
    try {
      const archivo = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
      if (!archivo.ok) throw new Error(`HTTP ${archivo.status} al bajar la imagen (${new URL(url).host})`);
      return await loadImage(Buffer.from(await archivo.arrayBuffer()));
    } catch (e) {
      ultimoError = e;
    }
  }
  throw ultimoError;
};

const respaldo = [];
const usadasRespaldo = [];

const agregarRespaldo = (url, link) => {
  if (url && !usadasRespaldo.includes(url) && !respaldo.some((x) => x.url === url)) respaldo.push({ url, link: link || url });
};

const rellenarRespaldo = async () => {
  const bust = Date.now();
  const fuentes = [
    async () => {
      const res = await fetch(`https://nekos.best/api/v2/kiss?amount=20&_=${bust}`, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`HTTP ${res.status} en nekos.best`);
      for (const item of (await res.json()).results || []) agregarRespaldo(item?.url, item?.source_url);
    },
    async () => {
      const res = await fetch("https://api.waifu.pics/many/sfw/kiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        signal: AbortSignal.timeout(8000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} en waifu.pics`);
      for (const url of (await res.json()).files || []) agregarRespaldo(url);
    }
  ];
  const resultados = await Promise.allSettled(fuentes.map((f) => f()));
  const fallos = resultados.filter((r) => r.status === "rejected").map((r) => r.reason.message);
  if (fallos.length) console.log("kiss: respaldo con fallos: " + fallos.join(" | "));
};

const imagenRespaldo = async () => {
  if (respaldo.length < 5) await rellenarRespaldo();
  if (!respaldo.length) {
    usadasRespaldo.length = 0;
    await rellenarRespaldo();
  }
  const [item] = respaldo.splice(Math.floor(Math.random() * respaldo.length), 1);
  if (!item) throw new Error("el respaldo no devolvió imagen");
  usadasRespaldo.push(item.url);
  if (usadasRespaldo.length > 150) usadasRespaldo.shift();
  const img = await bajarImagen(item.url);
  return { buffer: dibujar(img), link: item.link };
};

const generarUna = async () => {
  for (let i = 0; i < 2; i++) {
    try {
      const elegido = await siguiente();
      if (!elegido) break;
      const img = await bajarImagen(elegido.url);
      return { buffer: dibujar(img), link: `https://safebooru.donmai.us/posts/${elegido.id}` };
    } catch (e) {
      console.log("kiss: error obteniendo imagen: " + e.message);
    }
  }
  try {
    return await imagenRespaldo();
  } catch (e) {
    console.log("kiss: error en el respaldo: " + e.message);
  }
  return undefined;
};

const LISTAS = 6;
const listas = [];
let llenando = null;

const llenar = () => (llenando ??= (async () => {
  let fallos = 0;
  while (listas.length < LISTAS && fallos < 2) {
    const una = await generarUna();
    if (una) listas.push(una);
    else fallos++;
  }
})().finally(() => { llenando = null; }));

let ultima;

const obtenerImagenBeso = async () => {
  const lista = listas.shift() ?? (await generarUna()) ?? ultima;
  if (lista) ultima = lista;
  llenar();
  return lista;
};

console.log("kiss: v18 cargado (solo parejas chico-chica)");
recargar();
llenar();

export default {
  names: [".kiss", ".besar"],
  usage: ".kiss [@usuario]",
  desc: "Reacción de anime: kiss, con contador real de besos entre ambos",
  category: "Diversión",
  handler: async (ctx) => {
    const { sock, from, sender, msg } = ctx;
    const info = msg.message?.extendedTextMessage?.contextInfo;
    const target = info?.mentionedJid?.[0] || info?.participant || sender;
    const esASiMismo = target === sender;

    const total = esASiMismo ? 0 : registrarBeso(sender, target);
    const imagen = await obtenerImagenBeso();

    const nombreDe = `@${sender.split("@")[0]}`;
    const nombrePara = `@${target.split("@")[0]}`;
    const linea = esASiMismo ? `> ${nombreDe} se mandó un beso al aire.` : `> ${nombreDe} le dio un beso a ${nombrePara}.`;
    const titulo = esASiMismo ? "Beso al aire" : `${total} beso${total === 1 ? "" : "s"} en total`;

    const mencionados = esASiMismo ? [sender] : [sender, target];

    if (imagen) {
      const enviado = await enviarProducto(sock, from, {
        imagen: imagen.buffer,
        titulo,
        descripcion: FIRMA,
        texto: linea,
        footer: FIRMA,
        mentions: mencionados,
        quoted: msg
      });
      if (enviado) return;
    }

    const mensaje = {
      text: imagen ? linea : `${linea}\n\n*${titulo}*\n${FIRMA}`,
      mentions: esASiMismo ? [sender] : [sender, target]
    };
    if (imagen) {
      mensaje.contextInfo = {
        externalAdReply: {
          title: titulo,
          body: FIRMA,
          mediaType: 1,
          thumbnail: imagen.buffer,
          sourceUrl: imagen.link,
          renderLargerThumbnail: true,
          showAdAttribution: false
        }
      };
    }

    await sock.sendMessage(from, mensaje, { quoted: msg });
  }
};
                                                                 
