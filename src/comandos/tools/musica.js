import { config } from "../../../motores/db.js";
import { tarjetaUso, tarjetaAviso } from "../../descargas/tarjetas.js";
import { obtenerCliente, buscarVideosYoutube } from "../../descargas/youtube-engine.js";
import { descargarBuffer } from "../../descargas/core.js";
import { enviarConBoton } from "../../../motores/botones.js";

const ESPERA_MS = 8000;
const PISTAS = 8;
const DURACION_MIN_SEG = 60;
const DURACION_MAX_SEG = 600;

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

function textoDuracion(seg) {
  return seg ? `${Math.floor(seg / 60)}:${String(Math.round(seg % 60)).padStart(2, "0")}` : "";
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

async function armarLista(consulta) {
  const busqueda = (await buscarVideosYoutube(consulta, 14))
    .map((v) => ({ id: idDe(v.url), titulo: v.titulo, segundos: segundosDe(v.duracion), canal: v.canal }))
    .filter((v) => v.id);
  if (!busqueda.length) return [];

  const semilla = busqueda.find((v) => v.segundos >= DURACION_MIN_SEG && v.segundos <= DURACION_MAX_SEG) || busqueda[0];
  const parecidas = await relacionadas(semilla.id);

  const vistos = new Set();
  const nombres = new Set();
  const lista = [];
  const agregar = (v, estricto) => {
    if (!v.id || vistos.has(v.id)) return;
    if (estricto && v.segundos && (v.segundos < DURACION_MIN_SEG || v.segundos > DURACION_MAX_SEG)) return;
    const nombre = normalizar(v.titulo);
    if (nombre && nombres.has(nombre)) return;
    vistos.add(v.id);
    if (nombre) nombres.add(nombre);
    lista.push(v);
  };

  agregar(semilla, false);
  parecidas.forEach((v) => agregar(v, true));
  busqueda.forEach((v) => agregar(v, true));
  if (lista.length < PISTAS) busqueda.forEach((v) => agregar(v, false));
  return lista.slice(0, PISTAS);
}

async function conMiniaturas(pistas) {
  await Promise.all(
    pistas.map(async (p) => {
      try {
        const buf = await conLimite(descargarBuffer(`https://i.ytimg.com/vi/${p.id}/mqdefault.jpg`), 6000);
        p.img = `data:image/jpeg;base64,${buf.toString("base64")}`;
      } catch {
        p.img = "";
      }
    })
  );
  return pistas;
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
.vd iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.cu{padding:12px 14px 14px}
.nt{font-size:15px;font-weight:900;line-height:1.25;overflow-wrap:anywhere}
.nc{font-size:12px;color:var(--mut);margin-top:2px}
.cmd{margin-top:10px;padding:9px 11px;border-radius:12px;background:var(--soft);font-size:11.5px;line-height:1.55;color:var(--mut);border:2px dashed var(--bd)}
.cmd b{color:var(--ink)}
.sh{color:var(--hdr);font-weight:900;font-size:14px;margin:0 2px 8px;display:flex;justify-content:space-between;align-items:center}
.sh small{color:var(--hdr);opacity:.85}
.ls{display:flex;flex-direction:column;gap:9px}
.t{display:flex;align-items:center;gap:10px;min-width:0;background:var(--card);border:3px solid var(--bd);border-radius:16px;padding:6px;border-bottom:7px solid var(--acc2);box-shadow:0 3px 0 var(--bd);cursor:pointer}
.t.on{outline:3px solid var(--acc);outline-offset:1px;background:var(--soft)}
.t:active{transform:translateY(2px)}
.th{position:relative;flex:none;width:98px;aspect-ratio:16/9;border-radius:10px;border:2px solid var(--bd);overflow:hidden;background:var(--acc);display:flex;align-items:center;justify-content:center;font-size:22px}
.th img{width:100%;height:100%;object-fit:cover}
.th em{position:absolute;right:3px;bottom:3px;background:rgba(0,0,0,.8);color:#fff;font-style:normal;font-size:10px;font-weight:900;padding:1px 5px;border-radius:5px}
.ti{min-width:0;flex:1}
.ti b{display:block;font-size:12.5px;font-weight:900;line-height:1.2;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ti small{display:block;margin-top:2px}
.eq{flex:none;width:20px;height:18px;display:none;align-items:flex-end;gap:2px;margin-right:4px}
.t.on .eq{display:flex}
.eq i{flex:1;background:var(--acc2);border:1.5px solid var(--bd);border-radius:2px;height:100%;transform-origin:bottom;animation:eq .8s ease-in-out infinite}
.eq i:nth-child(2){animation-delay:.2s}.eq i:nth-child(3){animation-delay:.4s}
@keyframes eq{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
.pie{margin-top:14px;text-align:center;color:var(--hdr);font-size:11.5px;line-height:1.6}
.pie b{font-weight:900}
`;

const JS = `var I=__I__;
function u(i,a){var r=[];for(var k=1;k<I.length;k++)r.push(I[(i+k)%I.length]);return "https://www.youtube-nocookie.com/embed/"+I[i]+"?playsinline=1&rel=0&playlist="+r.join(",")+(a?"&autoplay=1":"")}
var fr=document.getElementById("fr"),rs=document.querySelectorAll(".t"),nt=document.getElementById("nt"),nc=document.getElementById("nc"),n=document.getElementById("n");
function ir(i,a){fr.src=u(i,a);for(var k=0;k<rs.length;k++)rs[k].classList.toggle("on",k===i);nt.textContent=rs[i].getAttribute("data-t");nc.textContent=rs[i].getAttribute("data-c");n.textContent=(i+1)+" / "+I.length}
for(var k=0;k<rs.length;k++){(function(i){rs[i].addEventListener("click",function(){ir(i,true)})})(k)}
ir(0,false);`;

function htmlMusica({ consulta, firma, pistas }) {
  const filas = pistas.map((p, i) => {
    const miniatura = p.img ? `<img src="${p.img}" alt="">` : "🎵";
    const dur = p.segundos ? `<em>${esc(textoDuracion(p.segundos))}</em>` : "";
    return `<div class="t" data-i="${i}" data-t="${esc(p.titulo)}" data-c="${esc(p.canal)}"><div class="th">${miniatura}${dur}</div><div class="ti"><b>${esc(p.titulo)}</b><small>${esc(p.canal)}</small></div><div class="eq"><i></i><i></i><i></i></div></div>`;
  }).join("");
  const js = JS.replace("__I__", () => JSON.stringify(pistas.map((p) => p.id)));

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${CSS}</style></head><body>
<div class="cab"><div class="logo">🎧</div><div class="tit"><b>Mi reproductor</b><small>Mix de ${esc(consulta)}</small></div></div>
<div class="res"><div><small>Canciones similares</small><b>${pistas.length} temas</b></div><div class="d"><small>Reproduciendo</small><b id="n"></b></div></div>
<div class="rar"><span class="rc" style="--c:#ff0033">▶ YouTube</span><span class="rc" style="--c:#a855f7">🔀 Mix</span><span class="rc" style="--c:#10b981">♾ Autoplay</span></div>
<div class="det"><div class="vd"><iframe id="fr" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>
<div class="cu"><div class="nt" id="nt"></div><div class="nc" id="nc"></div>
<div class="cmd">Toca una canción de la lista para reproducirla. Sigue sola con las parecidas.<br>¿Pantalla negra? Usa el botón <b>Abrir mix en YouTube</b> de abajo.</div></div></div>
<div class="sh"><span>A continuación</span><small>${pistas.length} canciones</small></div>
<div class="ls">${filas}</div>
<div class="pie">ⓘ Powered by <b>${esc(firma)}</b></div>
<script>${js}</script>
</body></html>`;
}

function textoRespaldo(consulta, pistas) {
  const partes = ["🎧 *MI REPRODUCTOR*", `> ${consulta}`, ""];
  pistas.slice(0, 6).forEach((v) => partes.push(`✿ *${v.titulo}*\n> https://www.youtube.com/watch?v=${v.id}`));
  return partes.join("\n");
}

export default {
  names: [".musica", ".reproductor", ".mix"],
  desc: "Reproductor tipo YouTube: busca una canción y arma una lista de canciones similares que sigue sola",
  category: "Tools",
  usage: ".musica <canción o artista>",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const consulta = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!consulta) {
      return reply({
        text: tarjetaUso({
          comando: ".musica <canción o artista>",
          ejemplo: ".musica PesoPluma   |   .musica rock en español   |   .mix lofi para estudiar",
          nota: "Armo una lista de canciones parecidas con reproductor de YouTube y botón para abrir todo el mix en YouTube."
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

    let pistas = [];
    try {
      pistas = await armarLista(consulta);
    } catch (e) {
      console.log("[MUSICA] búsqueda falló: " + String(e.message).split("\n")[0]);
    }
    if (!pistas.length) {
      return reply({ text: tarjetaAviso("REPRODUCTOR", "No encontré canciones con esa búsqueda. Prueba con otro nombre.") });
    }

    await conMiniaturas(pistas);

    const lista = [
      { texto: "▶ Abrir mix en YouTube", url: `https://www.youtube.com/watch_videos?video_ids=${pistas.map((p) => p.id).join(",")}` },
      ...pistas.slice(0, 3).map((p, i) => ({ texto: `${i + 1}. ${recortar(p.titulo, 24)}`, url: `https://www.youtube.com/watch?v=${p.id}` }))
    ];

    let htmlEnviado = false;
    try {
      if (typeof sock.sendHtml !== "function") throw new Error("sin sendHtml");
      await sock.sendHtml(from, htmlMusica({ consulta, firma, pistas }), [], msg, {});
      htmlEnviado = true;
    } catch (e) {
      console.log("[MUSICA] HTML falló: " + e.message);
      await sock.sendMessage(from, { text: textoRespaldo(consulta, pistas) }, { quoted: msg });
    }

    const enviado = await enviarConBoton({
      sock,
      from,
      msg,
      texto: `> 🎧 Mix de *${recortar(consulta, 40)}* · ${pistas.length} canciones`,
      footer: "Powered by " + firma,
      lista
    });
    if (!enviado && htmlEnviado) {
      await sock.sendMessage(from, { text: lista.map((b) => `${b.texto}\n> ${b.url}`).join("\n\n") }, { quoted: msg });
    }
  }
};
