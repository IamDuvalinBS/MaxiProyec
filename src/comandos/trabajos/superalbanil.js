import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "superalbanil",
  names: [".superalbañil", ".albañil"],
  desc: "Construcción pesada, la mejor paga (cada 3 horas)",
  emoji: "🧱",
  tituloExito: "OBRA FINALIZADA",
  cooldownMs: 180 * 60 * 1000,
  exitos: [
    { texto: "Resanaste las grietas de un muro exterior.", min: 120, max: 260 },
    { texto: "Instalaste una puerta y una ventana nuevas.", min: 200, max: 380 },
    { texto: "Reparaste una pared pequeña.", min: 200, max: 400 },
    { texto: "Colocaste el piso de una habitación completa.", min: 250, max: 450 },
    { texto: "Terminaste la remodelación de una cocina.", min: 400, max: 700 },
    { texto: "Construiste una barda perimetral para una vivienda.", min: 450, max: 750 },
    { texto: "Reforzaste los cimientos de una casa antigua.", min: 600, max: 950 },
    { texto: "Levantaste la estructura de un edificio completo.", min: 700, max: 1000 },
    { texto: "Levantaste una terraza con vista a la ciudad.", min: 800, max: 1200 },
    { texto: "Dirigiste a una cuadrilla en la construcción de una bodega.", min: 900, max: 1350 },
    { texto: "Realizaste labores de albañilería, plomería y electricidad en una misma obra.", min: 1000, max: 1500 },
    { texto: "Entregaste una casa completa antes de la fecha prometida y recibiste un bono.", min: 1200, max: 1800 }
  ]
});
