import { fmt } from "./formato.js";

export const APUESTA_MIN = 100;
export const APUESTA_MAX = 5000;

export const COLORES = [
  { emoji: "⚪", nombre: "Blanco", alias: ["white"], prob: 26.7, mult: 0.2 },
  { emoji: "🩶", nombre: "Gris", alias: ["gray", "grey"], prob: 17.8, mult: 0.3 },
  { emoji: "🟤", nombre: "Café", alias: ["cafe", "brown", "marron"], prob: 13.3, mult: 0.4 },
  { emoji: "🟢", nombre: "Verde", alias: ["green"], prob: 10.7, mult: 0.5 },
  { emoji: "🔵", nombre: "Azul", alias: ["blue"], prob: 8.9, mult: 0.6 },
  { emoji: "🟡", nombre: "Amarillo", alias: ["yellow"], prob: 6.2, mult: 0.7 },
  { emoji: "🟠", nombre: "Naranja", alias: ["orange"], prob: 4.4, mult: 0.8 },
  { emoji: "🔴", nombre: "Rojo", alias: ["red"], prob: 3.6, mult: 0.85 },
  { emoji: "🩷", nombre: "Rosa", alias: ["pink"], prob: 2.7, mult: 0.9 },
  { emoji: "🟣", nombre: "Morado", alias: ["purple"], prob: 1.8, mult: 0.95 },
  { emoji: "🩵", nombre: "Cian", alias: ["cyan"], prob: 1.5, mult: 30 },
  { emoji: "🖤", nombre: "Negro", alias: ["black"], prob: 1.0, mult: 50 },
  { emoji: "💜", nombre: "Violeta", alias: ["violet"], prob: 0.7, mult: 80 },
  { emoji: "🌈", nombre: "Arcoíris", alias: ["arcoiris", "rainbow"], prob: 0.4, mult: 140 },
  { emoji: "✨", nombre: "Dorado", alias: ["gold", "golden"], prob: 0.2, mult: 250 },
  { emoji: "💎", nombre: "Diamante", alias: ["diamond"], prob: 0.1, mult: 500 }
];

export function normalizar(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function textoMultiplicador(color) {
  const porcentaje = Math.round((color.mult - 1) * 100);
  const signo = porcentaje < 0 ? "-" : "+";
  return `x${color.mult} (${signo}${fmt(Math.abs(porcentaje))}%)`;
}

export function esGanador(color) {
  return color.mult > 1;
}

export function buscarColor(token) {
  if (!token) return null;
  const limpio = normalizar(token);
  if (/^\d+$/.test(limpio)) {
    const indice = parseInt(limpio, 10) - 1;
    return COLORES[indice] ? { color: COLORES[indice], numero: indice + 1 } : null;
  }
  const indice = COLORES.findIndex((c) => normalizar(c.nombre) === limpio || c.alias.includes(limpio));
  return indice === -1 ? null : { color: COLORES[indice], numero: indice + 1 };
}

export function girar(aleatorio = Math.random) {
  const total = COLORES.reduce((suma, c) => suma + c.prob, 0);
  let punto = aleatorio() * total;
  for (const color of COLORES) {
    punto -= color.prob;
    if (punto < 0) return color;
  }
  return COLORES[COLORES.length - 1];
}

export function textoPanel() {
  const lista = COLORES.map(
    (c, i) => `${i + 1}. ${c.emoji} ${c.nombre}: ${c.prob}% → ${textoMultiplicador(c)}`
  );
  return [
    "⧼🎡⧽ *RULETA MÁGICA*",
    "",
    "> Elige un color y apuesta un monto. Si la ruleta cae en el color elegido, recibirás esa bonificación.",
    "",
    ...lista,
    "",
    "> Del *1 al 10* el premio es menor a lo apostado (hay pérdida aunque aciertes). Del *11 al 16* el premio supera lo apostado. Si la ruleta cae en otro color, se pierde el monto apostado.",
    "",
    "📝 *USO::* *.ruleta <número o color> <monto>*",
    "💡 *EJEMPLO::* *.ruleta 16 1000*",
    `🎟️ *APUESTA MÍNIMA::* ${fmt(APUESTA_MIN)}`,
    `🎟️ *APUESTA MÁXIMA::* ${fmt(APUESTA_MAX)}`
  ].join("\n");
}
