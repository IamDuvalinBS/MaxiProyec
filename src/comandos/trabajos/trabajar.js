import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "trabajar",
  names: [".trabajar", ".w", ".work"],
  desc: "Trabajo tranquilo, sin riesgo (cada 20 minutos)",
  emoji: "👷",
  tituloExito: "TRABAJO COMPLETADO",
  cooldownMs: 20 * 60 * 1000,
  exitos: [
    { texto: "Completaste un turno como ayudante en una cafetería.", min: 40, max: 80 },
    { texto: "Realizaste entregas a domicilio para un comercio local.", min: 50, max: 100 },
    { texto: "Limpiaste oficinas al finalizar la jornada laboral.", min: 30, max: 70 },
    { texto: "Paseaste a los perros de varios vecinos del sector.", min: 20, max: 60 },
    { texto: "Atendiste la caja de un supermercado durante todo el día.", min: 60, max: 120 },
    { texto: "Organizaste el inventario de una bodega.", min: 45, max: 90 },
    { texto: "Impartiste una clase de refuerzo a un estudiante.", min: 55, max: 110 },
    { texto: "Colaboraste en una mudanza familiar.", min: 35, max: 85 }
  ]
});
