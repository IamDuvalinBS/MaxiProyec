import { addToWallet } from "./db.js";
import { cantidadItem, sumarItem, quitarItem, itemsDe } from "./gacha-db.js";
import { darFragmentos } from "./gacha-niveles.js";
import { darTickets } from "./gacha-tickets.js";
import { darSellos } from "./gacha-sellos.js";
import { CAT } from "./gacha-categorias.js";
import { sumarEstadistica, revisarInsignias } from "./gacha-insignias.js";
import { encabezado } from "../src/economia/estilo.js";
import { T } from "./gacha-tema.js";
import { avanzarHalloween } from "./gacha-halloween-misiones.js";

const ZONA = process.env.GACHA_ZONA || "America/Mexico_City";
const formatoFecha = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA });
export const hoy = () => formatoFecha.format(new Date());

const MISIONES_POR_DIA = 3;
const SELLOS_BONO_DIA = 3;

export const TIPOS = {
  tirada: { texto: (n) => `Haz ${n} ${n === 1 ? "tirada" : "tiradas"} en cualquier gacha`, rango: [3, 6], dinero: 2500, fragmentos: 0, sellos: 1 },
  reclamar: { texto: (n) => `Reclama ${n} ${n === 1 ? "personaje" : "personajes"}`, rango: [1, 3], dinero: 4000, fragmentos: 1, sellos: 1 },
  pvp: { texto: (n) => `Gana ${n} ${n === 1 ? "combate" : "combates"} PvP`, rango: [1, 2], dinero: 8000, fragmentos: 1, sellos: 2 },
  equipo: { texto: (n) => `Gana ${n} ${n === 1 ? "batalla" : "batallas"} por equipos`, rango: [1, 1], dinero: 15000, fragmentos: 2, sellos: 3 },
  mejorar: { texto: (n) => `Sube ${n} niveles a tus personajes`, rango: [3, 8], dinero: 1500, fragmentos: 0, sellos: 1 },
  tienda: { texto: (n) => `Compra ${n} ${n === 1 ? "artículo" : "artículos"} en las tiendas del gacha`, rango: [2, 4], dinero: 2000, fragmentos: 0, sellos: 1 },
  variedad: { texto: (n) => `Haz tiradas en ${n} gachas distintos`, rango: [2, 3], dinero: 3000, fragmentos: 1, sellos: 2 }
};

const ESTADISTICAS = {
  tirada: "tiradas", reclamar: "reclamados", pvp: "pvp_victorias", equipo: "equipos_victorias", mejorar: "niveles", tienda: "compras"
};

function semilla(texto) {
  let h = 2166136261;
  for (const c of String(texto)) {
    h ^= c.codePointAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function generador(valor) {
  let s = valor || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function asignadas(usuario, fecha = hoy()) {
  const azar = generador(semilla(`${usuario}:${fecha}`));
  const tipos = Object.keys(TIPOS);
  for (let i = tipos.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [tipos[i], tipos[j]] = [tipos[j], tipos[i]];
  }
  return tipos.slice(0, MISIONES_POR_DIA).map((tipo) => {
    const [min, max] = TIPOS[tipo].rango;
    const meta = min + Math.floor(azar() * (max - min + 1));
    return { tipo, meta, texto: TIPOS[tipo].texto(meta), dinero: TIPOS[tipo].dinero * meta, fragmentos: TIPOS[tipo].fragmentos, sellos: TIPOS[tipo].sellos };
  });
}

const claveAvance = (fecha, tipo) => `mis:${fecha}:${tipo}`;
const claveCobro = (fecha, tipo) => `mis:${fecha}:c:${tipo}`;
const prefijoVariedad = (fecha) => `mis:${fecha}:v:`;
const claveBono = (fecha) => `mis:${fecha}:bono`;

function avanceDe(usuario, fecha, tipo) {
  if (tipo === "variedad") return itemsDe(usuario, prefijoVariedad(fecha)).length;
  return cantidadItem(usuario, claveAvance(fecha, tipo));
}

const ultimaLimpieza = new Map();

function limpiarViejas(usuario, fecha) {
  if (ultimaLimpieza.get(usuario) === fecha) return;
  ultimaLimpieza.set(usuario, fecha);
  const vigente = `mis:${fecha}:`;
  for (const [item] of itemsDe(usuario, "mis:")) {
    if (!item.startsWith(vigente)) quitarItem(usuario, item);
  }
}

export function progreso(usuario, tipo, cantidad = 1, categoria = null) {
  const fecha = hoy();
  limpiarViejas(usuario, fecha);
  const lista = asignadas(usuario, fecha);
  const cuenta = tipo === "tirada" && categoria ? ["tirada", "variedad"] : [tipo];
  const afectadas = lista.filter((m) => cuenta.includes(m.tipo));
  if (!afectadas.length) return { completadas: [] };

  const antes = afectadas.map((m) => avanceDe(usuario, fecha, m.tipo));

  for (const m of afectadas) {
    if (m.tipo === "variedad") {
      const clave = `${prefijoVariedad(fecha)}${categoria}`;
      if (!cantidadItem(usuario, clave)) sumarItem(usuario, clave, 1);
    } else {
      sumarItem(usuario, claveAvance(fecha, m.tipo), cantidad);
    }
  }

  const completadas = afectadas.filter((m, i) => antes[i] < m.meta && avanceDe(usuario, fecha, m.tipo) >= m.meta);
  return { completadas };
}

export function misionesDe(usuario) {
  const fecha = hoy();
  limpiarViejas(usuario, fecha);
  return asignadas(usuario, fecha).map((m) => {
    const avance = Math.min(m.meta, avanceDe(usuario, fecha, m.tipo));
    return { ...m, avance, completa: avance >= m.meta, cobrada: cantidadItem(usuario, claveCobro(fecha, m.tipo)) > 0 };
  });
}

export function cobrarMisiones(usuario) {
  const fecha = hoy();
  const lista = misionesDe(usuario);
  const cobradas = lista.filter((m) => m.completa && !m.cobrada);
  const resultado = { cobradas, dinero: 0, fragmentos: 0, ticket: null, bono: false, sellos: 0, pendientes: lista.filter((m) => !m.completa).length };
  if (!cobradas.length) return resultado;

  for (const m of cobradas) {
    sumarItem(usuario, claveCobro(fecha, m.tipo), 1);
    resultado.dinero += m.dinero;
    resultado.fragmentos += m.fragmentos;
    resultado.sellos += m.sellos || 0;
  }
  if (resultado.dinero) addToWallet(usuario, resultado.dinero);
  if (resultado.fragmentos) darFragmentos(usuario, resultado.fragmentos);
  sumarEstadistica(usuario, "misiones_completas", cobradas.length);

  const todas = misionesDe(usuario).every((m) => m.cobrada);
  if (todas && !cantidadItem(usuario, claveBono(fecha))) {
    sumarItem(usuario, claveBono(fecha), 1);
    const categorias = Object.keys(CAT);
    resultado.ticket = categorias[Math.floor(Math.random() * categorias.length)];
    darTickets(usuario, resultado.ticket, 1);
    sumarEstadistica(usuario, "dias_completos", 1);
    resultado.bono = true;
    resultado.sellos += SELLOS_BONO_DIA;
  }
  if (resultado.sellos) resultado.sellos = darSellos(usuario, resultado.sellos).agregados;
  return resultado;
}

const arroba = (jid) => `@${String(jid).split("@")[0].split(":")[0]}`;

export async function registrarActividad({ reply, sender, eventos }) {
  try {
    const completadas = [];
    const halloween = [];
    for (const e of eventos) {
      const cantidad = e.cantidad ?? 1;
      if (ESTADISTICAS[e.tipo] && cantidad > 0) sumarEstadistica(sender, ESTADISTICAS[e.tipo], cantidad);
      completadas.push(...progreso(sender, e.tipo, cantidad, e.categoria).completadas);
      halloween.push(...avanzarHalloween(sender, e));
    }
    const insignias = [...revisarInsignias(sender), ...halloween.flatMap((m) => m.insignias || [])];
    if (!completadas.length && !insignias.length && !halloween.length) return;

    const partes = [];
    if (completadas.length) {
      partes.push(
        encabezado("📋", T("MISIÓN COMPLETADA", "MISIÓN MALDITA COMPLETADA")),
        "",
        ...completadas.map((m) => `> ${arroba(sender)} completó: *${m.texto}*.`),
        T("> Cobra tu recompensa con *.misiones cobrar*.", "> Cobra tu botín con *.misiones cobrar*.")
      );
    }
    if (halloween.some((m) => !m.soloInsignias)) {
      if (partes.length) partes.push("");
      partes.push(
        encabezado("🕯️", "MISIÓN DE HALLOWEEN COMPLETADA"),
        "",
        ...halloween.filter((m) => !m.soloInsignias).map((m) => `> ${arroba(sender)} cumplió *${m.nombre}* (exclusiva de Halloween 2026): +${m.dinero.toLocaleString("en-US")} 🎃${m.fragmentos ? `, +${m.fragmentos} fragmentos` : ""}${m.ticketCat ? `, 1 ticket de ${CAT[m.ticketCat]?.singular || m.ticketCat}` : ""}.`)
      );
    }
    if (insignias.length) {
      if (partes.length) partes.push("");
      partes.push(
        encabezado("🏅", T("NUEVA INSIGNIA", "NUEVA INSIGNIA DE LA NOCHE")),
        "",
        ...insignias.map((i) => `> ${arroba(sender)} desbloqueó ${i.emoji} *${i.nombre}*. ${i.desc}${i.premioTxt ? ` 🎁 ${i.premioTxt}` : ""}`)
      );
    }
    await reply({ text: partes.join("\n"), mentions: [sender] });
  } catch (e) {
    console.log("[gacha] Actividad:", e.message);
  }
}
