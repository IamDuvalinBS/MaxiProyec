import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { RAIZ } from "./utilidades-parches.mjs";

const DIRECTORIOS = [
  "src/comandos/gacha",
  "src/comandos/descargas",
  "src/comandos/economia",
  "src/comandos/negocios",
  "src/descargas",
  "src/economia"
];

const REEMPLAZOS = [
  ["Reclamalo", "Reclámalo"], ["reclamalo", "reclámalo"],
  ["Conseguilo", "Consíguelo"], ["conseguilo", "consíguelo"],
  ["Conseguí", "Consigue"], ["conseguí", "consigue"],
  ["Subilos", "Súbelos"], ["subilos", "súbelos"],
  ["Probá", "Prueba"], ["probá", "prueba"],
  ["Comprá", "Compra"], ["comprá", "compra"],
  ["Respondé", "Responde"], ["respondé", "responde"],
  ["Necesitás", "Necesitas"], ["necesitás", "necesitas"],
  ["Tenés", "Tienes"], ["tenés", "tienes"],
  ["Podés", "Puedes"], ["podés", "puedes"],
  ["Mirá", "Consulta"], ["mirá", "consulta"],
  ["Usá", "Usa"], ["usá", "usa"],
  ["Ejecutá", "Ejecuta"], ["ejecutá", "ejecuta"],
  ["Esperá", "Espera"], ["esperá", "espera"],
  ["Elegí", "Elige"], ["elegí", "elige"],
  ["Elegís", "Eliges"], ["elegís", "eliges"],
  ["vos mismo", "ti mismo"],
  ["Sos", "Eres"], ["sos", "eres"]
];

function aplicarVoseo(texto) {
  let resultado = texto;
  let cambios = 0;
  for (const [antes, despues] of REEMPLAZOS) {
    const expresion = new RegExp(`(?<![\\p{L}\\p{N}_])${antes}(?![\\p{L}\\p{N}_])`, "gu");
    resultado = resultado.replace(expresion, () => {
      cambios++;
      return despues;
    });
  }
  return { texto: resultado, cambios };
}

async function cargarAcorn() {
  try {
    return await import("acorn");
  } catch (e) {
    return null;
  }
}

function quitarRango(texto, inicio, fin) {
  const inicioLinea = texto.lastIndexOf("\n", inicio - 1) + 1;
  const siguienteSalto = texto.indexOf("\n", fin);
  const finLinea = siguienteSalto === -1 ? texto.length : siguienteSalto;
  const antes = texto.slice(inicioLinea, inicio);
  const despues = texto.slice(fin, finLinea);

  if (antes.trim() === "" && despues.trim() === "") {
    const desde = inicioLinea;
    const hasta = siguienteSalto === -1 ? finLinea : finLinea + 1;
    let resultado = texto.slice(0, desde) + texto.slice(hasta);
    if (resultado[desde - 1] === "\n" && resultado[desde - 2] === "\n" && resultado[desde] === "\n") {
      resultado = resultado.slice(0, desde) + resultado.slice(desde + 1);
    }
    return resultado;
  }

  let desde = inicio;
  while (desde > inicioLinea && /[ \t]/.test(texto[desde - 1])) desde--;
  return texto.slice(0, desde) + texto.slice(fin);
}

function quitarComentarios(texto, acorn) {
  if (acorn) {
    const comentarios = [];
    acorn.parse(texto, { ecmaVersion: "latest", sourceType: "module", allowHashBang: true, onComment: comentarios });
    let resultado = texto;
    for (const comentario of comentarios.sort((a, b) => b.start - a.start)) {
      if (comentario.value.startsWith("!")) continue;
      resultado = quitarRango(resultado, comentario.start, comentario.end);
    }
    return resultado;
  }
  return texto
    .split("\n")
    .filter((linea) => !/^\s*\/\/(?!#)/.test(linea))
    .join("\n");
}

function listarArchivos() {
  const archivos = [];
  for (const directorio of DIRECTORIOS) {
    const ruta = path.join(RAIZ, directorio);
    if (!fs.existsSync(ruta)) continue;
    for (const nombre of fs.readdirSync(ruta)) {
      if (nombre.endsWith(".js")) archivos.push(path.join(directorio, nombre));
    }
  }
  const motores = path.join(RAIZ, "motores");
  for (const nombre of fs.readdirSync(motores)) {
    if (/^gacha-.*\.js$/.test(nombre)) archivos.push(path.join("motores", nombre));
  }
  return archivos;
}

function sintaxisValida(ruta) {
  return spawnSync(process.execPath, ["--check", ruta], { stdio: "ignore" }).status === 0;
}

const acorn = await cargarAcorn();
const resultados = [];
let limpios = 0;
let voseoTotal = 0;
let omitidos = 0;

for (const relativa of listarArchivos()) {
  const ruta = path.join(RAIZ, relativa);
  const original = fs.readFileSync(ruta, "utf8");
  let texto = original;

  const voseo = aplicarVoseo(texto);
  texto = voseo.texto;

  try {
    texto = quitarComentarios(texto, acorn);
  } catch (e) {
    resultados.push(`OMITIDO        ${relativa}: no se pudo analizar (${e.message.slice(0, 60)})`);
    omitidos++;
    texto = voseo.texto;
  }

  if (texto === original) continue;

  fs.writeFileSync(ruta, texto, "utf8");
  if (!sintaxisValida(ruta)) {
    fs.writeFileSync(ruta, original, "utf8");
    resultados.push(`OMITIDO        ${relativa}: la limpieza dejó errores de sintaxis y se restauró`);
    omitidos++;
    continue;
  }
  limpios++;
  voseoTotal += voseo.cambios;
}

resultados.push(`APLICADO       ${limpios} archivos limpiados (${voseoTotal} frases corregidas, ${acorn ? "comentarios quitados con análisis completo" : "solo comentarios de línea completa"})`);
if (omitidos) resultados.push(`AVISO          ${omitidos} archivos se dejaron sin cambios por seguridad`);
console.log(resultados.join("\n"));
console.log("\nParches completados.");
