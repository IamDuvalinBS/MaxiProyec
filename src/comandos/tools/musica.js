
import { config } from "../../../motores/db.js";
import { tarjetaUso, tarjetaAviso } from "../../descargas/tarjetas.js";
import { obtenerCliente, buscarVideosYoutube } from "../../descargas/youtube-engine.js";
import { descargarBuffer } from "../../descargas/core.js";
import { enviarConBoton } from "../../../motores/botones.js";
import { enviarHtmlEmbebido } from "../../../motores/botones-nativos.js";

const ESPERA_MS = 8000;
const COLA_MAX = 12;
const EXPANDIR = 6;
const RELACIONADAS_MAX = 14;
const CON_AUDIO_COLA = 10;
const CON_AUDIO_REL = 8;
const TIEMPO_EXPANDIR_MS = 4500;
const TIEMPO_AUDIO_MS = 13000;
const DURACION_MIN_SEG = 60;
const DURACION_MAX_SEG = 600;
const FUENTES = [
  "astabot.hidenplay.net",
  "unpkg.com",
  "cdn.jsdelivr",
  "googlevideo.com",
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "s.ytimg.com",
  "i.ytimg.com",
  "www.google.com"
];

const esperas = new Map();

const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

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

function conLimite(promesa, ms) {
  let t;
  return Promise.race([promesa, new Promise((_, rej) => { t = setTimeout(() => rej(new Error("tiempo agotado")), ms); })]).finally(() => clearTimeout(t));
}

function pistasDeAudio(info) {
  const sd = info?.streaming_data || info?.streamingData || {};
  const formatos = (sd.adaptive_formats || sd.adaptiveFormats || []).filter((f) => {
    const m = String(f.mime_type || f.mimeType || "");
    return m.startsWith("audio/") && f.url;
  });
  const peso = (f) => {
    const m = String(f.mime_type || f.mimeType || "");
    return (m.includes("mp4") ? 2e9 : 1e9) + Number(f.bitrate || 0);
  };
  formatos.sort((a, b) => peso(b) - peso(a));
  const urls = [];
  for (const f of formatos) {
    if (f.url && !urls.includes(f.url)) urls.push(f.url);
    if (urls.length >= 2) break;
  }
  return urls;
}

async function detalle(id, conAudio) {
  try {
    const yt = await obtenerCliente();
    const info = await conLimite(yt.getInfo(id), 9000);
    const feed = Array.isArray(info.watch_next_feed) ? info.watch_next_feed : [];
    const rel = feed
      .map((it) => ({
        id: it.id || it.content_id || it.video_id || "",
        titulo: textoDe(it.title) || textoDe(it.metadata?.title),
        segundos: segundosDe(it.duration?.seconds ?? it.duration?.text ?? it.duration),
        canal: it.author?.name || "YouTube"
      }))
      .filter((v) => /^[a-zA-Z0-9_-]{11}$/.test(v.id) && v.titulo);
    return { rel, audio: conAudio ? pistasDeAudio(info) : [] };
  } catch (e) {
    console.log("[MUSICA] detalle falló " + id + ": " + String(e.message).split("\n")[0]);
    return { rel: [], audio: [] };
  }
}

function depurar(lista, excluirId, tope) {
  const vistos = new Set([excluirId]);
  const nombres = new Set();
  const salida = [];
  for (const v of lista) {
    if (!v.id || vistos.has(v.id)) continue;
    if (v.segundos && (v.segundos < DURACION_MIN_SEG || v.segundos > DURACION_MAX_SEG)) continue;
    const nombre = normalizar(v.titulo);
    if (nombre && nombres.has(nombre)) continue;
    vistos.add(v.id);
    if (nombre) nombres.add(nombre);
    salida.push(v);
    if (salida.length >= tope) break;
  }
  return salida;
}

async function armarMix(consulta) {
  const busqueda = (await buscarVideosYoutube(consulta, 14))
    .map((v) => ({ id: idDe(v.url), titulo: v.titulo, segundos: segundosDe(v.duracion), canal: v.canal }))
    .filter((v) => v.id);
  if (!busqueda.length) return null;

  const semilla = busqueda.find((v) => v.segundos >= DURACION_MIN_SEG && v.segundos <= DURACION_MAX_SEG) || busqueda[0];
  const raiz = await detalle(semilla.id, true);

  const cola = [semilla, ...depurar([...raiz.rel, ...busqueda], semilla.id, COLA_MAX - 1)];
  const dic = new Map();
  const guardar = (v) => { if (v.id && !dic.has(v.id)) dic.set(v.id, v); };
  cola.forEach(guardar);
  if (raiz.audio.length) semilla.a = raiz.audio;

  const rel = {};
  const propias = depurar(raiz.rel, semilla.id, RELACIONADAS_MAX);
  rel[semilla.id] = propias.map((v) => v.id);
  propias.forEach(guardar);

  const expandir = cola.filter((v) => v.id !== semilla.id).slice(0, EXPANDIR);
  const trabajos = expandir.map(async (v) => {
    const d = await detalle(v.id, true);
    const r = depurar(d.rel, v.id, RELACIONADAS_MAX);
    rel[v.id] = r.map((x) => x.id);
    r.forEach(guardar);
    if (d.audio.length) v.a = d.audio;
  });
  let temporizador;
  await Promise.race([
    Promise.allSettled(trabajos),
    new Promise((resolver) => { temporizador = setTimeout(resolver, TIEMPO_EXPANDIR_MS); })
  ]);
  clearTimeout(temporizador);

  // audio para el resto de la cola (las que no se expandieron)
  const pendientes = cola.slice(0, CON_AUDIO_COLA).filter((v) => !v.a || !v.a.length);
  const extra = pendientes.map(async (v) => {
    const d = await detalle(v.id, true);
    if (d.audio.length) v.a = d.audio;
  });
  let t2;
  await Promise.race([
    Promise.allSettled(extra),
    new Promise((resolver) => { t2 = setTimeout(resolver, TIEMPO_AUDIO_MS); })
  ]);
  clearTimeout(t2);

  // relacionadas sin audio: se les resuelve una sola pista
  const sinAudio = Object.values(rel).flat().slice(0, CON_AUDIO_REL * 2)
    .map((id) => dic.get(id)).filter((v) => v && (!v.a || !v.a.length));
  let t3;
  await Promise.race([
    Promise.allSettled(sinAudio.slice(0, CON_AUDIO_REL).map(async (v) => {
      const d = await detalle(v.id, true);
      if (d.audio.length) v.a = d.audio.slice(0, 1);
    })),
    new Promise((resolver) => { t3 = setTimeout(resolver, TIEMPO_AUDIO_MS); })
  ]);
  clearTimeout(t3);

  await Promise.all(
    cola.map(async (p) => {
      try {
        const buf = await conLimite(descargarBuffer(`https://i.ytimg.com/vi/${p.id}/mqdefault.jpg`), 6000);
        p.img = `data:image/jpeg;base64,${buf.toString("base64")}`;
      } catch {
        p.img = "";
      }
    })
  );

  const usados = new Set(cola.map((v) => v.id));
  for (const id of Object.keys(rel)) rel[id].forEach((x) => usados.add(x));
  const pool = {};
  for (const id of usados) {
    const v = dic.get(id);
    if (v) pool[id] = { t: v.titulo, c: v.canal, s: v.segundos || 0, i: v.img || "", a: v.a || [] };
  }
  const relLimpio = {};
  for (const id of Object.keys(rel)) relLimpio[id] = rel[id].filter((x) => pool[x]);

  return { inicio: semilla.id, cola: cola.map((v) => v.id), pool, rel: relLimpio };
}

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html{background:#0f0f0f;overflow-x:hidden}
body{background:#0f0f0f;color:#f1f1f1;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:13px;overflow-x:hidden;overscroll-behavior:none;min-height:100vh;padding-bottom:18px}
button{font:inherit;cursor:pointer;border:0;color:inherit;background:none}
img{display:block}
a{color:inherit;text-decoration:none}
.cab{position:sticky;top:0;z-index:9;display:flex;align-items:center;gap:9px;padding:9px 12px;background:#0f0f0f;border-bottom:1px solid #272727}
.pico{width:27px;height:19px;border-radius:6px;background:#ff0033;display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:900}
.marca{font-weight:900;font-size:16px;letter-spacing:-.6px}
.sp{flex:1}
.ic{width:31px;height:31px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;background:#212121}
.vd{position:relative;width:100%;aspect-ratio:16/9;background:#000;overflow:hidden}
.vd .fondo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.vd .velo{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.72))}
.grande{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:62px;height:62px;border-radius:50%;background:rgba(255,0,51,.94);color:#fff;font-size:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 22px rgba(0,0,0,.6);z-index:3}
.linea{position:absolute;left:0;right:0;bottom:44px;padding:0 12px;z-index:2}
input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:16px;background:transparent}
input[type=range]::-webkit-slider-runnable-track{height:4px;border-radius:4px;background:rgba(255,255,255,.32)}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#ff0033;margin-top:-4px;box-shadow:0 0 0 2px rgba(0,0,0,.4)}
#prog::-webkit-slider-runnable-track{background:linear-gradient(90deg,#ff0033 var(--p,0%),rgba(255,255,255,.32) var(--p,0%))}
.ctrl{position:absolute;left:0;right:0;bottom:0;z-index:2;display:flex;align-items:center;gap:10px;padding:6px 12px 8px;font-size:16px}
.ctrl button{width:30px;height:30px;display:flex;align-items:center;justify-content:center;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.7)}
.ctrl button.p{width:38px;height:38px;font-size:19px}
.tm{font-size:11px;font-variant-numeric:tabular-nums;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.8)}
.meta{padding:11px 12px 6px}
.nt{font-size:15px;font-weight:800;line-height:1.28;overflow-wrap:anywhere}
.sub{margin-top:3px;font-size:12px;color:#aaa}
.pt{margin:0 5px;opacity:.6}
.acc{display:flex;align-items:center;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:2px}
.chip{flex:none;display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:18px;background:#272727;font-size:12px;font-weight:700;white-space:nowrap}
.chip:active{background:#3a3a3a}
.vol{width:74px;flex:none;height:14px}
.vol::-webkit-slider-runnable-track{background:#4a4a4a}
.vol::-webkit-slider-thumb{background:#fff;width:10px;height:10px;margin-top:-3px}
.av{max-height:0;overflow:hidden;margin:0 12px;font-size:12px;color:#ffd6e0;transition:max-height .2s}
.av.on{max-height:60px;margin:8px 12px}
.sh{display:flex;align-items:center;justify-content:space-between;padding:12px 12px 8px;border-top:1px solid #272727;margin-top:10px;font-weight:800;font-size:14px}
.auto{font-size:11px;font-weight:700;color:#aaa;display:flex;align-items:center;gap:6px}
.auto b{color:#fff;background:#ff0033;padding:2px 7px;border-radius:9px;font-size:10px}
.auto b.off{background:#3a3a3a;color:#bbb}
.ls{display:flex;flex-direction:column;gap:8px;padding:0 12px}
.t{display:flex;gap:9px;align-items:flex-start;cursor:pointer}
.t:active{opacity:.75}
.th{position:relative;flex:none;width:96px;aspect-ratio:16/9;border-radius:8px;overflow:hidden;background:#212121;display:flex;align-items:center;justify-content:center;font-size:20px}
.th img{width:100%;height:100%;object-fit:cover}
.th em{position:absolute;right:2px;bottom:2px;background:rgba(0,0,0,.82);color:#fff;font-style:normal;font-size:10px;font-weight:800;padding:1px 4px;border-radius:4px}
.ti{min-width:0;flex:1;padding-top:1px}
.ti b{display:block;font-size:12.5px;font-weight:700;line-height:1.24;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ti small{display:block;margin-top:3px;color:#aaa;font-size:11px}
.pie{padding:18px 12px 4px;text-align:center;color:#8a8a8a;font-size:11px;line-height:1.6}
.pie b{color:#bbb;font-weight:800}
body.mini .fondo,body.mini .velo,body.mini .grande{display:none}
body.mini .vd{aspect-ratio:auto;height:auto;padding:10px 0 4px;background:#181818;border-bottom:1px solid #272727}
body.mini .linea{bottom:42px}
`;

const JS = `var P=__P__,R=__R__,Q=__Q__,S="__S__",F="__F__";
var cur="",hist=[],played={},nx=[],idx=0,auto=true,mini=false;
var au=new Audio();au.preload="auto";au.setAttribute("playsinline","");
function $(i){return document.getElementById(i)}
function th(id){var p=P[id];return (p&&p.i)||("https://i.ytimg.com/vi/"+id+"/mqdefault.jpg")}
function fmt(s){s=Math.max(0,Math.floor(s||0));var h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+":":"")+m+":"+("0"+x).slice(-2)}
function aviso(t){var a=$("av");a.textContent=t;a.classList.add("on");clearTimeout(aviso.t);aviso.t=setTimeout(function(){a.classList.remove("on")},2800)}
function sesion(){
if(!("mediaSession" in navigator))return;
try{navigator.mediaSession.metadata=new MediaMetadata({title:P[cur].t||"",artist:P[cur].c||"",album:"Mi reproductor",artwork:[{src:th(cur),sizes:"320x180",type:"image/jpeg"}]})}catch(e){}
function act(n,f){try{navigator.mediaSession.setActionHandler(n,f)}catch(e){}}
act("play",reproducir);act("pause",function(){au.pause()});act("previoustrack",atras);act("nexttrack",adelante);
act("seekbackward",function(){au.currentTime=Math.max(0,au.currentTime-10)});
act("seekforward",function(){au.currentTime=Math.min(au.duration||0,au.currentTime+10)});
}
function estado(){var on=!au.paused&&!au.ended;var g=$("grande");g.style.display=(on||mini)?"none":"flex";g.textContent=on?"⏸":"▶";$("play").textContent=on?"⏸":"▶";try{if("mediaSession" in navigator)navigator.mediaSession.playbackState=on?"playing":"paused"}catch(e){}}
function sig(id,r){var a=[],seen={},l=(R[id]||[]).concat(Q);
for(var k=0;k<l.length&&a.length<12;k++){var x=l[k];if(x!==id&&P[x]&&P[x].a&&P[x].a.length&&!played[x]&&!seen[x]){seen[x]=1;a.push(x)}}
if(!a.length&&!r){played={};played[id]=1;return sig(id,1)}return a}
function fila(id){
var d=document.createElement("div");d.className="t";
var h=document.createElement("div");h.className="th";
var im=document.createElement("img");im.alt="";im.onerror=function(){if(im.parentNode)h.removeChild(im);h.insertBefore(document.createTextNode("🎵"),h.firstChild)};im.src=th(id);h.appendChild(im);
if(P[id].s){var e=document.createElement("em");e.textContent=fmt(P[id].s);h.appendChild(e)}
var t=document.createElement("div");t.className="ti";
var b=document.createElement("b");b.textContent=P[id].t;
var s=document.createElement("small");s.textContent=P[id].c;
t.appendChild(b);t.appendChild(s);d.appendChild(h);d.appendChild(t);
d.addEventListener("click",function(){ir(id,true)});return d}
function pintar(){var ls=$("ls");ls.innerHTML="";for(var k=0;k<nx.length;k++)ls.appendChild(fila(nx[k]));$("nn").textContent=nx.length+" canciones"}
function poner(id,push){
if(cur&&push&&cur!==id)hist.push(cur);
cur=id;played[id]=1;idx=0;
$("nt").textContent=P[id].t;$("nc").textContent=P[id].c;$("np").textContent=hist.length+1;
$("fondo").src=th(id);$("yt").href="https://www.youtube.com/watch?v="+id;
nx=sig(id,0);pintar();sesion();
var p=P[id];$("t1").textContent="0:00";$("t2").textContent=fmt(p.s);$("prog").value="0";
if(!p.a||!p.a.length){aviso("Sin audio disponible, pasando...");return setTimeout(adelante,900)}
au.src=p.a[idx];reproducir();
}
function reproducir(){var pr=au.play();if(pr&&pr.catch)pr.catch(function(){estado()})}
function ir(id,go){poner(id,true)}
function adelante(){if(!nx.length){aviso("Se acabó la lista, toca 🔀 para seguir");return}ir(nx[0],true)}
function atras(){if(!hist.length)return;var id=hist.pop();poner(id,false);$("np").textContent=hist.length+1}
function azar(){if(!nx.length)return;ir(nx[Math.floor(Math.random()*nx.length)],true)}
$("grande").addEventListener("click",reproducir);
$("play").addEventListener("click",function(){au.paused?reproducir():au.pause()});
$("adelante").addEventListener("click",adelante);
$("atras").addEventListener("click",atras);
$("azar").addEventListener("click",azar);
$("mini").addEventListener("click",function(){mini=!mini;document.body.classList.toggle("mini",mini);estado()});
$("auto").addEventListener("click",function(){auto=!auto;this.textContent=auto?"ON":"OFF";this.classList.toggle("off",!auto)});
$("mudo").addEventListener("click",function(){au.muted=!au.muted;this.textContent=au.muted?"🔇":"🔊"});
$("vol").addEventListener("input",function(){au.volume=Number(this.value)/100;au.muted=this.value==="0";$("mudo").textContent=au.muted?"🔇":"🔊"});
$("prog").addEventListener("input",function(){var v=Number(this.value);this.style.setProperty("--p",(v/10)+"%");if(au.duration)au.currentTime=au.duration*v/1000});
au.addEventListener("play",estado);au.addEventListener("pause",estado);au.addEventListener("ended",function(){estado();if(auto)adelante()});
au.addEventListener("loadedmetadata",function(){$("t2").textContent=fmt(au.duration)});
au.addEventListener("timeupdate",function(){
if(au.duration&&isFinite(au.duration)){
var pc=au.currentTime/au.duration*100;
$("prog").value=String(Math.round(pc*10));$("prog").style.setProperty("--p",pc+"%");
$("t1").textContent=fmt(au.currentTime);$("t2").textContent=fmt(au.duration)} });
au.addEventListener("error",function(){
var p=P[cur];if(!p)return;
if(p.a&&idx<p.a.length-1){idx++;au.src=p.a[idx];reproducir();aviso("Servidor saturado, reintentando...");return}
aviso("Esa no se pudo reproducir, pasando a la siguiente...");setTimeout(adelante,1100)});
au.addEventListener("waiting",function(){if(au.currentTime>0)aviso("Cargando audio...")});
$("mix").textContent="__C__";$("firma").textContent=F;
poner(S,false);`;

function htmlMusica({ consulta, firma, mix }) {
  const json = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
  const js = JS
    .replace("__P__", () => json(mix.pool))
    .replace("__R__", () => json(mix.rel))
    .replace("__Q__", () => json(mix.cola))
    .replace("__S__", () => mix.inicio)
    .replace("__F__", () => JSON.stringify(firma))
    .replace("__C__", () => JSON.stringify(consulta));

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0f0f0f">
<style>${CSS}</style></head><body>
<div class="cab"><span class="pico">▶</span><span class="marca">YouTube</span><span class="sp"></span><span class="ic">🔔</span><span class="ic">🔍</span></div>
<div class="vd" id="vd">
<img class="fondo" id="fondo" alt=""><div class="velo"></div>
<button class="grande" id="grande">▶</button>
<div class="linea"><input type="range" id="prog" min="0" max="1000" value="0"></div>
<div class="ctrl">
<span class="tm" id="t1">0:00</span>
<button id="atras">⏮</button><button class="p" id="play">▶</button><button id="adelante">⏭</button>
<span class="tm" id="t2">0:00</span><span class="sp"></span>
<button id="azar">🔀</button><button id="mini">🎧</button>
</div></div>
<div class="meta">
<div class="nt" id="nt"></div>
<div class="sub"><span id="nc"></span><span class="pt">·</span><span id="np">1</span><span class="pt">en la cola</span></div>
<div class="acc">
<button class="chip" id="mudo">🔊</button>
<input type="range" class="vol" id="vol" min="0" max="100" value="100">
<a class="chip" id="yt" href="#" target="_blank">▶ Ver en YouTube</a>
</div></div>
<div class="av" id="av"></div>
<div class="sh"><span>A continuación</span><span class="auto">Autoplay <b id="auto">ON</b></span></div>
<div class="ls" id="ls"></div>
<div class="pie">Mix de <b id="mix"></b> · Powered by <b id="firma"></b></div>
<script>${js}</script>
</body></html>`;
}

function textoRespaldo(consulta, mix) {
  const partes = ["🎧 *MI REPRODUCTOR*", `> ${consulta}`, ""];
  mix.cola.slice(0, 6).forEach((id) => partes.push(`✿ *${mix.pool[id]?.t || id}*\n> https://www.youtube.com/watch?v=${id}`));
  return partes.join("\n");
}

export default {
  names: [".musica", ".reproductor", ".mix"],
  desc: "Reproductor tipo YouTube con audio real: busca una canción, arma una lista de similares y sigue sonando en segundo plano",
  category: "Tools",
  usage: ".musica <canción o artista>",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const consulta = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!consulta) {
      return reply({
        text: tarjetaUso({
          comando: ".musica <canción o artista>",
          ejemplo: ".musica PesoPluma   |   .musica rock en español   |   .mix lofi para estudiar",
          nota: "Te mando un botón que abre el reproductor, con audio real, lista de canciones parecidas y controles en la barra de notificaciones."
        })
      });
    }

    const ahora = Date.now();
    const ultima = esperas.get(sender) || 0;
    if (ahora - ultima < ESPERA_MS) {
      const falta = Math.ceil((ESPERA_MS - (ahora - ultima)) / 1000);
      return reply({ text: tarjetaAviso("REPRODUCTOR", `Espera ${falta}s antes de pedir otro mix.`) });
    }
    esperas.set(sender, ahora);
    if (esperas.size > 500) esperas.delete(esperas.keys().next().value);

    const firma = config.botNameShort || "MaxiProyec";
    try {
      await sock.sendMessage(from, { react: { text: "🎧", key: msg.key } });
    } catch {}

    let mix = null;
    try {
      mix = await armarMix(consulta);
    } catch (e) {
      console.log("[MUSICA] mix falló: " + String(e.message).split("\n")[0]);
    }
    if (!mix) {
      return reply({ text: tarjetaAviso("REPRODUCTOR", "No encontré canciones con esa búsqueda. Prueba con otro nombre.") });
    }

    const html = htmlMusica({ consulta, firma, mix });
    let enviadoHtml = false;
    try {
      enviadoHtml = await enviarHtmlEmbebido({ sock, from, msg, titulo: "▶ YouTube", html, pestana: "REPRODUCTOR", fuentes: FUENTES });
      if (!enviadoHtml && typeof sock.sendHtml === "function") {
        await sock.sendHtml(from, html, [], msg, {});
        enviadoHtml = true;
      }
    } catch (e) {
      console.log("[MUSICA] HTML falló: " + e.message);
    }
    if (!enviadoHtml) {
      await sock.sendMessage(from, { text: textoRespaldo(consulta, mix) }, { quoted: msg });
    }

    const lista = [
      { texto: "▶ Abrir mix en YouTube", url: `https://www.youtube.com/watch_videos?video_ids=${mix.cola.join(",")}` },
      ...mix.cola.slice(0, 3).map((id, i) => ({ texto: `${i + 1}. ${recortar(mix.pool[id]?.t || id, 24)}`, url: `https://www.youtube.com/watch?v=${id}` }))
    ];
    const enviado = await enviarConBoton({
      sock,
      from,
      msg,
      texto: `> 🎧 Mix de *${recortar(consulta, 40)}* · ${mix.cola.length} canciones`,
      footer: "Powered by " + firma,
      lista
    });
    if (!enviado && enviadoHtml) {
      await sock.sendMessage(from, { text: lista.map((b) => `${b.texto}\n> ${b.url}`).join("\n\n") }, { quoted: msg });
    }
  }
};
