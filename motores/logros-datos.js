import { CAT } from "./gacha-categorias.js";
import { AUTOMATICAS, TEMPORADA, TEMPORADA_HALLOWEEN, tieneInsignia, contextoDe } from "./gacha-insignias.js";
import { misionesHalloween, progresoInsigniasHw, revisarInsigniasHalloween, FIN_EVENTO, eventoActivo } from "./gacha-halloween-misiones.js";
import { RELIQUIAS, tieneReliquia } from "./gacha-reliquias.js";
import { esHalloween } from "../src/economia/temas.js";

const TOTAL_CATEGORIAS = () => Object.keys(CAT).length;

const PROGRESO = {
  coleccionista1: (c) => [c.total, 10],
  coleccionista2: (c) => [c.total, 50],
  coleccionista3: (c) => [c.total, 200],
  millonario: (c) => [c.valor, 1000000],
  leyenda: (c) => [c.legendario ? 1 : 0, 1],
  universal: (c) => [c.categorias, TOTAL_CATEGORIAS()],
  cumbre: (c) => [c.cumbre ? 1 : 0, 1],
  ascendido: (c) => [c.estrellasMax >= 1 ? 1 : 0, 1],
  constelacion: (c) => [c.estrellasMax, 5],
  primera_sangre: (c) => [c.pvp, 1],
  gladiador: (c) => [c.pvp, 25],
  invicto: (c) => [c.pvp, 100],
  estratega: (c) => [c.equipo, 10],
  misionero: (c) => [c.misiones, 50],
  disciplinado: (c) => [c.diasCompletos, 10],
  afortunado: (c) => [c.ticketsSuerte, 1]
};

export function construirDatosLogros(usuario, { nombre }) {
  revisarInsigniasHalloween(usuario);
  const ctx = contextoDe(usuario);
  const hwProg = progresoInsigniasHw(usuario);

  const auto = AUTOMATICAS.map((i) => {
    const tiene = tieneInsignia(usuario, i.id);
    const [v, m] = (PROGRESO[i.id] || (() => [tiene ? 1 : 0, 1]))(ctx);
    return { emoji: i.emoji, nombre: i.nombre, desc: i.desc, tiene, v: tiene ? m : Math.min(v, m), m };
  });

  const temporada = TEMPORADA.map((i) => {
    const p = hwProg[i.id] || { avance: 0, meta: 1, unidad: "", premio: "" };
    return { emoji: i.emoji, nombre: i.nombre, desc: i.desc, tiene: tieneInsignia(usuario, i.id), avance: p.avance, meta: p.meta, unidad: p.unidad, premio: p.premio };
  });
  const reliquias = RELIQUIAS.map((r) => ({ emoji: r.emoji, nombre: r.nombre, efecto: r.efecto, tiene: tieneReliquia(usuario, r.id) }));

  const misiones = misionesHalloween(usuario);
  const totalLogros = auto.length + temporada.length;
  const obtenidos = auto.filter((a) => a.tiene).length + temporada.filter((t) => t.tiene).length;

  return {
    halloween: esHalloween(),
    nombre,
    eventoVivo: eventoActivo(),
    finEvento: FIN_EVENTO,
    temporadaNombre: TEMPORADA_HALLOWEEN,
    obtenidos,
    totalLogros,
    misionesHechas: misiones.filter((m) => m.hecha).length,
    misiones,
    temporada,
    reliquias,
    auto,
    firma: "Powered By ItsDuva"
  };
}
