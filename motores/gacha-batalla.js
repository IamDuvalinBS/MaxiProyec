import { statsEfectivas, NIVEL_MAX } from "./gacha-niveles.js";
import { poderesActivos } from "./gacha-poderes.js";
import { encabezado } from "../src/economia/estilo.js";

const EFECTIVIDAD = {
  normal: { rock: .5, ghost: 0, steel: .5 },
  fire: { fire: .5, water: .5, grass: 2, ice: 2, bug: 2, rock: .5, dragon: .5, steel: 2 },
  water: { fire: 2, water: .5, grass: .5, ground: 2, rock: 2, dragon: .5 },
  electric: { water: 2, electric: .5, grass: .5, ground: 0, flying: 2, dragon: .5 },
  grass: { fire: .5, water: 2, grass: .5, poison: .5, ground: 2, flying: .5, bug: .5, rock: 2, dragon: .5, steel: .5 },
  ice: { fire: .5, water: .5, grass: 2, ice: .5, ground: 2, flying: 2, dragon: 2, steel: .5 },
  fighting: { normal: 2, ice: 2, poison: .5, flying: .5, psychic: .5, bug: .5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: .5 },
  poison: { grass: 2, poison: .5, ground: .5, rock: .5, ghost: .5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: .5, poison: 2, flying: 0, bug: .5, rock: 2, steel: 2 },
  flying: { electric: .5, grass: 2, fighting: 2, bug: 2, rock: .5, steel: .5 },
  psychic: { fighting: 2, poison: 2, psychic: .5, dark: 0, steel: .5 },
  bug: { fire: .5, grass: 2, fighting: .5, poison: .5, flying: .5, psychic: 2, ghost: .5, dark: 2, steel: .5, fairy: .5 },
  rock: { fire: 2, ice: 2, fighting: .5, ground: .5, flying: 2, bug: 2, steel: .5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: .5 },
  dragon: { dragon: 2, steel: .5, fairy: 0 },
  dark: { fighting: .5, psychic: 2, ghost: 2, dark: .5, fairy: .5 },
  steel: { fire: .5, water: .5, electric: .5, ice: 2, rock: 2, steel: .5, fairy: 2 },
  fairy: { fire: .5, fighting: 2, poison: .5, dragon: 2, dark: 2, steel: .5 }
};

const FACTOR_BONO_TIPO = 1.25;
const FACTOR_SIN_TIPOS = 1.1;
const CARGA_AL_ATACAR = 25;
const CARGA_AL_RECIBIR = 15;
const MAX_RONDAS = 40;
const MAPA_MEJORA = { vida: "hp", ataque: "atk", defensa: "def", velocidad: "spe" };

function efectividad(tipoAtaque, tiposDefensor) {
  let m = 1;
  for (const t of tiposDefensor) m *= EFECTIVIDAD[tipoAtaque]?.[t] ?? 1;
  return m;
}

export function prepararLuchador(p) {
  const nivel = p.nivel || 1;
  const s = statsEfectivas(p, nivel);
  const poderes = poderesActivos(p, nivel, NIVEL_MAX[p.categoria], p.estrellas || 0);
  const stats = { hp: s.hp, atk: s.atk, def: s.def, spe: s.spe };
  const mejora = poderes.mejora;
  if (mejora) {
    const campo = MAPA_MEJORA[mejora.efecto];
    stats[campo] = Math.round(stats[campo] * (1 + mejora.par.bono));
  }
  return {
    id: p.id, nombre: p.nombre, categoria: p.categoria, nivel, estrellas: p.estrellas || 0,
    tipos: s.tipos || [], nivelCombate: s.nivelCombate,
    hpMax: stats.hp, hp: stats.hp, atk: stats.atk, def: stats.def, spe: stats.spe,
    poderes, escudo: 0, furia: { bono: 0, rondas: 0 }, aturdido: false,
    enfriamiento: 0, usos: 0, alientoUsado: false, carga: 0
  };
}

function golpe(a, d, rng, { mult = 1, ignora = 0 } = {}) {
  let eff = 1;
  let stab = 1;
  if (a.tipos.length) {
    eff = Math.max(...a.tipos.map((t) => efectividad(t, d.tipos)));
    stab = FACTOR_BONO_TIPO;
  }
  const atk = a.atk * (1 + (a.furia.rondas > 0 ? a.furia.bono : 0));
  const def = Math.max(1, d.def * (1 - ignora));
  const base = (((2 * a.nivelCombate) / 5 + 2) * 70 * atk / def) / 50 + 2;
  const azar = 0.85 + rng() * 0.15;
  const probabilidadCritico = 1 / 16 + (a.poderes.estelar?.efecto === "critico" ? a.poderes.estelar.par.prob : 0);
  const critico = rng() < probabilidadCritico ? 1.5 : 1;
  const ajuste = a.tipos.length ? 1 : FACTOR_SIN_TIPOS;
  let dano = Math.max(1, Math.floor(base * stab * eff * azar * critico * ajuste * mult));
  const armadura = d.poderes.estelar?.efecto === "armadura" ? d.poderes.estelar.par.reduccion : 0;
  if (armadura) dano = Math.max(1, Math.floor(dano * (1 - armadura)));
  return { dano, eff, critico: critico > 1 };
}

function recibirDano(defensor, dano, notas) {
  let restante = dano;
  if (defensor.escudo > 0) {
    const absorbido = Math.min(defensor.escudo, restante);
    defensor.escudo -= absorbido;
    restante -= absorbido;
  }
  defensor.hp = Math.max(0, defensor.hp - restante);
  const estelar = defensor.poderes.estelar;
  if (defensor.hp <= 0 && estelar?.efecto === "aliento" && !defensor.alientoUsado) {
    defensor.alientoUsado = true;
    defensor.hp = Math.max(1, Math.round(defensor.hpMax * estelar.par.vida));
    notas.push(`🛡️ ${defensor.nombre} resiste con *${estelar.nombre}*`);
  }
  return restante;
}

const curar = (luchador, cantidad) => {
  const antes = luchador.hp;
  luchador.hp = Math.min(luchador.hpMax, luchador.hp + Math.round(cantidad));
  return luchador.hp - antes;
};

function intentarHabilidad(actor, objetivo, eventos) {
  const h = actor.poderes.habilidad;
  if (!h || actor.enfriamiento > 0 || actor.usos >= h.par.usos) return 1;

  const registrar = (texto) => {
    actor.usos++;
    actor.enfriamiento = h.par.espera;
    eventos.push({ tipo: "habilidad", actor: actor.nombre, nombre: h.nombre, texto });
  };

  switch (h.efecto) {
    case "curar": {
      if (actor.hp / actor.hpMax > 0.55) return 1;
      const ganado = curar(actor, actor.hpMax * h.par.curacion);
      registrar(`recupera ${ganado} de salud`);
      return 1;
    }
    case "escudo": {
      if (actor.escudo > 0) return 1;
      actor.escudo = Math.round(actor.hpMax * h.par.escudo);
      registrar(`crea un escudo de ${actor.escudo}`);
      return 1;
    }
    case "furia": {
      if (actor.furia.rondas > 0) return 1;
      actor.furia = { bono: h.par.bono, rondas: h.par.rondas };
      registrar(`aumenta su daño ${Math.round(h.par.bono * 100)}% por ${h.par.rondas} rondas`);
      return 1;
    }
    case "aturdir": {
      if (objetivo.aturdido) return 1;
      objetivo.aturdido = true;
      registrar(`aturde a ${objetivo.nombre}`);
      return 1;
    }
    case "estallido": {
      registrar("lanza un ataque potenciado");
      return h.par.mult;
    }
    default:
      return 1;
  }
}

function atacar(actor, objetivo, multHabilidad, rng, eventos) {
  const notas = [];
  const hiper = actor.poderes.hipercarga;
  const cargado = Boolean(hiper) && actor.carga >= 100;
  let mult = multHabilidad;
  let ignora = 0;

  if (cargado) {
    mult *= hiper.par.mult;
    if (hiper.efecto === "quiebre") ignora = hiper.par.ignora;
    actor.carga = 0;
  }

  const g = golpe(actor, objetivo, rng, { mult, ignora });
  const real = recibirDano(objetivo, g.dano, notas);

  if (cargado && hiper.efecto === "regeneracion") {
    const ganado = curar(actor, actor.hpMax * hiper.par.curacion);
    if (ganado) notas.push(`💚 ${actor.nombre} recupera ${ganado} de salud`);
  }

  const estelar = actor.poderes.estelar;
  if (estelar?.efecto === "vampirismo" && real > 0) {
    const ganado = curar(actor, real * estelar.par.robo);
    if (ganado) notas.push(`🩸 ${actor.nombre} drena ${ganado} de salud con *${estelar.nombre}*`);
  }

  const defensa = objetivo.poderes.estelar;
  if (defensa?.efecto === "espinas" && real > 0) {
    const reflejado = Math.floor(real * defensa.par.reflejo);
    if (reflejado > 0) {
      actor.hp = Math.max(0, actor.hp - reflejado);
      notas.push(`🌵 ${actor.nombre} recibe ${reflejado} de daño por *${defensa.nombre}*`);
    }
  }

  if (hiper) actor.carga = Math.min(100, actor.carga + CARGA_AL_ATACAR);
  if (objetivo.poderes.hipercarga) objetivo.carga = Math.min(100, objetivo.carga + CARGA_AL_RECIBIR);

  eventos.push({
    tipo: "ataque", atacante: actor.nombre, defensor: objetivo.nombre, dano: g.dano,
    eff: g.eff, critico: g.critico, hiper: cargado, nombreHiper: cargado ? hiper.nombre : null, notas
  });
}

const vivos = (equipo) => equipo.filter((f) => f.hp > 0);

function ratioDeVida(equipo) {
  const max = equipo.reduce((a, f) => a + f.hpMax, 0);
  return max ? equipo.reduce((a, f) => a + f.hp, 0) / max : 0;
}

export function simularBatalla(equipoA, equipoB, { maxRondas = MAX_RONDAS, rng = Math.random } = {}) {
  const A = equipoA.map(prepararLuchador);
  const B = equipoB.map(prepararLuchador);
  const rondas = [];

  while (vivos(A).length && vivos(B).length && rondas.length < maxRondas) {
    const orden = [...vivos(A).map((f) => ({ f, aliados: A, enemigos: B })), ...vivos(B).map((f) => ({ f, aliados: B, enemigos: A }))]
      .map((x) => ({ ...x, clave: x.f.spe + rng() * 0.5 }))
      .sort((x, y) => y.clave - x.clave);
    const eventos = [];

    for (const { f: actor, enemigos } of orden) {
      if (actor.hp <= 0) continue;
      const objetivo = vivos(enemigos)[0];
      if (!objetivo) break;
      if (actor.aturdido) {
        actor.aturdido = false;
        eventos.push({ tipo: "aturdido", actor: actor.nombre });
        continue;
      }
      const multHabilidad = intentarHabilidad(actor, objetivo, eventos);
      atacar(actor, objetivo, multHabilidad, rng, eventos);
    }

    for (const f of [...A, ...B]) {
      if (f.enfriamiento > 0) f.enfriamiento--;
      if (f.furia.rondas > 0) f.furia.rondas--;
    }

    rondas.push({ eventos, hpA: A.map((f) => f.hp), hpB: B.map((f) => f.hp) });
  }

  const vivosA = vivos(A).length;
  const vivosB = vivos(B).length;
  let ganador;
  if (vivosA && !vivosB) ganador = "A";
  else if (vivosB && !vivosA) ganador = "B";
  else {
    const a = ratioDeVida(A);
    const b = ratioDeVida(B);
    ganador = a === b ? (rng() < 0.5 ? "A" : "B") : a > b ? "A" : "B";
  }

  return { ganador, rondas, equipoA: A, equipoB: B, vivosA, vivosB };
}

const SEGMENTOS = 8;

function barra(hp, max) {
  const llenos = hp <= 0 ? 0 : Math.max(1, Math.round((hp / max) * SEGMENTOS));
  return "▰".repeat(llenos) + "▱".repeat(SEGMENTOS - llenos);
}

function lineaDeEvento(e) {
  if (e.tipo === "habilidad") return [`✦ ${e.actor} usa *${e.nombre}* y ${e.texto}`];
  if (e.tipo === "aturdido") return [`💫 ${e.actor} está aturdido y pierde su turno`];
  const extra = e.critico ? " 💥 golpe crítico" : e.eff >= 2 ? " ✨ súper efectivo" : e.eff === 0 ? " 🚫 no afecta" : e.eff < 1 ? " 🔻 poco efectivo" : "";
  const prefijo = e.hiper ? `⚡ *${e.nombreHiper}* ›› ` : "• ";
  return [`${prefijo}${e.atacante} ataca a ${e.defensor} (-${e.dano})${extra}`, ...e.notas.map((n) => `  ${n}`)];
}

function bloqueDeRonda(resultado, indice) {
  const ronda = resultado.rondas[indice];
  const lineas = [`*Ronda ${indice + 1}*`];
  for (const e of ronda.eventos) lineas.push(...lineaDeEvento(e));
  resultado.equipoA.forEach((f, i) => lineas.push(`🔴 ${f.nombre} ${barra(ronda.hpA[i], f.hpMax)} ${ronda.hpA[i]}/${f.hpMax}`));
  resultado.equipoB.forEach((f, i) => lineas.push(`🔵 ${f.nombre} ${barra(ronda.hpB[i], f.hpMax)} ${ronda.hpB[i]}/${f.hpMax}`));
  return lineas.join("\n");
}

export function mensajesDeBatalla(resultado, { limite = 3000, maxMensajes = 5 } = {}) {
  const grupos = [];
  let actual = { desde: 0, bloques: [], largo: 0 };

  for (let i = 0; i < resultado.rondas.length; i++) {
    const bloque = bloqueDeRonda(resultado, i);
    if (actual.bloques.length && actual.largo + bloque.length + 2 > limite) {
      grupos.push(actual);
      actual = { desde: i, bloques: [], largo: 0 };
    }
    actual.bloques.push(bloque);
    actual.largo += bloque.length + 2;
  }
  if (actual.bloques.length) grupos.push(actual);

  let elegidos = grupos;
  let omitidas = 0;
  if (grupos.length > maxMensajes) {
    const cola = maxMensajes - 2;
    elegidos = [grupos[0], grupos[1], ...grupos.slice(grupos.length - cola)];
    omitidas = grupos.slice(2, grupos.length - cola).reduce((a, g) => a + g.bloques.length, 0);
  }

  return elegidos.map((g, orden) => {
    const hasta = g.desde + g.bloques.length;
    const titulo = g.bloques.length === 1 ? `RONDA ${hasta}` : `RONDAS ${g.desde + 1} A ${hasta}`;
    const partes = [encabezado("🥊", titulo), ""];
    if (omitidas && orden === 2) partes.push(`> Se omiten ${omitidas} rondas intermedias para no saturar el chat.`, "");
    partes.push(g.bloques.join("\n\n"));
    return partes.join("\n");
  });
}

export function simularCombate(pa, pb, opciones) {
  return simularBatalla([pa], [pb], opciones);
}
