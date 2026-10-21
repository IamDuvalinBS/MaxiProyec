import { obtenerBase } from "./db.js";

export function contarComando(nombre) {
  const base = obtenerBase();
  if (!base || !nombre) return;
  base.collection("estadisticas")
    .updateOne({ _id: nombre.replace(/^[.!#]/, "") }, { $inc: { usos: 1 } }, { upsert: true })
    .catch(() => {});
}

export async function topComandos(limite = 10) {
  const base = obtenerBase();
  if (!base) return null;
  const col = base.collection("estadisticas");
  const [top, suma] = await Promise.all([
    col.find({}).sort({ usos: -1 }).limit(limite).toArray(),
    col.aggregate([{ $group: { _id: null, t: { $sum: "$usos" } } }]).toArray()
  ]);
  return { top, total: suma[0]?.t || 0 };
}
