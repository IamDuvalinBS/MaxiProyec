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

function reemplazar(archivo, descripcion, anterior, nuevo, yaAplicado) {
  if (archivo.texto.includes(yaAplicado)) {
    resultados.push(`YA ESTABA      ${archivo.relativa}: ${descripcion}`);
    return;
  }
  if (!archivo.texto.includes(anterior)) {
    resultados.push(`NO ENCONTRADO  ${archivo.relativa}: ${descripcion}`);
    return;
  }
  archivo.texto = archivo.texto.replace(anterior, nuevo);
  resultados.push(`APLICADO       ${archivo.relativa}: ${descripcion}`);
}

function ultimaLineaDeImports(lineas) {
  let ultima = -1;
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    if (/^(function|async function|const|let|var|export|class)\b/.test(linea)) break;
    if (/^import .*;\s*$/.test(linea) || /^\} from ".*";\s*$/.test(linea)) ultima = i;
  }
  return ultima;
}

function agregarImport(archivo, linea, clave) {
  if (archivo.texto.includes(clave)) {
    resultados.push(`YA ESTABA      ${archivo.relativa}: import de ${clave}`);
    return;
  }
  const lineas = archivo.texto.split("\n");
  const indice = ultimaLineaDeImports(lineas);
  if (indice < 0) {
    resultados.push(`NO ENCONTRADO  ${archivo.relativa}: zona de imports`);
    return;
  }
  lineas.splice(indice + 1, 0, linea);
  archivo.texto = lineas.join("\n");
  resultados.push(`APLICADO       ${archivo.relativa}: import de ${clave}`);
}

function guardar(archivo) {
  if (archivo) fs.writeFileSync(archivo.ruta, archivo.texto, "utf8");
}

const db = leer("motores/db.js");
if (db) {
  reemplazar(
    db,
    "carga de negocios y afk",
    "rachas: doc.rachas || {},",
    "rachas: doc.rachas || {},\n          negocios: doc.negocios || {},\n          afk: doc.afk || null,",
    "negocios: doc.negocios || {}"
  );
  reemplazar(
    db,
    "guardado de negocios y afk",
    "rachas: acc.rachas, profile: acc.profile",
    "rachas: acc.rachas, negocios: acc.negocios, afk: acc.afk || null, profile: acc.profile",
    "negocios: acc.negocios"
  );
  reemplazar(
    db,
    "cuenta nueva con negocios y afk",
    "cooldowns: {}, rachas: {} });",
    "cooldowns: {}, rachas: {}, negocios: {}, afk: null });",
    "negocios: {}, afk: null"
  );
  reemplazar(
    db,
    "valores por defecto de cuentas existentes",
    "  if (!acc.rachas) acc.rachas = {};",
    "  if (!acc.rachas) acc.rachas = {};\n  if (!acc.negocios) acc.negocios = {};\n  if (acc.afk === undefined) acc.afk = null;",
    "if (!acc.negocios)"
  );
  if (db.texto.includes("export function listarCuentas")) {
    resultados.push("YA ESTABA      motores/db.js: listarCuentas");
  } else {
    db.texto = db.texto.trimEnd() + "\n\nexport function listarCuentas() {\n  return [...accounts.entries()];\n}\n";
    resultados.push("APLICADO       motores/db.js: listarCuentas");
  }
  guardar(db);
}

const comandos = leer("src/nucleo/comandos.js");
if (comandos) {
  agregarImport(comandos, 'import { estaAfk } from "../economia/afk.js";', "estaAfk");
  reemplazar(
    comandos,
    "bloqueo de comandos durante el modo AFK",
    "  if (!COMANDOS_PROTEGIDOS.has(comando) && comandoEstaBaneado(",
    '  if (comando !== ".afk" && estaAfk(sender)) {\n    await reply({ text: "🌙 Te encuentras en modo AFK. Usa *.afk* para salir antes de utilizar otros comandos." });\n    return true;\n  }\n\n  if (!COMANDOS_PROTEGIDOS.has(comando) && comandoEstaBaneado(',
    'comando !== ".afk" && estaAfk(sender)'
  );
  guardar(comandos);
}

const indice = leer("index.js");
if (indice) {
  agregarImport(indice, 'import { iniciarAvisosRacha } from "./src/economia/avisos.js";', "iniciarAvisosRacha } from");
  if (indice.texto.includes("iniciarAvisosRacha(sock)")) {
    resultados.push("YA ESTABA      index.js: inicio de avisos de racha");
  } else {
    const patron = /^(\s*)console\.log\(chalk\.greenBright\.bold\("✔ Bot conectado a WhatsApp"\)\);$/m;
    if (patron.test(indice.texto)) {
      indice.texto = indice.texto.replace(patron, (linea, sangria) => `${linea}\n${sangria}iniciarAvisosRacha(sock);`);
      resultados.push("APLICADO       index.js: inicio de avisos de racha");
    } else {
      resultados.push("NO ENCONTRADO  index.js: inicio de avisos de racha (agregar iniciarAvisosRacha(sock); al conectar)");
    }
  }
  guardar(indice);
}

console.log(resultados.join("\n"));
if (resultados.some((r) => r.startsWith("NO ENCONTRADO"))) {
  console.log("\nAlgunos parches no se pudieron aplicar. Revisa las líneas marcadas.");
  process.exitCode = 1;
} else {
  console.log("\nParches completados.");
}
