import { registrarBeso } from "../../../motores/db.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const HEADERS = { "User-Agent": "MaxiProyecBot/1.0 (WhatsApp bot, contacto en GitHub IamDuvalinBS)" };
const MIN_RESERVA = 10;
const RECUERDA_USADAS = 40;

const pool = [];
const usadas = [];
let cargando = null;

const esBeso = (p) => {
  const tags = p.tag_string_general.split(" ");
  const personas = tags.includes("2girls") || tags.includes("2boys") || (tags.includes("1girl") && tags.includes("1boy"));
  const raro = tags.some((t) => t.includes("kiss") && /cheek|forehead|hand|blow|neck|foot|imminent|almost|incoming|interrupt/.test(t));
  return personas && !raro;
};

const buscarPagina = async (pagina) => {
  try {
    const res = await fetch(`https://safebooru.donmai.us/posts.json?tags=kiss&limit=100&page=${pagina}`, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const todos = (await res.json()).filter((p) => p.rating === "g" && p.large_file_url && /jpg|jpeg|png|webp/.test(p.file_ext) && p.tag_string_general.split(" ").includes("kiss"));
    const buenos = todos.filter((p) => p.tag_count_character > 0 && esBeso(p));
    const base = buenos.length ? buenos : todos.filter(esBeso);
    const ancha = base.filter((p) => p.image_width / p.image_height >= 1.3);
    const conOjos = ancha.filter((p) => p.tag_string_general.split(" ").includes("closed_eyes"));
    return conOjos.length >= 5 ? conOjos : ancha.length >= 5 ? ancha : base;
  } catch (e) {
    console.log("kiss: error cargando imágenes: " + e.message);
    return [];
  }
};

const rellenar = async () => {
  const paginas = [...new Set(Array.from({ length: 3 }, () => 1 + Math.floor(Math.random() * 20)))];
  const posts = (await Promise.all(paginas.map(buscarPagina))).flat();
  for (const p of posts) {
    if (usadas.includes(p.id) || pool.some((x) => x.id === p.id)) continue;
    pool.push({ id: p.id, url: p.large_file_url });
  }
};

const recargar = () => (cargando ??= rellenar().finally(() => { cargando = null; }));

const siguienteUrl = async () => {
  for (let i = 0; i < 3 && !pool.length; i++) await recargar();
  const [elegido] = pool.splice(Math.floor(Math.random() * pool.length), 1);
  if (!elegido) return undefined;
  usadas.push(elegido.id);
  if (usadas.length > RECUERDA_USADAS) usadas.shift();
  if (pool.length < MIN_RESERVA) recargar();
  return elegido.url;
};

const obtenerImagenBeso = async () => {
  for (let i = 0; i < 2; i++) {
    try {
      const url = await siguienteUrl();
      if (!url) return undefined;
      const archivo = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
      if (!archivo.ok) throw new Error(`HTTP ${archivo.status} al bajar la imagen`);
      const img = await loadImage(Buffer.from(await archivo.arrayBuffer()));
      const W = 640;
      const H = 360;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, W, H);
      const s = Math.min(W / img.width, H / img.height);
      const w = Math.round(img.width * s);
      const h = Math.round(img.height * s);
      ctx.drawImage(img, Math.round((W - w) / 2), Math.round((H - h) / 2), w, h);
      return canvas.toBuffer("image/jpeg", 70);
    } catch (e) {
      console.log("kiss: error obteniendo imagen: " + e.message);
    }
  }
  return undefined;
};

recargar();

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
    const miniatura = await obtenerImagenBeso();

    const nombreDe = `@${sender.split("@")[0]}`;
    const nombrePara = `@${target.split("@")[0]}`;

    await sock.sendMessage(
      from,
      {
        text: esASiMismo ? `> ${nombreDe} se mandó un beso al aire.` : `> ${nombreDe} le dio un beso a ${nombrePara}.`,
        mentions: esASiMismo ? [sender] : [sender, target],
        contextInfo: {
          isForwarded: true,
          forwardingScore: 999,
          externalAdReply: {
            title: esASiMismo ? "Beso al aire" : `${total} beso${total === 1 ? "" : "s"} en total`,
            body: "Pᴏᴡᴇʀᴇᴅ Bʏ • ItsDuva",
            mediaType: 1,
            thumbnail: miniatura,
            renderLargerThumbnail: true,
            showAdAttribution: false
          }
        }
      },
      { quoted: msg }
    );
  }
};
