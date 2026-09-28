import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "espiar",
  names: [".espiar", ".espia"],
  desc: "Espionaje, riesgo de ser descubierto (cada 1 hora)",
  emoji: "🕶️",
  tituloExito: "ESPIONAJE EXITOSO",
  tituloFallo: "ESPIONAJE DESCUBIERTO",
  emojiFallo: "🚨",
  chanceFallo: 0.35,
  cooldownMs: 60 * 60 * 1000,
  exitos: [
    { texto: "Obtuviste rumores sin mayor importancia.", min: 20, max: 60 },
    { texto: "Fotografiaste documentos comprometedores y cobraste por ellos.", min: 150, max: 300 },
    { texto: "Vendiste información confidencial de la competencia.", min: 350, max: 600 },
    { texto: "Interceptaste una conversación privada de valor comercial.", min: 200, max: 380 }
  ],
  fallos: [
    { texto: "Te descubrieron y pagaste para evitar represalias.", min: 40, max: 120 },
    { texto: "Perdiste el equipo de vigilancia durante la misión.", min: 60, max: 150 },
    { texto: "Un guardia notó tu presencia y debiste abandonar la zona.", min: 30, max: 100 }
  ]
});
