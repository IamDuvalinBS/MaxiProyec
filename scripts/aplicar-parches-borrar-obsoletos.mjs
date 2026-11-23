// Borra archivos que ya nada usa (se detectaron revisando qué importa a qué). Se ejecuta una vez y se borra solo.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const OBSOLETOS = [
  "prueba.js",
  "motores/botones-rapidos.js",
  "motores/brawlers-html.js",
  "motores/foro.js",
  "motores/gacha-coleccion-html.js",
  "motores/juegos-tunel.js",
  "motores/pokedex-html.js",
  "motores/redes.js",
  "motores/vigilante-zombi.js",
  "src/descargas/foto.js",
  "src/descargas/gestor.js",
  "src/descargas/nucleo.js",
  "src/economia/espera.js",
  "src/economia/triviaR.js",
  "src/nucleo/herramientas.js",
  "src/warnDB.js",
  "src/comandos/bot/pruebacolor.js",
  "src/comandos/subbots/Xd",
  "src/comandos/pets/Xd",
  "src/comandos/descargas/.play2",
  "scripts/aplicar-parches.mjs",
  "scripts/aplicar-parches-afk.mjs",
  "scripts/aplicar-parches-ahorro.mjs",
  "scripts/aplicar-parches-estilo.mjs",
  "scripts/aplicar-parches-limpieza.mjs",
  "scripts/aplicar-parches-mongo.mjs",
  "scripts/aplicar-parches-optimizar.mjs",
  "scripts/aplicar-parches-subidor.mjs",
  "scripts/texto-guardado.mjs",
];

for (const relativa of OBSOLETOS) {
  const ruta = path.join(RAIZ, relativa);
  if (!ruta.startsWith(RAIZ + path.sep)) continue;
  if (!fs.existsSync(ruta)) {
    console.log(`YA ESTABA      ${relativa}`);
    continue;
  }
  fs.rmSync(ruta, { force: true });
  console.log(`APLICADO       ${relativa}: borrado`);
}

fs.rmSync(fileURLToPath(import.meta.url), { force: true });
