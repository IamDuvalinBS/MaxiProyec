import { svgMascota } from "./mascotas-arte.js";

const CIELOS = {
  bosque: ["#8fd3ff", "#e9f9ff"],
  nieve: ["#a9c9ea", "#f3f8ff"],
  lago: ["#7cc4f5", "#e6f6ff"],
  encantado: ["#3a3585", "#8a62c9"],
  volcan: ["#5c2424", "#ff9c5a"],
  islas: ["#7bc7ff", "#fff0c4"]
};

const NOCHE = { bosque: 0.45, nieve: 0.42, lago: 0.45, encantado: 0.28, volcan: 0.22, islas: 0.4 };

const aleatorio = (i, a = 7) => ((i * 9301 + a * 49297) % 233280) / 233280;

function fondoBosque() {
  let s = `<path d="M0 150Q60 120 120 145T240 138T320 148V200H0Z" fill="#7cc079"/>`;
  for (const [x, h] of [[26, 1], [78, 0.8], [246, 0.9], [298, 1.1]]) {
    s += `<rect x="${x - 4}" y="${150 - 8 * h}" width="8" height="${52 + 8 * h}" fill="#7a5233"/>`
      + `<circle cx="${x}" cy="${132 - 10 * h}" r="${26 * h}" fill="#3f9b4e"/><circle cx="${x - 15 * h}" cy="${144 - 10 * h}" r="${18 * h}" fill="#4cae5a"/><circle cx="${x + 15 * h}" cy="${144 - 10 * h}" r="${18 * h}" fill="#4cae5a"/>`;
  }
  s += `<rect y="190" width="320" height="40" fill="#6cc266"/><path d="M0 190Q80 182 160 190T320 190V196H0Z" fill="#6cc266"/>`;
  for (let i = 0; i < 16; i++) {
    const x = 8 + aleatorio(i) * 300;
    const y = 200 + aleatorio(i, 3) * 26;
    s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="2.6" fill="${["#ff7aa8", "#ffe14d", "#fff"][i % 3]}"/>`;
  }
  s += `<g><rect x="44" y="198" width="3" height="8" fill="#f6e7c8"/><ellipse cx="45.5" cy="198" rx="7" ry="4.5" fill="#e0533f"/><circle cx="43" cy="197" r="1.2" fill="#fff"/><circle cx="48" cy="198.5" r="1.2" fill="#fff"/></g>`;
  return s;
}

function fondoNieve() {
  let s = `<path d="M-10 190L60 82L110 152L160 62L230 162L270 102L330 190Z" fill="#8fa9c9"/><path d="M60 82L112 152L90 190L30 190Z" fill="#7a95b8" opacity=".5"/>`
    + `<path d="M60 82L45 110L58 102L66 112L78 106Z" fill="#fff"/><path d="M160 62L140 98L154 90L162 102L174 92L184 100Z" fill="#fff"/><path d="M270 102L255 127L266 121L272 130L283 122Z" fill="#fff"/>`;
  for (const [x, h] of [[26, 1], [292, 1.15], [250, 0.8]]) {
    s += `<rect x="${x - 3}" y="${186 - 6 * h}" width="6" height="12" fill="#6b4a30"/>`
      + `<path d="M${x} ${178 - 40 * h}L${x - 17 * h} ${186 - 6 * h}H${x + 17 * h}Z" fill="#2f7d52"/><path d="M${x} ${160 - 44 * h}L${x - 14 * h} ${176 - 30 * h}H${x + 14 * h}Z" fill="#35905c"/>`
      + `<path d="M${x} ${160 - 44 * h}L${x - 7 * h} ${168 - 36 * h}H${x + 7 * h}Z" fill="#fff"/>`;
  }
  s += `<rect y="190" width="320" height="40" fill="#f4f9ff"/><path d="M0 190Q80 180 160 190T320 190V196H0Z" fill="#f4f9ff"/><ellipse cx="70" cy="214" rx="46" ry="6" fill="#cfe0f5"/><ellipse cx="250" cy="220" rx="52" ry="6" fill="#cfe0f5"/>`;
  return s;
}

function fondoLago(uid) {
  let s = `<defs><linearGradient id="lg${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6bd0f5"/><stop offset="1" stop-color="#2f8fd1"/></linearGradient></defs>`
    + `<path d="M0 142L50 100L100 136L150 96L210 140L270 106L320 136V160H0Z" fill="#7da7c9" opacity=".85"/>`
    + `<rect y="138" width="320" height="56" fill="url(#lg${uid})"/>`
    + `<g fill="none" stroke="#fff" stroke-width="1.6" opacity=".5"><ellipse cx="80" cy="160" rx="24" ry="3.6"/><ellipse cx="230" cy="172" rx="30" ry="4"/><ellipse cx="160" cy="150" rx="16" ry="2.6"/></g>`
    + `<g><ellipse cx="44" cy="178" rx="13" ry="4.5" fill="#4aa857"/><circle cx="46" cy="176" r="3.4" fill="#ff8fb7"/><ellipse cx="274" cy="166" rx="12" ry="4" fill="#4aa857"/><circle cx="272" cy="164.5" r="3" fill="#fff"/></g>`
    + `<path d="M0 192Q80 184 160 192T320 190V230H0Z" fill="#dcc88f"/><path d="M0 200Q80 196 160 202T320 200V230H0Z" fill="#cdb67a" opacity=".6"/>`;
  for (const x of [20, 30, 290, 300]) s += `<path d="M${x} 196Q${x - 3} 176 ${x - 6} 164M${x} 196Q${x} 174 ${x + 1} 162M${x} 196Q${x + 4} 178 ${x + 8} 168" stroke="#5aa04a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  return s;
}

function fondoEncantado() {
  let s = "";
  for (const [x, h] of [[30, 1], [282, 1.1], [150, 0.7]]) {
    s += `<path d="M${x - 12} 200Q${x - 20} ${130 - 20 * h} ${x - 6} ${70 - 10 * h}Q${x + 2} ${130 - 20 * h} ${x + 14} 200Z" fill="#1a1740"/>`
      + `<circle cx="${x}" cy="${74 - 10 * h}" r="${34 * h}" fill="#2a2370"/><circle cx="${x - 22 * h}" cy="${92 - 10 * h}" r="${22 * h}" fill="#332a85"/><circle cx="${x + 22 * h}" cy="${92 - 10 * h}" r="${22 * h}" fill="#332a85"/>`;
  }
  s += `<rect y="190" width="320" height="40" fill="#2d5a5a"/><path d="M0 190Q80 182 160 190T320 190V196H0Z" fill="#2d5a5a"/>`;
  for (const [x, y, r, c] of [[70, 204, 9, "#3ee6d0"], [118, 214, 6, "#ff7ad9"], [214, 206, 8, "#7ad0ff"], [262, 214, 10, "#3ee6d0"], [188, 222, 5, "#ff7ad9"]]) {
    s += `<circle cx="${x}" cy="${y - 4}" r="${r + 6}" fill="${c}" opacity=".16"/><rect x="${x - 1.6}" y="${y - 2}" width="3.2" height="${r * 0.9}" fill="#e9e3ff"/><ellipse cx="${x}" cy="${y - 2}" rx="${r}" ry="${r * 0.62}" fill="${c}"/>`
      + `<circle cx="${x - r * 0.3}" cy="${y - 3.6}" r="1.4" fill="#fff" opacity=".8"/>`;
  }
  for (let i = 0; i < 9; i++) {
    const x = 20 + aleatorio(i, 11) * 280;
    const y = 90 + aleatorio(i, 5) * 100;
    s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="2.2" fill="#fff59a"><animate attributeName="opacity" values=".15;1;.15" dur="${(2 + aleatorio(i) * 2).toFixed(1)}s" begin="-${(aleatorio(i, 2) * 3).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
  }
  return s;
}

function fondoVolcan() {
  let s = `<path d="M50 200L146 72L174 72L270 200Z" fill="#3b2a2a"/><path d="M146 72L120 200H50Z" fill="#2c1f1f" opacity=".6"/>`
    + `<path d="M146 72Q160 60 174 72Q160 82 146 72Z" fill="#ff7a2f"/>`
    + `<path d="M156 76Q148 112 138 150M164 76Q174 114 184 156" stroke="#ff7a2f" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M156 76Q148 112 138 150M164 76Q174 114 184 156" stroke="#ffd27a" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
    + `<g fill="#6b5a5a" opacity=".7"><circle cx="156" cy="56" r="11"><animate attributeName="cy" values="60;30" dur="4s" repeatCount="indefinite"/><animate attributeName="opacity" values=".7;0" dur="4s" repeatCount="indefinite"/></circle><circle cx="168" cy="52" r="9"><animate attributeName="cy" values="56;24" dur="5s" begin="-2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".7;0" dur="5s" begin="-2s" repeatCount="indefinite"/></circle></g>`
    + `<ellipse cx="30" cy="196" rx="30" ry="14" fill="#2a1d1a"/><ellipse cx="300" cy="198" rx="34" ry="16" fill="#2a1d1a"/>`
    + `<rect y="190" width="320" height="40" fill="#3a2622"/><path d="M0 190Q80 182 160 190T320 190V196H0Z" fill="#3a2622"/>`
    + `<g stroke="#ff7a2f" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M20 206L60 212L84 206L120 218"><animate attributeName="opacity" values=".6;1;.6" dur="2.4s" repeatCount="indefinite"/></path><path d="M210 210L250 204L284 214L310 208"><animate attributeName="opacity" values="1;.55;1" dur="2.8s" repeatCount="indefinite"/></path></g>`;
  return s;
}

function fondoIslas() {
  let s = `<defs><linearGradient id="rbw" x1="0" x2="1"><stop offset="0" stop-color="#ff8a8a"/><stop offset=".33" stop-color="#ffe27a"/><stop offset=".66" stop-color="#7affb0"/><stop offset="1" stop-color="#7ab4ff"/></linearGradient></defs>`
    + `<path d="M10 200Q160 10 310 200" stroke="url(#rbw)" stroke-width="9" fill="none" opacity=".3"/>`;
  for (const [x, y, k] of [[56, 108, 1], [262, 84, 0.72]]) {
    s += `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-40 6Q0 -6 40 6L26 32Q0 50 -26 32Z" fill="#8a6a4a"/><ellipse cx="0" cy="4" rx="40" ry="10" fill="#6fcf6a"/><circle cx="-14" cy="-6" r="7" fill="#4cae5a"/><rect x="-15" y="-2" width="2" height="6" fill="#6b4a30"/>`
      + `<animateTransform attributeName="transform" type="translate" values="${x} ${y};${x} ${y - 5};${x} ${y}" dur="${k === 1 ? 5 : 6.5}s" repeatCount="indefinite"/></g>`;
  }
  s += `<g fill="#fff" opacity=".95"><ellipse cx="40" cy="214" rx="56" ry="20"/><ellipse cx="110" cy="222" rx="60" ry="18"/><ellipse cx="190" cy="216" rx="56" ry="20"/><ellipse cx="270" cy="220" rx="62" ry="20"/></g>`
    + `<path d="M20 192Q90 182 160 190T300 190V206Q230 220 160 216T20 208Z" fill="#7bd36f"/><path d="M20 206Q90 220 160 216T300 206V214Q230 226 160 222T20 214Z" fill="#a98c6a"/>`;
  return s;
}

const FONDOS = { bosque: fondoBosque, nieve: fondoNieve, lago: fondoLago, encantado: fondoEncantado, volcan: fondoVolcan, islas: fondoIslas };

function lluvia(intensa) {
  let s = `<g stroke="#e8f4ff" stroke-width="1.6" stroke-linecap="round" opacity=".85">`;
  const n = intensa ? 38 : 26;
  for (let i = 0; i < n; i++) {
    const x = (i * 331) % 340;
    s += `<line x1="${x}" y1="0" x2="${x - 4}" y2="12"><animateTransform attributeName="transform" type="translate" values="0 -20;-14 250" dur="${(intensa ? 0.6 : 0.85).toFixed(2)}s" begin="-${((i * 0.17) % 0.85).toFixed(2)}s" repeatCount="indefinite"/></line>`;
  }
  return s + `</g>`;
}

function nieve() {
  let s = `<g fill="#fff" opacity=".95">`;
  for (let i = 0; i < 34; i++) {
    const x = (i * 97) % 330;
    const r = 1.4 + (i % 3) * 0.7;
    s += `<circle cx="${x}" cy="0" r="${r}"><animateTransform attributeName="transform" type="translate" values="0 -10;${(i % 2 ? 14 : -14)} 245" dur="${(3.2 + (i % 5) * 0.5).toFixed(1)}s" begin="-${((i * 0.43) % 4).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
  }
  return s + `</g>`;
}

function niebla() {
  return `<defs><filter id="nb" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="7"/></filter></defs><g fill="#fff" filter="url(#nb)"><rect x="-40" y="120" width="400" height="26" rx="13" opacity=".28"><animateTransform attributeName="transform" type="translate" values="-18 0;18 0;-18 0" dur="9s" repeatCount="indefinite"/></rect>`
    + `<rect x="-40" y="160" width="400" height="30" rx="15" opacity=".3"><animateTransform attributeName="transform" type="translate" values="16 0;-16 0;16 0" dur="11s" repeatCount="indefinite"/></rect>`
    + `<rect x="-40" y="196" width="400" height="26" rx="13" opacity=".22"><animateTransform attributeName="transform" type="translate" values="-12 0;12 0;-12 0" dur="8s" repeatCount="indefinite"/></rect></g>`;
}

function relampago() {
  return `<path d="M200 0L176 70H196L180 130L222 54H202L220 0Z" fill="#fff7b0" opacity="0"><animate attributeName="opacity" values="0;0;0.9;0;0;0.7;0;0;0" dur="5s" repeatCount="indefinite"/></path>`;
}

function cielo(zona, clima, uid) {
  const [a, b] = CIELOS[zona];
  let s = `<defs><linearGradient id="cz${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="320" height="230" fill="url(#cz${uid})"/>`;
  const despejado = clima.tipo === "despejado";
  if (!clima.esDia) {
    s += `<g fill="#fff" opacity=".85"><circle cx="30" cy="30" r="1.5"/><circle cx="82" cy="52" r="1.2"/><circle cx="140" cy="22" r="1.6"/><circle cx="214" cy="46" r="1.2"/><circle cx="300" cy="80" r="1.4"/><circle cx="262" cy="24" r="1.3"/></g>`;
    if (despejado || clima.tipo === "nublado") s += `<circle cx="272" cy="40" r="14" fill="#fff6cf"/><circle cx="278" cy="36" r="12" fill="${a}"/>`;
  } else if (despejado && zona !== "encantado") {
    s += `<circle cx="276" cy="40" r="18" fill="#ffe27a"/><circle cx="276" cy="40" r="25" fill="#ffe27a" opacity=".3"/>`;
  }
  if (clima.tipo !== "despejado" || zona === "islas") {
    const color = ["lluvia", "tormenta"].includes(clima.tipo) ? "#5d6b80" : "#fff";
    s += `<g fill="${color}" opacity=".92"><ellipse cx="70" cy="44" rx="34" ry="13"/><ellipse cx="92" cy="36" rx="22" ry="12"/><ellipse cx="200" cy="30" rx="30" ry="11"/><ellipse cx="218" cy="23" rx="19" ry="10"/></g>`;
  }
  return s;
}

export function svgEscenaZona({ zona, clima, especie, etapa = "adulto", dormido = false, animo = "normal", equipo = {}, uid = "z", buscando = true, conMascota = true }) {
  const c = clima || { tipo: "despejado", esDia: true };
  let s = `<svg viewBox="0 0 320 230" xmlns="http://www.w3.org/2000/svg" class="escena" role="img">`
    + cielo(zona, c, uid) + FONDOS[zona](uid);
  const tinte = { nublado: 0.18, lluvia: 0.3, tormenta: 0.42, niebla: 0.16 }[c.tipo];
  if (tinte) s += `<rect width="320" height="230" fill="#5d6b80" opacity="${tinte}"/>`;
  if (!c.esDia) s += `<rect width="320" height="230" fill="#0b1038" opacity="${NOCHE[zona]}"/>`;
  if (conMascota) {
    s += svgMascota({ especie, etapa, dormido, animo, equipo, uid, x: 160, y: 200, k: 0.9, buscando });
  }
  if (c.tipo === "lluvia") s += lluvia(false);
  if (c.tipo === "tormenta") s += lluvia(true) + relampago();
  if (c.tipo === "nieve") s += nieve();
  if (c.tipo === "niebla") s += niebla();
  if (!c.esDia) s += `<rect width="320" height="230" fill="#0b1038" opacity=".1"/>`;
  return s + `</svg>`;
}
