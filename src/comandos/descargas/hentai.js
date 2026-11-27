import axios from "axios";
import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { ajustesDe, definirAjusteMongo } from "../../grupos/estado.js";
import { esAdminOOwner } from "../../grupos/nucleo.js";
import { correrFfmpeg } from "../../nucleo/ffmpeg.js";
import { descargarATemporal } from "../../descargas/core.js";
import { descargarConYtdlp, hayYtdlp } from "../../descargas/redes.js";
import { enviarLote } from "../../descargas/envio.js";
import { medioForo } from "../../descargas/foro.js";
import { tarjetaUso, tarjetaError, tarjetaAviso } from "../../descargas/tarjetas.js";
import { encabezado } from "../../economia/estilo.js";

const execFileAsync = promisify(execFile);
const http = axios.create({ timeout: 15000, headers: { "User-Agent": "Mozilla/5.0" } });
const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];

// ───────── FOTOS: varias APIs de imágenes de anime; si una cae, se prueba la siguiente ─────────
const FUENTES_FOTO = [
  async () => (await http.get(`https://api.waifu.pics/nsfw/${azar(["waifu", "neko"])}`)).data.url,
  async () => (await http.get(`https://nekobot.xyz/api/image?type=${azar(["hentai", "hass", "hboobs", "hthigh", "hmidriff"])}`)).data.message,
  async () => (await http.get("https://api.waifu.im/search", { params: { included_tags: azar(["hentai", "ero", "milf", "oral"]), is_nsfw: "true" } })).data.images?.[0]?.url
];

async function urlFoto() {
  const orden = [...FUENTES_FOTO].sort(() => Math.random() - 0.5);
  for (const f of orden) {
    try { const u = await f(); if (/^https?:\/\//.test(u || "")) return u; } catch (e) {}
  }
  throw new Error("Las fuentes de imágenes no respondieron.");
}

// ───────── VIDEO CORTO: GIFs animados (purrbot) convertidos a mp4 con ffmpeg ─────────
const TAGS_GIF = ["blowjob", "fuck", "anal", "cum", "neko", "pussylick", "solo", "yuri", "threesome_fff"];

async function videoCorto() {
  let url;
  for (const tag of [azar(TAGS_GIF), azar(TAGS_GIF)]) {
    try {
      const { data } = await http.get(`https://api.purrbot.site/v2/img/nsfw/${tag}/gif`);
      if (data?.link) { url = data.link; break; }
    } catch (e) {}
  }
  if (!url) throw new Error("La fuente de videos cortos no respondió.");
  const gif = await descargarATemporal(url, "gif");
  const mp4 = path.join(os.tmpdir(), `hc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.mp4`);
  try {
    // 3 vueltas para que no dure solo 2 segundos; formato compatible con WhatsApp.
    await correrFfmpeg(["-stream_loop", "2", "-i", gif, "-movflags", "faststart", "-pix_fmt", "yuv420p",
      "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-an", mp4], 90000);
  } finally { try { fs.unlinkSync(gif); } catch (e) {} }
  return [{ type: "video", ruta: mp4 }];
}

// ───────── VIDEO LARGO: yt-dlp sobre listados (se pueden cambiar con HENTAI_FUENTES="url1,url2") ─────────
const FUENTES_LARGO = (process.env.HENTAI_FUENTES || "https://www.pornhub.com/video/search?search=hentai+uncensored")
  .split(",").map((s) => s.trim()).filter(Boolean);

async function videoLargo() {
  if (!(await hayYtdlp())) throw new Error('Falta yt-dlp: instala python y ffmpeg y corre pip install -U "yt-dlp[default]" (en Termux: pkg install python ffmpeg)');
  const fuente = azar(FUENTES_LARGO);
  const pagina = 1 + Math.floor(Math.random() * 5);
  const listado = fuente + (fuente.includes("?") ? "&" : "?") + `page=${pagina}`;
  const { stdout } = await execFileAsync("yt-dlp", ["-J", "--flat-playlist", "--playlist-end", "40", "--no-warnings", listado],
    { timeout: 60000, maxBuffer: 20 * 1024 * 1024 });
  const entradas = (JSON.parse(stdout).entries || []).filter((e) => e?.url);
  // Prefiere los de 10+ min; si el listado no trae duración usa cualquiera.
  const largos = entradas.filter((e) => Number(e.duration) >= 600);
  const elegido = azar(largos.length ? largos : entradas);
  if (!elegido) throw new Error("El listado no devolvió videos.");
  return (await descargarConYtdlp(elegido.url)).map((a) => ({ type: a.type, ruta: a.ruta }));
}

let EN_CURSO = false;

export default [
  {
    names: [".hentai", ".h"],
    usage: ".hentai [foto | video]",
    desc: "Fotos o videos de anime +18, cortos o largos",
    category: "Anime",
    handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
      const esGrupo = from.endsWith("@g.us");
      if (esGrupo && !ajustesDe(from).animeon) {
        return reply({ text: tarjetaAviso("ANIME", "Este grupo no lo tiene activado. Un admin debe escribir *.animeon on*."), mentions: [sender] });
      }
      const args = cleanText.toLowerCase().trim().split(/\s+/).slice(1);
      if (args.includes("ayuda")) {
        return reply({ text: tarjetaUso({ comando: ".hentai [foto|video] [corto|largo] [n]", ejemplo: ".hentai\n.hentai foto 3\n.hentai video corto\n.hentai video largo\n.hentai foro 5", nota: "Sin opciones manda 1 foto." }), mentions: [sender] });
      }
      const esVideo = args.some((a) => ["video", "videos", "vid"].includes(a));
      const esForo = args.some((a) => ["foro", "forogore"].includes(a));
      const esLargo = args.some((a) => ["largo", "largos", "long"].includes(a));
      const n = Math.min(5, Math.max(1, Number(args.find((a) => /^\d$/.test(a))) || 1));

      if (EN_CURSO) return reply({ text: tarjetaAviso("EN CURSO", "Espera a que termine el envío anterior."), mentions: [sender] });
      EN_CURSO = true;
      try {
        if (esForo) {
          await reply({ text: `${encabezado("🌸", "ANIME")}\n\n> Abriendo publicaciones del foro, dame unos segundos.` }).catch(() => {});
          let lote;
          try { lote = await medioForo(/\d/.test(args.join("")) ? n : 5); }
          catch (e) { return reply({ text: tarjetaError("No pude conseguir contenido del foro.", e.message) }); }
          let enviados = 0;
          if (lote.fotos.length) enviados += (await enviarLote(lote.fotos, reply, { sock, from, msg, objetivo: lote.fotos.length })).enviados;
          for (const v of lote.videos) enviados += (await enviarLote([v], reply, { sock, from, msg, objetivo: 1 })).enviados; // los videos van aparte
          if (!enviados) await reply({ text: tarjetaError("No se pudo enviar. Intenta otra vez.") });
          return;
        }
        let medias;
        try {
          if (!esVideo) {
            const urls = [];
            for (let i = 0; i < n * 2 && urls.length < n; i++) {
              try { const u = await urlFoto(); if (!urls.includes(u)) urls.push(u); } catch (e) { if (!urls.length && i >= 2) throw e; }
            }
            medias = urls.map((url) => ({ type: "image", url }));
          } else {
            await reply({ text: `${encabezado("🌸", "ANIME")}\n\n> Buscando video ${esLargo ? "largo" : "corto"}, dame unos segundos.` }).catch(() => {});
            medias = esLargo ? await videoLargo() : await videoCorto();
          }
        } catch (e) {
          return reply({ text: tarjetaError("No pude conseguir contenido ahora mismo.", e.message) });
        }
        const r = await enviarLote(medias, reply, { sock, from, msg, objetivo: medias.length });
        if (!r.enviados) await reply({ text: tarjetaError("No se pudo enviar. Intenta otra vez.", r.ultimoError) });
      } finally { EN_CURSO = false; }
    }
  },
  {
    names: [".animeon", ".anime18"],
    usage: ".animeon on|off",
    desc: "Activa o desactiva el anime +18 en el grupo (admins)",
    category: "Anime",
    handler: async ({ sock, from, sender, cleanText, reply }) => {
      if (!from.endsWith("@g.us")) return reply({ text: "🌸 En privado .hentai ya está disponible." });
      if (!(await esAdminOOwner(sock, from, sender))) return reply({ text: "🚫 Solo los admins pueden cambiar esto." });
      const op = cleanText.toLowerCase().trim().split(/\s+/)[1];
      if (!["on", "off"].includes(op)) return reply({ text: `🌸 Anime está *${ajustesDe(from).animeon ? "activado" : "desactivado"}*. Usa *.animeon on* o *.animeon off*.` });
      await definirAjusteMongo(from, "animeon", op === "on");
      return reply({ text: op === "on" ? "🌸 Anime *activado* en este grupo." : "✅ Anime *desactivado*." });
    }
  }
];
