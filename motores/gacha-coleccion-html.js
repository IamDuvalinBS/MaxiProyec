const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const COLOR_RAREZA = {
  "Ultra legendaria": "#ec4899",
  "Legendaria": "#f59e0b",
  "Mítica": "#ef4444",
  "Épica": "#a855f7",
  "Súper rara": "#3b82f6",
  "Rara": "#10b981",
  "Poco común": "#14b8a6",
  "Común": "#94a3b8"
};
const ORDEN_RAREZA = Object.keys(COLOR_RAREZA);

const HALLOWEEN = {
  waifu: {
    sub: "Harem de la bruja", icono: "🧙‍♀️", almas: "Almas hechizadas", moneda: "Calabazas",
    bg: ["#1a0b2e", "#4a1d6b"], borde: "#f472b6", acento: "#f9a8d4", tarjeta: "#2a1245",
    deco: ["🕸️", "🌙", "🦇", "🧙‍♀️", "🕯️"], vacio: "🔮"
  },
  pokemon: {
    sub: "Caldero Pokémon", icono: "🧪", almas: "Criaturas en el caldero", moneda: "Calabazas",
    bg: ["#06231c", "#14532d"], borde: "#84cc16", acento: "#bef264", tarjeta: "#0d3b2a",
    deco: ["🫧", "🧪", "🍄", "🦇", "🕸️"], vacio: "🥚"
  },
  brawler: {
    sub: "Brawlers de la noche embrujada", icono: "🎃", almas: "Almas reunidas", moneda: "Calabazas",
    bg: ["#1c0a2e", "#3b1260"], borde: "#fb923c", acento: "#fdba74", tarjeta: "#2c1148",
    deco: ["🕸️", "🕷️", "🎃", "🦇", "👻"], vacio: "💀"
  },
  snake: {
    sub: "Serpientes de la tumba", icono: "🪦", almas: "Almas arrastradas", moneda: "Calabazas",
    bg: ["#10161a", "#2b3a3f"], borde: "#a3e635", acento: "#d9f99d", tarjeta: "#1b272b",
    deco: ["🪦", "🐍", "🌫️", "🦉", "🌙"], vacio: "🪱"
  },
  cod: {
    sub: "Arsenal de esqueletos", icono: "💀", almas: "Armas malditas", moneda: "Calabazas",
    bg: ["#1a0808", "#450a0a"], borde: "#f87171", acento: "#fecaca", tarjeta: "#2d1010",
    deco: ["💀", "🦴", "🩸", "⚰️", "🕯️"], vacio: "🦴"
  },
  dragon: {
    sub: "Dragones de la cripta", icono: "👻", almas: "Huevos espectrales", moneda: "Calabazas",
    bg: ["#08141f", "#134e4a"], borde: "#5eead4", acento: "#99f6e4", tarjeta: "#0f2e33",
    deco: ["👻", "🐉", "🌫️", "🌙", "🏚️"], vacio: "🥚"
  },
  clash: {
    sub: "Leyendas malditas", icono: "🔮", almas: "Cartas selladas", moneda: "Calabazas",
    bg: ["#1a1205", "#3b2a0a"], borde: "#facc15", acento: "#fde68a", tarjeta: "#2b1f0a",
    deco: ["🔮", "⚗️", "👑", "🕯️", "🦇"], vacio: "🃏"
  }
};

const NORMAL = {
  waifu: { acento: "#ec4899", bg: ["#fff1f7", "#fde4f0"], icono: "🌸", sub: "Tu harem" },
  pokemon: { acento: "#ef4444", bg: ["#eaf3ff", "#d4e8ff"], icono: "🔴", sub: "Tus Pokémon" },
  brawler: { acento: "#f59e0b", bg: ["#fff7e0", "#ffe9a8"], icono: "⭐", sub: "Tus Brawlers" },
  snake: { acento: "#22c55e", bg: ["#ecfdf1", "#d1fadf"], icono: "🐍", sub: "Tus Snakes" },
  cod: { acento: "#64748b", bg: ["#eef1f5", "#d9dee7"], icono: "🔫", sub: "Tu arsenal" },
  dragon: { acento: "#f97316", bg: ["#fff1e6", "#ffdcc2"], icono: "🐉", sub: "Tus dragones" },
  clash: { acento: "#3b82f6", bg: ["#eaf1ff", "#cfdfff"], icono: "👑", sub: "Tus cartas" }
};

const estrellas = (n) => (n ? "★".repeat(n) : "");

export function htmlColeccion(d) {
  const h = d.halloween;
  const t = h ? (HALLOWEEN[d.clave] || HALLOWEEN.brawler) : null;
  const nm = NORMAL[d.clave] || NORMAL.brawler;
  const bg = h ? t.bg : nm.bg;
  const acento = h ? t.borde : nm.acento;
  const sub = h ? t.sub : nm.sub;
  const icono = h ? t.icono : nm.icono;
  const texto = h ? "#fff" : "#1c2540";
  const suave = h ? "rgba(255,255,255,.65)" : "#62708f";
  const tarjeta = h ? t.tarjeta : "#ffffff";
  const deco = h ? t.deco : [];

  const rarezas = [...d.rarezas].sort((a, b) => ORDEN_RAREZA.indexOf(a.n) - ORDEN_RAREZA.indexOf(b.n));
  const chips = rarezas.map((r) => `<span class="rc" style="--c:${COLOR_RAREZA[r.n] || "#94a3b8"}">${esc(r.n)} ${r.c}</span>`).join("");
  const pct = Math.min(100, Math.max(2, Math.round((d.n / Math.max(1, d.totalCat)) * 100)));

  const items = d.items.map((c, i) => {
    const col = COLOR_RAREZA[c.rareza] || "#94a3b8";
    const fondo = c.img
      ? `<img class="im" src="${c.img}" alt="">`
      : `<div class="im sin">${h ? t.vacio : icono}</div>`;
    const nivel = c.nivel != null ? `<div class="nv">Nv ${c.nivel}/${c.max}${c.estrellas ? ` <b>${estrellas(c.estrellas)}</b>` : ""}</div>` : "";
    return `<div class="t" data-i="${i}" style="--r:${col}"><div class="ti">${fondo}</div><div class="tn">${esc(c.nombre)}</div>${nivel}</div>`;
  }).join("");

  const datos = JSON.stringify(d.items.map((c) => ({
    n: c.nombre, id: c.id, r: c.rareza, v: c.valorTxt, nv: c.nivel, mx: c.max, e: c.estrellas || 0, st: c.st || null, f: c.fuente || ""
  }))).replace(/</g, "\\u003c");

  const decoHtml = deco.map((e, i) => `<i class="dc d${i}">${e}</i>`).join("");
  const moneda = h ? t.moneda : "";
  const etiquetaAlmas = h ? t.almas : "Colección";

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{background:linear-gradient(160deg,${bg[0]},${bg[1]});color:${texto};font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:13px;overflow-x:hidden;min-height:100%}
body{padding:12px;position:relative}
.dc{position:absolute;font-style:normal;font-size:22px;opacity:.55;pointer-events:none;animation:fl 5s ease-in-out infinite}
.d0{top:6px;left:8px}.d1{top:10px;right:14px;animation-delay:.8s}.d2{top:120px;right:6px;animation-delay:1.6s}.d3{top:200px;left:4px;animation-delay:2.4s}.d4{top:70px;left:52%;animation-delay:3s}
@keyframes fl{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-7px) rotate(4deg)}}
.cab{position:relative;display:flex;align-items:center;gap:12px;padding:12px;border-radius:22px;border:3px solid ${acento};background:${h ? "rgba(0,0,0,.35)" : "#fff"};margin-bottom:12px;box-shadow:0 0 18px ${acento}55}
.ic{flex:none;width:54px;height:54px;border-radius:16px;background:${acento};display:flex;align-items:center;justify-content:center;font-size:30px}
.tt{min-width:0}.tt b{display:block;font-size:19px;line-height:1.15;overflow-wrap:anywhere}.tt small{color:${h ? t.acento : suave};font-size:12px}
.res{position:relative;display:flex;justify-content:space-between;align-items:flex-end;gap:8px;margin-bottom:6px}
.res small{color:${suave};font-size:12px;display:block}.res b{font-size:17px;display:block}.res .d{text-align:right}
.bar{position:relative;height:9px;border-radius:6px;border:2px solid ${acento};overflow:hidden;background:${h ? "rgba(0,0,0,.4)" : "#dbe6f6"}}
.bar i{display:block;height:100%;width:${pct}%;background:linear-gradient(90deg,${acento},${h ? t.acento : "#fbbf24"})}
.rar{position:relative;display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}
.rc{font-size:11.5px;font-weight:800;padding:4px 10px;border-radius:20px;color:#fff;background:var(--c);border:2px solid rgba(255,255,255,.35);text-shadow:0 1px 2px rgba(0,0,0,.4)}
.grid{position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.t{min-width:0;background:${tarjeta};border-radius:16px;padding:6px 5px 8px;text-align:center;border:2px solid ${h ? "rgba(255,255,255,.12)" : "transparent"};border-bottom:4px solid var(--r);box-shadow:0 3px 8px rgba(0,0,0,.25);cursor:pointer}
.t.sel{outline:3px solid ${acento}}
.ti{width:100%;aspect-ratio:1/1;border-radius:12px;background:${h ? "rgba(0,0,0,.35)" : "#eef3fb"};display:flex;align-items:center;justify-content:center;overflow:hidden}
.im{width:92%;height:92%;object-fit:contain}.sin{font-size:30px;display:flex;align-items:center;justify-content:center}
.tn{font-weight:800;font-size:11.5px;margin-top:5px;line-height:1.15;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.nv{font-size:10.5px;color:${suave};margin-top:2px}.nv b{color:#fbbf24}
.det{position:relative;margin-top:12px;padding:12px;border-radius:16px;background:${h ? "rgba(0,0,0,.4)" : "#fff"};border:2px solid ${acento};display:none}
.det.on{display:block}.det h3{font-size:15px;margin-bottom:4px}
.det .g{display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;margin-top:6px}.det span{color:${suave}}
.pie{position:relative;margin-top:14px;text-align:center;color:${suave};font-size:11.5px;line-height:1.6}
.pie b{color:${texto}}
</style></head><body>
${decoHtml}
<div class="cab"><div class="ic">${icono}</div><div class="tt"><b>${esc(d.nombre)}</b><small>${esc(sub)}</small></div></div>
<div class="res"><div><small>${h ? "Valor total" : "Valor de tu colección"}</small><b>${esc(d.valorTxt)}</b></div><div class="d"><small>${esc(etiquetaAlmas)}</small><b>${d.n} / ${d.totalCat}</b></div></div>
<div class="bar"><i></i></div>
<div class="rar">${chips}</div>
<div class="grid">${items}</div>
<div class="det" id="det"></div>
<div class="pie">Página <b>${d.pagina}/${d.paginas}</b>${d.paginas > d.pagina ? ` · usa <b>${esc(d.comando)} ${d.pagina + 1}</b>` : ""}<br>${esc(d.firma)}</div>
<script>
var D=${datos};
var ts=document.querySelectorAll(".t"),det=document.getElementById("det");
ts.forEach(function(el){el.addEventListener("click",function(){
var c=D[+el.dataset.i];ts.forEach(function(x){x.classList.remove("sel")});el.classList.add("sel");
var s=c.st?'<span>Salud</span><b>'+c.st.hp+'</b><span>Daño</span><b>'+c.st.atk+'</b><span>Defensa</span><b>'+c.st.def+'</b><span>Velocidad</span><b>'+c.st.spe+'</b>':'';
det.innerHTML='<h3>'+c.n+'</h3><div class="g"><span>ID</span><b>#'+c.id+'</b><span>Rareza</span><b>'+c.r+'</b><span>Valor</span><b>'+c.v+'</b>'+(c.nv!=null?'<span>Nivel</span><b>'+c.nv+'/'+c.mx+'</b>':'')+s+'</div>';
det.className="det on";});});
</script>
</body></html>`;
}
