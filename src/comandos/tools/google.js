import axios from "axios";
import { config } from "../../../motores/db.js";
import { tarjetaUso, tarjetaAviso } from "../../descargas/tarjetas.js";

const ESPERA_MS = 8000;
const CACHE_MS = 5 * 60 * 1000;
const CACHE_MAX = 60;
const MAX_RESULTADOS = 6;
const UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";

const esperas = new Map();
const cache = new Map();

const ZONAS = {
  mexico: ["America/Mexico_City", "México"],
  cdmx: ["America/Mexico_City", "Ciudad de México"],
  chiapas: ["America/Mexico_City", "Chiapas"],
  cancun: ["America/Cancun", "Cancún"],
  tijuana: ["America/Tijuana", "Tijuana"],
  monterrey: ["America/Monterrey", "Monterrey"],
  bogota: ["America/Bogota", "Bogotá"],
  colombia: ["America/Bogota", "Colombia"],
  lima: ["America/Lima", "Lima"],
  peru: ["America/Lima", "Perú"],
  quito: ["America/Guayaquil", "Quito"],
  ecuador: ["America/Guayaquil", "Ecuador"],
  caracas: ["America/Caracas", "Caracas"],
  venezuela: ["America/Caracas", "Venezuela"],
  santiago: ["America/Santiago", "Santiago"],
  chile: ["America/Santiago", "Chile"],
  "buenos aires": ["America/Argentina/Buenos_Aires", "Buenos Aires"],
  argentina: ["America/Argentina/Buenos_Aires", "Argentina"],
  brasil: ["America/Sao_Paulo", "Brasil"],
  "sao paulo": ["America/Sao_Paulo", "São Paulo"],
  "nueva york": ["America/New_York", "Nueva York"],
  "new york": ["America/New_York", "Nueva York"],
  miami: ["America/New_York", "Miami"],
  chicago: ["America/Chicago", "Chicago"],
  "los angeles": ["America/Los_Angeles", "Los Ángeles"],
  madrid: ["Europe/Madrid", "Madrid"],
  espana: ["Europe/Madrid", "España"],
  londres: ["Europe/London", "Londres"],
  paris: ["Europe/Paris", "París"],
  berlin: ["Europe/Berlin", "Berlín"],
  roma: ["Europe/Rome", "Roma"],
  moscu: ["Europe/Moscow", "Moscú"],
  dubai: ["Asia/Dubai", "Dubái"],
  india: ["Asia/Kolkata", "India"],
  pekin: ["Asia/Shanghai", "Pekín"],
  china: ["Asia/Shanghai", "China"],
  tokio: ["Asia/Tokyo", "Tokio"],
  japon: ["Asia/Tokyo", "Japón"],
  seul: ["Asia/Seoul", "Seúl"],
  sidney: ["Australia/Sydney", "Sídney"]
};

const ZONA_POR_DEFECTO = ["America/Mexico_City", "Ciudad de México"];

const MODOS = {
  info: { etiqueta: "Info", emoji: "📖" },
  precio: { etiqueta: "Precio", emoji: "🏷️" },
  codigo: { etiqueta: "Código", emoji: "💻" }
};

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const sinTildes = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const limpiar = (s) => sinTildes(s).toLowerCase().replace(/[¿?¡!.,;:]/g, " ").replace(/\s+/g, " ").trim();

const recortar = (s, n) => {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
};

function decodificar(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function dominioDe(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function resolverEnlace(href) {
  let url = decodificar(href);
  if (url.startsWith("//")) url = "https:" + url;
  try {
    const u = new URL(url);
    const real = u.searchParams.get("uddg");
    if (real) return decodeURIComponent(real);
  } catch {
    return null;
  }
  return /^https?:\/\//i.test(url) ? url : null;
}

function evaluarMatematica(texto) {
  const src = texto.replace(/×|x(?=\s*\d)/gi, "*").replace(/÷/g, "/").replace(/\^/g, "**").replace(/,/g, ".").replace(/\s+/g, "");
  let i = 0;
  const peek = () => src[i];
  function numero() {
    const m = /^\d+(?:\.\d+)?/.exec(src.slice(i));
    if (!m) throw new Error("num");
    i += m[0].length;
    return parseFloat(m[0]);
  }
  function primario() {
    if (peek() === "-") {
      i++;
      return -primario();
    }
    if (peek() === "+") {
      i++;
      return primario();
    }
    if (peek() === "(") {
      i++;
      const v = suma();
      if (peek() !== ")") throw new Error("par");
      i++;
      return v;
    }
    return numero();
  }
  function potencia() {
    let v = primario();
    while (src.startsWith("**", i)) {
      i += 2;
      v = Math.pow(v, primario());
    }
    while (peek() === "%") {
      i++;
      v /= 100;
    }
    return v;
  }
  function producto() {
    let v = potencia();
    while (peek() === "*" || peek() === "/") {
      const op = src[i++];
      const d = potencia();
      v = op === "*" ? v * d : v / d;
    }
    return v;
  }
  function suma() {
    let v = producto();
    while (peek() === "+" || peek() === "-") {
      const op = src[i++];
      const d = producto();
      v = op === "+" ? v + d : v - d;
    }
    return v;
  }
  const r = suma();
  if (i !== src.length || !Number.isFinite(r)) throw new Error("fin");
  return r;
}

function respuestaCalculo(q) {
  const t = q.replace(/^cuanto es\s+/i, "").replace(/=\s*$/, "").trim();
  if (!/^[\d\s+\-*/().,%^x×÷]+$/i.test(t) || !/[+\-*/%^x×÷]/.test(t.replace(/^-/, "")) || !/\d/.test(t)) return null;
  try {
    const r = evaluarMatematica(t);
    const texto = Number.isInteger(r) ? String(r) : String(Number(r.toFixed(8)));
    return { tipo: "calculo", titulo: "Calculadora", grande: texto, detalle: t.replace(/\s+/g, " ") + " =" };
  } catch {
    return null;
  }
}

function buscarZona(q) {
  const t = limpiar(q);
  const claves = Object.keys(ZONAS).sort((a, b) => b.length - a.length);
  for (const k of claves) {
    if (new RegExp("(^|\\s)" + k + "(\\s|$)").test(t)) return ZONAS[k];
  }
  return null;
}

function respuestaHora(q) {
  const t = limpiar(q);
  if (!/(^|\s)hora(\s|$)/.test(t) || t.split(" ").length > 8) return null;
  const [zona, nombre] = buscarZona(q) || ZONA_POR_DEFECTO;
  const ahora = new Date();
  const hora = new Intl.DateTimeFormat("es-MX", { timeZone: zona, hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }).format(ahora);
  const fecha = new Intl.DateTimeFormat("es-MX", { timeZone: zona, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(ahora);
  const gmt = new Intl.DateTimeFormat("en-US", { timeZone: zona, timeZoneName: "shortOffset" }).formatToParts(ahora).find((p) => p.type === "timeZoneName")?.value || "";
  return {
    tipo: "hora",
    titulo: "Hora actual",
    grande: hora.replace(/\s?([ap])\.?\s?m\.?/i, (_, l) => " " + l.toLowerCase() + ".m."),
    detalle: `${fecha} (${gmt})`,
    lugar: nombre,
    zona
  };
}

function respuestaFecha(q) {
  const t = limpiar(q);
  if (!/(^|\s)(fecha|que dia es|dia es hoy|que fecha)(\s|$)/.test(t) || t.split(" ").length > 7) return null;
  const [zona, nombre] = buscarZona(q) || ZONA_POR_DEFECTO;
  const ahora = new Date();
  const dia = new Intl.DateTimeFormat("es-MX", { timeZone: zona, weekday: "long" }).format(ahora);
  const resto = new Intl.DateTimeFormat("es-MX", { timeZone: zona, day: "numeric", month: "long", year: "numeric" }).format(ahora);
  return { tipo: "fecha", titulo: "Fecha de hoy", grande: dia.charAt(0).toUpperCase() + dia.slice(1), detalle: resto, lugar: nombre };
}

function respuestaInstantanea(q) {
  return respuestaCalculo(q) || respuestaHora(q) || respuestaFecha(q);
}

function detectarModo(texto) {
  const palabras = texto.trim().split(/\s+/);
  const primera = sinTildes(palabras[0] || "").toLowerCase();
  if (palabras.length > 1 && MODOS[primera]) return { modo: primera, consulta: palabras.slice(1).join(" ") };
  if (/^(precio|cuanto cuesta|cuanto vale|costo)\b/.test(limpiar(texto))) return { modo: "precio", consulta: texto };
  if (/(^|\s)(codigo|script|funcion|como hacer un)(\s|$)/.test(limpiar(texto))) return { modo: "codigo", consulta: texto };
  return { modo: "info", consulta: texto };
}

function consultaParaBuscar(modo, consulta) {
  if (modo === "precio") return /precio|costo|cuesta/i.test(consulta) ? consulta + " comprar" : consulta + " precio comprar";
  if (modo === "codigo") return consulta + " código ejemplo";
  return consulta;
}

async function buscarWeb(consulta) {
  const clave = consulta.toLowerCase();
  const previo = cache.get(clave);
  if (previo && Date.now() - previo.t < CACHE_MS) return previo.datos;

  const { data } = await axios.post(
    "https://html.duckduckgo.com/html/",
    new URLSearchParams({ q: consulta, kl: "mx-es" }).toString(),
    {
      timeout: 12000,
      headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded", "Accept-Language": "es-MX,es;q=0.9" },
      responseType: "text"
    }
  );

  const bloques = String(data).split(/<div[^>]+class="[^"]*\bresult\b[^"]*"/).slice(1);
  const resultados = [];
  const vistos = new Set();
  for (const b of bloques) {
    if (/result--ad/.test(b.slice(0, 120))) continue;
    const a = /<a[^>]+class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/.exec(b);
    if (!a) continue;
    const url = resolverEnlace(a[1]);
    if (!url || /duckduckgo\.com\/y\.js/.test(url)) continue;
    const dominio = dominioDe(url);
    if (vistos.has(url)) continue;
    vistos.add(url);
    const s = /<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/.exec(b) || /<td[^>]+class="[^"]*result-snippet[^"]*"[^>]*>([\s\S]*?)<\/td>/.exec(b);
    resultados.push({ titulo: recortar(decodificar(a[2]), 90), url, dominio, texto: recortar(decodificar(s ? s[1] : ""), 230) });
    if (resultados.length >= MAX_RESULTADOS) break;
  }

  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(clave, { t: Date.now(), datos: resultados });
  return resultados;
}

function extraerPrecios(resultados) {
  const filas = [];
  const re = /(?:US\$|MX\$|MXN|USD|\$)\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?(?:\s?(?:MXN|USD|pesos|dólares))?/i;
  for (const r of resultados) {
    const m = re.exec(r.titulo + " " + r.texto);
    if (m) filas.push({ sitio: r.dominio, precio: m[0].trim(), url: r.url });
  }
  return filas;
}

function urlGoogle(consulta) {
  return "https://www.google.com/search?q=" + encodeURIComponent(consulta);
}

const CSS = `
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;padding:10px;background:#090a10;color:#eef0fa;font-family:Roboto,Arial,sans-serif}
.w{max-width:440px;margin:0 auto;background:#12141f;border:2px solid #252941;border-radius:26px;overflow:hidden}
.bar{display:flex;height:5px}.bar i{flex:1}.bar i:nth-child(1){background:#4c8dff}.bar i:nth-child(2){background:#ff5a5f}.bar i:nth-child(3){background:#ffc83d}.bar i:nth-child(4){background:#3ddc84}
.h{padding:16px 18px 12px}
.h small{display:block;font-size:10px;letter-spacing:2.5px;color:#7f86a8;margin-bottom:10px}
.q{display:flex;align-items:center;gap:10px;background:#0b0d16;border:2px solid #252941;border-radius:999px;padding:11px 16px;font-size:15px}
.q span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chips{display:flex;gap:6px;margin-top:10px}
.chip{padding:5px 12px;border-radius:999px;border:2px solid #252941;font-size:11px;letter-spacing:.5px;color:#8f96b8}
.chip.on{background:#4c8dff;border-color:#4c8dff;color:#fff;font-weight:bold}
.ans{margin:4px 14px 12px;padding:18px;border-radius:20px;background:linear-gradient(135deg,#1b2140,#151a30);border:2px solid #2d3560}
.ans small{display:block;font-size:10px;letter-spacing:2px;color:#8f9ad0;margin-bottom:6px}
.big{font-size:36px;font-weight:bold;line-height:1.1;word-break:break-word}
.det{margin-top:6px;font-size:13px;color:#a8b0d8;text-transform:capitalize}
.lug{margin-top:10px;display:inline-block;padding:4px 12px;border-radius:999px;background:#0b0d16;font-size:11px;color:#8f9ad0}
.res{padding:0 14px 6px}
.sec{font-size:10px;letter-spacing:2px;color:#7f86a8;margin:6px 4px 8px}
.r{display:block;margin-bottom:9px;padding:13px 14px;border-radius:18px;background:#181b2b;border:2px solid #252941;text-decoration:none;color:inherit}
.r:active{background:#20243a}
.d{font-size:11px;color:#3ddc84;margin-bottom:3px}
.t{font-size:15px;font-weight:bold;color:#8ab4ff;line-height:1.25}
.x{font-size:12.5px;color:#a3a9c9;margin-top:5px;line-height:1.4}
table{width:100%;border-collapse:collapse;margin-bottom:10px;border-radius:16px;overflow:hidden;font-size:13px}
th{background:#1d2140;color:#8f9ad0;font-size:10px;letter-spacing:1.5px;text-align:left;padding:9px 12px}
td{background:#171a2a;padding:10px 12px;border-top:1px solid #252941}
td b{color:#ffc83d}
.go{display:block;margin:4px 14px 12px;padding:15px;border-radius:16px;background:#4c8dff;color:#fff;text-align:center;text-decoration:none;font-weight:bold;font-size:14px;letter-spacing:.5px}
.go:active{transform:scale(.98)}
.none{padding:18px;text-align:center;color:#a3a9c9;font-size:14px}
.foot{display:flex;align-items:center;justify-content:center;gap:6px;padding:4px 0 15px;font-size:11px;color:#7d8197}
`;

function bloqueRespuesta(r) {
  const lugar = r.lugar ? `<div class="lug">📍 ${esc(r.lugar)}</div>` : "";
  return `<div class="ans"><small>${esc(r.titulo.toUpperCase())}</small><div class="big" id="big">${esc(r.grande)}</div><div class="det">${esc(r.detalle)}</div>${lugar}</div>`;
}

function scriptReloj(r) {
  if (r.tipo !== "hora") return "";
  return `<script>(function(){var e=document.getElementById("big");if(!e)return;try{var f=new Intl.DateTimeFormat("es-MX",{timeZone:${JSON.stringify(r.zona)},hour:"numeric",minute:"2-digit",second:"2-digit",hour12:true});setInterval(function(){e.textContent=f.format(new Date()).replace(/\\s?([ap])\\.?\\s?m\\.?/i,function(m,l){return " "+l.toLowerCase()+".m."})},1000)}catch(x){}})();</script>`;
}

function bloqueResultados(resultados, modo) {
  if (!resultados.length) return `<div class="none">No encontré resultados para esa búsqueda.</div>`;
  let precios = "";
  if (modo === "precio") {
    const filas = extraerPrecios(resultados);
    if (filas.length) {
      precios =
        `<div class="sec">TABLA DE PRECIOS</div><table><tr><th>SITIO</th><th>PRECIO</th></tr>` +
        filas.map((f) => `<tr><td><a style="color:#8ab4ff;text-decoration:none" href="${esc(f.url)}" target="_blank">${esc(f.sitio)}</a></td><td><b>${esc(f.precio)}</b></td></tr>`).join("") +
        `</table>`;
    }
  }
  const tarjetas = resultados
    .map(
      (r) =>
        `<a class="r" href="${esc(r.url)}" target="_blank" rel="noopener"><div class="d">${esc(r.dominio)}</div><div class="t">${esc(r.titulo)}</div>${r.texto ? `<div class="x">${esc(r.texto)}</div>` : ""}</a>`
    )
    .join("");
  return `${precios}<div class="sec">FUENTES · ${resultados.length}</div>${tarjetas}`;
}

function armarHtml({ consulta, modo, instantanea, resultados, firma }) {
  const chips = Object.entries(MODOS)
    .map(([id, m]) => `<span class="chip${id === modo ? " on" : ""}">${m.emoji} ${m.etiqueta}</span>`)
    .join("");
  const cuerpo = instantanea ? bloqueRespuesta(instantanea) : "";
  const lista = resultados ? `<div class="res">${bloqueResultados(resultados, modo)}</div>` : "";
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><style>${CSS}</style></head><body><div class="w"><div class="bar"><i></i><i></i><i></i><i></i></div><div class="h"><small>TOOLS · BUSCADOR</small><div class="q"><span>🔎</span><span>${esc(consulta)}</span></div><div class="chips">${chips}</div></div>${cuerpo}${lista}<a class="go" href="${esc(urlGoogle(consulta))}" target="_blank" rel="noopener">🔎 Ver en Google</a><div class="foot"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6.7"/><path d="M8 7v4.2M8 4.7v.1" stroke-linecap="round"/></svg>Powered by ${esc(firma)}</div></div>${instantanea ? scriptReloj(instantanea) : ""}</body></html>`;
}

function textoRespaldo({ consulta, instantanea, resultados }) {
  const partes = [`🔎 *GOOGLE*`, `> ${consulta}`];
  if (instantanea) partes.push("", `*${instantanea.titulo}::*`, `> ${instantanea.grande} · ${instantanea.detalle}`);
  if (resultados && resultados.length) {
    partes.push("", ...resultados.slice(0, 5).map((r) => `✿ *${r.titulo}*\n> ${r.texto}\n> ${r.url}`));
  }
  partes.push("", `> Ver en Google: ${urlGoogle(consulta)}`);
  return partes.join("\n");
}

export default {
  names: [".google", ".buscar"],
  desc: "Busca en internet con fuentes. Responde al instante hora, fecha y cálculos. Modos: info, precio, codigo",
  category: "Tools",
  usage: ".google <búsqueda>",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const texto = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!texto) {
      return reply({
        text: tarjetaUso({
          comando: ".google <búsqueda>",
          ejemplo: ".google qué hora es   |   .google precio iphone 15   |   .google codigo for en python",
          nota: "Modos: info, precio y codigo. También resuelve hora, fecha y operaciones como 25*4+10."
        })
      });
    }

    const ahora = Date.now();
    const ultima = esperas.get(sender) || 0;
    if (ahora - ultima < ESPERA_MS) {
      const falta = Math.ceil((ESPERA_MS - (ahora - ultima)) / 1000);
      return reply({ text: tarjetaAviso("GOOGLE", `Espera ${falta}s antes de buscar de nuevo.`) });
    }
    esperas.set(sender, ahora);
    if (esperas.size > 500) esperas.delete(esperas.keys().next().value);

    const { modo, consulta } = detectarModo(texto);
    const instantanea = respuestaInstantanea(consulta);
    const firma = config.botNameShort || "MaxiProyec";

    let resultados = null;
    if (!instantanea) {
      try {
        resultados = await buscarWeb(consultaParaBuscar(modo, consulta));
      } catch (e) {
        console.log("[GOOGLE] ERROR: " + e.message);
        esperas.delete(sender);
        return reply({ text: tarjetaAviso("GOOGLE", "No pude conectar con el buscador ahora mismo. Intenta de nuevo en unos segundos.") });
      }
    }

    try {
      if (typeof sock.sendHtml !== "function") throw new Error("sin sendHtml");
      const html = armarHtml({ consulta, modo, instantanea, resultados, firma });
      await sock.sendHtml(from, html, [], undefined, {});
    } catch (e) {
      console.log("[GOOGLE] HTML falló: " + e.message);
      await sock.sendMessage(from, { text: textoRespaldo({ consulta, instantanea, resultados }) }, { quoted: msg });
    }
  }
};
