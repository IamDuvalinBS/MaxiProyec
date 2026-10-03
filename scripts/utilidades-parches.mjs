import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function crearSesion() {
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

  function nota(texto) {
    resultados.push(texto);
  }

  function terminar() {
    console.log(resultados.join("\n"));
    if (resultados.some((r) => r.startsWith("NO ENCONTRADO"))) {
      console.log("\nAlgunos parches no se pudieron aplicar. Revisa las líneas marcadas.");
      process.exitCode = 1;
    } else {
      console.log("\nParches completados.");
    }
  }

  return { leer, guardar, reemplazar, reemplazarRegion, agregarImport, nota, terminar };
}
