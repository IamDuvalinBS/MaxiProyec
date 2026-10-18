import { fmt } from "./formato-evento.js";
import { estilo, esHalloween } from "./temas.js";

export const APUESTA_MIN = 100;
export const APUESTA_MAX = 5000;

export const COLORES = [
  { emoji: "⚪", nombre: "Blanco", alias: ["white"], prob: 26.7, mult: 0.2, halloween: { emoji: "👻", nombre: "Fantasma", alias: ["ghost"] } },
  { emoji: "🩶", nombre: "Gris", alias: ["gray", "grey"], prob: 17.8, mult: 0.3, halloween: { emoji: "🕸️", nombre: "Telaraña", alias: ["telarana", "web", "spiderweb"] } },
  { emoji: "🟤", nombre: "Café", alias: ["cafe", "brown", "marron"], prob: 13.3, mult: 0.4, halloween: { emoji: "⚰️", nombre: "Ataúd", alias: ["ataud", "coffin"] } },
  { emoji: "🟢", nombre: "Verde", alias: ["green"], prob: 10.7, mult: 0.5, halloween: { emoji: "🧟", nombre: "Zombi", alias: ["zombie", "zombi"] } },
  { emoji: "🔵", nombre: "Azul", alias: ["blue"], prob: 8.9, mult: 0.6, halloween: { emoji: "🌙", nombre: "Luna", alias: ["moon"] } },
  { emoji: "🟡", nombre: "Amarillo", alias: ["yellow"], prob: 6.2, mult: 0.7, halloween: { emoji: "🕯️", nombre: "Vela", alias: ["candle"] } },
  { emoji: "🟠", nombre: "Naranja", alias: ["orange"], prob: 4.4, mult: 0.8, halloween: { emoji: "🎃", nombre: "Calabaza", alias: ["pumpkin"] } },
  { emoji: "🔴", nombre: "Rojo", alias: ["red"], prob: 3.6, mult: 0.85, halloween: { emoji: "🩸", nombre: "Sangre", alias: ["blood"] } },
  { emoji: "🩷", nombre: "Rosa", alias: ["pink"], prob: 2.7, mult: 0.9, halloween: { emoji: "🍬", nombre: "Caramelo", alias: ["candy", "dulce"] } },
  { emoji: "🟣", nombre: "Morado", alias: ["purple"], prob: 1.8, mult: 0.95, halloween: { emoji: "🧙‍♀️", nombre: "Bruja", alias: ["witch"] } },
  { emoji: "🩵", nombre: "Cian", alias: ["cyan"], prob: 1.5, mult: 30, halloween: { emoji: "🔮", nombre: "Cristal", alias: ["crystal", "bola"] } },
  { emoji: "🖤", nombre: "Negro", alias: ["black"], prob: 1.0, mult: 50, halloween: { emoji: "🐈‍⬛", nombre: "Gato Negro", alias: ["gato", "blackcat", "gatonegro"] } },
  { emoji: "💜", nombre: "Violeta", alias: ["violet"], prob: 0.7, mult: 80, halloween: { emoji: "🦇", nombre: "Murciélago", alias: ["murcielago", "bat"] } },
  { emoji: "🌈", nombre: "Arcoíris", alias: ["arcoiris", "rainbow"], prob: 0.4, mult: 140, halloween: { emoji: "🧪", nombre: "Poción", alias: ["pocion", "potion"] } },
  { emoji: "✨", nombre: "Dorado", alias: ["gold", "golden"], prob: 0.2, mult: 250, halloween: { emoji: "💀", nombre: "Calavera", alias: ["skull", "calavera dorada"] } },
  { emoji: "💎", nombre: "Diamante", alias: ["diamond"], prob: 0.1, mult: 500, halloween: { emoji: "🧛", nombre: "Vampiro", alias: ["vampire", "dracula", "drácula"] } }
];

export function normalizar(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Cómo se ve un color según el evento activo (probabilidad y multiplicador no cambian).
export function verColor(color) {
  const h = esHalloween() ? color.halloween : null;
  return h ? { emoji: h.emoji, nombre: h.nombre } : { emoji: color.emoji, nombre: color.nombre };
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
  // Se aceptan los nombres normales y los de Halloween en cualquier evento.
  const indice = COLORES.findIndex(
    (c) =>
      normalizar(c.nombre) === limpio ||
      c.alias.includes(limpio) ||
      (c.halloween && (normalizar(c.halloween.nombre) === limpio || c.halloween.alias.map(normalizar).includes(limpio)))
  );
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

const ESTILOS_PANEL = {
  normal: {
    titulo: "⧼🎡⧽ *RULETA MÁGICA*",
    intro: "> Elige un color y apuesta un monto. Si la ruleta cae en el color elegido, recibirás esa bonificación.",
    reglas: "> Del *1 al 10* el premio es menor a lo apostado (hay pérdida aunque aciertes). Del *11 al 16* el premio supera lo apostado. Si la ruleta cae en otro color, se pierde el monto apostado.",
    uso: "📝 *USO::* *.ruleta <número o color> <monto>*",
    ejemplo: "💡 *EJEMPLO::* *.ruleta 16 1000*",
    minima: (n) => `🎟️ *APUESTA MÍNIMA::* ${n}`,
    maxima: (n) => `🎟️ *APUESTA MÁXIMA::* ${n}`
  },
  halloween: {
    titulo: "⧼🎃⧽ *RULETA DE LOS ESPÍRITUS*",
    intro: "> Elige una criatura y apuesta un monto. Si la ruleta embrujada cae en la criatura elegida, recibirás esa bonificación. 🕸️",
    reglas: "> Del *1 al 10* el premio es menor a lo apostado (hay pérdida aunque aciertes). Del *11 al 16* el premio supera lo apostado. Si la ruleta cae en otra criatura, los espíritus se llevan tu apuesta. 💀",
    uso: "📝 *USO::* *.ruleta <número o criatura> <monto>*",
    ejemplo: "💡 *EJEMPLO::* *.ruleta 16 1000*",
    minima: (n) => `🎟️ *APUESTA MÍNIMA::* ${n}`,
    maxima: (n) => `🎟️ *APUESTA MÁXIMA::* ${n}`
  }
};

export function textoPanel() {
  const E = estilo(ESTILOS_PANEL);
  const lista = COLORES.map((c, i) => {
    const v = verColor(c);
    return `${i + 1}. ${v.emoji} ${v.nombre}: ${c.prob}% → ${textoMultiplicador(c)}`;
  });
  const cabecera = esHalloween() ? "🦇 🕸️ 🎃 🕸️ 🦇" : null;
  return [
    ...(cabecera ? [cabecera] : []),
    E.titulo,
    "",
    E.intro,
    "",
    ...lista,
    "",
    E.reglas,
    "",
    E.uso,
    E.ejemplo,
    E.minima(fmt(APUESTA_MIN)),
    E.maxima(fmt(APUESTA_MAX)),
    ...(esHalloween() ? ["", "🕯️ 👻 🕯️"] : [])
  ].join("\n");
}
