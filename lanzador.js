// Lanzador del bot: arranca index.js y lo vuelve a encender cuando .update pide reiniciar.
// Se usa con: npm start (Termux, VPS, Railway, Render, Pterodactyl, Docker, etc.)
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { limiteMemoriaMb } from "./motores/entorno.js";

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const CODIGO_REINICIO = 42;
// Tope de RAM de Node (MB). Con tope, el recolector de basura limpia antes y el sistema no mata el proceso.
// Si el hosting limita la memoria del contenedor, se usa el 75% de ese límite. Se puede fijar con MAXI_RAM_MB.
const LIMITE_HOST = limiteMemoriaMb();
const RAM_MB = Number(process.env.MAXI_RAM_MB) || (LIMITE_HOST ? Math.max(128, Math.min(512, Math.floor(LIMITE_HOST * 0.75))) : 512);
let hijo = null;
let saliendo = false;

const lanzar = () => {
  hijo = spawn(process.execPath, [`--max-old-space-size=${RAM_MB}`, "index.js"], {
    cwd: RAIZ,
    stdio: "inherit",
    env: { ...process.env, MAXI_SUPERVISADO: "1" }
  });
  hijo.on("exit", (codigo, senal) => {
    if (!saliendo && codigo === CODIGO_REINICIO) {
      console.log("🔁 Reiniciando el bot...");
      setTimeout(lanzar, 2000);
      return;
    }
    console.log(`El bot se detuvo (${senal || `código ${codigo}`}).`);
    process.exit(codigo ?? 1);
  });
};

for (const senal of ["SIGINT", "SIGTERM"]) {
  process.on(senal, () => {
    saliendo = true;
    if (hijo) hijo.kill(senal);
    else process.exit(0);
  });
}

lanzar();
