// Parche de diagnóstico: permite arrancar el bot SIN subbots (SIN_SUBBOTS=1) y retrasar su arranque (SUBS_RETRASO_SEG=60).
// Uso (desde la carpeta raíz del bot):  node scripts/parche-subs.mjs
import fs from "fs";
const ruta = "index.js";
let t = fs.readFileSync(ruta, "utf8");
if (t.includes("SIN_SUBBOTS")) { console.log("Ya estaba parchado."); process.exit(0); }
const a = `      if (!subbotsIniciados) {
        subbotsIniciados = true;
        iniciarSubbots((subSock) => enlazarEventos(subSock, true)).catch((e) => console.log("Subbots: " + e.message));
      }`;
if (!t.includes(a)) { console.log("No encontré el bloque de subbots, no se cambió nada."); process.exit(1); }
t = t.replace(a, `      if (!subbotsIniciados && process.env.SIN_SUBBOTS === "1") {
        console.log("⚠ SIN_SUBBOTS=1: los subbots no se inician.");
      } else if (!subbotsIniciados) {
        subbotsIniciados = true;
        const retraso = (Number(process.env.SUBS_RETRASO_SEG) || 0) * 1000;
        if (retraso) console.log("Los subbots arrancan en " + retraso / 1000 + " s; mientras tanto el principal responde.");
        setTimeout(() => {
          iniciarSubbots((subSock) => enlazarEventos(subSock, true)).catch((e) => console.log("Subbots: " + e.message));
        }, retraso);
      }`);
fs.writeFileSync(ruta, t);
console.log("Parche aplicado a index.js");
