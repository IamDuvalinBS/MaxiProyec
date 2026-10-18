export const RANURAS = ["habilidad", "estelar", "mejora", "hipercarga"];

export const UMBRAL = { habilidad: 0.2, estelar: 0.4, mejora: 0.6, hipercarga: 0.85 };

const ETIQUETAS = {
  habilidad: "Habilidad",
  estelar: "Poder estelar",
  mejora: "Mejora",
  hipercarga: "Hipercarga"
};

const EMOJIS = { habilidad: "🎯", estelar: "⭐", mejora: "🧩", hipercarga: "⚡" };

const EFECTOS = {
  habilidad: ["curar", "escudo", "estallido", "aturdir", "furia"],
  estelar: ["vampirismo", "espinas", "aliento", "critico", "armadura"],
  mejora: ["vida", "ataque", "defensa", "velocidad"],
  hipercarga: ["destello", "regeneracion", "quiebre"]
};

const porcentaje = (n) => `${Math.round(n * 100)}%`;
const multiplicador = (n) => `x${n.toFixed(2)}`;

export const PARAMETROS = {
  curar: (p) => ({ curacion: 0.25 * p, espera: 4, usos: 3 }),
  escudo: (p) => ({ escudo: 0.22 * p, espera: 5, usos: 2 }),
  estallido: (p) => ({ mult: 1.2 + 0.4 * p, espera: 3, usos: 3 }),
  aturdir: () => ({ espera: 5, usos: 2 }),
  furia: (p) => ({ bono: 0.25 * p, rondas: 3, espera: 5, usos: 2 }),
  vampirismo: (p) => ({ robo: 0.12 * p }),
  espinas: (p) => ({ reflejo: 0.12 * p }),
  aliento: (p) => ({ vida: 0.08 * p }),
  critico: (p) => ({ prob: 0.15 * p }),
  armadura: (p) => ({ reduccion: Math.min(0.4, 0.12 * p) }),
  vida: (p) => ({ bono: 0.1 * p }),
  ataque: (p) => ({ bono: 0.1 * p }),
  defensa: (p) => ({ bono: 0.1 * p }),
  velocidad: (p) => ({ bono: 0.1 * p }),
  destello: (p) => ({ mult: 1.5 + 0.3 * p }),
  regeneracion: (p) => ({ mult: 1.3 + 0.2 * p, curacion: 0.12 * p }),
  quiebre: (p) => ({ mult: 1.3 + 0.25 * p, ignora: 0.4 })
};

export const DESCRIPCIONES = {
  curar: (v) => `Recupera ${porcentaje(v.curacion)} de la salud máxima. Se usa al bajar de la mitad de la vida. Hasta ${v.usos} veces por combate.`,
  escudo: (v) => `Crea un escudo que absorbe ${porcentaje(v.escudo)} de la salud máxima. Hasta ${v.usos} veces por combate.`,
  estallido: (v) => `Lanza un ataque potenciado (${multiplicador(v.mult)} de daño). Hasta ${v.usos} veces por combate.`,
  aturdir: (v) => `Aturde al rival y le hace perder su siguiente turno. Hasta ${v.usos} veces por combate.`,
  furia: (v) => `Aumenta el daño ${porcentaje(v.bono)} durante ${v.rondas} rondas. Hasta ${v.usos} veces por combate.`,
  vampirismo: (v) => `Recupera ${porcentaje(v.robo)} del daño que inflige.`,
  espinas: (v) => `Devuelve ${porcentaje(v.reflejo)} del daño que recibe.`,
  aliento: (v) => `Una vez por combate sobrevive a un golpe mortal con ${porcentaje(v.vida)} de salud.`,
  critico: (v) => `Suma ${porcentaje(v.prob)} de probabilidad de golpe crítico.`,
  armadura: (v) => `Reduce ${porcentaje(v.reduccion)} del daño que recibe.`,
  vida: (v) => `Aumenta la salud ${porcentaje(v.bono)}.`,
  ataque: (v) => `Aumenta el daño ${porcentaje(v.bono)}.`,
  defensa: (v) => `Aumenta la defensa ${porcentaje(v.bono)}.`,
  velocidad: (v) => `Aumenta la velocidad ${porcentaje(v.bono)}.`,
  destello: (v) => `Con la carga llena, el siguiente ataque hace ${multiplicador(v.mult)} de daño.`,
  regeneracion: (v) => `Con la carga llena, el siguiente ataque hace ${multiplicador(v.mult)} de daño y cura ${porcentaje(v.curacion)} de la salud.`,
  quiebre: (v) => `Con la carga llena, el siguiente ataque hace ${multiplicador(v.mult)} de daño e ignora ${porcentaje(v.ignora)} de la defensa.`
};

const NOMBRES = {
  waifu: {
    curar: "Abrazo Cálido", escudo: "Velo de Encanto", estallido: "Mirada Fulminante", aturdir: "Beso Hipnótico", furia: "Corazón Ardiente",
    vampirismo: "Dulce Succión", espinas: "Rosa con Espinas", aliento: "Promesa Eterna", critico: "Golpe de Suerte", armadura: "Kimono Sagrado",
    vida: "Vitalidad Radiante", ataque: "Pasión Intensa", defensa: "Voluntad de Hierro", velocidad: "Paso Ligero",
    destello: "Hiperencanto", regeneracion: "Bendición Floral", quiebre: "Declaración Final"
  },
  pokemon: {
    curar: "Recuperación", escudo: "Protección", estallido: "Hiperrayo", aturdir: "Onda Trueno", furia: "Danza Espada",
    vampirismo: "Drenadoras", espinas: "Cuerpo Llama", aliento: "Aguante", critico: "Garra Afilada", armadura: "Muro de Luz",
    vida: "Baya Vital", ataque: "Banda Fuerte", defensa: "Chaleco Asalto", velocidad: "Pluma Veloz",
    destello: "Megaevolución", regeneracion: "Raíz Vital", quiebre: "Ataque Z"
  },
  brawler: {
    curar: "Botiquín", escudo: "Barrera Láser", estallido: "Súper Explosivo", aturdir: "Granada Aturdidora", furia: "Subidón de Energía",
    vampirismo: "Robavidas", espinas: "Contragolpe", aliento: "Último Aliento", critico: "Ojo de Águila", armadura: "Blindaje Reforzado",
    vida: "Salud Extra", ataque: "Daño Extra", defensa: "Escudo Extra", velocidad: "Velocidad Turbo",
    destello: "Hipercarga", regeneracion: "Hipercarga Vital", quiebre: "Hipercarga Perforante"
  },
  snake: {
    curar: "Mudar Piel", escudo: "Escamas Duras", estallido: "Mordida Venenosa", aturdir: "Siseo Hipnótico", furia: "Frenesí Reptil",
    vampirismo: "Colmillos Sedientos", espinas: "Cola Espinosa", aliento: "Renacer Serpiente", critico: "Ataque Sorpresa", armadura: "Coraza Escamosa",
    vida: "Vigor Serpentino", ataque: "Veneno Potente", defensa: "Piel Gruesa", velocidad: "Reptar Veloz",
    destello: "Furia Ancestral", regeneracion: "Muda Eterna", quiebre: "Constricción Mortal"
  },
  cod: {
    curar: "Kit Médico", escudo: "Escudo Antidisturbios", estallido: "Ataque Aéreo", aturdir: "Granada Cegadora", furia: "Adrenalina",
    vampirismo: "Racha de Bajas", espinas: "Mina Trampa", aliento: "Chaleco Reforzado", critico: "Tiro a la Cabeza", armadura: "Armadura Balística",
    vida: "Parche de Salud", ataque: "Munición Perforante", defensa: "Casco Táctico", velocidad: "Botas Ligeras",
    destello: "Racha Letal", regeneracion: "Apoyo Médico", quiebre: "Bala Antiblindaje"
  },
  dragon: {
    curar: "Aliento de Vida", escudo: "Escamas Doradas", estallido: "Llamarada", aturdir: "Rugido Sísmico", furia: "Furia Dracónica",
    vampirismo: "Sed de Fuego", espinas: "Escamas Candentes", aliento: "Última Llama", critico: "Garra de Dragón", armadura: "Coraza Ancestral",
    vida: "Corazón de Dragón", ataque: "Fuego Interior", defensa: "Escama Gruesa", velocidad: "Alas Veloces",
    destello: "Tormenta Elemental", regeneracion: "Fénix Interior", quiebre: "Aliento Fulminante"
  },
  clash: {
    curar: "Hechizo de Curación", escudo: "Escudo Real", estallido: "Bola de Fuego", aturdir: "Hechizo de Congelación", furia: "Furia",
    vampirismo: "Rayo Vampírico", espinas: "Estructura Espinosa", aliento: "Cementerio", critico: "Flecha Certera", armadura: "Armadura Real",
    vida: "Nivel de Rey", ataque: "Daño Elevado", defensa: "Torre Reforzada", velocidad: "Carga Rápida",
    destello: "Evolución", regeneracion: "Evolución Curativa", quiebre: "Evolución Perforante"
  }
};

function semilla(texto) {
  let h = 2166136261;
  for (const c of String(texto)) {
    h ^= c.codePointAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function potenciaDe(nivel, nivelBase, estrellas = 0) {
  const proporcion = Math.min(1.5, Math.max(0, nivel) / Math.max(1, nivelBase));
  return 0.7 + 0.7 * proporcion + 0.06 * estrellas;
}

export const nivelDeRanura = (ranura, nivelBase) => Math.max(1, Math.ceil(nivelBase * UMBRAL[ranura]));

export function poderesDe(personaje, nivel, nivelBase, estrellas = 0) {
  const clave = String(personaje.clave ?? personaje.id ?? personaje.nombre);
  const categoria = personaje.categoria;
  const potencia = potenciaDe(nivel, nivelBase, estrellas);

  return RANURAS.map((ranura) => {
    const lista = EFECTOS[ranura];
    const efecto = lista[semilla(`${clave}:${ranura}`) % lista.length];
    const requiere = nivelDeRanura(ranura, nivelBase);
    const parametros = PARAMETROS[efecto](potencia);
    const etiqueta = ranura === "habilidad" && categoria === "brawler" ? "Gadget" : ETIQUETAS[ranura];
    return {
      ranura,
      etiqueta,
      emoji: EMOJIS[ranura],
      efecto,
      nombre: NOMBRES[categoria]?.[efecto] ?? efecto,
      requiere,
      activo: nivel >= requiere,
      par: parametros,
      descripcion: DESCRIPCIONES[efecto](parametros)
    };
  });
}

export function poderesActivos(personaje, nivel, nivelBase, estrellas = 0) {
  const salida = {};
  for (const poder of poderesDe(personaje, nivel, nivelBase, estrellas)) {
    if (poder.activo) salida[poder.ranura] = poder;
  }
  return salida;
}
