import { obtenerBase } from "./db.js";

// Lee las advertencias guardadas por .warn (colección "warns", documento por grupo: { _id: grupo, w: { numero: total } })
function coleccion() {
  const base = obtenerBase();
  return base ? base.collection("warns") : null;
}

export async function obtenerAdvertencias(grupo, usuario) {
  const col = coleccion();
  if (!col) return null;
  const doc = await col.findOne({ _id: grupo }, { projection: { w: 1 } });
  return Number(doc?.w?.[usuario]) || 0;
}

export async function listarAdvertencias(grupo) {
  const col = coleccion();
  if (!col) return null;
  const doc = await col.findOne({ _id: grupo }, { projection: { w: 1 } });
  return Object.entries(doc?.w || {})
    .map(([usuario, total]) => ({ usuario, total: Number(total) || 0 }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);
}
