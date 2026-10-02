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
    { texto: "Seguiste a un empresario todo el día sin descubrir nada útil.", min: 15, max: 45 },
    { texto: "Obtuviste rumores sin mayor importancia.", min: 20, max: 60 },
    { texto: "Escuchaste una reunión desde el pasillo y anotaste lo esencial.", min: 60, max: 130 },
    { texto: "Revisaste la basura de una oficina y encontraste documentos útiles.", min: 100, max: 200 },
    { texto: "Fotografiaste documentos comprometedores y cobraste por ellos.", min: 150, max: 300 },
    { texto: "Interceptaste una conversación privada de valor comercial.", min: 200, max: 380 },
    { texto: "Colocaste una cámara oculta en una sala de juntas.", min: 220, max: 400 },
    { texto: "Entregaste un informe detallado sobre los movimientos de un rival.", min: 250, max: 450 },
    { texto: "Descubriste el plan de lanzamiento de un producto de la competencia.", min: 300, max: 520 },
    { texto: "Vendiste información confidencial de la competencia.", min: 350, max: 600 },
    { texto: "Recuperaste un expediente confidencial para un cliente discreto.", min: 420, max: 700 },
    { texto: "Dejaste en evidencia una red de espionaje industrial y recibiste una gran recompensa.", min: 600, max: 950 }
  ],
  fallos: [
    { texto: "Te descubrieron y pagaste para evitar represalias.", min: 40, max: 120 },
    { texto: "Perdiste el equipo de vigilancia durante la misión.", min: 60, max: 150 },
    { texto: "Un guardia notó tu presencia y debiste abandonar la zona.", min: 30, max: 100 }
  ]
});
