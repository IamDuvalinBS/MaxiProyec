/**
 * Respaldo diario del código del bot (solo archivos de texto: .js, .json, .html...).
 * - Se guarda en data/respaldo-codigo/AAAA-MM-DD/<ruta>.bak (data/ no se sube a git).
 * - Sin gastar memoria: se copia con copyFile (lo hace el sistema) y lo que no cambió respecto al día anterior
 *   se enlaza (hardlink), así cada día ocupa casi nada. Al enviar, el archivo se lee en streaming desde el disco.
 * - Se conservan RESPALDO_CODIGO_DIAS días (3 por defecto).
 */
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { RAIZ, esProtegido } from "./codigo-rico.js";

export const DIR_RESPALDO = path.join(RAIZ, "data", "respaldo-codigo");
export const SUFIJO = ".bak";

const DIAS_GUARDAR = Math.max(2, Number(process.env.RESPALDO_CODIGO_DIAS) || 3);
const IGNORAR = new Set(["node_modules", ".git", "auth_info", "cache", "data", "database", "perfiles", "datos", "assets", "photo"]);
const EXT = new Set([".js", ".mjs", ".cjs", ".json", ".html", ".css", ".md"]);
const SALTAR = new Set(["package-lock.json"]);

let ocupado = false;

export const fechaLocal = (d = new Date()) => d.toLocaleDateString("sv-SE");

export function listarRespaldos() {
  try {
    return fs
      .readdirSync(DIR_RESPALDO, { withFileTypes: true })
      .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

async function recorrer(base, dir, salida) {
  let entradas;
  try { entradas = await fsp.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entradas) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!IGNORAR.has(e.name) && !e.name.startsWith(".")) await recorrer(base, abs, salida);
    } else if (e.isFile() && EXT.has(path.extname(e.name).toLowerCase()) && !SALTAR.has(e.name)) {
      const rel = path.relative(base, abs);
      if (!esProtegido(rel)) salida.push(rel);
    }
  }
}

const cederTurno = () => new Promise((r) => setImmediate(r));

export async function hacerRespaldo() {
  if (ocupado) return { omitido: true };
  const hoy = fechaLocal();
  const destino = path.join(DIR_RESPALDO, hoy);
  if (fs.existsSync(destino)) return { ya: true, fecha: hoy };

  ocupado = true;
  const temporal = destino + ".tmp";
  try {
    await fsp.rm(temporal, { recursive: true, force: true });
    await fsp.mkdir(temporal, { recursive: true });

    const previos = listarRespaldos().filter((f) => f < hoy);
    const previo = previos.length ? path.join(DIR_RESPALDO, previos[previos.length - 1]) : null;

    const archivos = [];
    await recorrer(RAIZ, RAIZ, archivos);

    let copiados = 0;
    let enlazados = 0;
    for (let i = 0; i < archivos.length; i++) {
      const rel = archivos[i];
      const origen = path.join(RAIZ, rel);
      const fin = path.join(temporal, rel + SUFIJO);
      try {
        const st = await fsp.stat(origen);
        await fsp.mkdir(path.dirname(fin), { recursive: true });
        let hecho = false;
        if (previo) {
          const anterior = path.join(previo, rel + SUFIJO);
          try {
            const sp = await fsp.stat(anterior);
            if (sp.size === st.size && Math.floor(sp.mtimeMs) === Math.floor(st.mtimeMs)) {
              await fsp.link(anterior, fin);
              enlazados++;
              hecho = true;
            }
          } catch {}
        }
        if (!hecho) {
          await fsp.copyFile(origen, fin);
          await fsp.utimes(fin, st.atime, st.mtime);
          copiados++;
        }
      } catch (e) {
        console.log(`[respaldo-codigo] No se respaldó ${rel}: ${e.message}`);
      }
      if (i % 25 === 24) await cederTurno();
    }

    await fsp.rename(temporal, destino);

    const todos = listarRespaldos();
    for (const viejo of todos.slice(0, Math.max(0, todos.length - DIAS_GUARDAR))) {
      await fsp.rm(path.join(DIR_RESPALDO, viejo), { recursive: true, force: true });
    }
    console.log(`[respaldo-codigo] Respaldo ${hoy}: ${archivos.length} archivos (${copiados} copiados, ${enlazados} sin cambios)`);
    return { fecha: hoy, total: archivos.length, copiados, enlazados };
  } catch (e) {
    console.log(`[respaldo-codigo] Falló el respaldo: ${e.message}`);
    await fsp.rm(temporal, { recursive: true, force: true }).catch(() => {});
    return { error: e.message };
  } finally {
    ocupado = false;
  }
}

/**
 * Elige el respaldo de "hace N días": el más reciente cuya fecha sea <= hoy - N.
 * Si todavía no hay uno tan viejo, devuelve el más antiguo y marca aproximado = true.
 */
export function elegirRespaldo(dias = 1) {
  const lista = listarRespaldos();
  if (!lista.length) return null;
  const limite = new Date();
  limite.setDate(limite.getDate() - Math.max(0, dias));
  const tope = fechaLocal(limite);
  const ok = lista.filter((f) => f <= tope);
  if (ok.length) return { fecha: ok[ok.length - 1], dir: path.join(DIR_RESPALDO, ok[ok.length - 1]), aproximado: false };
  return { fecha: lista[0], dir: path.join(DIR_RESPALDO, lista[0]), aproximado: true };
}

export function horaDeRespaldo(fecha) {
  try {
    return fs.statSync(path.join(DIR_RESPALDO, fecha)).mtime.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// Programación: un respaldo poco después de arrancar y una revisión cada 3 h (por si el bot pasa de día sin reiniciar).
if (!globalThis.__respaldoCodigoIniciado && process.env.RESPALDO_CODIGO !== "0") {
  globalThis.__respaldoCodigoIniciado = true;
  setTimeout(() => hacerRespaldo().catch(() => {}), 45 * 1000).unref();
  setInterval(() => hacerRespaldo().catch(() => {}), 3 * 60 * 60 * 1000).unref();
}
