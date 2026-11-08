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
  despierto: { hambre: 6, energia: 4, diversion: 5, limpieza: 3 },
  dormido: { hambre: 2, energia: -12, diversion: 1, limpieza: 1 },
  lluviaSinRefugio: { energia: 3, diversion: 8 }
};

export const CRECIMIENTO_POR_HORA = 10;

export const JABON = { nombre: "Jabón de baño", emoji: "🧼", precio: 1500 };

export const BANO_DIVERSION = { perro: 10, gato: -10, zorro: 0, pinguino: 10, ajolote: 15, dragon: 5 };

export const NIVEL_HABILIDAD = 31;

export const BONOS_NIVEL = [
  { desde: 1, texto: "Nivel 1-5: sin bonificaciones" },
  { desde: 6, texto: "Nivel 6-10: bono de monedas (+5% del valor de cada expedición)" },
  { desde: 11, texto: "Nivel 11-20: mejora de recompensas (+10% de hallazgos)" },
  { desde: 21, texto: "Nivel 21-30: mejores recompensas (+10% de probabilidad de ítems raros o mejores)" },
  { desde: NIVEL_HABILIDAD, texto: "Nivel 31+: habilidad especial según la especie" }
];

export const HABILIDADES = {
  perro: { nombre: "Olfato", texto: "20% de probabilidad de duplicar cada hallazgo" },
  gato: { nombre: "Instinto cazador", texto: "+25% de probabilidad de ítems raros o mejores" },
  zorro: { nombre: "Astucia", texto: "25% de probabilidad de un hallazgo extra" },
  pinguino: { nombre: "Piel gruesa", texto: "+20% de hallazgos con frío o nieve" },
  ajolote: { nombre: "Regeneración", texto: "Recupera 25 de energía al volver de una expedición" },
  dragon: { nombre: "Tesoro del dragón", texto: "+15% extra de monedas por expedición" }
};

export const FLAUTA = { nombre: "Flauta mágica", emoji: "🎶", precio: 250000 };

export const PERDIDA_HORAS = 12;
export const PREP_HORAS_BASE = 3;
export const PREP_MAX = 8;
export const PREP_PUNTOS = { basica: 1, premium: 2, gourmet: 4 };
export const RIESGO_ESPECIE = { perro: 0.85, gato: 1.15, zorro: 0.75, pinguino: 1, ajolote: 1, dragon: 0.8 };

export const ARBOL = {
  bosque: {
    nombre: "Despensa del bosque", emoji: "🌳", efecto: "La comida recupera más hambre",
    valores: [0.1, 0.2, 0.3], formato: (v) => `+${Math.round(v * 100)}% de comida recuperada`,
    niveles: [
      { items: { rama_seca: 4, pina_seca: 4 }, monedas: 15000 },
      { items: { hongo_silvestre: 3, panal_miel: 2 }, monedas: 60000 },
      { items: { nido_antiguo: 1, panal_miel: 3 }, monedas: 200000 }
    ]
  },
  nieve: {
    nombre: "Conservas heladas", emoji: "🏔️", efecto: "La comida también da energía",
    valores: [5, 10, 15], formato: (v) => `+${v} de energía al alimentar`,
    niveles: [
      { items: { piedra_escarchada: 4, ramita_congelada: 4 }, monedas: 25000 },
      { items: { cristal_hielo: 3, copo_eterno: 2 }, monedas: 90000 },
      { items: { pico_escalador: 2, copo_eterno: 4 }, monedas: 300000 }
    ]
  },
  lago: {
    nombre: "Pesca fresca", emoji: "🏞️", efecto: "La comida hace crecer más",
    valores: [0.2, 0.4, 0.6], formato: (v) => `+${Math.round(v * 100)}% de crecimiento por comida`,
    niveles: [
      { items: { alga_brillante: 4, concha: 4 }, monedas: 30000 },
      { items: { caracola: 3, botella_mensaje: 2 }, monedas: 110000 },
      { items: { perla: 2, caracola: 3 }, monedas: 350000 }
    ]
  },
  encantado: {
    nombre: "Hongos mágicos", emoji: "🍄", efecto: "La comida también da diversión",
    valores: [5, 10, 15], formato: (v) => `+${v} de diversión al alimentar`,
    niveles: [
      { items: { luciernaga: 4, hoja_plateada: 2 }, monedas: 40000 },
      { items: { hongo_luminoso: 3, hoja_plateada: 3 }, monedas: 140000 },
      { items: { esencia_verde: 2, polvo_hada: 2 }, monedas: 450000 }
    ]
  },
  volcan: {
    nombre: "Brasas eternas", emoji: "🌋", efecto: "La preparación dura más tiempo",
    valores: [1, 2, 3], formato: (v) => `+${v} h de duración de la preparación`,
    niveles: [
      { items: { carbon_ardiente: 5, ceniza_volcanica: 4 }, monedas: 50000 },
      { items: { mineral_rojizo: 4, obsidiana: 1 }, monedas: 180000 },
      { items: { obsidiana: 4, mineral_rojizo: 6 }, monedas: 600000 }
    ]
  },
  islas: {
    nombre: "Ambrosía celestial", emoji: "☁️", efecto: "Menos riesgo de perderse",
    valores: [0.15, 0.3, 0.45], formato: (v) => `-${Math.round(v * 100)}% de riesgo de perderse`,
    niveles: [
      { items: { pluma_nube: 3, fragmento_celestial: 1 }, monedas: 100000 },
      { items: { pluma_nube: 5, rayo_cautivo: 2 }, monedas: 300000 },
      { items: { fragmento_celestial: 3, polvo_estelar: 1, rayo_cautivo: 2 }, monedas: 900000 }
    ]
  }
};
