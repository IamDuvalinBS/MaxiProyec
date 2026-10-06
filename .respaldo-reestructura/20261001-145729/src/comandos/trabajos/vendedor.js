import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "vendedor",
  names: [".vendedor", ".ambulante"],
  desc: "Ventas ambulantes, ganancia pequeña pero segura (cada 30 minutos)",
  emoji: "🌭",
  tituloExito: "VENTA REALIZADA",
  cooldownMs: 30 * 60 * 1000,
  exitos: [
    { texto: "Vendiste hot dogs en la esquina de una avenida.", min: 40, max: 80 },
    { texto: "Vendiste helados en el parque durante la tarde.", min: 60, max: 110 },
    { texto: "Vendiste gorras y accesorios en un semáforo concurrido.", min: 50, max: 100 },
    { texto: "Vendiste bebidas frías durante un evento deportivo.", min: 70, max: 130 },
    { texto: "Vendiste dulces artesanales a la salida de una escuela.", min: 45, max: 95 }
  ]
});
