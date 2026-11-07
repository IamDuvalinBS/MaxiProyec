export const MAX_MINUTOS_EXPEDICION = 360;
export const PROB_BASURA = 0.15;
export const XP_POR_MINUTO = 0.4;
export const MAX_BOTIN = 14;

export const ORDEN_RAREZA = ["comun", "poco_comun", "raro", "epico", "legendario"];

export const ZONAS = {
  bosque: {
    id: "bosque", nombre: "Bosque tranquilo", emoji: "🌳", lugar: "Valle del Cocora, Colombia",
    lat: 4.6381, lon: -75.5712, nivel: 15, minutos: 10, dificultad: "Fácil",
    pesos: { comun: 70, poco_comun: 25, raro: 5 },
    favoritas: ["perro", "gato"], clima: "Ideal para comenzar a explorar."
  },
  nieve: {
    id: "nieve", nombre: "Montañas nevadas", emoji: "🏔️", lugar: "Longyearbyen, Svalbard (Noruega)",
    lat: 78.2232, lon: 15.6267, nivel: 18, minutos: 20, dificultad: "Fácil-media",
    pesos: { comun: 50, poco_comun: 38, raro: 11, epico: 1 },
    favoritas: ["pinguino"], clima: "Un lugar donde casi siempre hace frío y nieva."
  },
  lago: {
    id: "lago", nombre: "Lago cristalino", emoji: "🏞️", lugar: "Lago Titicaca, Perú",
    lat: -15.8402, lon: -70.0219, nivel: 21, minutos: 30, dificultad: "Media",
    pesos: { comun: 38, poco_comun: 42, raro: 17, epico: 3 },
    favoritas: ["ajolote"], clima: "El ajolote se mueve como pez en el agua."
  },
  encantado: {
    id: "encantado", nombre: "Bosque encantado", emoji: "🍄", lugar: "Monteverde, Costa Rica",
    lat: 10.3, lon: -84.8167, nivel: 25, minutos: 45, dificultad: "Media-alta",
    pesos: { comun: 25, poco_comun: 40, raro: 28, epico: 7 },
    favoritas: ["zorro"], clima: "Niebla, hongos brillantes y mucha magia."
  },
  volcan: {
    id: "volcan", nombre: "Valle volcánico", emoji: "🌋", lugar: "Volcán Kīlauea, Hawái",
    lat: 19.4194, lon: -155.2885, nivel: 30, minutos: 60, dificultad: "Alta",
    pesos: { comun: 15, poco_comun: 30, raro: 38, epico: 15, legendario: 2 },
    favoritas: ["dragon"], clima: "Calor, ceniza y minerales raros."
  },
  islas: {
    id: "islas", nombre: "Islas celestiales", emoji: "☁️", lugar: "Cima del Monte Fuji, Japón",
    lat: 35.3606, lon: 138.7274, nivel: 35, minutos: 90, dificultad: "Muy alta",
    pesos: { poco_comun: 20, raro: 38, epico: 35, legendario: 7 },
    favoritas: ["dragon", "zorro"], clima: "Por encima de las nubes, donde casi nadie llega."
  }
};

const item = (id, nombre, emoji, rareza, precio, zona = null) => [id, { id, nombre, emoji, rareza, precio, zona }];

export const ITEMS = Object.fromEntries([
  item("bota_vieja", "Bota vieja", "🥾", "comun", 120),
  item("lata_oxidada", "Lata oxidada", "🥫", "comun", 80),
  item("lampara_vieja", "Lámpara vieja", "🪔", "comun", 700),
  item("llave_oxidada", "Llave oxidada", "🗝️", "poco_comun", 2200),
  item("moneda_antigua", "Moneda antigua", "🪙", "poco_comun", 3500),
  item("brujula_rota", "Brújula rota", "🧭", "raro", 14000),

  item("rama_seca", "Rama seca", "🪵", "comun", 300, "bosque"),
  item("pina_seca", "Piña seca", "🌰", "comun", 350, "bosque"),
  item("pluma_ave", "Pluma de ave", "🪶", "comun", 500, "bosque"),
  item("hongo_silvestre", "Hongo silvestre", "🍄", "poco_comun", 2000, "bosque"),
  item("panal_miel", "Panal de miel", "🍯", "poco_comun", 3500, "bosque"),
  item("nido_antiguo", "Nido antiguo", "🪹", "raro", 12000, "bosque"),

  item("ramita_congelada", "Ramita congelada", "🌲", "comun", 400, "nieve"),
  item("piedra_escarchada", "Piedra escarchada", "🪨", "comun", 600, "nieve"),
  item("cristal_hielo", "Cristal de hielo", "🧊", "poco_comun", 2500, "nieve"),
  item("copo_eterno", "Copo eterno", "❄️", "poco_comun", 3200, "nieve"),
  item("pico_escalador", "Pico de escalador", "⛏️", "raro", 11000, "nieve"),
  item("diamante_glaciar", "Diamante glaciar", "💎", "epico", 55000, "nieve"),

  item("alga_brillante", "Alga brillante", "🌱", "comun", 500, "lago"),
  item("concha", "Concha de lago", "🐚", "comun", 700, "lago"),
  item("caracola", "Caracola", "🐚", "poco_comun", 2500, "lago"),
  item("botella_mensaje", "Botella con mensaje", "🍾", "poco_comun", 3000, "lago"),
  item("perla", "Perla", "🦪", "raro", 15000, "lago"),
  item("perla_negra", "Perla negra", "🖤", "epico", 60000, "lago"),

  item("luciernaga", "Luciérnaga embotellada", "🫙", "comun", 1200, "encantado"),
  item("hoja_plateada", "Hoja plateada", "🍃", "poco_comun", 3000, "encantado"),
  item("hongo_luminoso", "Hongo luminoso", "🍄", "poco_comun", 4000, "encantado"),
  item("esencia_verde", "Esencia verde", "🧪", "raro", 14000, "encantado"),
  item("polvo_hada", "Polvo de hada", "✨", "raro", 18000, "encantado"),
  item("cristal_arcano", "Cristal arcano", "🔮", "epico", 70000, "encantado"),

  item("carbon_ardiente", "Carbón ardiente", "🔥", "comun", 500, "volcan"),
  item("ceniza_volcanica", "Ceniza volcánica", "🌫️", "comun", 700, "volcan"),
  item("mineral_rojizo", "Mineral rojizo", "🪨", "poco_comun", 3500, "volcan"),
  item("obsidiana", "Obsidiana", "⚫", "raro", 16000, "volcan"),
  item("gema_fuego", "Gema de fuego", "🧡", "epico", 80000, "volcan"),
  item("escama_dragon", "Escama de dragón", "🐉", "legendario", 320000, "volcan"),

  item("pluma_nube", "Pluma de nube", "☁️", "poco_comun", 5000, "islas"),
  item("fragmento_celestial", "Fragmento celestial", "🌠", "raro", 20000, "islas"),
  item("rayo_cautivo", "Rayo cautivo", "⚡", "raro", 22000, "islas"),
  item("polvo_estelar", "Polvo estelar", "🌟", "epico", 70000, "islas"),
  item("plumon_angel", "Plumón de ángel", "🪽", "epico", 90000, "islas"),
  item("corona_nubes", "Corona de nubes", "👑", "legendario", 400000, "islas")
]);

const sinTildes = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const PALABRAS_ZONA = {
  bosque: ["bosque", "tranquilo", "cocora"],
  nieve: ["nieve", "nevadas", "montanas", "montana", "frio", "hielo"],
  lago: ["lago", "cristalino", "titicaca"],
  encantado: ["encantado", "magico", "monteverde"],
  volcan: ["volcan", "volcanico", "valle", "lava"],
  islas: ["islas", "isla", "celestiales", "celestial", "cielo", "nubes"]
};

export function buscarZona(texto) {
  const palabras = sinTildes(texto).split(/\s+/).filter(Boolean);
  if (palabras.includes("bosque") && palabras.includes("encantado")) return ZONAS.encantado;
  for (const [id, claves] of Object.entries(PALABRAS_ZONA)) {
    if (palabras.some((p) => claves.includes(p))) return ZONAS[id];
  }
  return null;
}

export function buscarItem(texto) {
  const t = sinTildes(texto).trim().replace(/\s+/g, "_");
  if (ITEMS[t]) return { item: ITEMS[t], candidatos: [ITEMS[t]] };
  const palabras = sinTildes(texto).split(/\s+/).filter(Boolean);
  if (!palabras.length) return { item: null, candidatos: [] };
  const candidatos = Object.values(ITEMS).filter((i) => {
    const nombre = sinTildes(i.nombre);
    return palabras.every((p) => nombre.includes(p) || i.id.includes(p));
  });
  return { item: candidatos.length === 1 ? candidatos[0] : null, candidatos };
}
