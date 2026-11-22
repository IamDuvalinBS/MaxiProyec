import { config } from "../../../motores/db.js";
import { tarjetaUso, tarjetaAviso } from "../../descargas/tarjetas.js";
import { obtenerCliente, buscarVideosYoutube } from "../../descargas/youtube-engine.js";
import { descargarBuffer } from "../../descargas/core.js";
import { enviarConBoton } from "../../../motores/botones.js";
import { enviarHtmlEmbebido } from "../../../motores/botones-nativos.js";

const ESPERA_MS = 8000;
const COLA_MAX = 14;
const EXPANDIR = 7;
const RELACIONADAS_MAX = 14;
const TIEMPO_EXPANDIR_MS = 4500;
const DURACION_MIN_SEG = 60;
const DURACION_MAX_SEG = 600;
const FUENTES = [
  "astabot.hidenplay.net",
  "unpkg.com",
  "cdn.jsdelivr",
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

async function relacionadas(id) {
  try {
    const yt = await obtenerCliente();
    const info = await conLimite(yt.getInfo(id), 7000);
    const feed = Array.isArray(info.watch_next_feed) ? info.watch_next_feed : [];
    return feed
      .map((it) => ({
        id: it.id || it.content_id || it.video_id || "",
        titulo: textoDe(it.title) || textoDe(it.metadata?.title),
        segundos: segundosDe(it.duration?.seconds ?? it.duration?.text ?? it.duration),
        canal: it.author?.name || "YouTube"
      }))
      .filter((v) => /^[a-zA-Z0-9_-]{11}$/.test(v.id) && v.titulo);
  } catch (e) {
    console.log("[MUSICA] relacionadas falló: " + String(e.message).split("\n")[0]);
    return [];
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
  const parecidas = await relacionadas(semilla.id);

  const cola = [semilla, ...depurar([...parecidas, ...busqueda], semilla.id, COLA_MAX - 1)];
  const dic = new Map();
  const guardar = (v) => { if (v.id && !dic.has(v.id)) dic.set(v.id, v); };
  cola.forEach(guardar);

  const rel = {};
  const propias = depurar(parecidas, semilla.id, RELACIONADAS_MAX);
  rel[semilla.id] = propias.map((v) => v.id);
  propias.forEach(guardar);

  const expandir = cola.filter((v) => v.id !== semilla.id).slice(0, EXPANDIR);
  const trabajos = expandir.map(async (v) => {
    const r = depurar(await relacionadas(v.id), v.id, RELACIONADAS_MAX);
    rel[v.id] = r.map((x) => x.id);
    r.forEach(guardar);
  });
  let temporizador;
  await Promise.race([
    Promise.allSettled(trabajos),
    new Promise((resolver) => { temporizador = setTimeout(resolver, TIEMPO_EXPANDIR_MS); })
  ]);
  clearTimeout(temporizador);

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
    if (v) pool[id] = { t: v.titulo, c: v.canal, s: v.segundos || 0, i: v.img || "" };
  }
  const relLimpio = {};
  for (const id of Object.keys(rel)) relLimpio[id] = rel[id].filter((x) => pool[x]);

  return { inicio: semilla.id, cola: cola.map((v) => v.id), pool, rel: relLimpio };
}

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{--bg1:#ff7eb6;--bg2:#a8227a;--card:#fff;--ink:#0d1330;--mut:#5c6896;--bd:#0d1330;--acc:#ffd0e6;--acc2:#ff5aa5;--soft:#ffe9f3;--glow:rgba(13,19,48,.28);--hdr:#fff;
background:linear-gradient(170deg,var(--bg1),var(--bg2));color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:13px;padding:12px;overflow-x:hidden;overscroll-behavior:none;min-height:100vh}
html{background:#a8227a;overflow-x:hidden}
button{font:inherit;cursor:pointer;border:0;color:inherit}
small{color:var(--mut);font-size:11px}
.cab{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:8px 10px;background:var(--card);border:3px solid var(--bd);border-radius:18px;box-shadow:0 4px 0 var(--bd),0 0 18px var(--glow)}
.logo{width:42px;height:42px;flex:none;border-radius:12px;border:3px solid var(--bd);background:var(--acc);display:flex;align-items:center;justify-content:center;font-size:22px;transform:rotate(-6deg)}
.tit{flex:1;min-width:0}
.tit b{display:block;font-size:18px;line-height:1.1;font-weight:900;overflow-wrap:anywhere}
.res{display:flex;justify-content:space-between;align-items:flex-end;gap:8px;margin-bottom:6px;color:var(--hdr)}
.res small{color:var(--hdr);opacity:.85}
.res b{display:block;font-size:15px;font-weight:900}
.res .d{text-align:right}
.rar{display:flex;flex-wrap:wrap;gap:5px;margin:10px 0 12px}
.rc{font-size:11px;font-weight:900;padding:3px 9px;border-radius:20px;color:#fff;background:var(--c);border:2px solid var(--bd);text-shadow:0 1px 2px rgba(0,0,0,.5)}
.det{background:var(--card);border:3px solid var(--bd);border-radius:20px;overflow:hidden;box-shadow:0 5px 0 var(--bd),0 0 22px var(--glow);margin-bottom:14px}
.vd{position:relative;width:100%;aspect-ratio:16/9;background:#000;border-bottom:3px solid var(--bd)}
.vd iframe,.vd #pl{position:absolute;inset:0;width:100%;height:100%;border:0}
.cu{padding:12px 14px 14px}
.nt{font-size:15px;font-weight:900;line-height:1.25;overflow-wrap:anywhere}
.nc{font-size:12px;color:var(--mut);margin-top:2px}
.fb{display:flex;justify-content:center;gap:12px;margin:12px 0 6px}
.fb button{width:48px;height:48px;border-radius:50%;background:var(--card);border:3px solid var(--bd);font-size:21px;box-shadow:0 3px 0 var(--bd)}
.fb button.g{background:var(--acc2);width:54px;height:54px;color:#fff}
.fb button:active{transform:translateY(2px);box-shadow:0 1px 0 var(--bd)}
.av{margin-top:6px;padding:8px 10px;border-radius:12px;background:var(--soft);font-size:11.5px;line-height:1.5;color:var(--mut);border:2px dashed var(--bd);text-align:center}
.sh{color:var(--hdr);font-weight:900;font-size:14px;margin:0 2px 8px;display:flex;justify-content:space-between;align-items:center}
.sh small{color:var(--hdr);opacity:.85}
.ls{display:flex;flex-direction:column;gap:9px}
.t{display:flex;align-items:center;gap:10px;min-width:0;background:var(--card);border:3px solid var(--bd);border-radius:16px;padding:6px;border-bottom:7px solid var(--acc2);box-shadow:0 3px 0 var(--bd);cursor:pointer}
.t:active{transform:translateY(2px)}
.th{position:relative;flex:none;width:98px;aspect-ratio:16/9;border-radius:10px;border:2px solid var(--bd);overflow:hidden;background:var(--acc);display:flex;align-items:center;justify-content:center;font-size:22px}
.th img{width:100%;height:100%;object-fit:cover}
.th em{position:absolute;right:3px;bottom:3px;background:rgba(0,0,0,.8);color:#fff;font-style:normal;font-size:10px;font-weight:900;padding:1px 5px;border-radius:5px}
.ti{min-width:0;flex:1}
.ti b{display:block;font-size:12.5px;font-weight:900;line-height:1.2;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ti small{display:block;margin-top:2px}
.pie{margin-top:14px;text-align:center;color:var(--hdr);font-size:11.5px;line-height:1.6}
.pie b{font-weight:900}
`;

const JS = `var P=__P__,R=__R__,Q=__Q__,S="__S__";
var yt=null,ok=false,cur="",hist=[],played={},nx=[],fallos=0;
function $(i){return document.getElementById(i)}
function th(id){var p=P[id];return p&&p.i?p.i:"https://i.ytimg.com/vi/"+id+"/mqdefault.jpg"}
function fmt(s){s=Math.floor(s||0);return Math.floor(s/60)+":"+("0"+(s%60)).slice(-2)}
function sig(id,r){var a=[],seen={},l=(R[id]||[]).concat(Q);for(var k=0;k<l.length&&a.length<10;k++){var x=l[k];if(x!==id&&P[x]&&!played[x]&&!seen[x]){seen[x]=1;a.push(x)}}if(!a.length&&!r){played={};played[id]=1;return sig(id,1)}return a}
function fila(id){var d=document.createElement("div");d.className="t";var h=document.createElement("div");h.className="th";var im=document.createElement("img");im.alt="";im.onerror=function(){if(im.parentNode)h.removeChild(im);h.insertBefore(document.createTextNode("🎵"),h.firstChild)};im.src=th(id);h.appendChild(im);if(P[id].s){var e=document.createElement("em");e.textContent=fmt(P[id].s);h.appendChild(e)}var t=document.createElement("div");t.className="ti";var b=document.createElement("b");b.textContent=P[id].t;var s=document.createElement("small");s.textContent=P[id].c;t.appendChild(b);t.appendChild(s);d.appendChild(h);d.appendChild(t);d.addEventListener("click",function(){ir(id,true)});return d}
function pintar(){var ls=$("ls");ls.innerHTML="";for(var k=0;k<nx.length;k++)ls.appendChild(fila(nx[k]));$("nn").textContent=nx.length+" canciones"}
function poner(id,push){if(cur&&push&&cur!==id)hist.push(cur);cur=id;played[id]=1;$("nt").textContent=P[id].t;$("nc").textContent=P[id].c;nx=sig(id,0);pintar();$("np").textContent=hist.length+1}
function ir(id,go){poner(id,true);if(ok&&yt){try{if(go)yt.loadVideoById(id);else yt.cueVideoById(id)}catch(x){}}}
function adelante(){if(nx.length)ir(nx[0],true)}
function atras(){if(hist.length){var id=hist.pop();poner(id,false);if(ok){try{yt.loadVideoById(id)}catch(x){}}}}
function azar(){if(nx.length)ir(nx[Math.floor(Math.random()*nx.length)],true)}
function caer(){if(ok)return;$("av").textContent="WhatsApp no deja cargar YouTube en esta página. Usa el botón Abrir mix en YouTube que te mandé en el chat."}
function cambio(e){
if(e.data===1){fallos=0;$("av").textContent=""}
if(e.data===0){adelante();return}
if(e.data===1||e.data===3){try{var v=yt.getVideoData();if(v&&v.video_id&&v.video_id!==cur&&P[v.video_id])poner(v.video_id,true)}catch(x){}}
}
window.onYouTubeIframeAPIReady=function(){
try{yt=new YT.Player("pl",{width:"100%",height:"100%",videoId:S,playerVars:{playsinline:1,rel:0,modestbranding:1},events:{
onReady:function(){ok=true;$("av").textContent=""},
onStateChange:cambio,
onError:function(){fallos++;if(fallos>=3){$("av").textContent="YouTube no deja reproducir aquí. Usa el botón Abrir mix en YouTube del chat.";return}$("av").textContent="Esa canción no se pudo reproducir, pasando a la siguiente...";setTimeout(adelante,1200)}}})}catch(x){caer()}};
$("pv").addEventListener("click",atras);
$("nx").addEventListener("click",adelante);
$("sh").addEventListener("click",azar);
var sc=document.createElement("script");sc.src="https://www.youtube.com/iframe_api";sc.onerror=caer;document.head.appendChild(sc);
setTimeout(caer,7000);
poner(S,false);`;

function htmlMusica({ consulta, firma, mix }) {
  const json = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
  const js = JS
    .replace("__P__", () => json(mix.pool))
    .replace("__R__", () => json(mix.rel))
    .replace("__Q__", () => json(mix.cola))
    .replace("__S__", () => mix.inicio);
  const portada = mix.pool[mix.inicio]?.i ? `<img src="${mix.pool[mix.inicio].i}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` : "";

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${CSS}</style></head><body>
<div class="cab"><div class="logo">🎧</div><div class="tit"><b>Mi reproductor</b><small>Mix de ${esc(consulta)}</small></div></div>
<div class="res"><div><small>Lista que se actualiza</small><b id="nn"></b></div><div class="d"><small>Escuchadas</small><b id="np">1</b></div></div>
<div class="rar"><span class="rc" style="--c:#ff0033">▶ YouTube</span><span class="rc" style="--c:#a855f7">🔀 Mix</span><span class="rc" style="--c:#10b981">♾ Autoplay</span></div>
<div class="det"><div class="vd">${portada}<div id="pl"></div></div>
<div class="cu"><div class="nt" id="nt"></div><div class="nc" id="nc"></div>
<div class="fb"><button id="sh">🔀</button><button id="pv">⏮</button><button class="g" id="nx">⏭</button></div>
<div class="av" id="av">Conectando con YouTube...</div></div></div>
<div class="sh"><span>A continuación</span><small id="nn2">cambia con cada canción</small></div>
<div class="ls" id="ls"></div>
<div class="pie">ⓘ Powered by <b>${esc(firma)}</b></div>
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
  desc: "Reproductor tipo YouTube: busca una canción y arma una lista de canciones similares que se actualiza con cada tema",
  category: "Tools",
  usage: ".musica <canción o artista>",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const consulta = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!consulta) {
      return reply({
        text: tarjetaUso({
          comando: ".musica <canción o artista>",
          ejemplo: ".musica PesoPluma   |   .musica rock en español   |   .mix lofi para estudiar",
          nota: "Te mando un botón que abre el reproductor, con lista de canciones parecidas que cambia con cada tema."
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
      enviadoHtml = await enviarHtmlEmbebido({ sock, from, msg, titulo: "🎧 Mi reproductor", html, pestana: "REPRODUCTOR", fuentes: FUENTES });
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
