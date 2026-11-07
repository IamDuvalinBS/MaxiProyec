export const CIUDAD = { nombre: "Bogotá", lat: 4.711, lon: -74.0721, zona: "America/Bogota" };

export const MAX_MASCOTAS = 5;
export const MAX_NOMBRE = 16;
export const PASO_MS = 10 * 60 * 1000;
export const MAX_SIMULACION_MS = 7 * 24 * 60 * 60 * 1000;
export const ESPERA_JUGAR_MS = 10 * 60 * 1000;
export const LLUVIA_MINIMA_MM = 0.1;

export const ETAPAS = [
  { id: "cria", nombre: "Cría", desde: 0, escala: 0.74, cabeza: 1.16 },
  { id: "joven", nombre: "Joven", desde: 120, escala: 0.88, cabeza: 1.08 },
  { id: "adulto", nombre: "Adulto", desde: 720, escala: 1, cabeza: 1 }
];

export const ESPECIES = {
  perro: { nombre: "Perrito", emoji: "🐶", rasgo: "Leal y juguetón: disfruta más cada juego", peso: 24 },
  gato: { nombre: "Gatito", emoji: "🐱", rasgo: "Independiente: se aburre más despacio", peso: 24 },
  zorro: { nombre: "Zorrito", emoji: "🦊", rasgo: "Ágil: gasta menos energía", peso: 18 },
  pinguino: { nombre: "Pingüinito", emoji: "🐧", rasgo: "Resistente: aguanta mejor el frío y la lluvia", peso: 14 },
  ajolote: { nombre: "Ajolote", emoji: "🦎", rasgo: "Acuático: la lluvia lo hace crecer más", peso: 14 },
  dragon: { nombre: "Dragoncito", emoji: "🐲", rasgo: "Poderoso: crece más rápido, pero come más", peso: 6 }
};

export const RASGOS = {
  perro: { juego: 1.3 },
  gato: { diversion: 0.75 },
  zorro: { energia: 0.8 },
  pinguino: { lluvia: 0.5 },
  ajolote: { amaLluvia: true },
  dragon: { crecimiento: 1.1, hambre: 1.15 }
};

export const RAREZAS = {
  comun: { nombre: "Común", emoji: "⚪", crecimiento: 1 },
  poco_comun: { nombre: "Poco común", emoji: "🟢", crecimiento: 1.05 },
  raro: { nombre: "Raro", emoji: "🔵", crecimiento: 1.1 },
  epico: { nombre: "Épico", emoji: "🟣", crecimiento: 1.2 },
  legendario: { nombre: "Legendario", emoji: "🟡", crecimiento: 1.35 }
};

export const INCUBADORA = {
  precio: 40000,
  niveles: [
    { nivel: 1, nombre: "Incubadora básica", espacios: 1, tiempo: 1, mejora: 0 },
    { nivel: 2, nombre: "Incubadora mejorada", espacios: 2, tiempo: 0.75, mejora: 180000 },
    { nivel: 3, nombre: "Incubadora avanzada", espacios: 3, tiempo: 0.5, mejora: 600000 }
  ]
};

export const HUEVOS = {
  comun: { nombre: "Huevo común", emoji: "🥚", precio: 25000, horas: 4, rarezas: { comun: 70, poco_comun: 30 } },
  raro: { nombre: "Huevo raro", emoji: "🪺", precio: 90000, horas: 6, rarezas: { poco_comun: 70, raro: 30 } },
  mistico: { nombre: "Huevo místico", emoji: "🔮", precio: 300000, horas: 8, rarezas: { raro: 75, epico: 25 } },
  legendario: { nombre: "Huevo legendario", emoji: "🌟", precio: 900000, horas: 10, rarezas: { epico: 80, legendario: 20 } }
};

export const COMIDAS = {
  basica: { nombre: "Croquetas básicas", emoji: "🍖", precio: 2500, hambre: 30, crecimiento: 2 },
  premium: { nombre: "Croquetas premium", emoji: "🥩", precio: 8000, hambre: 55, crecimiento: 6 },
  gourmet: { nombre: "Banquete gourmet", emoji: "🍗", precio: 22000, hambre: 100, crecimiento: 15 }
};

export const CASAS = {
  precio: 70000,
  niveles: [
    { nivel: 1, nombre: "Caseta de madera", comodidad: 0.05, mejora: 0 },
    { nivel: 2, nombre: "Casa de ladrillo", comodidad: 0.12, mejora: 260000 },
    { nivel: 3, nombre: "Mini mansión", comodidad: 0.22, mejora: 900000 }
  ]
};

export const ACCESORIOS = {
  gorrito: { nombre: "Gorrito de fiesta", emoji: "🎉", espacio: "cabeza", precio: 9000, lluvia: 0 },
  corona: { nombre: "Corona real", emoji: "👑", espacio: "cabeza", precio: 180000, lluvia: 0 },
  collar: { nombre: "Collar con placa", emoji: "📿", espacio: "cuello", precio: 12000, lluvia: 0 },
  bufanda: { nombre: "Bufanda rayada", emoji: "🧣", espacio: "cuello", precio: 22000, lluvia: 0.15 },
  gafas: { nombre: "Gafas de sol", emoji: "🕶️", espacio: "cara", precio: 16000, lluvia: 0 },
  impermeable: { nombre: "Impermeable amarillo", emoji: "🧥", espacio: "cuerpo", precio: 45000, lluvia: 0.7 }
};

export const ESPACIOS = ["cabeza", "cuello", "cara", "cuerpo"];

export const DECAIMIENTO = {
  despierto: { hambre: 6, energia: 4, diversion: 5 },
  dormido: { hambre: 2, energia: -12, diversion: 1 },
  lluviaSinRefugio: { energia: 3, diversion: 8 }
};

export const CRECIMIENTO_POR_HORA = 10;
