import { config } from "../../../motores/db.js";
import { tarjetaUso, tarjetaAviso } from "../../descargas/tarjetas.js";
import { encabezado } from "../../economia/estilo.js";
import { pedirJson } from "../../../motores/herramientas-red.js";
import { pagina, esc, json, normalizar, textoCitado, limitarEspera } from "../../../motores/herramientas-ui.js";

const ESPERA_MS = 4000;
const MAX_CARACTERES = 1200;
const MAX_EXTRAS_CARACTERES = 300;
const esperas = new Map();

export const IDIOMAS = {
  es: ["Español", "espanol castellano spanish"],
  en: ["Inglés", "ingles english"],
  pt: ["Portugués", "portugues portuguese"],
  fr: ["Francés", "frances french"],
  it: ["Italiano", "italiano italian"],
  de: ["Alemán", "aleman german deutsch"],
  ja: ["Japonés", "japones japanese"],
  ko: ["Coreano", "coreano korean"],
  "zh-CN": ["Chino", "chino chinese mandarin zh"],
  ru: ["Ruso", "ruso russian"],
  ar: ["Árabe", "arabe arabic"],
  hi: ["Hindi", "hindi"],
  tr: ["Turco", "turco turkish"],
  nl: ["Neerlandés", "holandes neerlandes dutch"],
  pl: ["Polaco", "polaco polish"],
  sv: ["Sueco", "sueco swedish"],
  no: ["Noruego", "noruego norwegian"],
  da: ["Danés", "danes danish"],
  fi: ["Finés", "fines finnish"],
  el: ["Griego", "griego greek"],
  he: ["Hebreo", "hebreo hebrew"],
  uk: ["Ucraniano", "ucraniano ukrainian"],
  ro: ["Rumano", "rumano romanian"],
  cs: ["Checo", "checo czech"],
  hu: ["Húngaro", "hungaro hungarian"],
  id: ["Indonesio", "indonesio indonesian"],
  vi: ["Vietnamita", "vietnamita vietnamese"],
  th: ["Tailandés", "tailandes thai"],
  ca: ["Catalán", "catalan"],
  gl: ["Gallego", "gallego galician"],
  eu: ["Euskera", "euskera vasco basque"],
  la: ["Latín", "latin"],
  fa: ["Persa", "persa farsi persian"],
  sw: ["Suajili", "suajili swahili"],
  tl: ["Filipino", "filipino tagalo tagalog"]
};

const CODIGOS_SEGUROS = new Set(["en", "es", "pt", "fr", "it", "ja", "ko", "ru", "ar", "hi", "tr", "nl", "pl", "sv", "vi", "th", "uk", "zh"]);
const EXTRAS = ["en", "es", "pt", "fr", "it", "de", "ja"];

const ALIAS = new Map();
for (const [codigo, [nombre, alias]] of Object.entries(IDIOMAS)) {
  for (const a of alias.split(" ")) ALIAS.set(a, codigo);
  ALIAS.set(normalizar(nombre), codigo);
}

export function idioma(token, permitirCodigo = true) {
  const t = normalizar(token);
  if (!t) return null;
  if (ALIAS.has(t)) return ALIAS.get(t);
  if (permitirCodigo && CODIGOS_SEGUROS.has(t)) return t === "zh" ? "zh-CN" : t;
  return null;
}

export function analizar(args, citado = "") {
  const t = String(args || "").trim();
  const tk = t.split(/\s+/).filter(Boolean);
  let destino = null;
  let texto = t;
  if (tk.length >= 2 && /^(a|al|en|to|into)$/i.test(tk[0]) && idioma(tk[1], true)) {
    destino = idioma(tk[1], true);
    texto = tk.slice(2).join(" ");
  } else if (tk.length >= 1 && idioma(tk[0], true)) {
    destino = idioma(tk[0], true);
    texto = tk.slice(1).join(" ");
  } else {
    const m = t.match(/^([\s\S]+?)\s+(?:al|a|en|to|into)\s+(\S+)$/i);
    if (m && idioma(m[2], true)) {
      destino = idioma(m[2], true);
      texto = m[1];
    }
  }
  if (!texto.trim()) texto = citado;
  return { destino, texto: texto.trim() };
}

async function traducirGoogle(texto, tl, sl = "auto") {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + sl + "&tl=" + tl + "&dt=t&dt=rm&q=" + encodeURIComponent(texto);
  const data = await pedirJson(url);
  const segs = Array.isArray(data?.[0]) ? data[0] : [];
  const traduccion = segs.map((s) => (typeof s?.[0] === "string" && typeof s?.[1] === "string" ? s[0] : "")).join("");
  if (!traduccion.trim()) throw new Error("respuesta vacía");
  const rom = segs.filter((s) => s && s[0] == null && (s[2] || s[3]));
  return {
    texto: traduccion,
    origen: typeof data?.[2] === "string" ? data[2] : sl,
    romDestino: rom.map((s) => s[2]).filter(Boolean).join(" "),
    romOrigen: rom.map((s) => s[3]).filter(Boolean).join(" ")
  };
}

async function traducirRespaldo(texto, tl, sl = "auto") {
  const par = (sl === "auto" ? "Autodetect" : sl) + "|" + tl;
  const data = await pedirJson("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(texto) + "&langpair=" + encodeURIComponent(par));
  const t = data?.responseData?.translatedText;
  if (!t || /MYMEMORY WARNING/i.test(t)) throw new Error("respaldo sin resultado");
  return { texto: t, origen: sl === "auto" ? "" : sl, romDestino: "", romOrigen: "" };
}

export async function traducir(texto, tl, sl = "auto") {
  try {
    return await traducirGoogle(texto, tl, sl);
  } catch (e) {
    console.log("[TRADUCIR] principal falló: " + e.message);
    return traducirRespaldo(texto, tl, sl);
  }
}

const nombreDe = (c) => (IDIOMAS[c] ? IDIOMAS[c][0] : String(c || "").toUpperCase() || "Detectado");
const baseDe = (c) => String(c || "").split("-")[0];

const CSS = `.tag{display:inline-block;font-size:12px;font-weight:650;color:var(--mut);margin-bottom:6px}
.tag.a{color:var(--acc)}
.orig p{margin:0;color:var(--mut);white-space:pre-wrap;word-break:break-word}
.seam{display:flex;align-items:center;gap:8px;margin:-4px 0 6px;color:var(--mut);font-size:12px}
.seam i{flex:1;height:1px;background:var(--ln)}
.dest{border-color:var(--acc)}
.big{margin:0 0 4px;font-size:1.45rem;line-height:1.3;white-space:pre-wrap;word-break:break-word}
.rom{margin:0 0 10px;color:var(--mut);font-style:italic;word-break:break-word}
.chips{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.chip{display:flex;align-items:baseline;gap:10px;text-align:left;border:1px solid var(--ln);background:transparent;border-radius:12px;padding:9px 12px;min-height:44px;width:100%}
.chip b{font-size:12px;color:var(--acc);min-width:74px;flex:none}
.chip span{word-break:break-word}
.chip:active{background:var(--pn2)}
#ok{min-height:18px;color:var(--acc);font-size:13px;margin-top:6px}`;

function construirHtml({ texto, r, origen, destino, extras, firma }) {
  const cuerpo =
    '<div class="top"><div class="logo">🌐</div><b>Traductor</b><span>' + esc(nombreDe(origen)) + " → " + esc(nombreDe(destino)) + "</span></div>" +
    '<div class="pn orig"><small class="tag">' + esc(nombreDe(origen)) + "</small><p>" + esc(texto) + "</p>" +
    (r.romOrigen ? '<p class="mut"><i>' + esc(r.romOrigen) + "</i></p>" : "") + "</div>" +
    '<div class="seam"><i></i>traducción<i></i></div>' +
    '<div class="pn dest"><small class="tag a">' + esc(nombreDe(destino)) + '</small><p class="big" id="d">' + esc(r.texto) + "</p>" +
    (r.romDestino ? '<p class="rom">' + esc(r.romDestino) + "</p>" : "") +
    '<div class="row"><button class="btn p" id="cp">Copiar</button><button class="btn" id="sp" hidden>Escuchar</button></div><div id="ok" role="status"></div></div>' +
    (extras.length
      ? '<div class="pn"><small class="tag">También en</small><div class="chips">' +
        extras.map((x, i) => '<button class="chip" data-i="' + i + '"><b>' + esc(nombreDe(x.c)) + "</b><span>" + esc(x.texto) + "</span></button>").join("") +
        "</div></div>"
      : "");
  const script = `var EX=${json(extras.map((x) => x.texto))},DEST=${json(baseDe(destino))};
var ok=document.getElementById('ok');
function copiar(t){var f=function(){var a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();try{document.execCommand('copy')}catch(e){}document.body.removeChild(a)};
try{navigator.clipboard.writeText(t).catch(f)}catch(e){f()}ok.textContent='Copiado ✓';setTimeout(function(){ok.textContent=''},1800)}
document.getElementById('cp').onclick=function(){copiar(document.getElementById('d').textContent)};
document.querySelectorAll('.chip').forEach(function(b){b.onclick=function(){copiar(EX[+b.dataset.i])}});
if('speechSynthesis' in window){var s=document.getElementById('sp');s.hidden=false;s.onclick=function(){try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(document.getElementById('d').textContent);u.lang=DEST;speechSynthesis.speak(u)}catch(e){}}}`;
  return pagina({ titulo: "Traductor", acento: "#4fd1c5", cuerpo, css: CSS, script, firma });
}

export default {
  names: [".traducir", ".traduce", ".translate", ".tr"],
  desc: "Traduce a más de 30 idiomas con pronunciación, audio y copia rápida. También traduce el mensaje al que respondas",
  category: "Tools",
  usage: ".traducir <idioma> <texto>",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const args = cleanText.split(/\s+/).slice(1).join(" ").trim();
    const { destino: pedido, texto } = analizar(args, textoCitado(msg));
    if (!texto) {
      return reply({
        text: tarjetaUso({
          comando: ".traducir <idioma> <texto>",
          ejemplo: ".traducir ingles buenos días   |   .traducir hello how are you   |   .traducir japones te quiero",
          nota: "Sin idioma traduce a español (o a inglés si el texto ya está en español). También puedes responder a un mensaje con .traducir."
        })
      });
    }
    if (texto.length > MAX_CARACTERES) return reply({ text: tarjetaAviso("TRADUCTOR", `El texto es muy largo (máximo ${MAX_CARACTERES} caracteres).`) });
    const falta = limitarEspera(esperas, sender, ESPERA_MS);
    if (falta) return reply({ text: tarjetaAviso("TRADUCTOR", `Espera ${falta}s antes de traducir de nuevo.`) });

    try {
      await sock.sendMessage(from, { react: { text: "🌐", key: msg.key } });
    } catch {}

    let destino = pedido || "es";
    let r;
    try {
      r = await traducir(texto, destino);
      if (!pedido && baseDe(r.origen) === "es") {
        destino = "en";
        r = await traducir(texto, destino, "es");
      }
    } catch (e) {
      console.log("[TRADUCIR] ERROR: " + e.message);
      return reply({ text: tarjetaAviso("TRADUCTOR", "No pude traducir ahora mismo. Intenta de nuevo en unos segundos.") });
    }
    const origen = r.origen || "auto";

    let extras = [];
    if (texto.length <= MAX_EXTRAS_CARACTERES) {
      const otros = EXTRAS.filter((c) => c !== destino && c !== baseDe(origen)).slice(0, 4);
      const listos = await Promise.allSettled(otros.map((c) => traducirGoogle(texto, c, "auto").then((x) => ({ c, texto: x.texto }))));
      extras = listos.filter((x) => x.status === "fulfilled").map((x) => x.value);
    }

    const firma = config.botNameShort || "MaxiProyec";
    const textoPlano =
      encabezado("🌐", "TRADUCTOR") + "\n\n" +
      `*${nombreDe(origen)} → ${nombreDe(destino)}::*\n> ${r.texto}` +
      (r.romDestino ? `\n\n_${r.romDestino}_` : "") +
      `\n\n> ⓘ Powered by ${firma}`;
    try {
      if (typeof sock.sendHtml !== "function") throw new Error("sin sendHtml");
      await sock.sendHtml(from, construirHtml({ texto, r, origen, destino, extras, firma }), [], msg, {});
    } catch (e) {
      console.log("[TRADUCIR] HTML falló: " + e.message);
    }
    await sock.sendMessage(from, { text: textoPlano }, { quoted: msg });
  }
};
