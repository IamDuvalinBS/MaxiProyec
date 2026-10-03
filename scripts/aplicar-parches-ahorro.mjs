import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resultados = [];

function leer(relativa) {
  const ruta = path.join(RAIZ, relativa);
  if (!fs.existsSync(ruta)) {
    resultados.push(`NO ENCONTRADO  ${relativa} (el archivo no existe)`);
    return null;
  }
  return { ruta, relativa, texto: fs.readFileSync(ruta, "utf8") };
}

function guardar(archivo) {
  if (archivo) fs.writeFileSync(archivo.ruta, archivo.texto, "utf8");
}

function reemplazar(archivo, descripcion, anterior, nuevo, yaAplicado) {
  if (archivo.texto.includes(yaAplicado)) {
    resultados.push(`YA ESTABA      ${archivo.relativa}: ${descripcion}`);
    return;
  }
  if (!archivo.texto.includes(anterior)) {
    resultados.push(`NO ENCONTRADO  ${archivo.relativa}: ${descripcion}`);
    return;
  }
  archivo.texto = archivo.texto.replace(anterior, () => nuevo);
  resultados.push(`APLICADO       ${archivo.relativa}: ${descripcion}`);
}

function reemplazarRegion(archivo, descripcion, inicio, fin, nuevo, yaAplicado) {
  if (archivo.texto.includes(yaAplicado)) {
    resultados.push(`YA ESTABA      ${archivo.relativa}: ${descripcion}`);
    return;
  }
  const desde = archivo.texto.indexOf(inicio);
  const hasta = desde < 0 ? -1 : archivo.texto.indexOf(fin, desde);
  if (desde < 0 || hasta < 0) {
    resultados.push(`NO ENCONTRADO  ${archivo.relativa}: ${descripcion}`);
    return;
  }
  archivo.texto = archivo.texto.slice(0, desde) + nuevo + archivo.texto.slice(hasta);
  resultados.push(`APLICADO       ${archivo.relativa}: ${descripcion}`);
}

function agregarImport(archivo, linea, clave) {
  if (archivo.texto.includes(clave)) {
    resultados.push(`YA ESTABA      ${archivo.relativa}: import de ${clave}`);
    return;
  }
  const lineas = archivo.texto.split("\n");
  let ultima = -1;
  for (let i = 0; i < lineas.length; i++) {
    if (/^(function|async function|const|let|var|export|class)\b/.test(lineas[i])) break;
    if (/^import .*;\s*$/.test(lineas[i]) || /^\} from ".*";\s*$/.test(lineas[i])) ultima = i;
  }
  if (ultima < 0) {
    resultados.push(`NO ENCONTRADO  ${archivo.relativa}: zona de imports`);
    return;
  }
  lineas.splice(ultima + 1, 0, linea);
  archivo.texto = lineas.join("\n");
  resultados.push(`APLICADO       ${archivo.relativa}: import de ${clave}`);
}

const comandos = leer("src/nucleo/comandos.js");
if (comandos) {
  agregarImport(
    comandos,
    'import { enviarConCache, reenviarCacheado, guardarRelay, registrarMedio, claveDeDescarga } from "../../motores/cache-medios.js";',
    "enviarConCache, reenviarCacheado"
  );
  reemplazar(
    comandos,
    "variable de captura de medios",
    "  const reply = async (contenido) => {",
    "  let capturados = null;\n\n  const reply = async (contenido) => {",
    "let capturados = null;"
  );
  reemplazar(
    comandos,
    "envío con caché de medios",
    "    return sock.sendMessage(from, contenido, { quoted: msg });\n  };",
    "    const enviado = await enviarConCache(sock, from, contenido, msg);\n    if (capturados) registrarMedio(capturados, enviado);\n    return enviado;\n  };",
    "enviarConCache(sock, from, contenido, msg)"
  );
  reemplazar(
    comandos,
    "reenvío de descargas repetidas",
    "  try {\n    await handler({ sock, from, sender, cleanText, msg, reply });\n  } catch (e) {",
    "  const claveDescarga = claveDeDescarga(categoriaDeComando.get(comando), comando, cleanText);\n  if (claveDescarga && (await reenviarCacheado(sock, from, claveDescarga, msg))) return true;\n  if (claveDescarga) capturados = [];\n\n  try {\n    await handler({ sock, from, sender, cleanText, msg, reply });\n    if (claveDescarga && capturados.length) guardarRelay(claveDescarga, capturados);\n  } catch (e) {",
    "claveDeDescarga(categoriaDeComando"
  );
  guardar(comandos);
}

const gacha = leer("motores/gacha-core.js");
if (gacha) {
  agregarImport(
    gacha,
    'import { rutaImagenCacheada, guardarImagenCacheada, hayRelay } from "./cache-medios.js";',
    "rutaImagenCacheada, guardarImagenCacheada"
  );
  reemplazarRegion(
    gacha,
    "caché de imágenes en disco",
    "export async function prepararImagen(urls) {",
    "\nconst cooldowns = new Map();",
    [
      "export async function prepararImagen(urls) {",
      "  return conCupo(async () => {",
      '    let ultimoError = new Error("sin imágenes");',
      "    for (const url of urls.filter(Boolean)) {",
      "      try {",
      '        if (url.startsWith("snake:")) {',
      "          const rutaSnake = await dibujarSnake(url.slice(6));",
      "          return { ruta: rutaSnake, limpiar: () => { try { fs.rmSync(rutaSnake, { force: true }); } catch {} } };",
      "        }",
      "        const enCache = rutaImagenCacheada(url);",
      "        if (enCache) return { ruta: enCache, limpiar: () => {} };",
      "        const ruta = await bajarAArchivo(url);",
      "        guardarImagenCacheada(url, ruta);",
      "        return { ruta, limpiar: () => { try { fs.rmSync(ruta, { force: true }); } catch {} } };",
      "      } catch (e) { ultimoError = e; }",
      "    }",
      "    throw ultimoError;",
      "  });",
      "}",
      ""
    ].join("\n"),
    "const enCache = rutaImagenCacheada(url);"
  );
  reemplazarRegion(
    gacha,
    "reenvío de imágenes ya subidas",
    "export async function enviarPersonaje(",
    "\nexport async function hacerRoll",
    [
      "export async function enviarPersonaje({ reply, personaje, titulo, lineasExtra = [], mentions = [] }) {",
      "  const caption = tarjeta({",
      '    emoji: CAT[personaje.categoria]?.emoji || "🎴",',
      "    titulo,",
      '    lineas: [...lineasPersonaje(personaje), ...(lineasExtra.length ? ["", ...lineasExtra] : [])]',
      "  });",
      "  const cacheKey = `gacha:${personaje.categoria}:${personaje.img}`;",
      "  if (hayRelay(cacheKey)) {",
      "    try {",
      "      return await reply({ cacheKey, caption, mentions });",
      "    } catch (e) {}",
      "  }",
      "  const img = await prepararImagen([personaje.img, ...(personaje.meta?.alt || [])]);",
      "  try {",
      "    return await reply({ image: { url: img.ruta }, caption, mentions, cacheKey });",
      "  } finally {",
      "    img.limpiar();",
      "  }",
      "}",
      ""
    ].join("\n"),
    "const cacheKey = `gacha:${personaje.categoria}"
  );
  guardar(gacha);
}

const youtube = leer("src/comandos/descargas/youtube.js");
if (youtube) {
  agregarImport(
    youtube,
    'import { reenviarCacheado, guardarMedioEnviado } from "../../../motores/cache-medios.js";',
    "reenviarCacheado, guardarMedioEnviado"
  );
  reemplazar(
    youtube,
    "reenvío de descargas repetidas",
    '  await responder({ text: esAudio ? "⏳ Descargando el audio..." : "⏳ Descargando el video..." });',
    '  const claveCache = `yt:${esAudio ? "audio" : "video"}:${link}`;\n  if (await reenviarCacheado(sock, from, claveCache, msg)) return;\n\n  await responder({ text: esAudio ? "⏳ Descargando el audio..." : "⏳ Descargando el video..." });',
    "const claveCache = `yt:"
  );
  reemplazar(
    youtube,
    "registro del audio enviado",
    '      await responder({ audio, mimetype: "audio/mpeg", ptt: false });',
    '      guardarMedioEnviado(claveCache, await responder({ audio, mimetype: "audio/mpeg", ptt: false }));',
    "guardarMedioEnviado(claveCache, await responder({ audio"
  );
  reemplazar(
    youtube,
    "registro del video enviado",
    '      await responder({ video, mimetype: "video/mp4" });',
    '      guardarMedioEnviado(claveCache, await responder({ video, mimetype: "video/mp4" }));',
    "guardarMedioEnviado(claveCache, await responder({ video"
  );
  guardar(youtube);
}

const ignorar = leer(".gitignore");
if (ignorar) {
  if (/^cache\/?$/m.test(ignorar.texto)) {
    resultados.push("YA ESTABA      .gitignore: cache/");
  } else {
    ignorar.texto = ignorar.texto.replace(/\s*$/, "\n") + "cache/\n";
    resultados.push("APLICADO       .gitignore: cache/");
  }
  guardar(ignorar);
}

console.log(resultados.join("\n"));
if (resultados.some((r) => r.startsWith("NO ENCONTRADO"))) {
  console.log("\nAlgunos parches no se pudieron aplicar. Revisa las líneas marcadas.");
  process.exitCode = 1;
} else {
  console.log("\nParches completados.");
}
