import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resultados = [];

function reemplazarEn(relativa, descripcion, anterior, nuevo, yaAplicado) {
  const ruta = path.join(RAIZ, relativa);
  if (!fs.existsSync(ruta)) {
    resultados.push(`NO ENCONTRADO  ${relativa} (el archivo no existe)`);
    return;
  }
  let texto = fs.readFileSync(ruta, "utf8");
  if (texto.includes(yaAplicado)) {
    resultados.push(`YA ESTABA      ${relativa}: ${descripcion}`);
    return;
  }
  if (!texto.includes(anterior)) {
    resultados.push(`NO ENCONTRADO  ${relativa}: ${descripcion}`);
    return;
  }
  texto = texto.replace(anterior, () => nuevo);
  fs.writeFileSync(ruta, texto, "utf8");
  resultados.push(`APLICADO       ${relativa}: ${descripcion}`);
}

reemplazarEn(
  "index.js",
  "lectura del texto en documentos adjuntos",
  '(msg.message.imageMessage ? msg.message.imageMessage.caption : "") ||',
  '(msg.message.imageMessage ? msg.message.imageMessage.caption : "") ||\n      (msg.message.documentMessage ? msg.message.documentMessage.caption : "") ||\n      (msg.message.documentWithCaptionMessage?.message?.documentMessage?.caption || "") ||',
  "documentWithCaptionMessage"
);

reemplazarEn(
  "scripts/verificar.mjs",
  "ignorar carpetas ocultas de respaldo",
  "if (IGNORAR.has(entrada.name)) continue;",
  'if (IGNORAR.has(entrada.name) || entrada.name.startsWith(".")) continue;',
  'entrada.name.startsWith(".")'
);

reemplazarEn(
  "scripts/verificar.mjs",
  "omitir los scripts de parches en la revisión de imports",
  '  const codigo = fs.readFileSync(archivo, "utf8");',
  '  if (relativa.startsWith("scripts")) continue;\n  const codigo = fs.readFileSync(archivo, "utf8");',
  'relativa.startsWith("scripts")'
);

console.log(resultados.join("\n"));
if (resultados.some((r) => r.startsWith("NO ENCONTRADO"))) {
  console.log("\nAlgunos parches no se pudieron aplicar. Revisa las líneas marcadas.");
  process.exitCode = 1;
} else {
  console.log("\nParches completados.");
}
