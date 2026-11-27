// Apaga por defecto el motor "saltar-atraso" (descartaba mensajes sin descifrarlos y rompía las sesiones de cifrado).
// Uso (desde la carpeta raíz del bot):  node scripts/parche-atraso.mjs
import fs from "fs";
const ruta = "motores/saltar-atraso.js";
let t = fs.readFileSync(ruta, "utf8");
const a = 'const ACTIVO = process.env.SALTAR_ATRASO !== "0";';
if (t.includes('SALTAR_ATRASO === "1"')) { console.log("Ya estaba parchado."); process.exit(0); }
if (!t.includes(a)) { console.log("No encontré la línea, no se cambió nada."); process.exit(1); }
t = t.replace(a, 'const ACTIVO = process.env.SALTAR_ATRASO === "1";   // apagado por defecto: saltar mensajes sin descifrar rompe las sesiones');
fs.writeFileSync(ruta, t);
console.log("Parche aplicado: saltar-atraso queda apagado (se enciende solo con SALTAR_ATRASO=1).");
