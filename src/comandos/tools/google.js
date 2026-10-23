import axios from "axios";
import { config } from "../../../motores/db.js";
import { tarjetaUso, tarjetaAviso } from "../../descargas/tarjetas.js";

const ESPERA_MS = 8000;
const CACHE_MS = 5 * 60 * 1000;
const CACHE_MAX = 60;
const MAX_RESULTADOS = 6;

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

// --- LÓGICA DE INSTANTÁNEAS (Hora, Fecha, Cálculo) ---
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
    if (peek() === "-") { i++; return -primario(); }
    if (peek() === "+") { i++; return primario(); }
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
    while (src.startsWith("**", i)) { i += 2; v = Math.pow(v, primario()); }
    while (peek() === "%") { i++; v /= 100; }
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
  } catch { return null; }
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
    tipo: "hora", titulo: "Hora actual",
    grande: hora.replace(/\s?([ap])\.?\s?m\.?/i, (_, l) => " " + l.toLowerCase() + ".m."),
    detalle: `${fecha} (${gmt})`, lugar: nombre, zona
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

// --- BÚSQUEDA WEB (WIKIPEDIA API) ---
async function buscarWeb(consulta) {
  const clave = consulta.toLowerCase();
  const previo = cache.get(clave);
  if (previo && Date.now() - previo.t < CACHE_MS) return previo.datos;

  try {
    const { data } = await axios.get("https://es.wikipedia.org/w/api.php", {
      params: {
        action: "query",
        list: "search",
        srsearch: consulta,
        format: "json",
        srlimit: MAX_RESULTADOS
      },
      timeout: 10000
    });

    const resultados = (data.query?.search || []).map(item => ({
      titulo: item.title,
      url: `https://es.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
      dominio: "es.wikipedia.org",
      // Quitamos las etiquetas HTML (<span class="searchmatch">) que devuelve Wikipedia
      texto: recortar(item.snippet.replace(/<[^>]+>/g, ""), 230)
    }));

    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
    cache.set(clave, { t: Date.now(), datos: resultados });
    return resultados;
  } catch (error) {
    console.error("[GOOGLE] Error en búsqueda:", error.message);
    return [];
  }
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

// --- DISEÑO GOOGLE CLEAN ---
const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html{background:#f8f9fa;overflow-x:hidden}
body{background:#f8f9fa;color:#202124;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:13px;padding:12px;overflow-x:hidden;overscroll-behavior:none}
small{color:#5f6368;font-size:11px}
.cab{display:flex;align-items:center;gap:8px;margin-bottom:14px;justify-content:center}
.logo{font-size:22px;font-weight:800;letter-spacing:-0.5px}
.logo span:nth-child(1){color:#4285F4}
.logo span:nth-child(2){color:#EA4335}
.logo span:nth-child(3){color:#FBBC05}
.logo span:nth-child(4){color:#4285F4}
.logo span:nth-child(5){color:#34A853}
.logo span:nth-child(6){color:#EA4335}
.logo span:nth-child(7){color:#4285F4}
.logo span:nth-child(8){color:#EA4335}
.q{display:flex;align-items:center;gap:10px;background:#fff;border-radius:24px;padding:12px 18px;font-size:14px;box-shadow:0 1px 6px rgba(32,33,36,.15);margin-bottom:12px;border:1px solid #dadce0}
.q span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500}
.chips{display:flex;gap:8px;margin-bottom:16px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px;justify-content:center}
.chips::-webkit-scrollbar{display:none}
.chip{flex:none;font-size:11px;font-weight:600;padding:6px 14px;border-radius:20px;background:#fff;color:#5f6368;border:1px solid #dadce0;transition:all .2s}
.chip.on{background:#e8f0fe;color:#1967d2;border-color:#e8f0fe}
.ans{background:#fff;border-radius:16px;padding:24px;box-shadow:0 1px 6px rgba(32,33,36,.1);margin-bottom:14px;text-align:center;border:1px solid #dadce0}
.ans small{display:block;font-size:10px;letter-spacing:1.5px;color:#5f6368;margin-bottom:8px;font-weight:600}
.big{font-size:38px;font-weight:700;line-height:1.1;word-break:break-word;color:#202124}
.det{margin-top:8px;font-size:13px;color:#5f6368}
.lug{margin-top:12px;display:inline-block;padding:5px 14px;border-radius:20px;background:#f1f3f4;font-size:11px;color:#5f6368;font-weight:600}
.res{display:flex;flex-direction:column;gap:10px}
.sec{font-size:11px;letter-spacing:1px;color:#5f6368;font-weight:600;margin:6px 4px 2px}
.r{display:block;padding:14px;border-radius:12px;background:#fff;box-shadow:0 1px 4px rgba(32,33,36,.1);text-decoration:none;color:inherit;border:1px solid #dadce0}
.r:active{background:#f8f9fa}
.d{font-size:11px;color:#0d652d;margin-bottom:4px}
.t{font-size:16px;font-weight:500;color:#1a0dab;line-height:1.3}
.x{font-size:13px;color:#4d5156;margin-top:6px;line-height:1.5}
table{width:100%;border-collapse:collapse;margin-bottom:12px;border-radius:12px;overflow:hidden;font-size:13px;box-shadow:0 1px 4px rgba(32,33,36,.1);border:1px solid #dadce0}
th{background:#f8f9fa;color:#5f6368;font-size:10px;letter-spacing:1px;text-align:left;padding:10px 12px;font-weight:600}
td{background:#fff;padding:10px 12px;border-top:1px solid #dadce0}
td b{color:#202124}
.go{display:block;margin-top:14px;padding:14px;border-radius:12px;background:#1a73e8;color:#fff;text-align:center;text-decoration:none;font-weight:600;font-size:14px;box-shadow:0 1px 3px rgba(26,115,232,.3)}
.go:active{background:#1765cc}
.none{padding:24px;text-align:center;color:#5f6368;font-size:14px;background:#fff;border-radius:16px;box-shadow:0 1px 6px rgba(32,33,36,.1);border:1px solid #dadce0}
.foot{display:flex;align-items:center;justify-content:center;gap:6px;padding:16px 0 8px;font-size:11px;color:#5f6368}
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
  if (!resultados || !resultados.length) return `<div class="none">No encontré resultados para esa búsqueda.</div>`;
  let precios = "";
  if (modo === "precio") {
    const filas = extraerPrecios(resultados);
    if (filas.length) {
      precios =
        `<div class="sec">TABLA DE PRECIOS</div><table><tr><th>SITIO</th><th>PRECIO</th></tr>` +
        filas.map((f) => `<tr><td><a style="color:#1a0dab;text-decoration:none;font-weight:600" href="${esc(f.url)}" target="_blank">${esc(f.sitio)}</a></td><td><b>${esc(f.precio)}</b></td></tr>`).join("") +
        `</table>`;
    }
  }
  const tarjetas = resultados
    .map((r) => `<a class="r" href="${esc(r.url)}" target="_blank" rel="noopener"><div class="d">${esc(r.dominio)}</div><div class="t">${esc(r.titulo)}</div>${r.texto ? `<div class="x">${esc(r.texto)}</div>` : ""}</a>`)
    .join("");
  return `${precios}<div class="sec">FUENTES · ${resultados.length}</div><div class="res">${tarjetas}</div>`;
}

function armarHtml({ consulta, modo, instantanea, resultados, firma }) {
  const chips = Object.entries(MODOS)
    .map(([id, m]) => `<span class="chip${id === modo ? " on" : ""}">${m.emoji} ${m.etiqueta}</span>`)
    .join("");
  const cuerpo = instantanea ? bloqueRespuesta(instantanea) : "";
  const lista = resultados ? bloqueResultados(resultados, modo) : "";
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><style>${CSS}</style></head><body>
  <div class="cab"><div class="logo"><span>B</span><span>u</span><span>s</span><span>c</span><span>a</span><span>d</span><span>o</span><span>r</span></div></div>
  <div class="q"><span>🔍</span><span>${esc(consulta)}</span></div>
  <div class="chips">${chips}</div>
  ${cuerpo}${lista}
  <a class="go" href="${esc(urlGoogle(consulta))}" target="_blank" rel="noopener">Ver en Google</a>
  <div class="foot"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6.7"/><path d="M8 7v4.2M8 4.7v.1" stroke-linecap="round"/></svg>Powered by ${esc(firma)}</div>
  ${instantanea ? scriptReloj(instantanea) : ""}
  </body></html>`;
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
