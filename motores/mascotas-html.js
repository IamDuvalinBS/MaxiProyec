import { ESPECIES, RAREZAS, HUEVOS, COMIDAS, CASAS, ACCESORIOS, ESPACIOS } from "./mascotas-datos.js";
import { svgEscena } from "./mascotas-arte.js";
import { etapaDe, progresoEtapa, estadoActual, felicidad, estadoIncubadora } from "./mascotas-logica.js";

const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function duracion(ms) {
  const m = Math.ceil(ms / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
}

const colorBarra = (v) => (v > 60 ? "#4cc46a" : v > 30 ? "#f3a53b" : "#e5534b");

function barra(icono, titulo, valor) {
  const v = Math.round(valor);
  return `<div class="nec"><span class="ni">${icono}</span><span class="nt">${titulo}</span><div class="bar"><i style="width:${v}%;background:${colorBarra(v)}"></i></div><b>${v}</b></div>`;
}

function animoDe(m, estado) {
  if (m.dormido) return "normal";
  if (["hambriento", "cansado", "aburrido", "mojado"].includes(estado.clave)) return "triste";
  return estado.clave === "feliz" ? "feliz" : "normal";
}

function tarjetaMascota(m, i, ctx) {
  const estado = estadoActual(m, ctx.llueve);
  const etapa = etapaDe(m.crec);
  const prog = progresoEtapa(m.crec);
  const esp = ESPECIES[m.especie];
  const rareza = RAREZAS[m.rareza] || RAREZAS.comun;
  const casa = m.casa ? CASAS.niveles[m.casa - 1] : null;
  const escena = svgEscena({
    especie: m.especie,
    etapa: etapa.id,
    dormido: m.dormido,
    animo: animoDe(m, estado),
    mojado: estado.clave === "mojado",
    equipo: m.equipo,
    casa: m.casa,
    llueve: ctx.llueve,
    noche: ctx.noche,
    uid: `p${m.id}`
  });
  const prendas = ESPACIOS.map((e) => ACCESORIOS[m.equipo[e]]).filter(Boolean)
    .map((a) => `<span class="chip">${a.emoji} ${esc(a.nombre)}</span>`).join("") || `<span class="chip vacio">Sin accesorios</span>`;
  const meta = prog.siguiente
    ? `Hacia ${esc(prog.siguiente.nombre)}: ${Math.round(prog.fraccion * 100)}%`
    : "Crecimiento completo";
  return `<section class="pet" data-estado="${estado.clave}" hidden>
<div class="escwrap">${escena}<div class="bub"></div></div>
<div class="fila"><div class="nom"><b>${esc(m.nombre)}</b><small>#${i + 1} · ${esp.emoji} ${esp.nombre}</small></div>
<div class="ins"><span class="pill e${etapa.id}">${etapa.nombre}</span><span class="pill cal r${m.rareza}">${rareza.emoji} ${rareza.nombre}</span></div></div>
<div class="rasgo">✨ ${esc(esp.rasgo)}</div>
<div class="est">${estado.emoji} ${estado.texto}<span>Ánimo ${felicidad(m)}%</span></div>
<div class="crec"><div class="ct"><span>🌱 Crecimiento</span><span>${meta}</span></div><div class="bar g"><i style="width:${Math.round(prog.fraccion * 100)}%"></i></div></div>
${barra("🍖", "Comida", m.hambre)}${barra(m.dormido ? "😴" : "⚡", "Energía", m.energia)}${barra("🎾", "Diversión", m.diversion)}
<div class="chips"><span class="chip casa">${casa ? `🏠 ${esc(casa.nombre)}` : "🏚️ Sin casa"}</span>${prendas}</div>
<div class="cmds">Usa <b>.petalimentar ${i + 1}</b> · <b>.petjugar ${i + 1}</b> · <b>.${m.dormido ? "petdespertar" : "petdormir"} ${i + 1}</b></div>
</section>`;
}

function bloqueIncubadora(est, ahora) {
  const inc = estadoIncubadora(est, ahora);
  if (!inc) return "";
  const filas = inc.huevos.map((h) => {
    const dato = HUEVOS[h.tipo];
    return `<div class="egg"><span>${dato.emoji} ${dato.nombre}</span><div class="bar g"><i style="width:${Math.round(h.fraccion * 100)}%"></i></div><b>${h.listo ? "¡Listo!" : duracion(h.restante)}</b></div>`;
  }).join("");
  const libres = inc.nivel.espacios - inc.huevos.length;
  return `<div class="caja"><div class="ct2">🔥 ${esc(inc.nivel.nombre)} · nivel ${inc.nivel.nivel}</div>${filas}${libres > 0 ? `<div class="libre">${libres} espacio${libres > 1 ? "s" : ""} libre${libres > 1 ? "s" : ""}</div>` : ""}</div>`;
}

function bloqueInventario(est) {
  const huevos = Object.entries(HUEVOS).filter(([k]) => est.huevos[k] > 0).map(([k, h]) => `<span class="chip">${h.emoji} ${est.huevos[k]}</span>`);
  const comida = Object.entries(COMIDAS).filter(([k]) => est.comida[k] > 0).map(([k, c]) => `<span class="chip">${c.emoji} ${est.comida[k]}</span>`);
  const prendas = Object.entries(ACCESORIOS).filter(([k]) => est.accesorios[k] > 0).map(([k, a]) => `<span class="chip">${a.emoji} ${est.accesorios[k]}</span>`);
  const todo = [...huevos, ...comida, ...prendas];
  return `<div class="caja"><div class="ct2">🎒 Mochila</div><div class="chips">${todo.join("") || `<span class="chip vacio">Vacía</span>`}</div></div>`;
}

const CSS = String.raw`*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{background:#fff1dc;overflow-x:hidden;overscroll-behavior:none}
body{color:#3b2a1d;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:13px;padding:10px;width:100%}
button{font:inherit;border:0;cursor:pointer}
small{color:#8a735d;font-size:11px}
.top{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:6px 8px;margin-bottom:8px}
.top b{flex:1 1 130px;min-width:0;font-size:16px;overflow-wrap:anywhere}
.clima{flex:none;font-size:11px;font-weight:700;background:#fff;border-radius:20px;padding:4px 9px;box-shadow:0 1px 4px rgba(90,60,20,.18)}
.tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.tab{background:#fff;border:2px solid #f0c48a;color:#6a4a2b;border-radius:20px;padding:4px 11px;font-size:12px;font-weight:700}
.tab.on{background:#f08a24;border-color:#f08a24;color:#fff}
.pet{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 14px rgba(90,60,20,.18);margin-bottom:10px;padding-bottom:12px}
.pet[hidden]{display:none}
.escwrap{position:relative;line-height:0;cursor:pointer;touch-action:manipulation}
.escena{display:block;width:100%;height:auto}
.bub{position:absolute;left:50%;top:8px;transform:translateX(-50%) scale(.85);max-width:80%;background:#fff;color:#3b2a1d;font-size:12px;font-weight:700;line-height:1.3;padding:5px 10px;border-radius:12px;opacity:0;transition:all .2s;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.bub.on{opacity:1;transform:translateX(-50%)}
.fl{position:absolute;bottom:30%;font-size:20px;line-height:1;pointer-events:none;animation:sube 1.2s ease-out forwards}
@keyframes sube{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-70px)}}
.lluvia line{animation:caer .8s linear infinite}
@keyframes caer{from{transform:translate(0,0)}to{transform:translate(-14px,250px)}}
.zz text{animation:zf 2.4s ease-in-out infinite}
@keyframes zf{0%,100%{opacity:.35}50%{opacity:1}}
.fila{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 12px 4px}
.nom{min-width:0}.nom b{display:block;font-size:17px;line-height:1.15;overflow-wrap:anywhere}
.ins{display:flex;flex-wrap:wrap;gap:4px;justify-content:flex-end}
.pill{font-size:11px;font-weight:800;color:#fff;padding:3px 9px;border-radius:20px;background:#8d6e4f}
.pill.ecria{background:#4fb3e8}.pill.ejoven{background:#8e6bd6}.pill.eadulto{background:#e0803a}
.pill.cal{background:#fff0d6;color:#8a5a1d}
.pill.rpoco_comun{background:#dff5e3;color:#25703a}.pill.rraro{background:#dcebff;color:#245a9c}.pill.repico{background:#ead9ff;color:#6a3fb0}.pill.rlegendario{background:#ffe9a8;color:#8a6200}
.rasgo{margin:2px 12px 6px;font-size:11.5px;color:#8a735d}
.est{display:flex;justify-content:space-between;gap:8px;margin:4px 12px 8px;padding:6px 10px;border-radius:12px;background:#fff4e2;font-weight:800}
.est span{font-weight:600;color:#8a735d}
.crec{margin:0 12px 6px}
.ct{display:flex;justify-content:space-between;gap:6px;font-size:11.5px;color:#6a4a2b;margin-bottom:4px}
.bar{flex:1;min-width:0;height:9px;border-radius:6px;background:#f3e4cd;overflow:hidden}
.bar i{display:block;height:100%;border-radius:6px}
.bar.g i{background:linear-gradient(90deg,#7ad06a,#35b86a)}
.nec{display:grid;grid-template-columns:20px 58px minmax(0,1fr) 26px;align-items:center;gap:6px;margin:6px 12px}
.nec .nt{color:#6a4a2b;font-size:12px}.nec b{text-align:right;font-size:12px}
.chips{display:flex;flex-wrap:wrap;gap:5px;margin:8px 12px 0}
.chip{font-size:11.5px;font-weight:700;background:#fff4e2;color:#6a4a2b;border-radius:20px;padding:3px 9px}
.chip.casa{background:#e8f4ff;color:#2f5f8f}.chip.vacio{opacity:.65;font-weight:600}
.cmds{margin:10px 12px 0;padding:8px 10px;border-radius:12px;background:#fff4e2;font-size:11.5px;line-height:1.6;color:#6a4a2b}
.caja{background:#fff;border-radius:16px;padding:10px 12px;margin-bottom:10px;box-shadow:0 2px 8px rgba(90,60,20,.14)}
.ct2{font-weight:800;margin-bottom:6px}
.caja .chips{margin:0}
.egg{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) auto;align-items:center;gap:8px;margin-top:6px;font-size:12px}
.egg b{font-size:11.5px;text-align:right}
.libre{margin-top:6px;font-size:11.5px;color:#8a735d}
.vacioPets{background:#fff;border-radius:20px;padding:18px 14px;text-align:center;box-shadow:0 4px 14px rgba(90,60,20,.18);margin-bottom:10px;line-height:1.5}
.pie{text-align:center;color:#a0876d;font-size:11px;margin-top:4px}`;

const SCRIPT = String.raw`(function(){
var tabs=[].slice.call(document.querySelectorAll('.tab')),pets=[].slice.call(document.querySelectorAll('.pet'));
var F={dormido:['Zzz...','💤 Cinco minutos más...'],hambriento:['¡Tengo mucha hambre!','🍖 ¿Hay comida?'],cansado:['Necesito dormir...','🥱 Estoy agotado'],aburrido:['¿Jugamos?','🎾 Estoy aburrido'],mojado:['Brrr, qué frío','🌧️ Me estoy mojando'],impermeable:['Mi impermeable funciona 😎'],feliz:['¡Qué buen día!','💛 ¡Te quiero!','¡Sigamos jugando!'],tranquilo:['Todo está tranquilo','🙂 Aquí estoy']};
function ir(i){tabs.forEach(function(t,j){t.classList.toggle('on',j===i)});pets.forEach(function(p,j){p.hidden=j!==i})}
tabs.forEach(function(t,i){t.onclick=function(){ir(i)}});
pets.forEach(function(p){var w=p.querySelector('.escwrap'),b=p.querySelector('.bub'),tm;
w.onclick=function(e){var l=F[p.getAttribute('data-estado')]||F.tranquilo;b.textContent=l[Math.floor(Math.random()*l.length)];b.classList.add('on');clearTimeout(tm);tm=setTimeout(function(){b.classList.remove('on')},2200);
var r=w.getBoundingClientRect(),h=document.createElement('span');h.className='fl';h.textContent=['💛','✨','💖'][Math.floor(Math.random()*3)];h.style.left=Math.max(5,Math.min(r.width-25,(e.clientX-r.left)-10))+'px';w.appendChild(h);setTimeout(function(){h.remove()},1200)}});
ir(Math.min(pets.length-1,Math.max(0,__INICIAL__)))})();`;

export function htmlMascotas({ nombre, est, ahora, clima, noche, inicial = 0, firma }) {
  const ctx = { llueve: clima.llueve, noche };
  const tarjetas = est.mascotas.map((m, i) => tarjetaMascota(m, i, ctx)).join("");
  const tabs = est.mascotas.length > 1
    ? `<div class="tabs">${est.mascotas.map((m, i) => `<button class="tab">${ESPECIES[m.especie].emoji} ${esc(m.nombre)}</button>`).join("")}</div>`
    : est.mascotas.length === 1 ? `<div class="tabs"><button class="tab">${ESPECIES[est.mascotas[0].especie].emoji} ${esc(est.mascotas[0].nombre)}</button></div>` : "";
  const textoClima = !clima.disponible
    ? `🌤️ ${esc(clima.ciudad)}`
    : `${clima.llueve ? "🌧️ Lloviendo" : noche ? "🌙 Despejado" : "☀️ Despejado"} · ${esc(clima.ciudad)}${clima.temperatura !== null ? ` · ${Math.round(clima.temperatura)}°` : ""}`;
  const vacio = est.mascotas.length
    ? ""
    : `<div class="vacioPets">🥚 Aún no tienes mascotas.<br>Compra un huevo, ponlo en la incubadora y espera a que nazca.<br><small>Usa .pettienda para ver los precios.</small></div>`;
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${CSS}</style></head><body>
<div class="top"><b>🐾 Mascotas de ${esc(nombre)}</b><span class="clima">${textoClima}</span></div>
${tabs}${tarjetas}${vacio}${bloqueIncubadora(est, ahora)}${bloqueInventario(est)}
<div class="pie">${esc(firma)}</div>
<script>${SCRIPT.replace("__INICIAL__", String(inicial | 0))}</script></body></html>`;
}
