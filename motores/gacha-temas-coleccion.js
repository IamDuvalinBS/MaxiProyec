const hv = (o) => Object.entries(o).map(([k, v]) => `--${k}:${v}`).join(";");

const BASE_H = { ink: "#ffe9d2", mut: "#c79ad8", btnt: "#1a0826", hdr: "#ffd9a8" };

const marco = (bg1, bg2, card, bd, acc, acc2, soft, extra = {}) =>
  hv({ ...BASE_H, bg1, bg2, card, bd, acc, acc2, btn: bd, soft, glow: bd + "59", ...extra });

const normal = (bg1, bg2, acc, acc2) => hv({ bg1, bg2, acc, acc2 });

const COMUN = {
  fr: ["¡Vamos! 💪", "¡A por todas!", "¡Qué bien se ve!", "¡Gracias, equipo!", "¡Listo para lo que sea!"],
  em: ["💪", "🔥", "😎"],
  inv: "🎉 Emotes"
};

export const TEMAS_COLECCION = {
  brawler: {
    ...COMUN,
    logo: "⭐", logoH: "🎃",
    sub: "Colección de Brawlers", subH: "Brawlers de la noche embrujada",
    regl: "Registrados", reglH: "Almas reunidas",
    cmd: ".misbrawlers", u1: "brawler", u2: "brawlers",
    marca: ["⭐", "☆"], marcaH: ["🎃", "🕸️"],
    pag: "🦇", bats: ["🦇", "🦇", "🦇"], colg: "",
    frH: ["¡Buuu! 👻", "Dulce o truco 🎃", "Mmm… un caramelo 🍬", "Qué miedo… 😱", "¡Noche perfecta! 🦇"],
    emH: ["🎃", "👻", "🦇"], invH: "🕯️ Invocar al brawler",
    cmdTxt: "Súbelo de nivel de verdad: <b>.cubitos</b> y <b>.subirbrawler #ID</b><br>Arma tu equipo: <b>.equipo brawler</b> · <b>.poderes brawler</b>",
    varsN: "", varsH: ""
  },
  pokemon: {
    ...COMUN,
    logo: "🔴", logoH: "🧪",
    sub: "Tus Pokémon", subH: "Caldero Pokémon",
    regl: "Registrados", reglH: "Criaturas del caldero",
    cmd: ".mispokemon", u1: "pokémon", u2: "pokémon",
    marca: ["⭐", "☆"], marcaH: ["🧪", "🫧"],
    pag: "🧪", bats: ["🫧", "🦇", "🫧"], colg: "🧪",
    frH: ["¡Glub, glub! 🫧", "Poción lista 🧪", "Mmm… huele a hechizo 🍄", "¡Burbujea! 🫧", "¡Caldero a tope! 🧙‍♀️"],
    emH: ["🧪", "🍄", "🫧"], invH: "🧪 Remover el caldero",
    cmdTxt: "Súbelo de nivel de verdad: <b>.pokecomida</b> y <b>.pokedar # ID</b><br>Arma tu equipo: <b>.equipo pokemon</b> · <b>.poderes pokemon</b>",
    varsN: normal("#4b8dff", "#1c3f9c", "#ffd23f", "#ee4455"),
    varsH: marco("#06231c", "#0a0f0c", "#0d3b2a", "#84cc16", "#a3e635", "#22d3ee", "#14532d", { mut: "#9ad9a8" })
  },
  waifu: {
    ...COMUN,
    logo: "🌸", logoH: "🧙‍♀️",
    sub: "Tu harem", subH: "Harem de la bruja",
    regl: "Registradas", reglH: "Almas hechizadas",
    cmd: ".harem", u1: "waifu", u2: "waifus",
    marca: ["💖", "🤍"], marcaH: ["🔮", "🕸️"],
    pag: "🌙", bats: ["🦇", "🌙", "🦇"], colg: "🧹",
    fr: ["¡Kyaa! 💖", "¡Qué linda! 🌸", "¡Gracias por cuidarme!", "¡Sigamos juntas!", "¡Eres el mejor!"],
    em: ["💖", "🌸", "✨"],
    frH: ["¡Hechizo listo! 🔮", "Mi escoba te espera 🧹", "Un beso embrujado 💋", "¡Luna llena! 🌕", "¡Eres mi aprendiz! 🧙‍♀️"],
    emH: ["🔮", "🧙‍♀️", "🕯️"], invH: "🔮 Lanzar un hechizo",
    cmdTxt: "Súbela de nivel de verdad: <b>.waifushop</b> y <b>.waifudar # ID</b><br>Arma tu equipo: <b>.equipo waifu</b> · <b>.poderes waifu</b>",
    varsN: normal("#ff7eb6", "#a8227a", "#ffd0e6", "#ff5aa5"),
    varsH: marco("#1a0b2e", "#08020f", "#2a1245", "#f472b6", "#f9a8d4", "#c084fc", "#3b1a5c")
  },
  snake: {
    ...COMUN,
    logo: "🐍", logoH: "🪦",
    sub: "Tus Snakes", subH: "Serpientes de la tumba",
    regl: "Registrados", reglH: "Almas arrastradas",
    cmd: ".missnakes", u1: "snake", u2: "snakes",
    marca: ["🌻", "🌱"], marcaH: ["🪦", "🕸️"],
    pag: "🪦", bats: ["🦉", "🌫️", "🦉"], colg: "🪦",
    frH: ["Ssssss… 🐍", "Desde la tumba 🪦", "¡Niebla espesa! 🌫️", "Los búhos vigilan 🦉", "¡Hora de arrastrarse!"],
    emH: ["🪦", "🐍", "🦉"], invH: "🪦 Invocar desde la tumba",
    cmdTxt: "Súbelo de nivel de verdad: <b>.orbes</b> y <b>.darorbe # ID</b><br>Arma tu equipo: <b>.equipo snake</b> · <b>.poderes snake</b>",
    varsN: normal("#4cc16a", "#176b3a", "#ffe66d", "#ff8f3f"),
    varsH: marco("#10161a", "#05080a", "#1b272b", "#a3e635", "#bef264", "#34d399", "#2b3a3f", { mut: "#9db4a6" })
  },
  cod: {
    ...COMUN,
    logo: "🔫", logoH: "💀",
    sub: "Tu arsenal", subH: "Arsenal de esqueletos",
    regl: "Registrados", reglH: "Armas malditas",
    cmd: ".miscod", u1: "ítem", u2: "ítems",
    marca: ["🎖️", "▫️"], marcaH: ["💀", "🦴"],
    pag: "💀", bats: ["💀", "🦴", "💀"], colg: "💀",
    frH: ["¡Hueso duro! 🦴", "Sin piel, sin miedo 💀", "Recargando almas 🩸", "¡Fuego del más allá!", "¡A la tumba, soldado!"],
    emH: ["💀", "🦴", "🩸"], invH: "💀 Despertar al esqueleto",
    cmdTxt: "Súbelo de nivel de verdad: <b>.codtienda</b> y <b>.codmejorar # ID</b><br>Arma tu equipo: <b>.equipo cod</b> · <b>.poderes cod</b>",
    varsN: normal("#5b6b86", "#1d2538", "#ffce1f", "#ff5a36"),
    varsH: marco("#1a0808", "#080202", "#2d1010", "#f87171", "#fca5a5", "#fb923c", "#431818")
  },
  dragon: {
    ...COMUN,
    logo: "🐉", logoH: "👻",
    sub: "Tus dragones", subH: "Dragones de la cripta",
    regl: "Registrados", reglH: "Huevos espectrales",
    cmd: ".misdragones", u1: "dragón", u2: "dragones",
    marca: ["🔥", "🥚"], marcaH: ["👻", "🕸️"],
    pag: "👻", bats: ["👻", "🌫️", "👻"], colg: "👻",
    frH: ["¡Buuu! 👻", "Fuego fantasma 🔥", "Desde la cripta 🏚️", "¡Rugido espectral!", "¡Noche de dragones! 🐉"],
    emH: ["👻", "🐉", "🔥"], invH: "👻 Invocar al espectro",
    cmdTxt: "Súbelo de nivel de verdad: <b>.dragonfood</b> y <b>.dragondar # ID</b><br>Arma tu equipo: <b>.equipo dragon</b> · <b>.poderes dragon</b>",
    varsN: normal("#ff9a3d", "#a3340f", "#ffe066", "#34d399"),
    varsH: marco("#08141f", "#02070d", "#0f2e33", "#5eead4", "#99f6e4", "#a78bfa", "#134e4a")
  },
  clash: {
    ...COMUN,
    logo: "👑", logoH: "🔮",
    sub: "Tus cartas", subH: "Leyendas malditas",
    regl: "Desbloqueadas", reglH: "Cartas selladas",
    cmd: ".miscartas", u1: "carta", u2: "cartas",
    marca: ["👑", "🃏"], marcaH: ["🔮", "🕸️"],
    pag: "🔮", bats: ["🔮", "🦇", "🔮"], colg: "⚗️",
    frH: ["¡Leyenda maldita! 🔮", "Poción dorada ⚗️", "El rey duerme 👑", "¡Sello roto!", "¡La noche es mía! 🌙"],
    emH: ["🔮", "⚗️", "👑"], invH: "🔮 Romper el sello",
    cmdTxt: "Súbelo de nivel de verdad: <b>.clashtienda</b> y <b>.clashmejorar # ID</b><br>Arma tu equipo: <b>.equipo clash</b> · <b>.poderes clash</b>",
    varsN: normal("#4a8dff", "#1b2f8f", "#ffd23f", "#ff5a36"),
    varsH: marco("#1a1205", "#080501", "#2b1f0a", "#facc15", "#fde68a", "#c084fc", "#3d2b0c")
  }
};
