import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { config } from "../../../motores/db.js";
import { tarjetaUso, tarjetaAviso } from "../../descargas/tarjetas.js";
import { encabezado } from "../../economia/estilo.js";
import { obtenerCliente, buscarVideosYoutube, descargarAudioConProveedores } from "../../descargas/youtube-engine.js";
import { descargarBuffer } from "../../descargas/core.js";
import { enviarConBoton } from "../../../motores/botones.js";

const execFileAsync = promisify(execFile);

const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{--a:#ec4899;--a2:#f9a8d4;--tx:#1c2540;--su:#62708f}
html,body{background:linear-gradient(160deg,#fff1f7,#fde4f0);color:var(--tx);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:13px;overflow-x:hidden;min-height:100%}
body{padding:12px;position:relative}
.cab{display:flex;align-items:center;gap:12px;padding:12px;border-radius:22px;border:3px solid var(--a);background:#fff;margin-bottom:12px;box-shadow:0 0 18px #ec489955}
.ic{flex:none;width:54px;height:54px;border-radius:16px;background:var(--a);display:flex;align-items:center;justify-content:center;font-size:30px}
.tt{min-width:0}.tt b{display:block;font-size:19px;line-height:1.15;overflow-wrap:anywhere}.tt small{color:var(--su);font-size:12px;display:block;overflow-wrap:anywhere}
.pl{background:#fff;border-radius:22px;border:3px solid var(--a);padding:10px;box-shadow:0 3px 10px rgba(0,0,0,.12)}
.cv{position:relative;width:100%;aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#f3d9e8;display:flex;align-items:center;justify-content:center;font-size:54px;cursor:pointer}
.cv img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.ov{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.22);transition:opacity .15s}
.ov span{width:60px;height:60px;border-radius:50%;background:var(--a);color:#fff;font-size:26px;display:flex;align-items:center;justify-content:center;padding-left:4px;border:3px solid #fff}
.pl.go .ov{opacity:0}
.np{margin:10px 2px 6px}.np b{display:block;font-size:15px;line-height:1.25;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.np small{color:var(--su);font-size:12px}
.sk{display:flex;align-items:center;gap:8px;margin:8px 2px}
.sk em{font-style:normal;font-size:11.5px;color:var(--su);min-width:34px;text-align:center;font-variant-numeric:tabular-nums}
input[type=range]{-webkit-appearance:none;appearance:none;flex:1;height:8px;border-radius:6px;background:#f6cfe3;outline:none}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:var(--a);border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35)}
input[type=range]::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:var(--a);border:3px solid #fff}
.bt{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:6px}
.b{width:46px;height:46px;border-radius:50%;border:2px solid var(--a);background:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;color:var(--tx);cursor:pointer}
.b.big{width:62px;height:62px;background:var(--a);color:#fff;font-size:24px;border-color:#fff;box-shadow:0 3px 10px #ec489988}
.b.on{background:var(--a2)}
.b:active{transform:scale(.93)}
.st{text-align:center;color:var(--su);font-size:11.5px;min-height:15px;margin-top:6px}
.sec{margin:14px 2px 8px;font-weight:900;font-size:14px;display:flex;justify-content:space-between;align-items:center}
.sec small{font-weight:700;color:var(--su);font-size:11.5px}
.ls{display:flex;flex-direction:column;gap:8px}
.r{display:flex;align-items:center;gap:10px;background:#fff;border-radius:16px;padding:6px;border:2px solid transparent;border-bottom:4px solid var(--a2);box-shadow:0 3px 8px rgba(0,0,0,.1);cursor:pointer}
.r.on{border-color:var(--a);border-bottom-color:var(--a);background:#fff5fa}
.rt{position:relative;flex:none;width:96px;aspect-ratio:16/9;border-radius:10px;overflow:hidden;background:#f3d9e8;display:flex;align-items:center;justify-content:center}
.rt img{width:100%;height:100%;object-fit:cover}
.rt em{position:absolute;right:3px;bottom:3px;background:rgba(0,0,0,.75);color:#fff;font-style:normal;font-size:10px;font-weight:700;padding:1px 5px;border-radius:5px}
.ri{min-width:0;flex:1}.ri b{display:block;font-size:12.5px;line-height:1.2;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ri small{color:var(--su);font-size:11px}
.eq{flex:none;width:22px;height:18px;display:none;align-items:flex-end;gap:2px;margin-right:4px}
.r.on .eq{display:flex}
.eq i{flex:1;background:var(--a);border-radius:2px;height:100%;transform-origin:bottom;animation:eq .8s ease-in-out infinite}
.eq i:nth-child(2){animation-delay:.2s}.eq i:nth-child(3){animation-delay:.4s}
.pa .eq i{animation-play-state:paused}
@keyframes eq{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
.pie{margin-top:14px;text-align:center;color:var(--su);font-size:11.5px;line-height:1.6}
.pie b{color:var(--tx)}
`;

const JS = `
var D=__D__,A=__A__;
var au=document.getElementById("au"),pl=document.getElementById("pl"),cur=-1,urls={},rep=false,shuf=false,drag=false;
function $(i){return document.getElementById(i)}
function f(s){s=Math.floor(s||0);return Math.floor(s/60)+":"+("0"+(s%60)).slice(-2)}
function mk(i){if(urls[i])return urls[i];var b=atob(A[i]),n=b.length,u=new Uint8Array(n);for(var k=0;k<n;k++)u[k]=b.charCodeAt(k);urls[i]=URL.createObjectURL(new Blob([u],{type:"audio/mpeg"}));return urls[i]}
function rows(){return document.querySelectorAll(".r")}
function pausa(p){pl.classList.toggle("pa",p);pl.classList.toggle("go",!p);$("pp").textContent=p?"\\u25B6":"\\u23F8"}
function ir(i,go){
if(i<0||i>=D.length)return;
var old=cur;cur=i;
au.src=mk(i);
if(old>=0&&old!==i&&urls[old]){try{URL.revokeObjectURL(urls[old])}catch(e){}delete urls[old]}
var rs=rows();for(var k=0;k<rs.length;k++)rs[k].classList.toggle("on",k===i);
var im=rs[i].querySelector("img"),cv=$("cv"),old2=cv.querySelector("img");
if(old2)cv.removeChild(old2);
if(im){var n=document.createElement("img");n.src=im.src;n.alt="";cv.insertBefore(n,cv.firstChild)}
$("nt").textContent=D[i].t;$("nc").textContent=D[i].c;$("n").textContent=(i+1)+" / "+D.length;
$("sk").value=0;$("t0").textContent="0:00";$("t1").textContent=f(D[i].s);$("st").textContent="";
if(go){var p=au.play();if(p&&p.catch)p.catch(function(){pausa(true);$("st").textContent="Toca \\u25B6 para reproducir"})}
else pausa(true);
}
function sig(auto){
if(!D.length)return;
var n;
if(shuf&&D.length>1){do{n=Math.floor(Math.random()*D.length)}while(n===cur)}
else{n=cur+1;if(n>=D.length){if(auto&&!rep){pausa(true);ir(0,false);return}n=0}}
ir(n,true)}
function ant(){if(au.currentTime>3){au.currentTime=0;return}ir(cur<=0?D.length-1:cur-1,true)}
function toggle(){if(cur<0){ir(0,true);return}if(au.paused){var p=au.play();if(p&&p.catch)p.catch(function(){})}else au.pause()}
au.addEventListener("play",function(){pausa(false)});
au.addEventListener("pause",function(){pausa(true)});
au.addEventListener("ended",function(){sig(true)});
au.addEventListener("error",function(){$("st").textContent="No se pudo reproducir, pasando a la siguiente...";setTimeout(function(){sig(false)},900)});
au.addEventListener("timeupdate",function(){if(drag||!au.duration)return;$("sk").value=Math.round(au.currentTime/au.duration*1000);$("t0").textContent=f(au.currentTime)});
au.addEventListener("loadedmetadata",function(){if(au.duration&&isFinite(au.duration))$("t1").textContent=f(au.duration)});
var sk=$("sk");
sk.addEventListener("input",function(){drag=true;if(au.duration)$("t0").textContent=f(sk.value/1000*au.duration)});
sk.addEventListener("change",function(){if(au.duration)au.currentTime=sk.value/1000*au.duration;drag=false});
$("cv").addEventListener("click",toggle);
$("pp").addEventListener("click",toggle);
$("nx").addEventListener("click",function(){sig(false)});
$("pv").addEventListener("click",ant);
$("sh").addEventListener("click",function(){shuf=!shuf;this.classList.toggle("on",shuf)});
$("rp").addEventListener("click",function(){rep=!rep;this.classList.toggle("on",rep)});
var rs=rows();for(var k=0;k<rs.length;k++){(function(i){rs[i].addEventListener("click",function(){ir(i,true)})})(k)}
ir(0,false);
`;

function htmlMusica({ consulta, firma, pistas, nota }) {
  const filas = pistas.map((p, i) => {
    const miniatura = p.img ? `<img src="${p.img}" alt="">` : "<span>🎵</span>";
    return `<div class="r" data-i="${i}"><div class="rt">${miniatura}<em>${esc(p.duracion)}</em></div><div class="ri"><b>${esc(p.titulo)}</b><small>${esc(p.canal)}</small></div><div class="eq"><i></i><i></i><i></i></div></div>`;
  }).join("");

  const meta = JSON.stringify(pistas.map((p) => ({ t: p.titulo, c: p.canal, s: p.segundos }))).replace(/</g, "\\u003c");
  const audios = JSON.stringify(pistas.map((p) => p.audio));
  const js = JS.replace("__D__", () => meta).replace("__A__", () => audios);

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${CSS}</style></head><body>
<div class="cab"><div class="ic">🎧</div><div class="tt"><b>Mi reproductor</b><small>Mix de ${esc(consulta)}</small></div></div>
<div class="pl pa" id="pl">
<div class="cv" id="cv">🎵<div class="ov"><span>▶</span></div></div>
<div class="np"><b id="nt"></b><small id="nc"></small></div>
<div class="sk"><em id="t0">0:00</em><input type="range" id="sk" min="0" max="1000" value="0"><em id="t1">0:00</em></div>
<div class="bt"><button class="b" id="sh">🔀</button><button class="b" id="pv">⏮</button><button class="b big" id="pp">▶</button><button class="b" id="nx">⏭</button><button class="b" id="rp">🔁</button></div>
<div class="st" id="st"></div>
<audio id="au" preload="auto"></audio>
</div>
<div class="sec"><span>A continuación</span><small id="n"></small></div>
<div class="ls">${filas}</div>
<div class="pie">${nota ? `${esc(nota)}<br>` : ""}ⓘ Powered by <b>${esc(firma)}</b></div>
<script>${js}</script>
</body></html>`;
}

function htmlMusicaYT({ consulta, firma, pistas }) {
  const filas = pistas.map((p, i) => {
    const miniatura = p.img ? `<img src="${p.img}" alt="">` : "<span>🎵</span>";
    return `<div class="r" data-i="${i}"><div class="rt">${miniatura}<em>${esc(p.duracion)}</em></div><div class="ri"><b>${esc(p.titulo)}</b><small>${esc(p.canal)}</small></div><div class="eq"><i></i><i></i><i></i></div></div>`;
  }).join("");
  const ids = JSON.stringify(pistas.map((p) => p.id));
  const css = CSS + `.vd{position:relative;width:100%;aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#000}.vd iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.av{margin:8px 2px 0;text-align:center;color:var(--su);font-size:11.5px}`;
  const js = `var I=${ids};
function u(i,a){var r=[];for(var k=1;k<I.length;k++)r.push(I[(i+k)%I.length]);return "https://www.youtube-nocookie.com/embed/"+I[i]+"?playsinline=1&rel=0&playlist="+r.join(",")+(a?"&autoplay=1":"")}
var fr=document.getElementById("fr"),rs=document.querySelectorAll(".r");
function ir(i,a){fr.src=u(i,a);for(var k=0;k<rs.length;k++)rs[k].classList.toggle("on",k===i);document.getElementById("n").textContent=(i+1)+" / "+I.length}
for(var k=0;k<rs.length;k++){(function(i){rs[i].addEventListener("click",function(){ir(i,true)})})(k)}
ir(0,false);`;
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${css}</style></head><body>
<div class="cab"><div class="ic">▶️</div><div class="tt"><b>Mi YouTube</b><small>Mix de ${esc(consulta)}</small></div></div>
<div class="pl pa"><div class="vd"><iframe id="fr" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>
<div class="av">¿Pantalla negra? Aquí WhatsApp no deja cargar YouTube: usa .musica sin "yt"</div></div>
<div class="sec"><span>A continuación</span><small id="n"></small></div>
<div class="ls">${filas}</div>
<div class="pie">ⓘ Powered by <b>${esc(firma)}</b></div>
<script>${js}</script>
</body></html>`;
}

const ESPERA_MS = 20000;
const MAX_SIMULTANEOS = 2;
const PISTAS_OBJETIVO = 6;
const CANDIDATAS = 10;
const CONCURRENCIA = 3;
const SEG_VISTA_PREVIA = 60;
const DURACION_MIN_SEG = 90;
const DURACION_MAX_SEG = 540;
const TIEMPO_PISTA_MS = 50000;
const TIEMPO_TOTAL_MS = 85000;
const LIMITE_AUDIO_B64 = 4200000;

const esperas = new Map();
let activos = 0;

const recortar = (t, max) => {
  const s = String(t || "").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

const textoDe = (v) => (v === null || v === undefined ? "" : typeof v === "string" ? v : v.text ?? String(v));

const idDe = (url) => (/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/.exec(String(url || "")) || [])[1] || "";

const normalizar = (t) =>
  String(t || "")
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
    .replace(/official|video|oficial|lyrics|letra|audio|hd|4k|visualizer|ft\.?|feat\.?/g, " ")
    .replace(/[^a-z0-9áéíóúñ]+/g, " ")
    .trim();

function segundosDe(valor) {
  if (typeof valor === "number") return valor;
  const m = /^(?:(\d+):)?(\d{1,2}):(\d{2})$/.exec(String(valor || "").trim());
  return m ? Number(m[1] || 0) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
}

function textoDuracion(seg) {
  return `${Math.floor(seg / 60)}:${String(Math.round(seg % 60)).padStart(2, "0")}`;
}

async function relacionadas(id) {
  try {
    const yt = await obtenerCliente();
    const info = await yt.getInfo(id);
    const feed = Array.isArray(info.watch_next_feed) ? info.watch_next_feed : [];
    return feed
      .map((it) => {
        const vid = it.id || it.content_id || it.video_id || "";
        const titulo = textoDe(it.title) || textoDe(it.metadata?.title);
        const seg = segundosDe(it.duration?.seconds ?? it.duration?.text ?? it.duration);
        const canal = it.author?.name || textoDe(it.metadata?.metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text) || "YouTube";
        return { id: vid, titulo, segundos: seg, canal };
      })
      .filter((v) => /^[a-zA-Z0-9_-]{11}$/.test(v.id) && v.titulo);
  } catch (e) {
    console.log("[MUSICA] relacionadas falló: " + String(e.message).split("\n")[0]);
    return [];
  }
}

async function armarCandidatas(consulta) {
  const busqueda = (await buscarVideosYoutube(consulta, 10)).map((v) => ({
    id: idDe(v.url),
    titulo: v.titulo,
    segundos: segundosDe(v.duracion),
    canal: v.canal
  })).filter((v) => v.id);
  if (!busqueda.length) return [];

  const semilla = busqueda.find((v) => v.segundos >= DURACION_MIN_SEG && v.segundos <= DURACION_MAX_SEG) || busqueda[0];
  const parecidas = await relacionadas(semilla.id);

  const vistos = new Set();
  const nombres = new Set();
  const lista = [];
  const agregar = (v, estricto) => {
    if (!v.id || vistos.has(v.id)) return;
    if (estricto && (v.segundos < DURACION_MIN_SEG || v.segundos > DURACION_MAX_SEG)) return;
    const nombre = normalizar(v.titulo);
    if (nombre && nombres.has(nombre)) return;
    vistos.add(v.id);
    if (nombre) nombres.add(nombre);
    lista.push(v);
  };

  agregar(semilla, false);
  parecidas.forEach((v) => agregar(v, true));
  busqueda.forEach((v) => agregar(v, true));
  return lista.slice(0, CANDIDATAS);
}

async function vistaPrevia(pista) {
  const link = `https://www.youtube.com/watch?v=${pista.id}`;
  const mp3 = await descargarAudioConProveedores(link, { titulo: pista.titulo, artista: pista.canal });
  const total = Number(mp3.duracionSeg) || pista.segundos || 0;
  const inicio = total > SEG_VISTA_PREVIA * 2 ? 20 : 0;
  const base = path.join(os.tmpdir(), `mus-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const entrada = base + "-in.mp3";
  const salida = base + "-out.mp3";
  try {
    fs.writeFileSync(entrada, mp3);
    await execFileAsync(
      "ffmpeg",
      ["-y", "-loglevel", "error", "-ss", String(inicio), "-i", entrada, "-t", String(SEG_VISTA_PREVIA), "-vn", "-ac", "1", "-ar", "32000", "-c:a", "libmp3lame", "-b:a", "48k", salida],
      { timeout: 30000 }
    );
    const datos = fs.readFileSync(salida);
    if (datos.length < 8 * 1024) throw new Error("vista previa vacía");
    const segundos = Math.min(SEG_VISTA_PREVIA, Math.max(1, total ? total - inicio : SEG_VISTA_PREVIA));
    return { audio: datos.toString("base64"), segundos };
  } finally {
    for (const f of [entrada, salida]) {
      try {
        fs.unlinkSync(f);
      } catch {}
    }
  }
}

function conLimite(promesa, ms) {
  let t;
  return Promise.race([promesa, new Promise((_, rej) => { t = setTimeout(() => rej(new Error("tiempo agotado")), ms); })]).finally(() => clearTimeout(t));
}

async function prepararPistas(candidatas) {
  const listas = [];
  const limite = Date.now() + TIEMPO_TOTAL_MS;
  let siguiente = 0;
  let pesoB64 = 0;

  const trabajador = async () => {
    while (listas.length < PISTAS_OBJETIVO && siguiente < candidatas.length && Date.now() < limite) {
      const pista = candidatas[siguiente++];
      const idx = siguiente - 1;
      try {
        const r = await conLimite(vistaPrevia(pista), Math.min(TIEMPO_PISTA_MS, Math.max(5000, limite - Date.now())));
        if (listas.length >= PISTAS_OBJETIVO || pesoB64 + r.audio.length > LIMITE_AUDIO_B64) continue;
        pesoB64 += r.audio.length;
        listas.push({ ...pista, ...r, duracion: textoDuracion(pista.segundos || r.segundos), orden: idx });
      } catch (e) {
        console.log(`[MUSICA] ${recortar(pista.titulo, 30)}: ${String(e.message).split("\n")[0]}`);
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCIA }, trabajador));
  return listas.sort((a, b) => a.orden - b.orden);
}

async function conMiniaturas(pistas) {
  await Promise.all(
    pistas.map(async (p) => {
      try {
        const buf = await conLimite(descargarBuffer(`https://i.ytimg.com/vi/${p.id}/mqdefault.jpg`), 8000);
        p.img = `data:image/jpeg;base64,${buf.toString("base64")}`;
      } catch {
        p.img = "";
      }
    })
  );
  return pistas;
}

function textoRespaldo(consulta, candidatas) {
  const partes = ["🎧 *MI REPRODUCTOR*", `> ${consulta}`, ""];
  candidatas.slice(0, 6).forEach((v) => partes.push(`✿ *${v.titulo}*\n> https://www.youtube.com/watch?v=${v.id}`));
  partes.push("", "> Usa *.play <nombre>* para bajar la canción completa.");
  return partes.join("\n");
}

export default {
  names: [".musica", ".reproductor", ".mix"],
  desc: "Reproductor tipo YouTube: busca una canción y arma una lista de canciones similares para escuchar dentro del chat",
  category: "Tools",
  usage: ".musica <canción o artista>",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    let palabras = cleanText.split(/\s+/).slice(1);
    const directo = palabras.length > 1 && ["yt", "directo", "youtube"].includes(palabras[0].toLowerCase());
    if (directo) palabras = palabras.slice(1);
    const consulta = palabras.join(" ").trim();
    if (!consulta) {
      return reply({
        text: tarjetaUso({
          comando: ".musica <canción o artista>",
          ejemplo: ".musica bad bunny   |   .musica rock en español   |   .musica yt bad bunny (directo con YouTube)",
          nota: "Armo una lista de canciones parecidas con vista previa de 1 minuto por tema, con adelantar, siguiente, aleatorio y repetir."
        })
      });
    }

    const ahora = Date.now();
    const ultima = esperas.get(sender) || 0;
    if (ahora - ultima < ESPERA_MS) {
      const falta = Math.ceil((ESPERA_MS - (ahora - ultima)) / 1000);
      return reply({ text: tarjetaAviso("REPRODUCTOR", `Espera ${falta}s antes de pedir otro mix.`) });
    }
    if (activos >= MAX_SIMULTANEOS) {
      return reply({ text: tarjetaAviso("REPRODUCTOR", "Estoy armando otros mixes. Intenta de nuevo en un momento.") });
    }
    esperas.set(sender, ahora);
    if (esperas.size > 500) esperas.delete(esperas.keys().next().value);

    const firma = config.botNameShort || "MaxiProyec";
    activos++;
    try {
      try {
        await sock.sendMessage(from, { react: { text: "🎧", key: msg.key } });
      } catch {}
      if (!directo) await reply({ text: [encabezado("🎧", "REPRODUCTOR"), "", `> Armando tu mix de *${recortar(consulta, 40)}*, tarda cerca de 1 minuto.`].join("\n") });

      let candidatas = [];
      try {
        candidatas = await armarCandidatas(consulta);
      } catch (e) {
        console.log("[MUSICA] búsqueda falló: " + String(e.message).split("\n")[0]);
      }
      if (!candidatas.length) {
        return reply({ text: tarjetaAviso("REPRODUCTOR", "No encontré canciones con esa búsqueda. Prueba con otro nombre.") });
      }

      if (directo) {
        const lista8 = await conMiniaturas(candidatas.slice(0, 8).map((p) => ({ ...p, duracion: textoDuracion(p.segundos) })));
        try {
          if (typeof sock.sendHtml !== "function") throw new Error("sin sendHtml");
          return await sock.sendHtml(from, htmlMusicaYT({ consulta, firma, pistas: lista8 }), [], msg, {});
        } catch (e) {
          console.log("[MUSICA] HTML directo falló: " + e.message);
          return sock.sendMessage(from, { text: textoRespaldo(consulta, candidatas) }, { quoted: msg });
        }
      }

      const pistas = await conMiniaturas(await prepararPistas(candidatas));
      if (!pistas.length) {
        return sock.sendMessage(from, { text: textoRespaldo(consulta, candidatas) }, { quoted: msg });
      }

      const nota = `Vista previa de ${SEG_VISTA_PREVIA} s por canción · usa .play para la completa`;
      try {
        if (typeof sock.sendHtml !== "function") throw new Error("sin sendHtml");
        await sock.sendHtml(from, htmlMusica({ consulta, firma, pistas, nota }), [], msg, {});
      } catch (e) {
        console.log("[MUSICA] HTML falló: " + e.message);
        return sock.sendMessage(from, { text: textoRespaldo(consulta, candidatas) }, { quoted: msg });
      }

      const lista = pistas.slice(0, 4).map((p, i) => ({
        texto: `${i + 1}. ${recortar(p.titulo, 24)}`,
        url: `https://www.youtube.com/watch?v=${p.id}`
      }));
      const enviado = await enviarConBoton({
        sock,
        from,
        msg,
        texto: `> 🎧 Mix de *${recortar(consulta, 40)}* · ${pistas.length} canciones`,
        footer: "Powered by " + firma,
        lista
      });
      if (!enviado) {
        await sock.sendMessage(from, { text: lista.map((b) => `${b.texto}\n> ${b.url}`).join("\n\n") }, { quoted: msg });
      }
    } catch (e) {
      console.log("[MUSICA] ERROR: " + e.message);
      await reply({ text: tarjetaAviso("REPRODUCTOR", "No pude armar el mix. Intenta de nuevo.") });
    } finally {
      activos--;
    }
  }
};
