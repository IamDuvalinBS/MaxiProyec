import { CAT } from "./gacha-categorias.js";
import { coleccionDe, filasUsuario } from "./gacha-db.js";
import { AUTOMATICAS, TEMPORADA, TEMPORADA_HALLOWEEN, listaExclusivas, tieneInsignia, insigniasDe } from "./gacha-insignias.js";
import { nivelMaxDe } from "./gacha-niveles.js";
import { imagenesCompactas } from "./gacha-imagen-html.js";
import { htmlPerfilGacha } from "./perfil-gacha-html.js";
import { esHalloween } from "../src/economia/temas.js";
import { misionesHalloween } from "./gacha-halloween-misiones.js";

const POR_CATEGORIA = 6;
const FIRMA = "Powered By ItsDuva";

export function nivelDeRareza(rareza) {
  const r = String(rareza || "").toLowerCase();
  if (/legendar|m[ií]tic|ultra/.test(r)) return "L";
  if (/[eé]pic/.test(r)) return "E";
  if (/rar/.test(r)) return "R";
  return "C";
}

const NOMBRES_CORTOS = { cod: "COD" };
const capitalizar = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

export async function construirDatosPerfil(usuario, { nombre, tabInicial = "todos" }) {
  const halloween = esHalloween();
  const filas = filasUsuario(usuario);

  const porNivel = { L: 0, E: 0, R: 0, C: 0 };
  const porCategoria = {};
  for (const f of filas) {
    porNivel[nivelDeRareza(f.rareza)]++;
    porCategoria[f.categoria] = (porCategoria[f.categoria] || 0) + 1;
  }

  const claves = Object.keys(CAT);
  const cats = claves.map((k) => ({ k, emoji: CAT[k].emoji, nombre: NOMBRES_CORTOS[k] || capitalizar(CAT[k].plural), n: porCategoria[k] || 0 }));

  const elegidos = [];
  for (const k of claves) {
    for (const c of coleccionDe(usuario, k, POR_CATEGORIA, 0)) elegidos.push({ k, c });
  }
  const imagenes = await imagenesCompactas(
    elegidos.map(({ c }) => c.img),
    { ancho: 150, alto: 200, modo: "cover", fondo: halloween ? "#150620" : "#0d1132", formato: "jpeg", calidad: 68 },
    10
  );

  const items = elegidos.map(({ k, c }, i) => ({
    id: c.id,
    k,
    cat: capitalizar(CAT[k].singular),
    nombre: c.nombre,
    rareza: c.rareza,
    t: nivelDeRareza(c.rareza),
    nivel: c.nivel,
    max: nivelMaxDe(k, c.estrellas, c),
    es: c.estrellas || 0,
    v: c.valor,
    img: imagenes[i]
  }));

  const temporada = TEMPORADA.map((i) => ({ id: i.id, nombre: i.nombre, desc: i.desc, tiene: tieneInsignia(usuario, i.id) }));
  const auto = AUTOMATICAS.map((i) => ({ emoji: i.emoji, nombre: i.nombre, desc: i.desc, tiene: tieneInsignia(usuario, i.id) }));
  const exclusivas = listaExclusivas()
    .filter((i) => !i.temporada && tieneInsignia(usuario, i.id))
    .map((i) => ({ emoji: i.emoji, nombre: i.nombre, desc: i.desc }));

  return {
    halloween,
    tabInicial,
    firma: FIRMA,
    titulo: `Gacha de ${nombre}`,
    subtitulo: halloween ? "Colección embrujada" : "Colección personal",
    stats: {
      total: filas.length,
      gachas: Object.keys(porCategoria).length,
      legendarios: porNivel.L,
      epicos: porNivel.E,
      raros: porNivel.R
    },
    cats,
    items,
    hw: misionesHalloween(usuario),
    ins: {
      total: insigniasDe(usuario).length,
      temporada: { nombre: TEMPORADA_HALLOWEEN, lista: temporada, tiene: temporada.filter((t) => t.tiene).length },
      exclusivas,
      auto,
      autoTiene: auto.filter((a) => a.tiene).length
    }
  };
}

export async function htmlPerfilDe(usuario, opciones) {
  return htmlPerfilGacha(await construirDatosPerfil(usuario, opciones));
}
