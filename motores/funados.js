import fs from "fs";
import path from "path";
import { obtenerBase } from "./db.js";
import { normalizarNumero } from "./owner.js";

// Números "funados": el bot (principal y subbots) ignora todo lo que escriben (comandos, botones, stickers, juegos).
// Se guardan en MongoDB (colección "funados") y en data/funados.json como respaldo. La consulta es un Set en memoria.
const ARCHIVO = path.resolve("./data/funados.json");
const COLECCION = "funados";
const funados = new Map(); // clave -> { fecha, por }

const clave = (valor) => {
  const base = String(valor || "").split(":")[0].split("@")[0];
  const sufijo = String(valor || "").endsWith("@lid") ? "@lid" : "";
  return sufijo ? `${base}${sufijo}` : normalizarNumero(base);
};

function guardarLocal() {
  try {
    fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
    fs.writeFileSync(ARCHIVO, JSON.stringify([...funados].map(([id, d]) => ({ id, ...d }))));
  } catch (e) {
    console.log(`⚠️ No se pudo guardar data/funados.json: ${e.message}`);
  }
}

try {
  if (fs.existsSync(ARCHIVO)) for (const x of JSON.parse(fs.readFileSync(ARCHIVO, "utf8"))) if (x?.id) funados.set(x.id, { fecha: x.fecha, por: x.por });
} catch {}

// MongoDB se conecta en paralelo al arrancar: se espera (hasta 2 min) y se toma como fuente principal.
(async () => {
  for (let i = 0; i < 240 && !obtenerBase(); i++) await new Promise((r) => setTimeout(r, 500));
  const base = obtenerBase();
  if (!base) return;
  try {
    const docs = await base.collection(COLECCION).find({}).toArray();
    const locales = new Map(funados);
    funados.clear();
    for (const d of docs) funados.set(d._id, { fecha: d.fecha, por: d.por });
    for (const [id, d] of locales) if (!funados.has(id)) {
      funados.set(id, d);
      base.collection(COLECCION).updateOne({ _id: id }, { $set: d }, { upsert: true }).catch(() => {});
    }
    guardarLocal();
  } catch (e) {
    console.log(`⚠️ No se pudieron cargar los funados de MongoDB: ${e.message}`);
  }
})();

export function estaFunado(sender) {
  return funados.size > 0 && Boolean(sender) && funados.has(clave(sender));
}

export async function funar(id, por) {
  const k = clave(id);
  if (!k || funados.has(k)) return false;
  const datos = { fecha: Date.now(), por: String(por || "") };
  funados.set(k, datos);
  guardarLocal();
  const base = obtenerBase();
  if (base) await base.collection(COLECCION).updateOne({ _id: k }, { $set: datos }, { upsert: true }).catch((e) => console.log(`⚠️ Funar: no se guardó en MongoDB: ${e.message}`));
  return true;
}

export async function desfunar(id) {
  const k = clave(id);
  if (!funados.delete(k)) return false;
  guardarLocal();
  const base = obtenerBase();
  if (base) await base.collection(COLECCION).deleteOne({ _id: k }).catch(() => {});
  return true;
}

export const listarFunados = () => [...funados.keys()];
