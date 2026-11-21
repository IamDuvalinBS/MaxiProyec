/**
 * Muestra el código de un archivo del bot en el estilo de Meta AI: título + bloque "Código de Js / Ver código"
 * con colores. Sirve para el comando .codigo (solo owners). Si el formato rico falla, cae a texto monoespaciado.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { enviarRespuestaRica } from "./respuesta-rica.js";

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const IGNORAR = new Set(["node_modules", ".git", "auth_info", "cache", "data", "database", "perfiles", "datos"]);
const EXT_TEXTO = new Set([".js", ".mjs", ".cjs", ".json", ".html", ".css", ".md", ".txt", ".sh", ".env.example"]);
const MAX_ARCHIVO = 600 * 1024;
// Por defecto el archivo completo va en UN solo mensaje (WhatsApp admite ~65 000 caracteres por mensaje).
// Si WhatsApp rechaza uno así de grande, se reintenta en trozos más chicos (ver TAMANOS_RESPALDO).
const MAX_CARACTERES = Number(process.env.CODIGO_MAX_CARACTERES) || 60000;
const TAMANOS_RESPALDO = [15000, 6000];

// Tipos de color del bloque de código de WhatsApp
const DEFAULT = 0, KEYWORD = 1, METHOD = 2, STRING = 3, NUMBER = 4, COMMENT = 5;

const RE_JS = new RegExp(
  [
    "(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)",
    "(\"(?:\\\\.|[^\"\\\\\\n])*\"|'(?:\\\\.|[^'\\\\\\n])*'|`(?:\\\\.|[^`\\\\])*`)",
    "(\\b0x[0-9a-fA-F]+\\b|\\b\\d[\\d_]*(?:\\.\\d+)?(?:e[+-]?\\d+)?\\b)",
    "\\b(import|export|from|default|const|let|var|function|async|await|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|try|catch|finally|throw|typeof|instanceof|in|of|null|undefined|true|false|this|static|yield|delete|void)\\b",
    "([A-Za-z_$][\\w$]*)(?=\\s*\\()"
  ].join("|"),
  "g"
);

function lenguajeDe(ruta) {
  const ext = path.extname(ruta).slice(1).toLowerCase();
  if (["js", "mjs", "cjs"].includes(ext)) return "js";
  return ext || "txt";
}

function colorear(codigo, lenguaje) {
  if (lenguaje !== "js" && lenguaje !== "json") return [{ highlightType: DEFAULT, codeContent: codigo }];
  const bloques = [];
  const poner = (tipo, texto) => {
    if (!texto) return;
    const ultimo = bloques[bloques.length - 1];
    if (ultimo && ultimo.highlightType === tipo) ultimo.codeContent += texto;
    else bloques.push({ highlightType: tipo, codeContent: texto });
  };
  let desde = 0;
  RE_JS.lastIndex = 0;
  for (let m = RE_JS.exec(codigo); m; m = RE_JS.exec(codigo)) {
    poner(DEFAULT, codigo.slice(desde, m.index));
    const tipo = m[1] !== undefined ? COMMENT : m[2] !== undefined ? STRING : m[3] !== undefined ? NUMBER : m[4] !== undefined ? KEYWORD : METHOD;
    poner(tipo, m[0]);
    desde = m.index + m[0].length;
    if (m[0].length === 0) RE_JS.lastIndex++;
  }
  poner(DEFAULT, codigo.slice(desde));
  return bloques;
}

// Corta el archivo por líneas en trozos de ~MAX_CARACTERES
export function partirCodigo(texto, maximo = MAX_CARACTERES) {
  const lineas = texto.replace(/\r\n/g, "\n").split("\n");
  const partes = [];
  let actual = [];
  let tam = 0;
  let inicio = 1;
  lineas.forEach((linea, i) => {
    const largo = linea.length + 1;
    if (tam + largo > maximo && actual.length) {
      partes.push({ desde: inicio, hasta: i, codigo: actual.join("\n") });
      actual = [];
      tam = 0;
      inicio = i + 1;
    }
    actual.push(linea.length > maximo ? linea.slice(0, maximo) + " …" : linea);
    tam += Math.min(largo, maximo);
  });
  if (actual.length) partes.push({ desde: inicio, hasta: lineas.length, codigo: actual.join("\n") });
  return partes;
}

// Archivos con llaves o credenciales: nunca se muestran ni se envían.
const PROTEGIDO = /(^|\/)(\.env[^/]*|firebase-key[^/]*|.*credenciales.*|.*secret.*|.*creds.*|.*llave.*)$/i;
export const esProtegido = (rel) => PROTEGIDO.test(String(rel).replace(/\\/g, "/"));

/**
 * Busca un archivo en todo el proyecto, esté en la carpeta que esté. Devuelve rutas relativas.
 * base/sufijo permiten buscar dentro de un respaldo, donde los archivos se guardan como <nombre>.bak
 */
export function buscarArchivos(consulta, { base = RAIZ, sufijo = "" } = {}) {
  const q = String(consulta || "").trim().replace(/^\.?\//, "").replace(/\\/g, "/").toLowerCase();
  if (!q) return [];

  const exacta = path.resolve(base, q + sufijo);
  if (exacta.startsWith(base + path.sep)) {
    try {
      if (fs.statSync(exacta).isFile()) return esProtegido(q) ? [] : [path.relative(base, exacta).slice(0, sufijo ? -sufijo.length : undefined)];
    } catch {}
  }

  const exactos = [];
  const sinExt = [];
  const parciales = [];
  const pila = [base];
  while (pila.length) {
    const dir = pila.pop();
    let entradas;
    try { entradas = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entradas) {
      if (e.isDirectory()) {
        if (!IGNORAR.has(e.name) && !e.name.startsWith(".")) pila.push(path.join(dir, e.name));
        continue;
      }
      if (!e.isFile()) continue;
      if (sufijo && !e.name.endsWith(sufijo)) continue;
      const nombreReal = sufijo ? e.name.slice(0, -sufijo.length) : e.name;
      if (!EXT_TEXTO.has(path.extname(nombreReal).toLowerCase())) continue;
      const rel = path.relative(base, path.join(dir, nombreReal)).replace(/\\/g, "/");
      if (esProtegido(rel)) continue;
      const relMin = rel.toLowerCase();
      const nombre = nombreReal.toLowerCase();
      if (nombre === q || relMin === q || relMin.endsWith("/" + q)) exactos.push(rel);
      else if (path.parse(nombre).name === q) sinExt.push(rel);
      else if (relMin.includes(q)) parciales.push(rel);
    }
  }
  const orden = (a, b) => a.length - b.length || a.localeCompare(b);
  return (exactos.length ? exactos : sinExt.length ? sinExt : parciales).sort(orden);
}

export function leerArchivoTexto(rutaAbs) {
  const st = fs.statSync(rutaAbs);
  if (st.size > MAX_ARCHIVO) return { demasiadoGrande: true, bytes: st.size };
  return { texto: fs.readFileSync(rutaAbs, "utf8"), bytes: st.size };
}

/**
 * Envía el archivo en estilo Meta AI. Normalmente completo y en un solo mensaje.
 * desdeParte: parte inicial (1…); maxPartes: cuántas partes manda de una vez (solo importa en archivos enormes).
 */
export async function enviarCodigo({ sock, from, reply, rutaRel, texto, desdeParte = 1, maxPartes = 3, forzarTexto = false, etiqueta = "" }) {
  const lenguaje = lenguajeDe(rutaRel);

  const mandarRico = (p, total, n) => {
    const titulo = `${rutaRel}${total > 1 ? ` — parte ${n}/${total}` : ""} (líneas ${p.desde}-${p.hasta})${etiqueta ? ` ${etiqueta}` : ""}`;
    return enviarRespuestaRica({
      sock,
      from,
      submensajes: [
        { messageType: 2, messageText: titulo },
        { messageType: 5, codeMetadata: { codeLanguage: lenguaje, codeBlocks: colorear(p.codigo, lenguaje) } }
      ]
    });
  };

  if (!forzarTexto) {
    for (const tam of [MAX_CARACTERES, ...TAMANOS_RESPALDO]) {
      const partes = partirCodigo(texto, tam);
      const total = partes.length;
      const inicio = Math.min(Math.max(1, desdeParte), total);
      const fin = Math.min(total, inicio + maxPartes - 1);

      // La primera parte decide: si WhatsApp la rechaza, se reintenta con trozos más chicos.
      if (!(await mandarRico(partes[inicio - 1], total, inicio))) continue;
      for (let n = inicio + 1; n <= fin; n++) await mandarRico(partes[n - 1], total, n);
      if (fin < total) await reply({ text: `> Faltan ${total - fin} parte(s). Sigue con *.codigo ${rutaRel} ${fin + 1}*.` });
      return { total, inicio, fin };
    }
  }

  // Respaldo en texto normal (monoespaciado), en trozos que caben en un mensaje.
  const partes = partirCodigo(texto, 3500);
  const total = partes.length;
  const inicio = Math.min(Math.max(1, desdeParte), total);
  const fin = Math.min(total, inicio + 5);
  for (let n = inicio; n <= fin; n++) {
    const p = partes[n - 1];
    await reply({ text: `📄 *${rutaRel}${total > 1 ? ` — parte ${n}/${total}` : ""}* (líneas ${p.desde}-${p.hasta})\n\`\`\`\n${p.codigo}\n\`\`\`` });
  }
  if (fin < total) await reply({ text: `> Faltan ${total - fin} parte(s). Sigue con *.codigo ${rutaRel} ${fin + 1} texto*.` });
  return { total, inicio, fin };
}
