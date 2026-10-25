import { addToWallet } from "./db.js";
import {
  filasUsuario, setNivel, cantidadItem, fijarCantidadItem, itemsDe, coleccionDe
} from "./gacha-db.js";
import { nivelMaxDe, cubitosParaSubir, PRECIO_CUBITO, TIENE_NIVELES, nivelAleatorio } from "./gacha-niveles.js";
import { CAT } from "./gacha-categorias.js";
import { encabezado } from "../src/economia/estilo.js";
import { fmt } from "../src/economia/formato.js";
import { moneda } from "../src/economia/temas.js";
import { registrarEspera } from "../src/nucleo/espera.js";
import { T } from "./gacha-tema.js";

export const MIGRACION_ACTIVA = true;
export const FACTOR_NIVEL = 35 / 65;
export const BONO_REEMBOLSO = 0.05;

const MARCA = "migra:v1";
const MARCA_AZAR = "migra:azar:v1";
const PREFIJO_NIVELES = "migra:niv:";
const PREFIJO_ORO = "migra:oro:";
const ESPERA_MS = 5 * 60 * 1000;

const PRECIO_NIVEL = { pokemon: 1500, cod: 1200, dragon: 1200, clash: 1200, snake: 1000 };

function costoDeNiveles(categoria, desde, hasta) {
  if (categoria !== "brawler") return (PRECIO_NIVEL[categoria] || 1200) * Math.max(0, hasta - desde);
  let total = 0;
  for (let l = desde; l < hasta; l++) total += cubitosParaSubir(l) * PRECIO_CUBITO;
  return total;
}

const nivelNuevo = (nivel) => Math.max(1, Math.round(nivel * FACTOR_NIVEL));

function aplicarReduccion(sender) {
  const perdidos = {};
  const oro = {};
  for (const f of filasUsuario(sender)) {
    if (!(f.categoria in PRECIO_NIVEL) && f.categoria !== "brawler") continue;
    if (f.nivel <= 1) {
      setNivel(sender, f.id, nivelAleatorio(f.categoria));
      continue;
    }
    const nuevo = nivelNuevo(f.nivel);
    if (nuevo >= f.nivel) continue;
    setNivel(sender, f.id, nuevo);
    perdidos[f.categoria] = (perdidos[f.categoria] || 0) + (f.nivel - nuevo);
    oro[f.categoria] = (oro[f.categoria] || 0) + costoDeNiveles(f.categoria, nuevo, f.nivel);
  }
  fijarCantidadItem(sender, MARCA, 1);
  fijarCantidadItem(sender, MARCA_AZAR, 1);
  for (const c of Object.keys(perdidos)) {
    fijarCantidadItem(sender, PREFIJO_NIVELES + c, perdidos[c]);
    fijarCantidadItem(sender, PREFIJO_ORO + c, Math.round(oro[c]));
  }
}

function repartirNivelesAlAzar(sender) {
  for (const f of filasUsuario(sender)) {
    if (!TIENE_NIVELES(f.categoria) || f.nivel > 1 || (f.estrellas || 0) > 0) continue;
    setNivel(sender, f.id, nivelAleatorio(f.categoria));
  }
  fijarCantidadItem(sender, MARCA_AZAR, 1);
}

export function pendientesDe(sender) {
  const salida = [];
  for (const [item, niveles] of itemsDe(sender, PREFIJO_NIVELES)) {
    if (niveles < 1) continue;
    const categoria = item.slice(PREFIJO_NIVELES.length);
    salida.push({ categoria, niveles, oro: cantidadItem(sender, PREFIJO_ORO + categoria) });
  }
  return salida;
}

const arroba = (jid) => `@${jid.split("@")[0]}`;

function textoPregunta(sender, pend) {
  const totalOro = pend.reduce((a, p) => a + Math.round(p.oro * (1 + BONO_REEMBOLSO)), 0);
  const filas = pend.map((p) => `> ${CAT[p.categoria]?.emoji || "🎴"} ${CAT[p.categoria]?.plural || p.categoria} ›› *${fmt(p.niveles)}* niveles`);
  return [
    encabezado("⚖️", T("AJUSTE DE NIVELES", "AJUSTE DE LA NOCHE")),
    "",
    T(
      `> ${arroba(sender)}, los niveles de tus personajes se reajustaron con el nuevo sistema. Elige qué hacer con los niveles que bajaron:`,
      `> ${arroba(sender)}, los espíritus reajustaron los niveles de tus personajes. Elige qué hacer con los niveles que se perdieron:`
    ),
    ...filas,
    "",
    `1️⃣ *monedas* ›› recibes *${fmt(totalOro)}* ${moneda()} (lo gastado + ${Math.round(BONO_REEMBOLSO * 100)}% extra).`,
    "2️⃣ *niveles* ›› se suman a personajes aleatorios de tu colección.",
    "",
    "> Responde *monedas* o *niveles* (también *1* o *2*), o usa *.migrar monedas* / *.migrar niveles*."
  ].join("\n");
}

export async function avisarMigracion({ sender, from, reply }) {
  const pend = pendientesDe(sender);
  if (!pend.length) return false;
  await reply({ text: textoPregunta(sender, pend), mentions: [sender] });
  if (from) {
    registrarEspera(`${from}:${sender}`, {
      duracionMs: ESPERA_MS,
      tipo: "migracion",
      alResponder: async (texto, ctx) => {
        const t = String(texto || "").trim().toLowerCase();
        const opcion = ["monedas", "moneda", "1"].includes(t) ? "monedas" : ["niveles", "nivel", "2"].includes(t) ? "niveles" : null;
        if (!opcion) return false;
        const r = resolverMigracion(sender, opcion);
        if (r) await reply({ text: r, mentions: [sender] });
        return true;
      }
    });
  }
  return true;
}

const ultimoAviso = new Map();

export async function revisarMigracion({ sender, from, reply, forzar = false }) {
  if (!MIGRACION_ACTIVA) return false;
  if (!cantidadItem(sender, MARCA)) aplicarReduccion(sender);
  else if (!cantidadItem(sender, MARCA_AZAR)) repartirNivelesAlAzar(sender);
  if (!forzar && Date.now() - (ultimoAviso.get(sender) || 0) < 10 * 60 * 1000) return false;
  const avisado = await avisarMigracion({ sender, from, reply });
  if (avisado) ultimoAviso.set(sender, Date.now());
  return avisado;
}

export function resolverMigracion(sender, opcion) {
  const pend = pendientesDe(sender);
  if (!pend.length) return null;
  const lineas = [];
  let monedas = 0;

  for (const p of pend) {
    if (opcion === "monedas") {
      monedas += Math.round(p.oro * (1 + BONO_REEMBOLSO));
    } else {
      let restantes = p.niveles;
      const mias = coleccionDe(sender, p.categoria, 100000, 0).sort(() => Math.random() - 0.5);
      for (const c of mias) {
        if (restantes <= 0) break;
        const cupo = nivelMaxDe(p.categoria, c.estrellas) - c.nivel;
        if (cupo <= 0) continue;
        const suma = Math.min(restantes, cupo);
        setNivel(sender, c.id, c.nivel + suma);
        restantes -= suma;
        lineas.push(`> ${CAT[p.categoria]?.emoji || "🎴"} *${c.nombre}* ›› +${suma} niveles (${c.nivel} → ${c.nivel + suma})`);
      }
      if (restantes > 0 && p.niveles > 0) monedas += Math.round(p.oro * (restantes / p.niveles) * (1 + BONO_REEMBOLSO));
    }
    fijarCantidadItem(sender, PREFIJO_NIVELES + p.categoria, 0);
    fijarCantidadItem(sender, PREFIJO_ORO + p.categoria, 0);
  }
  if (monedas > 0) addToWallet(sender, monedas);

  return [
    encabezado("✅", T("AJUSTE COMPLETADO", "AJUSTE SELLADO")),
    "",
    opcion === "monedas"
      ? `> Recibiste *${fmt(monedas)}* ${moneda()} en tu cartera.`
      : `> Tus niveles se repartieron entre personajes aleatorios.${monedas > 0 ? ` Lo que no cupo se pagó con *${fmt(monedas)}* ${moneda()}.` : ""}`,
    ...(lineas.length ? ["", ...lineas.slice(0, 20)] : [])
  ].join("\n");
}
