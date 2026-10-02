import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "vendedor",
  names: [".vendedor", ".ambulante"],
  desc: "Ventas ambulantes, ganancia pequeña pero segura (cada 30 minutos)",
  emoji: "🌭",
  tituloExito: "VENTA REALIZADA",
  cooldownMs: 30 * 60 * 1000,
  exitos: [
    { texto: "Vendiste globos durante una feria local.", min: 35, max: 75 },
    { texto: "Vendiste hot dogs en la esquina de una avenida.", min: 40, max: 80 },
    { texto: "Vendiste dulces artesanales a la salida de una escuela.", min: 45, max: 95 },
    { texto: "Vendiste gorras y accesorios en un semáforo concurrido.", min: 50, max: 100 },
    { texto: "Vendiste elotes en la plaza principal.", min: 55, max: 105 },
    { texto: "Vendiste helados en el parque durante la tarde.", min: 60, max: 110 },
    { texto: "Vendiste bebidas frías durante un evento deportivo.", min: 70, max: 130 },
    { texto: "Ofreciste paraguas en plena lluvia y se agotaron enseguida.", min: 80, max: 150 },
    { texto: "Vendiste flores el día de San Valentín.", min: 100, max: 170 },
    { texto: "Vendiste camisetas a los aficionados antes de un partido.", min: 110, max: 190 },
    { texto: "Vendiste artesanías a un grupo de turistas.", min: 130, max: 220 },
    { texto: "Atendiste un puesto en el mercado durante la temporada alta.", min: 150, max: 260 }
  ]
});
