import { esHalloween } from "../src/economia/temas.js";

const BASE = {
  waifu: {
    clave: "waifu",
    unidad: "waifu",
    mejorado: "WAIFU MEJORADA",
    emoji: "🌸",
    titulo: "WAIFU",
    singular: "waifu",
    indef: "una waifu",
    art: "la",
    de: "de la",
    al: "a la",
    plural: "waifus",
    unidades: "waifus",
    reclamado: "WAIFU RECLAMADA",
    rollCmd: ".rw",
    claimCmd: ".c",
    coleccionCmd: ".harem",
    topCmd: ".waifutop",
    emojiTop: "💖",
    subirNivel: "Para subirlas de nivel usa *.waifushop* y *.waifudar <número> <ID>*.",
    ticketCmd: ".ticket",
    tituloColeccion: "TU HAREM",
    tituloTop: "WAIFUS",
    etiquetaTotal: "Total de tus waifus",
    etiquetaTickets: "Tickets de waifus",
    tituloLista: "WAIFUS - DATOS",
    emojiTotal: "💖",
    emojiValor: "💎",
    emojiLista: "📜",
    descripcionColeccion: "Aquí aparecen todas las waifus que has reclamado. Para conseguir más usa *.rw*."
  },
  pokemon: {
    clave: "pokemon",
    unidad: "pokémon",
    mejorado: "POKÉMON MEJORADO",
    emoji: "🌱",
    titulo: "POKÉMON",
    singular: "Pokémon",
    indef: "un Pokémon",
    art: "el",
    de: "del",
    al: "al",
    plural: "Pokémon",
    unidades: "pokémon",
    reclamado: "POKÉMON ATRAPADO",
    rollCmd: ".pokemon",
    claimCmd: ".atrapar",
    coleccionCmd: ".mispokemon",
    topCmd: ".poketop",
    emojiTop: "🏆",
    subirNivel: "Para subirlos de nivel usa *.pokecomida* y *.pokedar <número> <ID>*.",
    ticketCmd: ".ticketpoke",
    tituloColeccion: "TUS POKÉMON",
    tituloTop: "POKÉMON",
    etiquetaTotal: "Total de tus Pokémon",
    etiquetaTickets: "Tickets de Pokémon",
    tituloLista: "POKÉMON - DATOS",
    emojiTotal: "🔴",
    emojiValor: "💎",
    emojiLista: "🎒",
    descripcionColeccion: "Esta cantidad solo aplica para tus Pokémon. Para conseguir más usa *.pokemon*."
  },
  brawler: {
    clave: "brawler",
    unidad: "brawler",
    mejorado: "BRAWLER MEJORADO",
    emoji: "⭐",
    titulo: "BRAWLER",
    singular: "brawler",
    indef: "un brawler",
    art: "el",
    de: "del",
    al: "al",
    plural: "brawlers",
    unidades: "brawlers",
    reclamado: "BRAWLER RECLAMADO",
    rollCmd: ".brawlstars",
    claimCmd: ".drop",
    coleccionCmd: ".misbrawlers",
    topCmd: ".brawltop",
    emojiTop: "🎖️",
    subirNivel: "Para subirlos de nivel usa *.cubitos* y *.subirbrawler <ID>*.",
    ticketCmd: ".ticketbs",
    tituloColeccion: "TUS BRAWLERS",
    tituloTop: "BRAWLERS",
    etiquetaTotal: "Total de tus brawlers",
    etiquetaTickets: "Tickets de brawlers",
    tituloLista: "BRAWLERS - DATOS",
    emojiTotal: "🎖️",
    emojiValor: "💰",
    emojiLista: "🏅",
    descripcionColeccion: "Esta cantidad solo aplica para tus brawlers. Para conseguir más usa *.brawlstars*."
  },
  snake: {
    clave: "snake",
    unidad: "gusanito",
    mejorado: "SNAKE MEJORADO",
    emoji: "🐍",
    titulo: "SNAKE",
    singular: "snake",
    indef: "un snake",
    art: "el",
    de: "del",
    al: "al",
    plural: "snakes",
    unidades: "gusanitos",
    reclamado: "SNAKE ADOPTADO",
    rollCmd: ".snake",
    claimCmd: ".adoptar",
    coleccionCmd: ".missnakes",
    topCmd: ".snaketop",
    emojiTop: "🐍",
    subirNivel: "Para subirlos de nivel usa *.orbes* y *.darorbe <número> <ID>*.",
    ticketCmd: ".ticketsnake",
    tituloColeccion: "TUS SNAKES",
    tituloTop: "SNAKES",
    etiquetaTotal: "Total de tus snakes",
    etiquetaTickets: "Tickets de gusanitos",
    tituloLista: "GUSANITOS - DATOS",
    emojiTotal: "🌻",
    emojiValor: "🪺",
    emojiLista: "🚂",
    descripcionColeccion: "Esta cantidad solo aplica para tus gusanitos. Para conseguir más usa *.snake*."
  },
  cod: {
    clave: "cod",
    unidad: "ítem de COD",
    mejorado: "ÍTEM MEJORADO",
    emoji: "🔫",
    titulo: "CALL OF DUTY",
    singular: "ítem de COD",
    indef: "un ítem de COD",
    art: "el",
    de: "del",
    al: "al",
    plural: "ítems de COD",
    unidades: "ítems de COD",
    reclamado: "ÍTEM RECLAMADO",
    rollCmd: ".callofduty",
    claimCmd: ".equipar",
    coleccionCmd: ".miscod",
    topCmd: ".codtop",
    emojiTop: "🎖️",
    subirNivel: "Para subirlos de nivel usa *.codtienda* y *.codmejorar <número> <ID>*.",
    ticketCmd: ".ticketcod",
    tituloColeccion: "TU ARSENAL",
    tituloTop: "ÍTEMS DE COD",
    etiquetaTotal: "Total de tus ítems",
    etiquetaTickets: "Tickets de COD",
    tituloLista: "ARSENAL - DATOS",
    emojiTotal: "🪖",
    emojiValor: "💰",
    emojiLista: "🎯",
    descripcionColeccion: "Aquí aparecen los operadores, skins y armas de Call of Duty que has reclamado. Para conseguir más usa *.callofduty*."
  },
  dragon: {
    clave: "dragon",
    unidad: "dragón",
    mejorado: "DRAGÓN MEJORADO",
    emoji: "🐉",
    titulo: "DRAGON MANIA",
    singular: "dragón",
    indef: "un dragón",
    art: "el",
    de: "del",
    al: "al",
    plural: "dragones",
    unidades: "dragones",
    reclamado: "DRAGÓN CRIADO",
    rollCmd: ".dragon",
    claimCmd: ".criar",
    coleccionCmd: ".misdragones",
    topCmd: ".dragontop",
    emojiTop: "🔥",
    subirNivel: "Para subirlos de nivel usa *.dragonfood* y *.dragondar <número> <ID>*.",
    ticketCmd: ".ticketdragon",
    tituloColeccion: "TUS DRAGONES",
    tituloTop: "DRAGONES",
    etiquetaTotal: "Total de tus dragones",
    etiquetaTickets: "Tickets de dragones",
    tituloLista: "DRAGONES - DATOS",
    emojiTotal: "🥚",
    emojiValor: "💎",
    emojiLista: "🏔️",
    descripcionColeccion: "Aquí aparecen todos los dragones que has criado. Para conseguir más usa *.dragon*."
  },
  clash: {
    clave: "clash",
    unidad: "carta",
    mejorado: "CARTA MEJORADA",
    emoji: "👑",
    titulo: "CLASH ROYALE",
    singular: "carta",
    indef: "una carta",
    art: "la",
    de: "de la",
    al: "a la",
    plural: "cartas",
    unidades: "cartas",
    reclamado: "CARTA DESBLOQUEADA",
    rollCmd: ".clashroyale",
    claimCmd: ".desbloquear",
    coleccionCmd: ".miscartas",
    topCmd: ".clashtop",
    emojiTop: "🏰",
    subirNivel: "Para subirlas de nivel usa *.clashtienda* y *.clashmejorar <número> <ID>*.",
    ticketCmd: ".ticketcr",
    tituloColeccion: "TUS CARTAS",
    tituloTop: "CARTAS",
    etiquetaTotal: "Total de tus cartas",
    etiquetaTickets: "Tickets de cartas",
    tituloLista: "CARTAS - DATOS",
    emojiTotal: "🃏",
    emojiValor: "🏆",
    emojiLista: "⚔️",
    descripcionColeccion: "Aquí aparecen todas las cartas que has desbloqueado. Para conseguir más usa *.clashroyale*."
  }
};

// Extensión de Halloween: solo títulos y descripciones (no cambia comandos, claves ni datos).
const HALLOWEEN = {
  waifu: {
    reclamado: "WAIFU CAPTURADA",
    tituloColeccion: "TU HAREM EMBRUJADO",
    descripcionColeccion: "Aquí aparecen todas las waifus que capturaste en la noche. Para conseguir más usa *.rw*."
  },
  pokemon: {
    reclamado: "POKÉMON ATRAPADO",
    mejorado: "POKÉMON FORTALECIDO",
    tituloColeccion: "TUS POKÉMON NOCTURNOS",
    descripcionColeccion: "Esta cantidad solo aplica para tus Pokémon, los que salieron de la niebla. Para conseguir más usa *.pokemon*."
  },
  brawler: {
    reclamado: "BRAWLER CAPTURADO",
    mejorado: "BRAWLER FORTALECIDO",
    tituloColeccion: "TUS BRAWLERS EMBRUJADOS",
    descripcionColeccion: "Esta cantidad solo aplica para tus brawlers, los que sobrevivieron a la noche. Para conseguir más usa *.brawlstars*."
  },
  snake: {
    reclamado: "SNAKE ADOPTADO",
    mejorado: "SNAKE FORTALECIDO",
    tituloColeccion: "TUS SNAKES MALDITOS",
    descripcionColeccion: "Esta cantidad solo aplica para tus gusanitos, los que se arrastraron desde la tumba. Para conseguir más usa *.snake*."
  },
  cod: {
    reclamado: "ÍTEM RECLAMADO",
    mejorado: "ÍTEM FORTALECIDO",
    tituloColeccion: "TU ARSENAL MACABRO",
    descripcionColeccion: "Aquí aparecen los operadores, skins y armas de Call of Duty que reclamaste esta noche. Para conseguir más usa *.callofduty*."
  },
  dragon: {
    reclamado: "DRAGÓN CRIADO",
    mejorado: "DRAGÓN FORTALECIDO",
    tituloColeccion: "TUS DRAGONES DE LA CRIPTA",
    descripcionColeccion: "Aquí aparecen todos los dragones que criaste en la oscuridad. Para conseguir más usa *.dragon*."
  },
  clash: {
    reclamado: "CARTA DESBLOQUEADA",
    mejorado: "CARTA FORTALECIDA",
    tituloColeccion: "TUS CARTAS MALDITAS",
    descripcionColeccion: "Aquí aparecen todas las cartas que desbloqueaste esta noche. Para conseguir más usa *.clashroyale*."
  }
};

// Vista "viva": lee el evento activo en cada acceso, así los comandos que guardan
// `const cat = CAT[...]` también cambian de estilo al instante.
export const CAT = {};
for (const [clave, base] of Object.entries(BASE)) {
  const vista = {};
  for (const campo of Object.keys(base)) {
    Object.defineProperty(vista, campo, {
      enumerable: true,
      get: () => (esHalloween() && HALLOWEEN[clave]?.[campo] !== undefined ? HALLOWEEN[clave][campo] : base[campo])
    });
  }
  CAT[clave] = vista;
}

const ALIAS = {
  waifu: "waifu", waifus: "waifu", rw: "waifu",
  pokemon: "pokemon", poke: "pokemon", pokemons: "pokemon",
  brawl: "brawler", brawler: "brawler", brawlers: "brawler", brawlstars: "brawler", bs: "brawler",
  snake: "snake", snakes: "snake", gusanito: "snake", gusanitos: "snake",
  cod: "cod", callofduty: "cod", warzone: "cod", codm: "cod",
  dragon: "dragon", dragones: "dragon", dragonmania: "dragon", dml: "dragon",
  clash: "clash", cr: "clash", clashroyale: "clash", carta: "clash", cartas: "clash"
};

export function categoriaPorAlias(texto) {
  return ALIAS[String(texto || "").toLowerCase()] || null;
}
