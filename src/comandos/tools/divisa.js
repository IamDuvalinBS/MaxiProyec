import fs from "fs";
import path from "path";
import { config } from "../../../motores/db.js";
import { tarjetaUso, tarjetaAviso } from "../../descargas/tarjetas.js";
import { encabezado } from "../../economia/estilo.js";
import { pedirJson } from "../../../motores/herramientas-red.js";
import { pagina, esc, json, normalizar, parseNumero, limitarEspera } from "../../../motores/herramientas-ui.js";

const ESPERA_MS = 3000;
const VIGENCIA_MS = 45 * 60 * 1000;
const ARCHIVO = path.resolve("./data/tasas.json");
const POPULARES = ["USD", "MXN", "EUR", "GBP", "JPY", "CAD", "BRL", "ARS", "COP", "CLP", "PEN"];
const esperas = new Map();

const MONEDAS = [
  ["USD", "Dólar estadounidense", "dolar dolares usd dolar americano dolar estadounidense dolares americanos dolares estadounidenses billete verde"],
  ["MXN", "Peso mexicano", "peso pesos mxn peso mexicano pesos mexicanos mex"],
  ["EUR", "Euro", "euro euros eur"],
  ["GBP", "Libra esterlina", "libra libras gbp libra esterlina libras esterlinas esterlina"],
  ["JPY", "Yen japonés", "yen yenes jpy yen japones"],
  ["CAD", "Dólar canadiense", "cad dolar canadiense dolares canadienses"],
  ["AUD", "Dólar australiano", "aud dolar australiano dolares australianos"],
  ["NZD", "Dólar neozelandés", "nzd dolar neozelandes"],
  ["CHF", "Franco suizo", "chf franco suizo francos suizos franco"],
  ["CNY", "Yuan chino", "cny yuan yuanes renminbi rmb yuan chino"],
  ["KRW", "Won surcoreano", "krw won wones"],
  ["INR", "Rupia india", "inr rupia rupias rupia india"],
  ["BRL", "Real brasileño", "brl real reales real brasileno reales brasilenos"],
  ["ARS", "Peso argentino", "ars peso argentino pesos argentinos"],
  ["COP", "Peso colombiano", "cop peso colombiano pesos colombianos"],
  ["CLP", "Peso chileno", "clp peso chileno pesos chilenos"],
  ["UYU", "Peso uruguayo", "uyu peso uruguayo pesos uruguayos"],
  ["DOP", "Peso dominicano", "dop peso dominicano pesos dominicanos"],
  ["CUP", "Peso cubano", "cup peso cubano pesos cubanos"],
  ["PEN", "Sol peruano", "pen sol soles sol peruano soles peruanos"],
  ["BOB", "Boliviano", "bob boliviano bolivianos"],
  ["PYG", "Guaraní paraguayo", "pyg guarani guaranies"],
  ["VES", "Bolívar venezolano", "ves bolivar bolivares vef"],
  ["GTQ", "Quetzal guatemalteco", "gtq quetzal quetzales"],
  ["HNL", "Lempira hondureño", "hnl lempira lempiras"],
  ["NIO", "Córdoba nicaragüense", "nio cordoba cordobas"],
  ["CRC", "Colón costarricense", "crc colon colones"],
  ["PAB", "Balboa panameño", "pab balboa balboas"],
  ["RUB", "Rublo ruso", "rub rublo rublos"],
  ["TRY", "Lira turca", "try lira liras lira turca"],
  ["SEK", "Corona sueca", "sek corona sueca coronas suecas"],
  ["NOK", "Corona noruega", "nok corona noruega coronas noruegas"],
  ["DKK", "Corona danesa", "dkk corona danesa coronas danesas"],
  ["PLN", "Esloti polaco", "pln esloti zloty"],
  ["CZK", "Corona checa", "czk corona checa coronas checas"],
  ["HUF", "Forinto húngaro", "huf forinto forintos"],
  ["ZAR", "Rand sudafricano", "zar rand rands"],
  ["EGP", "Libra egipcia", "egp libra egipcia libras egipcias"],
  ["AED", "Dirham emiratí", "aed dirham dirhams"],
  ["SAR", "Rial saudí", "sar rial saudi riyal"],
  ["ILS", "Séquel israelí", "ils shekel sequel"],
  ["THB", "Baht tailandés", "thb baht bat"],
  ["SGD", "Dólar de Singapur", "sgd dolar de singapur"],
  ["HKD", "Dólar de Hong Kong", "hkd dolar de hong kong"],
  ["TWD", "Dólar taiwanés", "twd dolar taiwanes nuevo dolar taiwanes"],
  ["IDR", "Rupia indonesia", "idr rupia indonesia"],
  ["PHP", "Peso filipino", "php peso filipino pesos filipinos"],
  ["VND", "Dong vietnamita", "vnd dong"],
  ["MYR", "Ringgit malayo", "myr ringgit"],
  ["UAH", "Grivna ucraniana", "uah grivna grivnas"],
  ["NGN", "Naira nigeriano", "ngn naira"],
  ["BTC", "Bitcoin", "btc bitcoin bitcoins"]
];

const NOMBRES = Object.fromEntries(MONEDAS.map(([c, n]) => [c, n]));
const ALIAS = new Map();
for (const [codigo, , alias] of MONEDAS) {
  ALIAS.set(codigo.toLowerCase(), codigo);
  const frases = alias.split(" ");
  for (let i = 0; i < frases.length; i++) {
    ALIAS.set(frases[i], ALIAS.get(frases[i]) || codigo);
    if (i + 1 < frases.length) ALIAS.set(frases[i] + " " + frases[i + 1], ALIAS.get(frases[i] + " " + frases[i + 1]) || codigo);
    if (i + 2 < frases.length) ALIAS.set(frases[i] + " " + frases[i + 1] + " " + frases[i + 2], codigo);
  }
}
ALIAS.set("peso", "MXN");
ALIAS.set("pesos", "MXN");
ALIAS.set("dolar", "USD");
ALIAS.set("dolares", "USD");

function fmtNum(n) {
  if (!isFinite(n)) return "—";
  const a = Math.abs(n);
  if (a === 0) return "0";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: a >= 1 ? 2 : 0,
    maximumFractionDigits: a >= 1 ? 2 : a >= 0.01 ? 4 : 8
  });
}

let cache = null;
try {
  if (fs.existsSync(ARCHIVO)) cache = JSON.parse(fs.readFileSync(ARCHIVO, "utf8"));
} catch {
  cache = null;
}

async function descargarTasas() {
  try {
    const d = await pedirJson("https://open.er-api.com/v6/latest/USD");
    if (d?.result === "success" && d.rates?.USD) return d.rates;
  } catch (e) {
    console.log("[DIVISA] principal falló: " + e.message);
  }
  const d = await pedirJson("https://api.frankfurter.app/latest?from=USD");
  if (d?.rates) return { USD: 1, ...d.rates };
  throw new Error("sin tasas");
}

export async function obtenerTasas() {
  const ahora = Date.now();
  if (cache?.rates && ahora - cache.t < VIGENCIA_MS) return { ...cache, vieja: false };
  try {
    const rates = await descargarTasas();
    cache = { t: ahora, rates };
    try {
      fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
      fs.writeFileSync(ARCHIVO, JSON.stringify(cache));
    } catch {}
    return { ...cache, vieja: false };
  } catch (e) {
    if (cache?.rates) return { ...cache, vieja: true };
    throw e;
  }
}

function resolver(texto, rates) {
  let t = normalizar(texto).replace(/[.,;:]+$/g, "").trim();
  if (!t) return null;
  if (ALIAS.has(t)) return ALIAS.get(t);
  if (/^[a-z]{3}$/.test(t) && rates[t.toUpperCase()]) return t.toUpperCase();
  const sing = t.replace(/(es|s)$/, "");
  if (ALIAS.has(sing)) return ALIAS.get(sing);
  return null;
}

export function analizar(args, rates) {
  const SIM = { "$": "usd", "€": "eur", "£": "gbp", "¥": "jpy" };
  let t = String(args || "")
    .replace(/([$€£¥])\s*(\d[\d.,]*)/g, (_, s, n) => n + " " + SIM[s] + " ")
    .replace(/\$/g, " usd ")
    .replace(/€/g, " eur ")
    .replace(/£/g, " gbp ")
    .replace(/¥/g, " jpy ");
  t = normalizar(t);
  const m = t.match(/^(-?\d[\d.,]*)?\s*(.*)$/);
  let monto = m[1] ? parseNumero(m[1]) : 1;
  if (!Number.isFinite(monto)) monto = 1;
  const resto = m[2].trim();
  let de = null;
  let a = null;
  const partes = resto.split(/\s+(?:a|en|to|into|hacia|->|→)\s+/);
  if (partes.length === 2) {
    de = resolver(partes[0], rates);
    a = resolver(partes[1], rates);
  } else if (resto) {
    const p = resto.split(/\s+/);
    for (let k = 1; k <= p.length && !(de && a); k++) {
      const x = resolver(p.slice(0, k).join(" "), rates);
      const y = k < p.length ? resolver(p.slice(k).join(" "), rates) : null;
      if (x && y) {
        de = x;
        a = y;
      }
    }
    if (!de && resolver(resto, rates)) de = resolver(resto, rates);
  }
  return { monto, de, a, resto };
}

function hace(ms) {
  const m = Math.max(1, Math.round(ms / 60000));
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  return h < 48 ? `hace ${h} h` : `hace ${Math.round(h / 24)} días`;
}

const CSS = `.big{font-size:2.5rem;font-weight:700;line-height:1.1;word-break:break-all;font-variant-numeric:tabular-nums}
.big small{font-size:1rem;color:var(--acc);margin-left:6px;font-weight:650}
.rate{color:var(--mut);margin-top:6px;font-size:14px}
.fld{display:grid;grid-template-columns:1fr 44px 1fr;gap:8px;align-items:end;margin-top:10px}
.fld label{display:block;font-size:12px;color:var(--mut);margin-bottom:4px}
.fld .btn{padding:0;font-size:18px}
select.in{appearance:none;text-overflow:ellipsis}
.tab{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
.tab td{padding:9px 2px;border-bottom:1px solid var(--ln);cursor:pointer}
.tab tr:last-child td{border-bottom:0}
.tab td:first-child{font-weight:650;width:56px}
.tab td:last-child{text-align:right}
.tab tr.on td:first-child{color:var(--acc)}
.warn{color:#f2b84b;font-size:13px;margin-bottom:10px}`;

function construirHtml({ monto, de, a, tasas, firma }) {
  const codigos = Object.keys(tasas.rates).sort();
  const opciones = (sel) =>
    codigos.map((c) => '<option value="' + c + '"' + (c === sel ? " selected" : "") + ">" + c + (NOMBRES[c] ? " · " + esc(NOMBRES[c]) : "") + "</option>").join("");
  const cuerpo =
    '<div class="top"><div class="logo">💱</div><b>Divisas</b><span>Tasas ' + esc(hace(Date.now() - tasas.t)) + "</span></div>" +
    (tasas.vieja ? '<div class="warn">Sin conexión con el servicio de tasas: uso las últimas guardadas.</div>' : "") +
    '<div class="pn"><div class="big" id="res"></div><div class="rate" id="rt"></div>' +
    '<div class="fld"><div><label for="am">Cantidad</label><input class="in" id="am" inputmode="decimal" autocomplete="off" value="' + esc(String(monto)) + '"></div><span></span><span></span></div>' +
    '<div class="fld"><div><label for="de">De</label><select class="in" id="de">' + opciones(de) + '</select></div>' +
    '<button class="btn" id="sw" aria-label="Intercambiar">⇄</button>' +
    '<div><label for="a">A</label><select class="in" id="a">' + opciones(a) + "</select></div></div></div>" +
    '<div class="pn"><div class="mut" id="tt"></div><table class="tab" id="tb"></table></div>';
  const script = `var R=${json(tasas.rates)},POP=${json(POPULARES)};
${fmtNum.toString()}
function $(i){return document.getElementById(i)}
function num(s){s=String(s).replace(/\\s/g,'');var c=s.lastIndexOf(','),p=s.lastIndexOf('.');if(c>=0&&p>=0)s=c>p?s.split('.').join('').replace(',','.'):s.split(',').join('');else if(c>=0)s=/^\\d{1,3}(,\\d{3})+$/.test(s)?s.split(',').join(''):s.replace(',','.');var n=Number(s);return isFinite(n)?n:NaN}
function cv(v,x,y){return v*R[y]/R[x]}
function draw(){var v=num($('am').value),x=$('de').value,y=$('a').value;
if(isNaN(v)){$('res').textContent='—';$('rt').textContent='Escribe una cantidad';return}
$('res').innerHTML=fmtNum(cv(v,x,y))+'<small>'+y+'</small>';
$('rt').textContent='1 '+x+' = '+fmtNum(cv(1,x,y))+' '+y;
$('tt').textContent=fmtNum(v)+' '+x+' equivale a';
$('tb').innerHTML=POP.filter(function(c){return c!==x&&R[c]}).map(function(c){return '<tr data-c="'+c+'"'+(c===y?' class="on"':'')+'><td>'+c+'</td><td>'+fmtNum(cv(v,x,c))+'</td></tr>'}).join('')}
['am','de','a'].forEach(function(i){$(i).oninput=draw;$(i).onchange=draw});
$('sw').onclick=function(){var t=$('de').value;$('de').value=$('a').value;$('a').value=t;draw()};
$('tb').onclick=function(e){var r=e.target.closest('tr');if(r){$('a').value=r.dataset.c;draw()}};
draw();`;
  return pagina({ titulo: "Divisas", acento: "#7bd88f", cuerpo, css: CSS, script, firma });
}

export default {
  names: [".divisa", ".divisas", ".moneda", ".cambio", ".usd"],
  desc: "Convierte monedas con las tasas del día (más de 150) y un convertidor interactivo",
  category: "Tools",
  usage: ".divisa <cantidad> <moneda> a <moneda>",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const args = cleanText.split(/\s+/).slice(1).join(" ").trim();
    const falta = limitarEspera(esperas, sender, ESPERA_MS);
    if (falta) return reply({ text: tarjetaAviso("DIVISAS", `Espera ${falta}s antes de convertir de nuevo.`) });

    let tasas;
    try {
      tasas = await obtenerTasas();
    } catch (e) {
      console.log("[DIVISA] ERROR: " + e.message);
      return reply({ text: tarjetaAviso("DIVISAS", "No pude obtener las tasas ahora mismo. Intenta de nuevo en un momento.") });
    }

    const p = analizar(args, tasas.rates);
    if (args && !p.de) {
      return reply({
        text: tarjetaUso({
          comando: ".divisa <cantidad> <moneda> a <moneda>",
          ejemplo: ".divisa 100 usd mxn   |   .divisa 500 pesos a dolares   |   .divisa 20 euros a pesos",
          nota: "No reconocí la moneda. Puedes usar el código (USD, MXN, EUR…) o el nombre."
        })
      });
    }
    const de = p.de || "USD";
    const a = p.a || (de === "MXN" ? "USD" : "MXN");
    if (!tasas.rates[de] || !tasas.rates[a]) {
      return reply({ text: tarjetaAviso("DIVISAS", "Esa moneda no tiene tasa disponible en este momento.") });
    }
    const resultado = (p.monto * tasas.rates[a]) / tasas.rates[de];
    const unidad = (tasas.rates[a] / tasas.rates[de]);
    const firma = config.botNameShort || "MaxiProyec";
    const texto =
      encabezado("💱", "DIVISAS") + "\n\n" +
      `${fmtNum(p.monto)} ${de} =\n*${fmtNum(resultado)} ${a}*\n\n` +
      `> 1 ${de} = ${fmtNum(unidad)} ${a}\n> Tasas ${hace(Date.now() - tasas.t)}${tasas.vieja ? " (sin conexión, últimas guardadas)" : ""}` +
      `\n\n> ⓘ Powered by ${firma}`;
    try {
      if (typeof sock.sendHtml !== "function") throw new Error("sin sendHtml");
      await sock.sendHtml(from, construirHtml({ monto: p.monto, de, a, tasas, firma }), [], msg, {});
    } catch (e) {
      console.log("[DIVISA] HTML falló: " + e.message);
    }
    await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
