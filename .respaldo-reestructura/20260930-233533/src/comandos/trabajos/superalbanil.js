import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "superalbanil",
  names: [".superalbañil", ".albañil"],
  desc: "Construcción pesada, la mejor paga (cada 3 horas)",
  emoji: "🧱",
  tituloExito: "OBRA FINALIZADA",
  cooldownMs: 180 * 60 * 1000,
  exitos: [
    { texto: "Reparaste una pared pequeña.", min: 200, max: 400 },
    { texto: "Levantaste la estructura de un edificio completo.", min: 700, max: 1000 },
    { texto: "Realizaste labores de albañilería, plomería y electricidad en una misma obra.", min: 1000, max: 1500 },
    { texto: "Terminaste la remodelación de una cocina.", min: 400, max: 700 }
  ]
});
