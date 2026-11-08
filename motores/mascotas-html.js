import { ESPECIES, RAREZAS, HUEVOS, COMIDAS, CASAS, ACCESORIOS, ESPACIOS, JABON, FLAUTA, ARBOL, PERDIDA_HORAS, HABILIDADES, NIVEL_HABILIDAD } from "./mascotas-datos.js";
import { svgEscena } from "./mascotas-arte.js";
import { svgEscenaZona } from "./mascotas-zonas-arte.js";
import { ZONAS, ITEMS, ORDEN_RAREZA } from "./mascotas-zonas.js";
import { etapaDe, progresoEtapa, estadoActual, felicidad, estadoIncubadora, nivelDe, prepActiva } from "./mascotas-logica.js";

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
  if (["hambriento", "cansado", "aburrido", "mojado", "sucio"].includes(estado.clave)) return "triste";
  return estado.clave === "feliz" ? "feliz" : "normal";
}

const NOMBRE_CLIMA = {
  despejado: (c) => (c.esDia ? "☀️ Despejado" : "🌙 Despejado"),
  nublado: () => "☁️ Nublado",
  lluvia: () => "🌧️ Lloviendo",
  tormenta: () => "⛈️ Tormenta",
  nieve: () => "❄️ Nevando",
  niebla: () => "🌫️ Niebla"
};

function textoClimaZona(c) {
  if (!c || !c.disponible) return "🌤️ Clima no disponible";
  return `${NOMBRE_CLIMA[c.tipo](c)}${c.temperatura !== null ? ` · ${Math.round(c.temperatura)}°` : ""}${c.esDia ? "" : " · noche"}`;
}

function tarjetaMascota(m, i, ctx) {
  const ex = m.expedicion;
  const activa = Boolean(ex && ctx.ahora < ex.fin);
  const zonaEx = ex ? ZONAS[ex.zona] : null;
  const zonaPerdida = m.perdida ? ZONAS[m.perdida.resultado.zona] : null;
  const estado = zonaPerdida
    ? { clave: "perdida", texto: "Se perdió", emoji: "🌫️" }
    : activa
      ? { clave: "explorando", texto: "Investigando la zona", emoji: "🔍" }
      : estadoActual(m, ctx.llueve);
  const etapa = etapaDe(m.crec);
  const prog = progresoEtapa(m.crec);
  const esp = ESPECIES[m.especie];
  const rareza = RAREZAS[m.rareza] || RAREZAS.comun;
  const casa = m.casa ? CASAS.niveles[m.casa - 1] : null;
  const climaEx = activa ? ctx.climaZonas?.[ex.zona] : null;
  const escenaPerdida = zonaPerdida
    ? svgEscenaZona({ zona: zonaPerdida.id, clima: ctx.climaZonas?.[zonaPerdida.id], uid: `p${m.id}`, conMascota: false })
      .replace("</svg>", `<text x="160" y="150" text-anchor="middle" font-size="70" opacity=".9">❓</text></svg>`)
    : null;
  const escena = escenaPerdida || (activa ? svgEscenaZona({
    zona: ex.zona,
    clima: climaEx,
    especie: m.especie,
    etapa: etapa.id,
    animo: "normal",
    equipo: m.equipo,
    uid: `p${m.id}`
  }) : svgEscena({
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
  }));
  const prendas = ESPACIOS.map((e) => ACCESORIOS[m.equipo[e]]).filter(Boolean)
    .map((a) => `<span class="chip">${a.emoji} ${esc(a.nombre)}</span>`).join("") || `<span class="chip vacio">Sin accesorios</span>`;
  const prep = prepActiva(m, ctx.ahora);
  const bannerPerdida = zonaPerdida
    ? `<div class="exp perdida">🌫️ ${esc(m.nombre)} se perdió volviendo de ${zonaPerdida.emoji} ${esc(zonaPerdida.nombre)}. Volverá sola en ${duracion(Math.max(0, m.perdida.vuelve - ctx.ahora))} o llámala ahora con <b>.petllamar</b> ${ctx.flauta ? "🎶" : "(necesitas la flauta mágica)"}.</div>`
    : "";
  const banner = bannerPerdida || (activa
    ? `<div class="exp"><div class="ct"><span>🔍 ${zonaEx.emoji} ${esc(zonaEx.nombre)}</span><span>Vuelve en ${duracion(ex.fin - ctx.ahora)}</span></div><div class="bar g"><i style="width:${Math.round(Math.min(1, (ctx.ahora - ex.inicio) / (ex.fin - ex.inicio)) * 100)}%"></i></div><small>${esc(zonaEx.lugar)} · ${textoClimaZona(climaEx)}</small></div>`
    : ex
      ? `<div class="exp listo">✅ ¡${esc(m.nombre)} volvió de ${zonaEx.emoji} ${esc(zonaEx.nombre)}! Usa <b>.petreclamar</b> para recibir lo que encontró.</div>`
      : "");
  const meta = prog.siguiente
    ? `Hacia ${esc(prog.siguiente.nombre)}: ${Math.round(prog.fraccion * 100)}%`
    : "Crecimiento completo";
  return `<section class="pet" data-estado="${estado.clave}" hidden>
<div class="escwrap">${escena}<div class="bub"></div></div>
<div class="fila"><div class="nom"><b>${esc(m.nombre)}</b><small>#${i + 1} · ${esp.emoji} ${esp.nombre}</small></div>
<div class="ins"><span class="pill nv">Nv ${nivelDe(m)}</span><span class="pill e${etapa.id}">${etapa.nombre}</span><span class="pill cal r${m.rareza}">${rareza.emoji} ${rareza.nombre}</span></div></div>
<div class="rasgo">✨ ${esc(esp.rasgo)}<br>⭐ ${esc(HABILIDADES[m.especie].nombre)}: ${esc(HABILIDADES[m.especie].texto)} <b>${nivelDe(m) >= NIVEL_HABILIDAD ? "(activa)" : `(Nv ${NIVEL_HABILIDAD})`}</b></div>
${banner}<div class="est">${estado.emoji} ${estado.texto}<span>Ánimo ${felicidad(m)}%</span></div>
<div class="crec"><div class="ct"><span>🌱 Crecimiento</span><span>${meta}</span></div><div class="bar g"><i style="width:${Math.round(prog.fraccion * 100)}%"></i></div></div>
${barra("🍖", "Comida", m.hambre)}${barra(m.dormido ? "😴" : "⚡", "Energía", m.energia)}${barra("🎾", "Diversión", m.diversion)}${barra("🫧", "Limpieza", m.limpieza)}
<div class="chips">${prep ? `<span class="chip prep">🛡️ Preparado ×${prep}</span>` : ""}<span class="chip casa">${casa ? `🏠 ${esc(casa.nombre)}` : "🏚️ Sin casa"}</span>${prendas}</div>
<div class="cmds">${zonaPerdida ? "Está perdida; no puede hacer nada hasta que regrese." : activa ? "Está explorando; no puede jugar, comer ni dormir hasta que vuelva." : `Usa <b>.petalimentar ${i + 1}</b> · <b>.petjugar ${i + 1}</b> · <b>.petbañar ${i + 1}</b> · <b>.${m.dormido ? "petdespertar" : "petdormir"} ${i + 1}</b> · <b>.petinvestigar</b>`}</div>
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
  const jabon = est.jabon > 0 ? [`<span class="chip">${JABON.emoji} ${est.jabon}</span>`] : [];
  const flauta = est.flauta ? [`<span class="chip">${FLAUTA.emoji} Flauta mágica</span>`] : [];
  const todo = [...huevos, ...comida, ...jabon, ...flauta, ...prendas];
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
.pill.nv{background:#2f6fb8}
.exp{margin:2px 12px 8px;padding:8px 10px;border-radius:12px;background:#e8f4ff;color:#2f5f8f;font-size:12px}
.exp.listo{background:#e4f7e8;color:#25703a;line-height:1.5}
.exp.perdida{background:#fff0d9;color:#8a5a1d;line-height:1.5}
.chip.prep{background:#e4f7e8;color:#25703a}
.rama{background:#fff;border-radius:16px;padding:10px 12px;margin-bottom:8px;box-shadow:0 2px 8px rgba(90,60,20,.14)}
.rama .rh{display:flex;justify-content:space-between;align-items:center;gap:8px;font-weight:800}
.rama .ef{margin:4px 0;font-size:12px;color:#6a4a2b}
.rama .mats{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}
.arbolsvg{display:block;width:100%;height:auto;background:#fff;border-radius:18px;box-shadow:0 3px 10px rgba(90,60,20,.16);margin-bottom:10px}
.exp small{display:block;margin-top:5px;color:#4a7aa8}
.zc{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 3px 10px rgba(90,60,20,.16);margin-bottom:10px;padding-bottom:10px}
.zc .nombre{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 12px 0}
.zc .nombre b{font-size:15px;overflow-wrap:anywhere}
.zc .lug{margin:2px 12px 6px;font-size:11.5px;color:#8a735d}
.zc .datos{display:flex;flex-wrap:wrap;gap:5px;margin:0 12px 6px}
.zc .loot{margin:6px 12px 0;font-size:16px;letter-spacing:2px;line-height:1.5}
.zc .nota{margin:6px 12px 0;font-size:11.5px;color:#6a4a2b}
.ok{background:#e4f7e8!important;color:#25703a!important}
.no{background:#fde8e6!important;color:#a3352c!important}
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
var F={dormido:['Zzz...','💤 Cinco minutos más...'],hambriento:['¡Tengo mucha hambre!','🍖 ¿Hay comida?'],cansado:['Necesito dormir...','🥱 Estoy agotado'],aburrido:['¿Jugamos?','🎾 Estoy aburrido'],sucio:['Necesito un baño 🫧','Estoy lleno de lodo'],mojado:['Brrr, qué frío','🌧️ Me estoy mojando'],impermeable:['Mi impermeable funciona 😎'],feliz:['¡Qué buen día!','💛 ¡Te quiero!','¡Sigamos jugando!'],tranquilo:['Todo está tranquilo','🙂 Aquí estoy']};
function ir(i){tabs.forEach(function(t,j){t.classList.toggle('on',j===i)});pets.forEach(function(p,j){p.hidden=j!==i})}
tabs.forEach(function(t,i){t.onclick=function(){ir(i)}});
pets.forEach(function(p){var w=p.querySelector('.escwrap'),b=p.querySelector('.bub'),tm;
w.onclick=function(e){var l=F[p.getAttribute('data-estado')]||F.tranquilo;b.textContent=l[Math.floor(Math.random()*l.length)];b.classList.add('on');clearTimeout(tm);tm=setTimeout(function(){b.classList.remove('on')},2200);
var r=w.getBoundingClientRect(),h=document.createElement('span');h.className='fl';h.textContent=['💛','✨','💖'][Math.floor(Math.random()*3)];h.style.left=Math.max(5,Math.min(r.width-25,(e.clientX-r.left)-10))+'px';w.appendChild(h);setTimeout(function(){h.remove()},1200)}});
ir(Math.min(pets.length-1,Math.max(0,__INICIAL__)))})();`;

export function htmlMascotas({ nombre, est, ahora, clima, noche, inicial = 0, firma, climaZonas = null }) {
  const ctx = { llueve: clima.llueve, noche, ahora, climaZonas, flauta: est.flauta };
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

export function htmlZonas({ nombre, est, ahora, climaZonas, firma }) {
  const tarjetas = Object.values(ZONAS).map((z) => {
    const c = climaZonas?.[z.id];
    const escena = svgEscenaZona({ zona: z.id, clima: c, uid: `zz${z.id}`, conMascota: false });
    const aptas = est.mascotas.filter((m) => nivelDe(m) >= z.nivel).map((m) => m.nombre);
    const loot = Object.values(ITEMS).filter((i) => i.zona === z.id)
      .sort((a, b) => ORDEN_RAREZA.indexOf(a.rareza) - ORDEN_RAREZA.indexOf(b.rareza)).map((i) => i.emoji).join(" ");
    const fav = z.favoritas.map((f) => ESPECIES[f].emoji + " " + ESPECIES[f].nombre).join(" · ");
    return `<section class="zc">${escena}
<div class="nombre"><b>${z.emoji} ${esc(z.nombre)}</b><span class="clima">${esc(textoClimaZona(c))}</span></div>
<div class="lug">📍 ${esc(z.lugar)}</div>
<div class="datos"><span class="chip">🎚️ Nivel ${z.nivel}</span><span class="chip">⏱️ Desde ${z.minutos} min</span><span class="chip">⚔️ ${esc(z.dificultad)}</span></div>
<div class="loot">${loot}</div>
<div class="nota">⭐ Ventaja: ${esc(fav)}</div>
<div class="datos"><span class="chip ${aptas.length ? "ok" : "no"}">${aptas.length ? `Pueden ir: ${esc(aptas.join(", "))}` : "Ninguna de tus mascotas tiene el nivel"}</span></div>
</section>`;
  }).join("");
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${CSS}</style></head><body>
<div class="top"><b>🗺️ Zonas de ${esc(nombre)}</b><span class="clima">Clima real en vivo</span></div>
${tarjetas}
<div class="caja"><div class="ct2">🔍 Cómo investigar</div><div class="nota">Usa <b>.petinvestigar &lt;zona&gt; [tiempo] [mascota]</b>. Mientras más tiempo busque, más ítems encontrará. Ejemplo: <b>.petinvestigar bosque 2h 1</b></div></div>
<div class="pie">${esc(firma)}</div></body></html>`;
}

const COLORES_NIVEL = ["#d9d9d9", "#cd8f5a", "#c3cad6", "#ffd34d"];

function svgArbol(est) {
  const nodos = { bosque: [62, 52], nieve: [160, 34], lago: [258, 52], encantado: [62, 142], volcan: [160, 126], islas: [258, 142] };
  let s = `<svg viewBox="0 0 320 250" xmlns="http://www.w3.org/2000/svg" class="arbolsvg" role="img">`
    + `<defs><linearGradient id="fa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9f9ff"/><stop offset="1" stop-color="#fff4dd"/></linearGradient></defs>`
    + `<rect width="320" height="250" fill="url(#fa)"/>`
    + `<ellipse cx="160" cy="100" rx="150" ry="92" fill="#a9dd95" opacity=".8"/><ellipse cx="160" cy="110" rx="122" ry="72" fill="#8fd27f" opacity=".7"/>`
    + `<path d="M150 246L154 190Q158 176 160 160Q162 176 166 190L170 246Z" fill="#8a5a36"/>`
    + `<g stroke="#8a5a36" stroke-width="5" fill="none" stroke-linecap="round">`;
  for (const [x, y] of Object.values(nodos)) s += `<path d="M160 180Q${(160 + x) / 2} ${(180 + y) / 2 + 10} ${x} ${y + 20}"/>`;
  s += `</g>`;
  for (const [id, [x, y]] of Object.entries(nodos)) {
    const n = est.arbol[id];
    s += `<g><circle cx="${x}" cy="${y}" r="26" fill="${COLORES_NIVEL[n]}" stroke="#00000033" stroke-width="2"/>`
      + (n ? `<circle cx="${x}" cy="${y}" r="31" fill="none" stroke="${COLORES_NIVEL[n]}" stroke-width="2" opacity=".6"><animate attributeName="r" values="29;34;29" dur="3s" repeatCount="indefinite"/></circle>` : "")
      + `<text x="${x}" y="${y + 8}" text-anchor="middle" font-size="24" opacity="${n ? 1 : 0.5}">${ARBOL[id].emoji}</text>`
      + `<text x="${x}" y="${y + 43}" text-anchor="middle" font-size="11" font-weight="800" fill="#4a3320" font-family="system-ui,sans-serif">${"●".repeat(n)}${"○".repeat(3 - n)}</text></g>`;
  }
  return s + `</svg>`;
}

export function htmlArbol({ nombre, est, firma }) {
  const ramas = Object.entries(ARBOL).map(([id, r]) => {
    const n = est.arbol[id];
    const coste = n < 3 ? r.niveles[n] : null;
    const mats = coste
      ? Object.entries(coste.items).map(([item, cant]) => {
        const tiene = est.items[item] || 0;
        return `<span class="chip ${tiene >= cant ? "ok" : "no"}">${ITEMS[item].emoji} ${esc(ITEMS[item].nombre)} ${tiene}/${cant}</span>`;
      }).join("") + `<span class="chip">💸 ${coste.monedas.toLocaleString("es-CO")} ¥</span>`
      : `<span class="chip ok">✅ Nivel máximo</span>`;
    return `<div class="rama"><div class="rh"><span>${r.emoji} ${esc(r.nombre)}</span><span>Nv ${n}/3</span></div>
<div class="ef">${n ? `✨ ${esc(r.formato(r.valores[n - 1]))}` : esc(r.efecto)}${n < 3 ? `<br><small>Siguiente: ${esc(r.formato(r.valores[n]))}</small>` : ""}</div>
<div class="mats">${mats}</div>${coste ? `<div class="ef"><small>Mejórala con <b>.petarbolmejorar ${id}</b></small></div>` : ""}</div>`;
  }).join("");
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${CSS}</style></head><body>
<div class="top"><b>🌳 Árbol de comida de ${esc(nombre)}</b></div>
${svgArbol(est)}${ramas}
<div class="caja"><div class="ct2">🍖 Cómo funciona</div><div class="ef">Los materiales salen de las expediciones. Cada rama mejora la comida de forma permanente. Alimentar a una mascota también la <b>prepara</b>: reduce el riesgo de perderse al investigar.</div></div>
<div class="pie">${esc(firma)}</div></body></html>`;
}
