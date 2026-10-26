import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR_MINIATURAS = path.join(RAIZ, "cache", "miniaturas");
const LIMITE_ARCHIVOS = 6000;
const ESCRITURAS_ENTRE_PODAS = 300;

let escrituras = 0;

try {
  fs.mkdirSync(DIR_MINIATURAS, { recursive: true });
} catch (e) {
  console.log(`[gacha] No se pudo crear la carpeta de miniaturas: ${e.message}`);
}

const rutaDe = (clave) => path.join(DIR_MINIATURAS, `${crypto.createHash("sha1").update(String(clave)).digest("hex")}.uri`);

export async function leerMiniatura(clave) {
  try {
    return await fs.promises.readFile(rutaDe(clave), "utf8");
  } catch {
    return "";
  }
}

async function podar() {
  try {
    const nombres = await fs.promises.readdir(DIR_MINIATURAS);
    if (nombres.length <= LIMITE_ARCHIVOS) return;
    const info = await Promise.all(
      nombres.map(async (n) => {
        const ruta = path.join(DIR_MINIATURAS, n);
        const st = await fs.promises.stat(ruta).catch(() => null);
        return st ? { ruta, tiempo: st.mtimeMs } : null;
      })
    );
    const ordenados = info.filter(Boolean).sort((a, b) => a.tiempo - b.tiempo);
    const sobrantes = ordenados.length - Math.floor(LIMITE_ARCHIVOS * 0.8);
    await Promise.all(ordenados.slice(0, Math.max(0, sobrantes)).map((a) => fs.promises.rm(a.ruta, { force: true })));
  } catch (e) {
    console.log(`[gacha] No se pudieron depurar las miniaturas: ${e.message}`);
  }
}

export async function guardarMiniatura(clave, uri) {
  if (!uri) return;
  try {
    const destino = rutaDe(clave);
    const temporal = `${destino}.parcial`;
    await fs.promises.writeFile(temporal, uri);
    await fs.promises.rename(temporal, destino);
    if (++escrituras % ESCRITURAS_ENTRE_PODAS === 0) podar();
  } catch (e) {
    console.log(`[gacha] No se pudo guardar la miniatura: ${e.message}`);
  }
}
