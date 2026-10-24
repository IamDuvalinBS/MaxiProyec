import { config, saveConfig } from "./db.js";
import { cantidadItem, sumarItem, quitarItem, filasUsuario } from "./gacha-db.js";
import { NIVEL_MAX } from "./gacha-niveles.js";
import { CAT } from "./gacha-categorias.js";

export const estadistica = (usuario, nombre) => cantidadItem(usuario, `stat:${nombre}`);
export const sumarEstadistica = (usuario, nombre, cantidad = 1) => sumarItem(usuario, `stat:${nombre}`, cantidad);

const claveInsignia = (id) => `insignia:${id}`;
const FORMATO_ID = /^[a-z0-9_]{2,20}$/;

export const AUTOMATICAS = [
  { id: "coleccionista1", emoji: "🥉", nombre: "Coleccionista I", desc: "Reúne 10 personajes.", ok: (c) => c.total >= 10 },
  { id: "coleccionista2", emoji: "🥈", nombre: "Coleccionista II", desc: "Reúne 50 personajes.", ok: (c) => c.total >= 50 },
  { id: "coleccionista3", emoji: "🥇", nombre: "Coleccionista III", desc: "Reúne 200 personajes.", ok: (c) => c.total >= 200 },
  { id: "millonario", emoji: "💎", nombre: "Colección Millonaria", desc: "Alcanza 1,000,000 de valor total entre tus personajes.", ok: (c) => c.valor >= 1000000 },
  { id: "leyenda", emoji: "👑", nombre: "Cazador de Leyendas", desc: "Consigue un personaje de rareza Legendaria.", ok: (c) => c.legendario },
  { id: "universal", emoji: "🌐", nombre: "Coleccionista Universal", desc: "Ten al menos un personaje de cada gacha.", ok: (c) => c.categorias >= Object.keys(CAT).length },
  { id: "cumbre", emoji: "🏔️", nombre: "En la Cima", desc: "Lleva un personaje a su nivel máximo.", ok: (c) => c.cumbre },
  { id: "ascendido", emoji: "✨", nombre: "Ascendido", desc: "Asciende un personaje por primera vez.", ok: (c) => c.estrellasMax >= 1 },
  { id: "constelacion", emoji: "🌟", nombre: "Constelación", desc: "Lleva un personaje a 5 estrellas.", ok: (c) => c.estrellasMax >= 5 },
  { id: "primera_sangre", emoji: "⚔️", nombre: "Primera Sangre", desc: "Gana tu primer combate PvP.", ok: (c) => c.pvp >= 1 },
  { id: "gladiador", emoji: "🛡️", nombre: "Gladiador", desc: "Gana 25 combates PvP.", ok: (c) => c.pvp >= 25 },
  { id: "invicto", emoji: "🔥", nombre: "Invicto", desc: "Gana 100 combates PvP.", ok: (c) => c.pvp >= 100 },
  { id: "estratega", emoji: "🧠", nombre: "Estratega", desc: "Gana 10 batallas por equipos.", ok: (c) => c.equipo >= 10 },
  { id: "misionero", emoji: "📋", nombre: "Misionero", desc: "Cobra 50 misiones diarias.", ok: (c) => c.misiones >= 50 },
  { id: "disciplinado", emoji: "📅", nombre: "Disciplinado", desc: "Completa las tres misiones del día en 10 días distintos.", ok: (c) => c.diasCompletos >= 10 },
  { id: "afortunado", emoji: "🍀", nombre: "Afortunado", desc: "Consigue un ticket por suerte en una tirada.", ok: (c) => c.ticketsSuerte >= 1 }
];

export const TEMPORADA_HALLOWEEN = "Halloween 2026";

export const TEMPORADA = [
  { id: "hw_telarana", emoji: "🕸️", nombre: "Tejedor de Telarañas", desc: "Atrapó la noche entera en una red de seda." },
  { id: "hw_arana", emoji: "🕷️", nombre: "Reina Araña", desc: "Todas las patas de la oscuridad responden a su llamado." },
  { id: "hw_zombie", emoji: "🧟", nombre: "Superviviente Zombi", desc: "Se levantó de la tumba y volvió por más personajes." },
  { id: "hw_frankenstein", emoji: "⚡", nombre: "Criatura de Frankenstein", desc: "Cosida con rayos, tormenta y mucha obstinación." },
  { id: "hw_bruja", emoji: "🧙‍♀️", nombre: "Gran Bruja", desc: "Su caldero nunca se enfría y su escoba nunca falla." },
  { id: "hw_hechizo", emoji: "🔮", nombre: "Maestro de Hechizos", desc: "Dibujó el círculo prohibido y lo cerró sin un rasguño." },
  { id: "hw_calabaza", emoji: "🎃", nombre: "Rey Calabaza", desc: "La cosecha de la noche de brujas se inclina ante él." },
  { id: "hw_fantasma", emoji: "👻", nombre: "Espíritu Errante", desc: "Nadie lo vio llegar, nadie lo verá partir." },
  { id: "hw_supremo", emoji: "💀", nombre: "Señor de Halloween", desc: "La insignia suprema de la temporada. Solo una mano la entrega." }
].map((i) => ({ ...i, temporada: TEMPORADA_HALLOWEEN }));

const POR_ID = new Map(AUTOMATICAS.map((i) => [i.id, i]));
const TEMPORADA_POR_ID = new Map(TEMPORADA.map((i) => [i.id, i]));

function exclusivas() {
  return config.gachaInsignias || {};
}

const deTemporada = (i) => ({ id: i.id, emoji: i.emoji, nombre: i.nombre, desc: i.desc, exclusiva: true, temporada: i.temporada });

export function listaExclusivas() {
  const propias = Object.entries(exclusivas()).map(([id, d]) => ({ id, emoji: d.emoji, nombre: d.nombre, desc: d.desc, exclusiva: true }));
  return [...TEMPORADA.map(deTemporada), ...propias];
}

export function definicion(id) {
  const auto = POR_ID.get(id);
  if (auto) return { id: auto.id, emoji: auto.emoji, nombre: auto.nombre, desc: auto.desc, exclusiva: false };
  const temporada = TEMPORADA_POR_ID.get(id);
  if (temporada) return deTemporada(temporada);
  const ex = exclusivas()[id];
  return ex ? { id, emoji: ex.emoji, nombre: ex.nombre, desc: ex.desc, exclusiva: true } : null;
}

export const tieneInsignia = (usuario, id) => cantidadItem(usuario, claveInsignia(id)) > 0;

export function insigniasDe(usuario) {
  const salida = [];
  for (const d of AUTOMATICAS) if (tieneInsignia(usuario, d.id)) salida.push(definicion(d.id));
  for (const e of listaExclusivas()) if (tieneInsignia(usuario, e.id)) salida.push(e);
  return salida;
}

export function otorgar(usuario, id) {
  if (tieneInsignia(usuario, id)) return false;
  sumarItem(usuario, claveInsignia(id), 1);
  return true;
}

export function retirar(usuario, id) {
  if (!tieneInsignia(usuario, id)) return false;
  quitarItem(usuario, claveInsignia(id));
  return true;
}

export function contextoDe(usuario) {
  const filas = filasUsuario(usuario);
  const porCategoria = {};
  const ctx = {
    total: filas.length, valor: 0, estrellasMax: 0, cumbre: false, legendario: false,
    pvp: estadistica(usuario, "pvp_victorias"),
    equipo: estadistica(usuario, "equipos_victorias"),
    misiones: estadistica(usuario, "misiones_completas"),
    diasCompletos: estadistica(usuario, "dias_completos"),
    ticketsSuerte: estadistica(usuario, "tickets_suerte")
  };
  for (const f of filas) {
    porCategoria[f.categoria] = (porCategoria[f.categoria] || 0) + 1;
    ctx.valor += f.valor;
    if (f.estrellas > ctx.estrellasMax) ctx.estrellasMax = f.estrellas;
    if (f.nivel >= NIVEL_MAX[f.categoria]) ctx.cumbre = true;
    if (/legendaria/i.test(f.rareza)) ctx.legendario = true;
  }
  ctx.porCategoria = porCategoria;
  ctx.categorias = Object.keys(porCategoria).length;
  return ctx;
}

export function revisarInsignias(usuario) {
  const ctx = contextoDe(usuario);
  const nuevas = [];
  for (const d of AUTOMATICAS) {
    if (!tieneInsignia(usuario, d.id) && d.ok(ctx)) {
      otorgar(usuario, d.id);
      nuevas.push(definicion(d.id));
    }
  }
  return nuevas;
}

export async function crearExclusiva({ id, emoji, nombre, desc }) {
  if (!FORMATO_ID.test(id)) return { error: "formato" };
  if (POR_ID.has(id) || TEMPORADA_POR_ID.has(id)) return { error: "reservado" };
  config.gachaInsignias = { ...exclusivas(), [id]: { emoji, nombre, desc } };
  await saveConfig();
  return { ok: true };
}

export async function borrarExclusiva(id) {
  if (!exclusivas()[id]) return false;
  const copia = { ...exclusivas() };
  delete copia[id];
  config.gachaInsignias = copia;
  await saveConfig();
  return true;
}
