// Lanzador del bot: arranca index.js y lo vuelve a encender cuando .update pide reiniciar.
// Se usa con: npm start
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const CODIGO_REINICIO = 42;
let hijo = null;
let saliendo = false;

const lanzar = () => {
  hijo = spawn(process.execPath, ["index.js"], {
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
