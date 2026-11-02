import { addToWallet } from "./db.js";
import {
  initGachaDB, cantidadItem, sumarItem, enTransaccion, personajesDeCategoria, propietarios, reclamar, usuariosConItem
} from "./gacha-db.js";
import { darSellos, EMOJI_SELLO } from "./gacha-sellos.js";
import { darFragmentos, NIVEL_INICIAL } from "./gacha-niveles.js";
import { darTickets } from "./gacha-tickets.js";
import { darReliquia, reliquiaPorId } from "./gacha-reliquias.js";
import { otorgar, tieneInsignia, definicion } from "./gacha-insignias.js";
import { rangoDeRareza } from "./gacha-config.js";
import { CAT } from "./gacha-categorias.js";
import { fmt } from "../src/economia/formato.js";
import { moneda } from "../src/economia/temas.js";
import { encabezado, mencion } from "../src/economia/estilo.js";

export const META_COMUNIDAD = 10000;
export const COMANDOS_MINIMOS = 100;
export const INICIO_MUERTOS = Date.parse("2026-11-01T06:00:00Z");
export const FIN_MUERTOS = Date.parse("2026-11-16T06:00:00Z");
export const ESPERA_MIN_MS = 3000;
export const NOMBRE_EVENTO = "Ofrenda de Día de Muertos";
export const ETIQUETA_WAIFU = "muertos";

const COMUNIDAD = "evento:muertos2026";
const K_TOTAL = "mu26:total";
const K_N = "mu26:n";
const kFase = (id) => `mu26:fase:${id}`;
const kObjeto = (id) => `mu26:objeto:${id}`;

export const OBJETOS = {
  flor: { emoji: "🌼", nombre: "Flor de Cempasúchil" },
  pan: { emoji: "🍞", nombre: "Pan de Muerto" },
  calavera: { emoji: "💀", nombre: "Calavera de Azúcar" },
  vela: { emoji: "🕯️", nombre: "Vela de Ofrenda" },
  catrina: { emoji: "💃", nombre: "Catrina Eterna" }
};

export const FASES = [
  {
    id: 1, pct: 0.1, emoji: "🌼", nombre: "Flores de Cempasúchil",
    desc: "El camino de pétalos que guía a las almas hasta la ofrenda.",
    premio: { dinero: 50000, sellos: 2, fragmentos: 2, objeto: "flor" }
  },
  {
    id: 2, pct: 0.25, emoji: "🍞", nombre: "Pan de Muerto",
    desc: "El pan recién horneado llega a todas las mesas.",
    premio: { dinero: 120000, sellos: 2, fragmentos: 3, ticketsWaifu: 1, objeto: "pan" }
  },
  {
    id: 3, pct: 0.5, emoji: "💀", nombre: "Calaveritas de Azúcar",
    desc: "La mitad del camino está iluminada. Aparece la primera waifu del evento.",
    premio: { dinero: 250000, sellos: 3, fragmentos: 5, tickets: 1, waifu: { min: 3, max: 4 }, objeto: "calavera" }
  },
  {
    id: 4, pct: 0.75, emoji: "🕯️", nombre: "Velas del Camino",
    desc: "Miles de velas encendidas. Las almas ya están cerca.",
    premio: { dinero: 500000, sellos: 3, fragmentos: 8, tickets: 2, waifu: { min: 5, max: 6 }, objeto: "vela" }
  },
  {
    id: 5, pct: 1, emoji: "👑", nombre: "La Gran Ofrenda",
    desc: "La comunidad completa el altar. Llega la mejor recompensa del evento.",
    premio: {
      dinero: 1500000, sellos: 5, fragmentos: 15, tickets: 3, waifu: { mejor: true }, objeto: "catrina",
      insignia: "mu_guardian", reliquia: "cempasuchil"
    }
  }
];

let listo = false;
initGachaDB().then(() => { listo = true; }).catch(() => {});

const ultimos = new Map();

export const umbralDe = (fase) => Math.max(1, Math.round(META_COMUNIDAD * fase.pct));
export const eventoVigente = (ahora = Date.now()) => ahora >= INICIO_MUERTOS && ahora < FIN_MUERTOS;
export const totalComunidad = () => cantidadItem(COMUNIDAD, K_TOTAL);
export const comandosDe = (usuario) => cantidadItem(usuario, K_N);
export const faseDesbloqueada = (fase) => totalComunidad() >= umbralDe(fase);
export const faseEntregada = (usuario, fase) => cantidadItem(usuario, kFase(fase.id)) > 0;
export const objetosDe = (usuario) => Object.entries(OBJETOS).map(([id, o]) => ({ id, ...o, tiene: cantidadItem(usuario, kObjeto(id)) > 0 }));

const monedaTexto = (n) => `${fmt(n)} ${moneda()}`;

function elegirWaifu({ min = 1, max = 99, mejor = false }) {
  const libres = personajesDeCategoria("waifu").filter((p) => p.meta?.evento === ETIQUETA_WAIFU && !propietarios(p.id).length);
  if (!libres.length) return null;
  const rango = (p) => rangoDeRareza(p.rareza);
  const tope = Math.max(...libres.map(rango));
  let pool = mejor ? libres.filter((p) => rango(p) === tope) : libres.filter((p) => rango(p) >= min && rango(p) <= max);
  if (!pool.length) pool = libres.filter((p) => rango(p) >= min);
  if (!pool.length) pool = libres.filter((p) => rango(p) === tope);
  return pool[Math.floor(Math.random() * pool.length)];
}

function ticketAzar(usuario) {
  const categorias = Object.keys(CAT);
  const categoria = categorias[Math.floor(Math.random() * categorias.length)];
  darTickets(usuario, categoria, 1);
  return categoria;
}

function entregarFase(usuario, fase) {
  const p = fase.premio;
  const lineas = [];
  let waifu = null;
  enTransaccion(() => {
    sumarItem(usuario, kFase(fase.id), 1);
    if (p.sellos) {
      const r = darSellos(usuario, p.sellos);
      lineas.push(`${EMOJI_SELLO} *Sellos de Reclamo* ›› +${r.agregados}${r.agregados < p.sellos ? " (límite alcanzado)" : ""}`);
    }
    if (p.fragmentos) {
      darFragmentos(usuario, p.fragmentos);
      lineas.push(`🧩 *Fragmentos de ascensión* ›› +${p.fragmentos}`);
    }
    if (p.ticketsWaifu) {
      darTickets(usuario, "waifu", p.ticketsWaifu);
      lineas.push(`🎟️ *Ticket de waifus* ›› +${p.ticketsWaifu}`);
    }
    for (let i = 0; i < (p.tickets || 0); i++) {
      const categoria = ticketAzar(usuario);
      lineas.push(`🎟️ *Ticket de ${CAT[categoria].plural}* ›› +1`);
    }
    if (p.waifu) {
      for (let intento = 0; intento < 5 && !waifu; intento++) {
        const candidata = elegirWaifu(p.waifu);
        if (!candidata) break;
        if (reclamar(usuario, candidata, NIVEL_INICIAL) === "ok") waifu = candidata;
      }
      if (waifu) {
        lineas.push(`🎃 *Waifu del evento* ›› ${waifu.nombre} (${waifu.rareza}) · ID ${waifu.id}`);
      } else {
        darTickets(usuario, "waifu", 1);
        lineas.push("🎟️ *Ticket de waifus* ›› +1 (no quedaban waifus libres del evento)");
      }
    }
    if (p.objeto) {
      sumarItem(usuario, kObjeto(p.objeto), 1);
      const o = OBJETOS[p.objeto];
      lineas.push(`${o.emoji} *Objeto exclusivo* ›› ${o.nombre}`);
    }
    if (p.reliquia) {
      const r = reliquiaPorId(p.reliquia);
      if (darReliquia(usuario, p.reliquia)) lineas.push(`${r.emoji} *Reliquia exclusiva* ›› ${r.nombre}. ${r.efecto}`);
    }
    if (p.insignia && otorgar(usuario, p.insignia)) {
      const d = definicion(p.insignia);
      lineas.push(`🏅 *Insignia exclusiva* ›› ${d.emoji} ${d.nombre}`);
    }
  });
  addToWallet(usuario, p.dinero);
  lineas.unshift(`💴 *Dinero* ›› +${monedaTexto(p.dinero)}`);
  return { fase, lineas, waifu };
}

export function entregarPendientes(usuario) {
  if (comandosDe(usuario) < COMANDOS_MINIMOS) return [];
  const entregas = [];
  for (const fase of FASES) {
    if (faseDesbloqueada(fase) && !faseEntregada(usuario, fase)) entregas.push(entregarFase(usuario, fase));
  }
  return entregas;
}

export function registrarComando(usuario, ahora = Date.now()) {
  if (!listo) return null;
  const salida = { desbloqueadas: [], entregas: [], califico: false, conteo: comandosDe(usuario) };
  const previo = ultimos.get(usuario) || 0;
  if (eventoVigente(ahora) && ahora - previo >= ESPERA_MIN_MS) {
    ultimos.set(usuario, ahora);
    const antes = totalComunidad();
    sumarItem(usuario, K_N, 1);
    sumarItem(COMUNIDAD, K_TOTAL, 1);
    salida.conteo = comandosDe(usuario);
    const despues = antes + 1;
    for (const fase of FASES) {
      const umbral = umbralDe(fase);
      if (antes < umbral && despues >= umbral) salida.desbloqueadas.push(fase);
    }
    if (salida.conteo === COMANDOS_MINIMOS) {
      salida.califico = true;
      otorgar(usuario, "mu_ofrendador");
    }
  }
  salida.entregas = entregarPendientes(usuario);
  if (!salida.desbloqueadas.length && !salida.entregas.length && !salida.califico) return null;
  return salida;
}

export function sumarComunidad(cantidad) {
  sumarItem(COMUNIDAD, K_TOTAL, cantidad);
  return totalComunidad();
}

export function textoAviso(usuario, r) {
  const total = totalComunidad();
  const partes = [encabezado("🌼", "OFRENDA DE DÍA DE MUERTOS"), ""];
  for (const fase of r.desbloqueadas) {
    partes.push(`🎉 *¡La comunidad desbloqueó la Fase ${fase.id}: ${fase.nombre}!* ›› ${fmt(Math.min(total, META_COMUNIDAD))}/${fmt(META_COMUNIDAD)}`);
  }
  if (r.desbloqueadas.length && r.conteo < COMANDOS_MINIMOS) {
    partes.push(`> ${mencion(usuario)} llevas *${r.conteo}/${COMANDOS_MINIMOS}* comandos de economía. Al llegar a ${COMANDOS_MINIMOS} recibes de forma automática los premios de todas las fases desbloqueadas.`);
  }
  if (r.califico && !r.entregas.length) {
    partes.push(`> ${mencion(usuario)} completaste tus *${COMANDOS_MINIMOS} comandos* y obtuviste la insignia 🕯️ Ofrendador. Los premios llegan solos cuando la comunidad desbloquee cada fase.`);
  }
  for (const e of r.entregas) {
    partes.push("", `${e.fase.emoji} *Fase ${e.fase.id}: ${e.fase.nombre}* ›› premios para ${mencion(usuario)}`, ...e.lineas);
  }
  partes.push("", "> Mira el altar y la barra de la comunidad con *.muertos*.");
  return partes.join("\n");
}

export async function avisarMuertos({ sender, reply }) {
  try {
    const r = registrarComando(sender);
    if (!r) return;
    await reply({ text: textoAviso(sender, r), mentions: [sender] });
  } catch (e) {
    console.log("[muertos] " + e.message);
  }
}

export function premioTexto(fase) {
  const p = fase.premio;
  const lista = [{ i: "💴", t: monedaTexto(p.dinero) }];
  if (p.sellos) lista.push({ i: EMOJI_SELLO, t: `${p.sellos} sellos de reclamo` });
  if (p.fragmentos) lista.push({ i: "🧩", t: `${p.fragmentos} fragmentos` });
  const tickets = (p.tickets || 0) + (p.ticketsWaifu || 0);
  if (tickets) lista.push({ i: "🎟️", t: `${tickets} ${tickets === 1 ? "ticket" : "tickets"}` });
  if (p.waifu) lista.push({ i: "🎃", t: `Waifu de Halloween del evento (${p.waifu.mejor ? "la mejor rareza disponible" : p.waifu.min >= 5 ? "Épica" : "Rara o superior"})` });
  if (p.objeto) lista.push({ i: OBJETOS[p.objeto].emoji, t: OBJETOS[p.objeto].nombre });
  if (p.reliquia) {
    const r = reliquiaPorId(p.reliquia);
    lista.push({ i: r.emoji, t: `Reliquia: ${r.nombre}` });
  }
  if (p.insignia) {
    const d = definicion(p.insignia);
    lista.push({ i: d.emoji, t: `Insignia: ${d.nombre}` });
  }
  return lista;
}

export function construirDatosMuertos(usuario, { nombre }) {
  const total = totalComunidad();
  const usuarios = usuariosConItem(K_N);
  const n = comandosDe(usuario);
  return {
    nombre,
    nombreEvento: NOMBRE_EVENTO,
    meta: META_COMUNIDAD,
    total,
    minimo: COMANDOS_MINIMOS,
    esperaSeg: ESPERA_MIN_MS / 1000,
    n,
    califica: n >= COMANDOS_MINIMOS,
    inicio: INICIO_MUERTOS,
    fin: FIN_MUERTOS,
    vigente: eventoVigente(),
    participantes: usuarios.length,
    calificados: usuarios.filter((u) => comandosDe(u) >= COMANDOS_MINIMOS).length,
    fases: FASES.map((f) => ({
      id: f.id,
      emoji: f.emoji,
      nombre: f.nombre,
      desc: f.desc,
      umbral: umbralDe(f),
      desbloqueada: total >= umbralDe(f),
      entregada: faseEntregada(usuario, f),
      premio: premioTexto(f)
    })),
    objetos: objetosDe(usuario),
    insignias: ["mu_ofrendador", "mu_guardian"].map((id) => ({ ...definicion(id), tiene: tieneInsignia(usuario, id) })),
    firma: "Powered By ItsDuva"
  };
}

export function textoEstado(usuario) {
  const d = construirDatosMuertos(usuario, { nombre: "" });
  const barras = Math.max(0, Math.min(10, Math.floor((d.total / d.meta) * 10)));
  const lineas = [
    `🌼 *Comunidad* ›› ${fmt(Math.min(d.total, d.meta))}/${fmt(d.meta)} comandos de economía`,
    `> ${"▰".repeat(barras)}${"▱".repeat(10 - barras)} ${Math.min(100, Math.floor((d.total / d.meta) * 100))}%`,
    `🕯️ *Tus comandos* ›› ${fmt(d.n)}/${fmt(d.minimo)}${d.califica ? " ✅" : ""}`,
    ""
  ];
  for (const f of d.fases) {
    const estado = f.entregada ? "✅ Recibida" : f.desbloqueada ? (d.califica ? "🎁 Por recibir" : "🔓 Desbloqueada") : "🔒 Bloqueada";
    lineas.push(`${f.emoji} *Fase ${f.id}* · ${fmt(f.umbral)} ›› ${f.nombre} · ${estado}`);
  }
  return lineas;
}
