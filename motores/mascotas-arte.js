import { ETAPAS, CASAS } from "./mascotas-datos.js";

const PALETAS = {
  perro: { pelaje: "#d99a5b", oscuro: "#8d5a2f", claro: "#f8e6c8", nariz: "#2b1d1a" },
  gato: { pelaje: "#aab2c2", oscuro: "#6c7587", claro: "#f0f2f7", nariz: "#f08ca0" },
  zorro: { pelaje: "#ee8426", oscuro: "#3a2318", claro: "#fff2df", nariz: "#241613" },
  pinguino: { pelaje: "#2e3a52", oscuro: "#1c2436", claro: "#f6f8fc", nariz: "#f2a23a" },
  ajolote: { pelaje: "#f8b3cb", oscuro: "#e0789f", claro: "#ffe6ef", nariz: "#c95b80" },
  dragon: { pelaje: "#5fc99c", oscuro: "#2e8c6c", claro: "#ffe9a6", nariz: "#2e6f58", hocico: "#a9ebcb" }
};

const OJO_Y = { perro: 3, gato: 3, zorro: 1, pinguino: 2, ajolote: 4, dragon: 3 };
const sepOjo = (especie) => (especie === "perro" ? 17 : especie === "ajolote" ? 21 : 18);

const espejo = (contenido) => `<g>${contenido}</g><g transform="scale(-1 1)">${contenido}</g>`;
const espejoCuerpo = (contenido) => `<g>${contenido}</g><g transform="translate(200 0) scale(-1 1)">${contenido}</g>`;

function orejas(especie, p) {
  if (especie === "perro") {
    return espejo(`<path d="M-30 -22C-54 -28 -60 8 -47 26C-38 30 -30 14 -27 -6Z" fill="${p.oscuro}"/>`);
  }
  if (especie === "gato") {
    return espejo(
      `<path d="M-40 -8L-35 -52L-8 -32Z" fill="${p.pelaje}" stroke="${p.oscuro}" stroke-width="2" stroke-linejoin="round"/>`
      + `<path d="M-34 -16L-32 -40L-17 -29Z" fill="#f6b4c2"/>`
    );
  }
  if (especie === "zorro") {
    return espejo(
      `<path d="M-41 -6L-39 -58L-7 -30Z" fill="${p.pelaje}" stroke="${p.oscuro}" stroke-width="2" stroke-linejoin="round"/>`
      + `<path d="M-39 -58L-39.5 -45L-26 -46.5Z" fill="${p.oscuro}"/>`
      + `<path d="M-35 -13L-34 -41L-16 -28Z" fill="${p.claro}"/>`
    );
  }
  if (especie === "ajolote") {
    return espejo(
      `<g stroke="#ff6b8f" stroke-width="5" stroke-linecap="round" fill="none"><path d="M-42 -6Q-58 -12 -62 -26"/><path d="M-45 6Q-64 4 -70 -6"/><path d="M-42 18Q-60 22 -66 12"/></g>`
      + `<g fill="#ff6b8f"><circle cx="-62" cy="-26" r="4.2"/><circle cx="-70" cy="-6" r="4.2"/><circle cx="-66" cy="12" r="4.2"/></g>`
    );
  }
  if (especie === "dragon") {
    return espejo(
      `<path d="M-42 -2L-64 -12L-48 14Z" fill="${p.oscuro}"/>`
      + `<path d="M-24 -30Q-36 -52 -22 -64Q-18 -46 -10 -34Z" fill="#f2d27a" stroke="#c9a845" stroke-width="1.5" stroke-linejoin="round"/>`
    );
  }
  return "";
}

function colas(especie, p, uid) {
  if (especie === "perro") {
    return `<g><animateTransform attributeName="transform" type="rotate" values="-10 136 152;12 136 152;-10 136 152" dur="0.9s" repeatCount="indefinite"/>`
      + `<path d="M136 152C170 148 176 116 162 98" fill="none" stroke="${p.pelaje}" stroke-width="13" stroke-linecap="round"/>`
      + `<circle cx="162" cy="98" r="6.5" fill="${p.claro}"/></g>`;
  }
  if (especie === "gato") {
    return `<g><animateTransform attributeName="transform" type="rotate" values="-6 136 160;8 136 160;-6 136 160" dur="2.4s" repeatCount="indefinite"/>`
      + `<path d="M136 162C178 166 182 122 160 110" fill="none" stroke="${p.pelaje}" stroke-width="11" stroke-linecap="round"/>`
      + `<path d="M136 162C178 166 182 122 160 110" fill="none" stroke="${p.oscuro}" stroke-width="11" stroke-dasharray="4 11" opacity=".55"/></g>`;
  }
  if (especie === "zorro") {
    return `<g><animateTransform attributeName="transform" type="rotate" values="-5 134 156;7 134 156;-5 134 156" dur="2.2s" repeatCount="indefinite"/>`
      + `<clipPath id="pt${uid}"><rect x="150" y="60" width="60" height="64"/></clipPath>`
      + `<path d="M132 158C168 170 196 136 178 90C176 112 154 126 130 138Z" fill="${p.pelaje}" stroke="${p.oscuro}" stroke-width="1.5" stroke-linejoin="round"/>`
      + `<path d="M132 158C168 170 196 136 178 90C176 112 154 126 130 138Z" fill="${p.claro}" clip-path="url(#pt${uid})"/></g>`;
  }
  if (especie === "pinguino") {
    return `<path d="M130 166Q150 166 154 178Q136 180 128 172Z" fill="${p.oscuro}"/>`;
  }
  if (especie === "ajolote") {
    return `<g><animateTransform attributeName="transform" type="rotate" values="-7 134 164;9 134 164;-7 134 164" dur="1.8s" repeatCount="indefinite"/>`
      + `<path d="M132 158Q178 140 190 172Q160 188 130 174Z" fill="${p.pelaje}" stroke="${p.oscuro}" stroke-width="1.5" stroke-linejoin="round"/>`
      + `<path d="M142 160Q172 156 184 172" fill="none" stroke="${p.oscuro}" stroke-width="2" opacity=".55"/></g>`;
  }
  const alas = `<path d="M74 118Q30 80 20 108Q34 108 36 122Q46 116 52 130Q62 122 74 130Z" fill="#3fae84" stroke="${p.oscuro}" stroke-width="2" stroke-linejoin="round"/>`
    + `<path d="M38 112L52 126M30 112L42 124" stroke="${p.oscuro}" stroke-width="1.5" opacity=".6"/>`;
  return `<g><animateTransform attributeName="transform" type="rotate" values="-2 100 124;3 100 124;-2 100 124" dur="2s" repeatCount="indefinite"/>${espejoCuerpo(alas)}</g>`
    + `<g><animateTransform attributeName="transform" type="rotate" values="-6 136 160;8 136 160;-6 136 160" dur="2.2s" repeatCount="indefinite"/>`
    + `<path d="M136 162C178 170 192 132 172 112" fill="none" stroke="${p.pelaje}" stroke-width="12" stroke-linecap="round"/>`
    + `<path d="M170 98L184 116L164 120Z" fill="${p.oscuro}" stroke="${p.oscuro}" stroke-width="2" stroke-linejoin="round"/></g>`;
}

function cabezaBase(especie, p) {
  const ojo = OJO_Y[especie];
  if (especie === "perro") {
    return `<ellipse rx="44" ry="37" fill="${p.pelaje}"/>`
      + `<ellipse cx="-19" cy="${ojo - 2}" rx="15" ry="16" fill="${p.oscuro}"/>`
      + `<path d="M0 -37Q-7 -22 0 -10Q7 -22 0 -37Z" fill="${p.claro}"/>`
      + `<ellipse cy="17" rx="19" ry="14" fill="${p.claro}"/>`;
  }
  if (especie === "gato") {
    return `<ellipse rx="44" ry="37" fill="${p.pelaje}"/>`
      + `<g stroke="${p.oscuro}" stroke-width="3" stroke-linecap="round" fill="none"><path d="M0 -36V-24"/><path d="M-10 -35L-8 -25"/><path d="M10 -35L8 -25"/></g>`
      + `<ellipse cy="18" rx="17" ry="12" fill="${p.claro}"/>`;
  }
  if (especie === "zorro") {
    return `<ellipse rx="43" ry="35" fill="${p.pelaje}"/>`
      + `<path d="M-44 6L-52 12L-42 14L-47 24L-34 24Q-24 36 0 38Q24 36 34 24L47 24L42 14L52 12L44 6Q34 2 20 10Q0 4 -20 10Q-34 2 -44 6Z" fill="${p.claro}"/>`;
  }
  if (especie === "pinguino") {
    return `<ellipse rx="42" ry="36" fill="${p.pelaje}"/>`
      + `<path d="M-31 4Q-35 -14 -17 -10Q0 -3 0 -3Q0 -3 17 -10Q35 -14 31 4Q29 25 0 31Q-29 25 -31 4Z" fill="${p.claro}"/>`;
  }
  if (especie === "ajolote") {
    return `<ellipse rx="46" ry="36" fill="${p.pelaje}"/>`
      + `<ellipse cy="17" rx="26" ry="15" fill="${p.claro}"/>`
      + `<g fill="${p.oscuro}" opacity=".35"><circle cx="-30" cy="-12" r="3"/><circle cx="30" cy="-12" r="3"/><circle cx="-22" cy="-24" r="2.2"/><circle cx="22" cy="-24" r="2.2"/><circle cx="0" cy="-26" r="2.4"/></g>`;
  }
  return `<ellipse rx="43" ry="36" fill="${p.pelaje}"/>`
    + `<path d="M-14 -34L-8 -50L-2 -35L4 -52L10 -35L16 -48L18 -33Z" fill="${p.oscuro}" stroke="${p.oscuro}" stroke-width="1.5" stroke-linejoin="round"/>`
    + `<ellipse cy="18" rx="22" ry="14" fill="${p.hocico}"/>`;
}

function rostro(especie, p, animo, dormido, mojado) {
  const ojo = OJO_Y[especie];
  const sep = sepOjo(especie);
  let ojos;
  if (dormido) {
    ojos = `<g stroke="#2a1c1a" stroke-width="3" stroke-linecap="round" fill="none"><path d="M${-sep - 6} ${ojo + 1}Q${-sep} ${ojo + 7} ${-sep + 6} ${ojo + 1}"/><path d="M${sep - 6} ${ojo + 1}Q${sep} ${ojo + 7} ${sep + 6} ${ojo + 1}"/></g>`;
  } else {
    const felino = (x, iris) => `<ellipse cx="${x}" cy="${ojo}" rx="7" ry="8.5" fill="${iris}"/><ellipse cx="${x}" cy="${ojo}" rx="2.6" ry="7" fill="#2a1c1a"/><circle cx="${x - 2.2}" cy="${ojo - 3}" r="2.4" fill="#fff"/>`;
    const comun = (x, rx = 6, ry = 7.6) => `<ellipse cx="${x}" cy="${ojo}" rx="${rx}" ry="${ry}" fill="#2a1c1a"/><circle cx="${x - 1.8}" cy="${ojo - 2.8}" r="2.5" fill="#fff"/><circle cx="${x + 2}" cy="${ojo + 2.6}" r="1.2" fill="#fff"/>`;
    const unOjo = (x) => {
      if (especie === "gato") return felino(x, "#e9b92f");
      if (especie === "dragon") return felino(x, "#f2c94c");
      if (especie === "ajolote") return comun(x, 5.4, 6.4);
      return comun(x);
    };
    ojos = unOjo(-sep) + unOjo(sep);
    if (animo === "triste") {
      ojos += `<g stroke="${especie === "pinguino" ? "#8793ad" : p.oscuro}" stroke-width="2.4" stroke-linecap="round"><path d="M${-sep - 7} ${ojo - 11}L${-sep + 5} ${ojo - 14}"/><path d="M${sep + 7} ${ojo - 11}L${sep - 5} ${ojo - 14}"/></g>`;
    }
  }
  const op = animo === "feliz" || dormido ? 0.55 : 0.3;
  const rubor = `<ellipse cx="${-sep - 8}" cy="${ojo + 13}" rx="6" ry="3.6" fill="#ff8aa5" opacity="${op}"/><ellipse cx="${sep + 8}" cy="${ojo + 13}" rx="6" ry="3.6" fill="#ff8aa5" opacity="${op}"/>`;

  const ny = especie === "perro" ? 10 : especie === "gato" ? 11 : 12;
  const my = ny + 3;
  let boca = "";
  if (especie === "perro") boca = `<ellipse cy="${ny}" rx="6.5" ry="4.8" fill="${p.nariz}"/><circle cx="-2" cy="${ny - 1.6}" r="1.4" fill="#fff" opacity=".7"/>`;
  else if (especie === "gato") boca = `<path d="M-4.5 ${ny - 2}H4.5L0 ${ny + 3.5}Z" fill="${p.nariz}"/>`;
  else if (especie === "zorro") boca = `<ellipse cy="${ny}" rx="5" ry="3.8" fill="${p.nariz}"/><circle cx="-1.6" cy="${ny - 1.2}" r="1.1" fill="#fff" opacity=".7"/>`;
  else if (especie === "dragon") boca = `<circle cx="-5" cy="${ny}" r="1.8" fill="${p.nariz}"/><circle cx="5" cy="${ny}" r="1.8" fill="${p.nariz}"/>`;

  let trazo = "";
  if (especie === "pinguino") {
    boca = `<path d="M-9 9Q0 3 9 9Q5 22 0 22Q-5 22 -9 9Z" fill="${p.nariz}" stroke="#c97a1a" stroke-width="1.2" stroke-linejoin="round"/><path d="M-6 13Q0 15 6 13" stroke="#c97a1a" stroke-width="1.4" fill="none"/>`;
  } else if (especie === "ajolote") {
    const curva = dormido ? "M-12 17Q0 23 12 17" : animo === "feliz" ? "M-15 14Q0 28 15 14" : animo === "triste" ? "M-12 23Q0 13 12 23" : "M-12 17Q0 23 12 17";
    boca = `<circle cx="-4" cy="10" r="1.2" fill="${p.nariz}"/><circle cx="4" cy="10" r="1.2" fill="${p.nariz}"/>`;
    trazo = `<path d="${curva}" stroke="${p.nariz}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  } else if (dormido) {
    trazo = `<path d="M0 ${my}V${my + 3}M-5 ${my + 5}Q0 ${my + 8} 5 ${my + 5}" stroke="#4a2e24" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  } else if (animo === "feliz") {
    trazo = `<path d="M0 ${my}V${my + 3}M-10 ${my + 4}Q0 ${my + 14} 10 ${my + 4}Z" stroke="#4a2e24" stroke-width="2" fill="#7a2b34" stroke-linejoin="round" stroke-linecap="round"/>`
      + `<path d="M-5 ${my + 9}Q0 ${my + 16} 5 ${my + 9}Z" fill="#f4788d"/>`;
  } else if (animo === "triste") {
    trazo = `<path d="M0 ${my}V${my + 3}M-6 ${my + 8}Q0 ${my + 3} 6 ${my + 8}" stroke="#4a2e24" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  } else {
    trazo = `<path d="M0 ${my}V${my + 3}M-6 ${my + 4}Q-3 ${my + 8} 0 ${my + 3}Q3 ${my + 8} 6 ${my + 4}" stroke="#4a2e24" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  let bigotes = "";
  if (especie === "gato") {
    bigotes = `<g stroke="${p.oscuro}" stroke-width="1.6" stroke-linecap="round" opacity=".8"><path d="M-17 ${ny + 4}L-40 ${ny}"/><path d="M-17 ${ny + 8}L-40 ${ny + 10}"/><path d="M17 ${ny + 4}L40 ${ny}"/><path d="M17 ${ny + 8}L40 ${ny + 10}"/></g>`;
  }
  const gotas = mojado
    ? `<path d="M-30 -30Q-33 -24 -30 -21Q-27 -24 -30 -30Z" fill="#5ab3ff"/><path d="M24 -34Q21 -28 24 -25Q27 -28 24 -34Z" fill="#5ab3ff"/><path d="M36 -12Q33 -6 36 -3Q39 -6 36 -12Z" fill="#5ab3ff"/>`
    : "";
  return rubor + ojos + boca + trazo + bigotes + gotas;
}

function accesoriosCabeza(equipo, especie) {
  const ojo = OJO_Y[especie];
  let s = "";
  if (equipo.cabeza === "gorrito") {
    s += `<g transform="rotate(12 0 -34)"><path d="M-15 -31L0 -68L15 -31Z" fill="#ff5d8f" stroke="#c63a68" stroke-width="1.5" stroke-linejoin="round"/>`
      + `<circle cx="-4" cy="-48" r="2.4" fill="#fff"/><circle cx="5" cy="-40" r="2.4" fill="#ffe14d"/><circle cx="-1" cy="-58" r="2" fill="#6ee7ff"/>`
      + `<circle cx="0" cy="-69" r="5" fill="#ffe14d"/><ellipse cy="-31" rx="17" ry="4" fill="#ffd0e0"/></g>`;
  }
  if (equipo.cabeza === "corona") {
    s += `<g><path d="M-19 -30L-21 -54L-10 -43L0 -58L10 -43L21 -54L19 -30Z" fill="#ffd23f" stroke="#c9962b" stroke-width="2" stroke-linejoin="round"/>`
      + `<rect x="-19" y="-34" width="38" height="6" rx="2" fill="#f0b91f" stroke="#c9962b" stroke-width="1.5"/>`
      + `<circle cx="0" cy="-37" r="2.6" fill="#e0394f"/><circle cx="-11" cy="-37" r="2" fill="#3b82f6"/><circle cx="11" cy="-37" r="2" fill="#3b82f6"/>`
      + `<circle cx="-21" cy="-54" r="2.4" fill="#ffd23f" stroke="#c9962b"/><circle cx="21" cy="-54" r="2.4" fill="#ffd23f" stroke="#c9962b"/><circle cx="0" cy="-58" r="2.4" fill="#ffd23f" stroke="#c9962b"/></g>`;
  }
  if (equipo.cara === "gafas") {
    const sep = sepOjo(especie);
    s += `<g><rect x="${-sep - 12}" y="${ojo - 9}" width="24" height="17" rx="7" fill="#17171c" stroke="#3a3a46" stroke-width="1.5"/>`
      + `<rect x="${sep - 12}" y="${ojo - 9}" width="24" height="17" rx="7" fill="#17171c" stroke="#3a3a46" stroke-width="1.5"/>`
      + `<path d="M${-sep + 12} ${ojo - 3}Q0 ${ojo - 6} ${sep - 12} ${ojo - 3}" stroke="#3a3a46" stroke-width="2.4" fill="none"/>`
      + `<path d="M${-sep - 8} ${ojo - 5}L${-sep - 2} ${ojo - 5}M${sep - 8} ${ojo - 5}L${sep - 2} ${ojo - 5}" stroke="#8ab4ff" stroke-width="2" stroke-linecap="round" opacity=".8"/></g>`;
  }
  return s;
}

function accesoriosCuello(equipo, y) {
  let s = "";
  if (equipo.cuello === "collar") {
    s += `<path d="M-30 ${y - 3}Q0 ${y + 13} 30 ${y - 3}" fill="none" stroke="#d93b4b" stroke-width="6" stroke-linecap="round"/>`
      + `<circle cx="0" cy="${y + 8}" r="5" fill="#ffd23f" stroke="#c9962b" stroke-width="1.5"/>`;
  }
  if (equipo.cuello === "bufanda") {
    s += `<path d="M-34 ${y - 4}Q0 ${y + 14} 34 ${y - 4}" fill="none" stroke="#e64a5c" stroke-width="13" stroke-linecap="round"/>`
      + `<path d="M-34 ${y - 4}Q0 ${y + 14} 34 ${y - 4}" fill="none" stroke="#fff" stroke-width="13" stroke-dasharray="5 11" opacity=".85"/>`
      + `<path d="M18 ${y + 6}L28 ${y + 34}L14 ${y + 37}L8 ${y + 10}Z" fill="#e64a5c" stroke="#b83446" stroke-width="1.5" stroke-linejoin="round"/>`
      + `<path d="M12 ${y + 26}L25 ${y + 23}" stroke="#fff" stroke-width="3"/>`;
  }
  return s;
}

function cuerpo(especie, p, equipo) {
  let s;
  if (especie === "pinguino") {
    s = `<ellipse cx="100" cy="141" rx="40" ry="38" fill="${p.pelaje}"/>`
      + `<ellipse cx="100" cy="149" rx="28" ry="30" fill="${p.claro}"/>`
      + espejoCuerpo(`<path d="M64 124Q44 140 52 166Q67 158 70 134Z" fill="${p.oscuro}"/>`);
  } else if (especie === "ajolote") {
    s = `<ellipse cx="100" cy="143" rx="38" ry="35" fill="${p.pelaje}"/>`
      + `<ellipse cx="100" cy="151" rx="25" ry="25" fill="${p.claro}"/>`
      + `<g fill="${p.oscuro}" opacity=".3"><circle cx="76" cy="132" r="3"/><circle cx="124" cy="132" r="3"/><circle cx="82" cy="144" r="2.4"/><circle cx="118" cy="144" r="2.4"/></g>`;
  } else {
    s = `<ellipse cx="66" cy="152" rx="17" ry="21" fill="${p.pelaje}"/><ellipse cx="134" cy="152" rx="17" ry="21" fill="${p.pelaje}"/>`
      + `<ellipse cx="100" cy="140" rx="39" ry="37" fill="${p.pelaje}"/>`
      + `<ellipse cx="100" cy="150" rx="24" ry="26" fill="${p.claro}"/>`;
  }
  if (especie === "gato") {
    s += `<g stroke="${p.oscuro}" stroke-width="3" stroke-linecap="round" opacity=".55"><path d="M64 140L72 142"/><path d="M62 150L71 150"/><path d="M136 140L128 142"/><path d="M138 150L129 150"/></g>`;
  }
  if (especie === "dragon") {
    s += `<g stroke="#e0bb55" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".8"><path d="M86 140Q100 144 114 140"/><path d="M84 152Q100 157 116 152"/><path d="M86 164Q100 168 114 164"/></g>`;
  }
  if (equipo.cuerpo === "impermeable") {
    s += `<path d="M62 124Q100 108 138 124L146 170Q100 184 54 170Z" fill="#ffd23f" stroke="#d7a912" stroke-width="2" stroke-linejoin="round"/>`
      + `<path d="M100 114V178" stroke="#d7a912" stroke-width="2"/><circle cx="94" cy="140" r="3" fill="#d7a912"/><circle cx="94" cy="158" r="3" fill="#d7a912"/>`
      + `<path d="M66 128Q100 116 134 128" fill="none" stroke="#fff3a8" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
  }
  if (especie === "pinguino") {
    s += `<ellipse cx="82" cy="177" rx="14" ry="6" fill="${p.nariz}"/><ellipse cx="118" cy="177" rx="14" ry="6" fill="${p.nariz}"/>`;
  } else if (especie === "ajolote") {
    s += `<ellipse cx="78" cy="175" rx="14" ry="7.5" fill="${p.pelaje}" stroke="${p.oscuro}" stroke-width="1"/><ellipse cx="122" cy="175" rx="14" ry="7.5" fill="${p.pelaje}" stroke="${p.oscuro}" stroke-width="1"/>`
      + `<g fill="${p.oscuro}" opacity=".6"><circle cx="72" cy="178" r="1.6"/><circle cx="78" cy="179" r="1.6"/><circle cx="84" cy="178" r="1.6"/><circle cx="116" cy="178" r="1.6"/><circle cx="122" cy="179" r="1.6"/><circle cx="128" cy="178" r="1.6"/></g>`;
  } else {
    s += `<ellipse cx="82" cy="174" rx="13" ry="8" fill="${p.claro}" stroke="${p.pelaje}" stroke-width="1"/><ellipse cx="118" cy="174" rx="13" ry="8" fill="${p.claro}" stroke="${p.pelaje}" stroke-width="1"/>`
      + `<ellipse cx="62" cy="174" rx="13" ry="7" fill="${p.pelaje}"/><ellipse cx="138" cy="174" rx="13" ry="7" fill="${p.pelaje}"/>`;
  }
  return s;
}

export function svgMascota({ especie, etapa = "adulto", dormido = false, animo = "normal", mojado = false, equipo = {}, uid = "a", x = 100, y = 180, k = 1 }) {
  const p = PALETAS[especie];
  const e = ETAPAS.find((t) => t.id === etapa) || ETAPAS[2];
  const ch = e.cabeza;
  const cuelloY = 84 + 33 * ch;
  const cabeza = cabezaBase(especie, p);
  const cara = rostro(especie, p, animo, dormido, mojado);
  const zzz = dormido
    ? `<g class="zz" fill="#6b7fd6" font-weight="800" font-family="system-ui,sans-serif"><text x="150" y="60" font-size="20">Z</text><text x="166" y="42" font-size="15">z</text><text x="178" y="28" font-size="11">z</text></g>`
    : "";
  return `<g transform="translate(${x} ${y}) scale(${(k * e.escala).toFixed(3)}) translate(-100 -180)">`
    + `<ellipse cx="100" cy="179" rx="56" ry="8" fill="#000" opacity=".16"/>`
    + colas(especie, p, uid)
    + `<g>${dormido ? `<animateTransform attributeName="transform" type="translate" values="0 0;0 1.6;0 0" dur="3.2s" repeatCount="indefinite"/>` : ""}`
    + cuerpo(especie, p, equipo)
    + `<g transform="translate(100 84) scale(${ch})"><g>`
    + (dormido
      ? `<animateTransform attributeName="transform" type="translate" values="0 0;0 2;0 0" dur="3.2s" repeatCount="indefinite"/>`
      : `<animateTransform attributeName="transform" type="translate" values="0 0;0 -1.6;0 0" dur="2.6s" repeatCount="indefinite"/>`)
    + orejas(especie, p) + cabeza + cara + accesoriosCabeza(equipo, especie) + `</g></g>`
    + `<g transform="translate(100 0)">${accesoriosCuello(equipo, cuelloY)}</g>`
    + `</g>` + zzz + `</g>`;
}

const ESTILO_CASA = [
  { pared: "#c88f52", techo: "#8a4b2a", linea: "#a8733a" },
  { pared: "#c9573f", techo: "#4b4b5c", linea: "#a8432f" },
  { pared: "#f3ead6", techo: "#2f6fb8", linea: "#d9ccb0" }
];

export function svgCasa(nivel, { x = 0, y = 0, k = 1 } = {}) {
  const c = ESTILO_CASA[nivel - 1] || ESTILO_CASA[0];
  let s = `<g transform="translate(${x} ${y}) scale(${k})">`
    + `<ellipse cx="65" cy="2" rx="78" ry="7" fill="#000" opacity=".14"/>`;
  if (nivel >= 2) s += `<rect x="92" y="-96" width="16" height="40" fill="#8f3a2b"/><rect x="89" y="-100" width="22" height="7" fill="#6d2b20"/>`;
  s += `<rect x="0" y="-62" width="130" height="62" fill="${c.pared}" stroke="${c.linea}" stroke-width="2"/>`;
  if (nivel === 1) {
    for (let i = 1; i < 5; i++) s += `<path d="M${i * 26} -62V0" stroke="${c.linea}" stroke-width="1.5"/>`;
  } else if (nivel === 2) {
    for (let r = 0; r < 5; r++) {
      s += `<path d="M0 ${-62 + r * 12.4}H130" stroke="${c.linea}" stroke-width="1.2"/>`;
      for (let b = 0; b < 7; b++) s += `<path d="M${(b * 20 + (r % 2) * 10)} ${-62 + r * 12.4}v12.4" stroke="${c.linea}" stroke-width="1.2"/>`;
    }
  } else {
    s += `<rect x="6" y="-52" width="22" height="22" rx="3" fill="#a9d8ff" stroke="#b79a52" stroke-width="2"/><path d="M17 -52V-30M6 -41H28" stroke="#b79a52" stroke-width="2"/>`
      + `<rect x="102" y="-52" width="22" height="22" rx="3" fill="#a9d8ff" stroke="#b79a52" stroke-width="2"/><path d="M113 -52V-30M102 -41H124" stroke="#b79a52" stroke-width="2"/>`
      + `<path d="M0 -62H130" stroke="#d6b44f" stroke-width="3"/>`;
  }
  s += `<path d="M-12 -60L65 -112L142 -60Z" fill="${c.techo}" stroke="#00000033" stroke-width="2" stroke-linejoin="round"/>`;
  if (nivel === 3) s += `<path d="M65 -112V-132" stroke="#8a8a8a" stroke-width="2"/><path d="M65 -132L83 -126L65 -120Z" fill="#e0394f"/>`;
  s += `<path d="M43 0V-34A22 22 0 0 1 87 -34V0Z" fill="#2a1f1c"/>`
    + `<path d="M43 0V-34A22 22 0 0 1 87 -34V0" fill="none" stroke="${nivel === 3 ? "#d6b44f" : c.linea}" stroke-width="4"/>`;
  if (nivel === 3) s += `<g><circle cx="10" cy="-6" r="5" fill="#ff6b9d"/><circle cx="22" cy="-3" r="4" fill="#ffd23f"/><circle cx="120" cy="-5" r="5" fill="#ff6b9d"/><circle cx="108" cy="-3" r="4" fill="#fff"/></g>`;
  return s + `</g>`;
}

export function svgPuertaClip(uid, nivel, { x, y, k }) {
  return `<clipPath id="pu${uid}"><path transform="translate(${x} ${y}) scale(${k})" d="M43 0V-34A22 22 0 0 1 87 -34V0Z"/></clipPath>`;
}

function gotasLluvia() {
  let s = `<g class="lluvia" stroke="#e8f4ff" stroke-width="1.6" stroke-linecap="round" opacity=".85">`;
  for (let i = 0; i < 26; i++) {
    const x = (i * 37) % 330;
    const demora = ((i * 0.23) % 1.1).toFixed(2);
    s += `<line x1="${x}" y1="-14" x2="${x - 4}" y2="-2" style="animation-delay:-${demora}s"/>`;
  }
  return s + `</g>`;
}

export function svgEscena({ especie, etapa, dormido, animo, mojado, equipo, casa, llueve, noche, uid }) {
  const cieloA = llueve ? "#7c8ca2" : noche ? "#1b2447" : "#9fdcff";
  const cieloB = llueve ? "#b3bfce" : noche ? "#3b4a86" : "#eaf8ff";
  const suelo = llueve ? "#4f9a58" : noche ? "#2b5a49" : "#7bcf68";
  const e = ETAPAS.find((t) => t.id === etapa) || ETAPAS[2];
  let s = `<svg viewBox="0 0 320 230" xmlns="http://www.w3.org/2000/svg" class="escena" role="img">`
    + `<defs><linearGradient id="cl${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cieloA}"/><stop offset="1" stop-color="${cieloB}"/></linearGradient></defs>`
    + `<rect width="320" height="230" fill="url(#cl${uid})"/>`;
  if (noche && !llueve) {
    s += `<circle cx="268" cy="38" r="15" fill="#fff6cf"/><circle cx="274" cy="34" r="13" fill="#2a3566"/>`
      + `<g fill="#fff" opacity=".85"><circle cx="40" cy="28" r="1.6"/><circle cx="96" cy="50" r="1.2"/><circle cx="150" cy="22" r="1.5"/><circle cx="210" cy="56" r="1.2"/><circle cx="300" cy="90" r="1.4"/><circle cx="20" cy="84" r="1.2"/></g>`;
  } else if (!llueve) {
    s += `<circle cx="276" cy="40" r="19" fill="#ffe27a"/><circle cx="276" cy="40" r="26" fill="#ffe27a" opacity=".3"/>`;
  }
  const nube = llueve ? "#5d6b80" : noche ? "#46508a" : "#fff";
  s += `<g fill="${nube}" opacity="${llueve ? 0.95 : 0.9}"><ellipse cx="70" cy="42" rx="34" ry="13"/><ellipse cx="92" cy="34" rx="22" ry="12"/><ellipse cx="190" cy="30" rx="30" ry="11"/><ellipse cx="208" cy="23" rx="19" ry="10"/>`
    + (llueve ? `<ellipse cx="270" cy="52" rx="36" ry="13"/><ellipse cx="250" cy="44" rx="22" ry="11"/>` : "")
    + `</g>`
    + `<rect y="190" width="320" height="40" fill="${suelo}"/><path d="M0 190Q40 182 80 190T160 190T240 190T320 190V196H0Z" fill="${suelo}"/>`;
  if (llueve) s += `<ellipse cx="260" cy="212" rx="30" ry="5" fill="#8fc9ff" opacity=".55"/><ellipse cx="60" cy="220" rx="22" ry="4" fill="#8fc9ff" opacity=".5"/>`;

  const protegido = llueve && casa > 0;
  const conCasa = casa > 0;
  const casaK = 1.18;
  const casaX = 20;
  const casaY = 196;
  const puertaX = casaX + 43 * casaK;
  if (conCasa) s += svgCasa(casa, { x: casaX, y: casaY, k: casaK });
  if (protegido) {
    s += `<defs>${svgPuertaClip(uid, casa, { x: casaX, y: casaY, k: casaK })}</defs>`
      + `<g clip-path="url(#pu${uid})"><rect x="${puertaX}" y="${casaY - 70}" width="${44 * casaK}" height="${70}" fill="#3a2b27"/>`
      + svgMascota({ especie, etapa, dormido, animo, mojado: false, equipo, uid, x: casaX + 65 * casaK, y: casaY - 2, k: 0.36 / e.escala })
      + `</g>`
      + `<path d="M${casaX + 43 * casaK} ${casaY}V${casaY - 34 * casaK}A${22 * casaK} ${22 * casaK} 0 0 1 ${casaX + 87 * casaK} ${casaY - 34 * casaK}V${casaY}" fill="none" stroke="#00000044" stroke-width="3"/>`;
  } else {
    const px = conCasa ? 244 : 160;
    s += svgMascota({ especie, etapa, dormido, animo, mojado, equipo, uid, x: px, y: 196, k: conCasa ? 0.86 : 1.02 });
  }
  if (llueve) s += gotasLluvia();
  return s + `</svg>`;
}
