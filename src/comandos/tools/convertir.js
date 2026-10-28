import { config } from "../../../motores/db.js";
import { tarjetaUso, tarjetaAviso } from "../../descargas/tarjetas.js";
import { encabezado } from "../../economia/estilo.js";
import { pagina, esc, json, normalizar, parseNumero, limitarEspera } from "../../../motores/herramientas-ui.js";

const ESPERA_MS = 2000;
const esperas = new Map();

// [id, factor a la unidad base, nombre, símbolo, alias]
const CATS = {
  longitud: { n: "Longitud", i: "📏", u: [
    ["m", 1, "Metro", "m", "m metro metros mt mts"],
    ["km", 1000, "Kilómetro", "km", "km kilometro kilometros kms"],
    ["cm", 0.01, "Centímetro", "cm", "cm centimetro centimetros cms"],
    ["mm", 0.001, "Milímetro", "mm", "mm milimetro milimetros mms"],
    ["um", 1e-6, "Micrómetro", "µm", "um micrometro micrometros micra micras"],
    ["mi", 1609.344, "Milla", "mi", "mi milla millas mile miles"],
    ["yd", 0.9144, "Yarda", "yd", "yd yarda yardas yard yards yds"],
    ["ft", 0.3048, "Pie", "ft", "ft pie pies foot feet"],
    ["in", 0.0254, "Pulgada", "in", "in pulgada pulgadas inch inches"],
    ["nmi", 1852, "Milla náutica", "nmi", "nmi nm milla nautica millas nauticas"]
  ] },
  masa: { n: "Masa", i: "⚖️", u: [
    ["kg", 1, "Kilogramo", "kg", "kg kilogramo kilogramos kilo kilos kgs"],
    ["g", 0.001, "Gramo", "g", "g gramo gramos gr grs"],
    ["mg", 1e-6, "Miligramo", "mg", "mg miligramo miligramos"],
    ["t", 1000, "Tonelada", "t", "t tonelada toneladas ton tons"],
    ["lb", 0.45359237, "Libra", "lb", "lb libra libras lbs pound pounds"],
    ["oz", 0.028349523125, "Onza", "oz", "oz onza onzas ounce ounces"],
    ["st", 6.35029318, "Stone", "st", "st stone"]
  ] },
  volumen: { n: "Volumen", i: "🧪", u: [
    ["l", 1, "Litro", "L", "l lt lts litro litros"],
    ["ml", 0.001, "Mililitro", "mL", "ml mililitro mililitros"],
    ["m3", 1000, "Metro cúbico", "m³", "m3 metro cubico metros cubicos"],
    ["cm3", 0.001, "Centímetro cúbico", "cm³", "cm3 cc centimetro cubico centimetros cubicos"],
    ["gal", 3.785411784, "Galón (EE. UU.)", "gal", "gal galon galones gallon gallons"],
    ["galuk", 4.54609, "Galón (Reino Unido)", "gal UK", "galuk galon uk galon imperial"],
    ["qt", 0.946352946, "Cuarto de galón", "qt", "qt cuarto de galon quart"],
    ["pt", 0.473176473, "Pinta", "pt", "pt pinta pintas pint pints"],
    ["cup", 0.2365882365, "Taza", "taza", "cup taza tazas cups"],
    ["floz", 0.0295735295625, "Onza líquida", "fl oz", "floz fl oz onza liquida onzas liquidas"],
    ["tbsp", 0.01478676478125, "Cucharada", "cda", "tbsp cda cucharada cucharadas"],
    ["tsp", 0.00492892159375, "Cucharadita", "cdta", "tsp cdta cucharadita cucharaditas"]
  ] },
  area: { n: "Área", i: "🗺️", u: [
    ["m2", 1, "Metro cuadrado", "m²", "m2 mt2 metro cuadrado metros cuadrados"],
    ["km2", 1e6, "Kilómetro cuadrado", "km²", "km2 kilometro cuadrado kilometros cuadrados"],
    ["cm2", 1e-4, "Centímetro cuadrado", "cm²", "cm2 centimetro cuadrado centimetros cuadrados"],
    ["ha", 1e4, "Hectárea", "ha", "ha hectarea hectareas"],
    ["acre", 4046.8564224, "Acre", "ac", "acre acres"],
    ["ft2", 0.09290304, "Pie cuadrado", "ft²", "ft2 sqft pie cuadrado pies cuadrados"],
    ["in2", 0.00064516, "Pulgada cuadrada", "in²", "in2 pulgada cuadrada pulgadas cuadradas"],
    ["yd2", 0.83612736, "Yarda cuadrada", "yd²", "yd2 yarda cuadrada yardas cuadradas"],
    ["mi2", 2589988.110336, "Milla cuadrada", "mi²", "mi2 milla cuadrada millas cuadradas"]
  ] },
  velocidad: { n: "Velocidad", i: "🚀", u: [
    ["ms", 1, "Metro por segundo", "m/s", "m/s mps metro por segundo metros por segundo"],
    ["kmh", 0.2777777777778, "Kilómetro por hora", "km/h", "km/h kmh kph kilometro por hora kilometros por hora"],
    ["mph", 0.44704, "Milla por hora", "mph", "mph milla por hora millas por hora"],
    ["kn", 0.5144444444444, "Nudo", "kn", "kn kt nudo nudos knot knots"],
    ["fts", 0.3048, "Pie por segundo", "ft/s", "ft/s fps pie por segundo pies por segundo"],
    ["mach", 340.29, "Mach", "Ma", "mach"]
  ] },
  tiempo: { n: "Tiempo", i: "⏱️", u: [
    ["s", 1, "Segundo", "s", "s seg segs segundo segundos sec"],
    ["msec", 0.001, "Milisegundo", "ms", "ms mseg milisegundo milisegundos"],
    ["min", 60, "Minuto", "min", "min mins minuto minutos"],
    ["h", 3600, "Hora", "h", "h hr hrs hora horas"],
    ["d", 86400, "Día", "d", "d dia dias"],
    ["sem", 604800, "Semana", "sem", "sem semana semanas"],
    ["mes", 2629800, "Mes", "mes", "mes meses"],
    ["ano", 31557600, "Año", "año", "ano anos"]
  ] },
  datos: { n: "Datos", i: "💾", u: [
    ["bit", 0.125, "Bit", "bit", "bit bits"],
    ["byte", 1, "Byte", "B", "byte bytes"],
    ["kb", 1e3, "Kilobyte", "KB", "kb kbyte kilobyte kilobytes"],
    ["mb", 1e6, "Megabyte", "MB", "mb mbyte megabyte megabytes mega megas"],
    ["gb", 1e9, "Gigabyte", "GB", "gb gbyte gigabyte gigabytes giga gigas"],
    ["tb", 1e12, "Terabyte", "TB", "tb terabyte terabytes tera"],
    ["pb", 1e15, "Petabyte", "PB", "pb petabyte petabytes"],
    ["kib", 1024, "Kibibyte", "KiB", "kib"],
    ["mib", 1048576, "Mebibyte", "MiB", "mib"],
    ["gib", 1073741824, "Gibibyte", "GiB", "gib"],
    ["tib", 1099511627776, "Tebibyte", "TiB", "tib"]
  ] },
  energia: { n: "Energía", i: "⚡", u: [
    ["j", 1, "Julio", "J", "j julio julios joule"],
    ["kj", 1000, "Kilojulio", "kJ", "kj kilojulio kilojulios"],
    ["cal", 4.184, "Caloría", "cal", "cal caloria calorias"],
    ["kcal", 4184, "Kilocaloría", "kcal", "kcal kilocaloria kilocalorias"],
    ["wh", 3600, "Vatio hora", "Wh", "wh vatio hora vatios hora"],
    ["kwh", 3.6e6, "Kilovatio hora", "kWh", "kwh kilovatio hora kilovatios hora"],
    ["btu", 1055.05585262, "BTU", "BTU", "btu"]
  ] },
  potencia: { n: "Potencia", i: "🔌", u: [
    ["w", 1, "Vatio", "W", "w vatio vatios watt watts"],
    ["kw", 1000, "Kilovatio", "kW", "kw kilovatio kilovatios"],
    ["mw", 1e6, "Megavatio", "MW", "mw megavatio megavatios"],
    ["hp", 745.69987158227, "Caballo de fuerza", "hp", "hp caballo de fuerza caballos de fuerza"],
    ["cv", 735.49875, "Caballo de vapor", "CV", "cv caballo de vapor caballos de vapor"]
  ] },
  presion: { n: "Presión", i: "🎈", u: [
    ["pa", 1, "Pascal", "Pa", "pa pascal pascales"],
    ["kpa", 1000, "Kilopascal", "kPa", "kpa kilopascal kilopascales"],
    ["bar", 1e5, "Bar", "bar", "bar bares"],
    ["psi", 6894.757293168, "PSI", "psi", "psi libras por pulgada cuadrada"],
    ["atm", 101325, "Atmósfera", "atm", "atm atmosfera atmosferas"],
    ["mmhg", 133.322387415, "Milímetro de mercurio", "mmHg", "mmhg milimetro de mercurio milimetros de mercurio"]
  ] },
  angulo: { n: "Ángulo", i: "📐", u: [
    ["deg", 1, "Grado", "°", "deg grado grados"],
    ["rad", 57.29577951308232, "Radián", "rad", "rad radian radianes"],
    ["grad", 0.9, "Gradián", "grad", "grad gradian gradianes"],
    ["vuelta", 360, "Vuelta", "rev", "rev vuelta vueltas revolucion revoluciones"]
  ] },
  temperatura: { n: "Temperatura", i: "🌡️", t: true, u: [
    ["c", 1, "Celsius", "°C", "c celsius centigrado centigrados grado celsius grados celsius grados centigrados"],
    ["f", 1, "Fahrenheit", "°F", "f fahrenheit grado fahrenheit grados fahrenheit"],
    ["k", 1, "Kelvin", "K", "k kelvin kelvins"]
  ] }
};

const FRASES = new Set([
  "metro cuadrado", "metros cuadrados", "kilometro cuadrado", "kilometros cuadrados", "centimetro cuadrado", "centimetros cuadrados",
  "pie cuadrado", "pies cuadrados", "pulgada cuadrada", "pulgadas cuadradas", "yarda cuadrada", "yardas cuadradas", "milla cuadrada",
  "millas cuadradas", "metro cubico", "metros cubicos", "centimetro cubico", "centimetros cubicos", "milla nautica", "millas nauticas",
  "galon uk", "galon imperial", "cuarto de galon", "fl oz", "onza liquida", "onzas liquidas", "metro por segundo", "metros por segundo",
  "kilometro por hora", "kilometros por hora", "milla por hora", "millas por hora", "pie por segundo", "pies por segundo", "vatio hora",
  "vatios hora", "kilovatio hora", "kilovatios hora", "libras por pulgada cuadrada", "milimetro de mercurio", "milimetros de mercurio",
  "caballo de fuerza", "caballos de fuerza", "caballo de vapor", "caballos de vapor", "grado celsius", "grados celsius", "grados centigrados",
  "grado fahrenheit", "grados fahrenheit"
]);

function alias(lista) {
  const p = lista.split(" ");
  const out = [];
  for (let i = 0; i < p.length; ) {
    let n = Math.min(5, p.length - i);
    while (n > 1 && !FRASES.has(p.slice(i, i + n).join(" "))) n--;
    out.push(p.slice(i, i + n).join(" "));
    i += n;
  }
  return out;
}

const DATOS = {};
const ALIAS = new Map();
for (const [id, c] of Object.entries(CATS)) {
  DATOS[id] = { n: c.n, i: c.i, t: !!c.t, u: Object.fromEntries(c.u.map((x) => [x[0], x[1]])), l: c.u.map((x) => [x[0], x[2], x[3]]) };
  for (const x of c.u) for (const a of [x[0], ...alias(x[4])]) if (!ALIAS.has(a)) ALIAS.set(a, [id, x[0]]);
}

function fmtU(n) {
  if (!isFinite(n)) return "—";
  if (n === 0) return "0";
  const a = Math.abs(n);
  if (a >= 1e15 || a < 1e-6) return n.toExponential(6).replace(/\.?0+e/, "e");
  return parseFloat(n.toPrecision(10)).toLocaleString("en-US", { maximumFractionDigits: 10 });
}

function convertirU(v, cat, de, a) {
  if (cat.t) {
    const c = de === "c" ? v : de === "f" ? ((v - 32) * 5) / 9 : v - 273.15;
    return a === "c" ? c : a === "f" ? (c * 9) / 5 + 32 : c + 273.15;
  }
  return (v * cat.u[de]) / cat.u[a];
}

function unidad(texto) {
  const t = normalizar(texto).replace(/[.,;:]+$/g, "").trim();
  if (!t) return null;
  if (ALIAS.has(t)) return ALIAS.get(t);
  const s = t.replace(/(es|s)$/, "");
  return ALIAS.has(s) ? ALIAS.get(s) : null;
}

export function analizar(args) {
  const t = normalizar(args);
  const m = t.match(/^(-?\d[\d.,]*)\s*(.*)$/);
  if (!m) return { error: "falta" };
  const valor = parseNumero(m[1]);
  if (!Number.isFinite(valor)) return { error: "numero" };
  const resto = m[2].replace(/^(de|en)\s+/, "").trim();
  if (!resto) return { error: "unidad" };
  let a = null;
  let b = null;
  const partes = resto.split(/\s*(?:->|→|=)\s*|\s+(?:a|en|to|into|hacia)\s+/);
  if (partes.length === 2) {
    a = unidad(partes[0]);
    b = unidad(partes[1]);
  } else {
    const p = resto.split(/\s+/);
    for (let k = 1; k < p.length && !(a && b); k++) {
      const x = unidad(p.slice(0, k).join(" "));
      const y = unidad(p.slice(k).join(" "));
      if (x && y && x[0] === y[0]) {
        a = x;
        b = y;
      }
    }
    if (!a) a = unidad(resto);
  }
  if (!a) return { error: "unidad" };
  if (b && b[0] !== a[0]) return { error: "categoria", de: a, a: b };
  return { valor, cat: a[0], de: a[1], a: b ? b[1] : null };
}

const CSS = `.tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tabs button{flex:none;border:1px solid var(--ln);background:transparent;border-radius:999px;padding:8px 13px;min-height:40px;font-size:14px;white-space:nowrap}
.tabs button.on{background:var(--acc);color:var(--on);border-color:var(--acc);font-weight:650}
.big{font-size:2.3rem;font-weight:700;line-height:1.15;word-break:break-all;font-variant-numeric:tabular-nums}
.big small{font-size:1rem;color:var(--acc);margin-left:6px;font-weight:650}
.fld{display:grid;grid-template-columns:1fr 44px 1fr;gap:8px;align-items:end;margin-top:12px}
.fld label{display:block;font-size:12px;color:var(--mut);margin-bottom:4px}
.fld .btn{padding:0;font-size:18px}
select.in{appearance:none;text-overflow:ellipsis}
.all{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
.all td{padding:9px 2px;border-bottom:1px solid var(--ln);cursor:pointer}
.all tr:last-child td{border-bottom:0}
.all td:last-child{text-align:right;word-break:break-all}
.all .s{color:var(--mut);font-size:12px;display:block}
.all tr.on td:first-child{color:var(--acc);font-weight:650}`;

function construirHtml({ valor, cat, de, a, firma }) {
  const cuerpo =
    '<div class="top"><div class="logo">🔁</div><b>Convertidor</b><span>' + Object.keys(DATOS).length + " categorías</span></div>" +
    '<div class="tabs" id="tabs"></div>' +
    '<div class="pn"><div class="big" id="res"></div>' +
    '<div class="fld"><div><label for="am">Cantidad</label><input class="in" id="am" inputmode="decimal" autocomplete="off" value="' + esc(String(valor)) + '"></div><span></span><span></span></div>' +
    '<div class="fld"><div><label for="de">De</label><select class="in" id="de"></select></div><button class="btn" id="sw" aria-label="Intercambiar">⇄</button><div><label for="a">A</label><select class="in" id="a"></select></div></div></div>' +
    '<div class="pn"><table class="all" id="all"></table></div>';
  const script = `var D=${json(DATOS)},C=${json(cat)},DE=${json(de)},A=${json(a)};
${fmtU.toString()}
${convertirU.toString()}
function $(i){return document.getElementById(i)}
function num(s){s=String(s).replace(/\\s/g,'');var c=s.lastIndexOf(','),p=s.lastIndexOf('.');if(c>=0&&p>=0)s=c>p?s.split('.').join('').replace(',','.'):s.split(',').join('');else if(c>=0)s=/^-?\\d{1,3}(,\\d{3})+$/.test(s)?s.split(',').join(''):s.replace(',','.');var n=Number(s);return isFinite(n)?n:NaN}
function tabs(){$('tabs').innerHTML=Object.keys(D).map(function(k){return '<button data-k="'+k+'"'+(k===C?' class="on"':'')+'>'+D[k].i+' '+D[k].n+'</button>'}).join('')}
function opts(){var l=D[C].l,h=l.map(function(u){return '<option value="'+u[0]+'">'+u[1]+(u[2]&&u[2]!==u[1]?' ('+u[2]+')':'')+'</option>'}).join('');$('de').innerHTML=h;$('a').innerHTML=h;$('de').value=DE;$('a').value=A}
function draw(){var v=num($('am').value),x=$('de').value,y=$('a').value,d=D[C];
if(isNaN(v)){$('res').textContent='—';$('all').innerHTML='';return}
var sy=function(i){for(var k=0;k<d.l.length;k++)if(d.l[k][0]===i)return d.l[k][2]};
$('res').innerHTML=fmtU(convertirU(v,d,x,y))+'<small>'+sy(y)+'</small>';
$('all').innerHTML=d.l.map(function(u){return '<tr data-u="'+u[0]+'"'+(u[0]===y?' class="on"':'')+'><td>'+u[1]+'<span class="s">'+u[2]+'</span></td><td>'+fmtU(convertirU(v,d,x,u[0]))+'</td></tr>'}).join('')}
function ir(k){C=k;var l=D[C].l;DE=l[0][0];A=l[1]?l[1][0]:l[0][0];tabs();opts();draw()}
$('tabs').onclick=function(e){var b=e.target.closest('button');if(b)ir(b.dataset.k)};
['am','de','a'].forEach(function(i){$(i).oninput=draw;$(i).onchange=draw});
$('sw').onclick=function(){var t=$('de').value;$('de').value=$('a').value;$('a').value=t;draw()};
$('all').onclick=function(e){var r=e.target.closest('tr');if(r){$('a').value=r.dataset.u;draw()}};
tabs();opts();draw();`;
  return pagina({ titulo: "Convertidor", acento: "#f4a259", cuerpo, css: CSS, script, firma });
}

export default {
  names: [".convertir", ".convierte", ".unidades", ".conv"],
  desc: "Convierte unidades de longitud, masa, volumen, temperatura, tiempo, datos, velocidad y más (funciona sin internet)",
  category: "Tools",
  usage: ".convertir <cantidad> <unidad> a <unidad>",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const args = cleanText.split(/\s+/).slice(1).join(" ").trim();
    const falta = limitarEspera(esperas, sender, ESPERA_MS);
    if (falta) return reply({ text: tarjetaAviso("CONVERTIDOR", `Espera ${falta}s antes de convertir de nuevo.`) });
    const firma = config.botNameShort || "MaxiProyec";

    let p = args ? analizar(args) : { valor: 1, cat: "longitud", de: "km", a: "mi" };
    if (p.error) {
      const nota =
        p.error === "categoria"
          ? "No puedo convertir entre tipos de unidad distintos (por ejemplo kilómetros a kilogramos)."
          : "No entendí la unidad o la cantidad.";
      return reply({
        text: tarjetaUso({
          comando: ".convertir <cantidad> <unidad> a <unidad>",
          ejemplo: ".convertir 5 km a millas   |   .convertir 100 f c   |   .convertir 2.5 gb a mb   |   .convertir 30 min a segundos",
          nota
        })
      });
    }
    const cat = DATOS[p.cat];
    const b = p.a || (cat.l.find((x) => x[0] !== p.de) || cat.l[0])[0];
    const sim = (id) => cat.l.find((x) => x[0] === id)[2];
    const nom = (id) => cat.l.find((x) => x[0] === id)[1];
    let texto = "";
    if (args) {
      const r = convertirU(p.valor, cat, p.de, b);
      texto =
        encabezado(CATS[p.cat].i, "CONVERTIDOR") + "\n\n" +
        `${fmtU(p.valor)} ${sim(p.de)} =\n*${fmtU(r)} ${sim(b)}*\n\n> ${nom(p.de)} → ${nom(b)}` +
        `\n\n> ⓘ Powered by ${firma}`;
    }
    try {
      if (typeof sock.sendHtml !== "function") throw new Error("sin sendHtml");
      await sock.sendHtml(from, construirHtml({ valor: p.valor, cat: p.cat, de: p.de, a: b, firma }), [], msg, {});
      if (texto) await sock.sendMessage(from, { text: texto }, { quoted: msg });
    } catch (e) {
      console.log("[CONVERTIR] HTML falló: " + e.message);
      if (!texto) return reply({ text: tarjetaAviso("CONVERTIDOR", "No pude abrir el convertidor. Prueba con .convertir 5 km a millas") });
      await sock.sendMessage(from, { text: texto }, { quoted: msg });
    }
  }
};
