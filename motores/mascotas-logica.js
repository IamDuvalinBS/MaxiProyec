import {
  ETAPAS, ESPECIES, RASGOS, RAREZAS, INCUBADORA, HUEVOS, COMIDAS, CASAS, ACCESORIOS, ESPACIOS, DECAIMIENTO,
  CRECIMIENTO_POR_HORA, MAX_MASCOTAS, MAX_NOMBRE, PASO_MS, MAX_SIMULACION_MS, ESPERA_JUGAR_MS, LLUVIA_MINIMA_MM
} from "./mascotas-datos.js";

const HORA_MS = 3600000;
const limitar = (n, min = 0, max = 100) => Math.min(max, Math.max(min, n));
const sinTildes = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const NOMBRES = {
  perro: ["Rocky", "Max", "Toby", "Coco", "Bruno", "Thor"],
  gato: ["Luna", "Michi", "Simba", "Nala", "Tigre", "Misifú"],
  zorro: ["Rufus", "Canela", "Fénix", "Kitsu", "Ember", "Brasa"],
  pinguino: ["Pingu", "Copo", "Frosty", "Hielo", "Polar", "Nieve"],
  ajolote: ["Xolo", "Xochi", "Coral", "Burbuja", "Lirio", "Nemo"],
  dragon: ["Drako", "Ignis", "Zafiro", "Esmeralda", "Ceniza", "Volcán"]
};

const MIGRACION_ESPECIE = { zorro_m: "zorro", zorro_h: "zorro" };
const MIGRACION_RAREZA = { comun: "comun", raro: "raro", epico: "epico" };

export function estadoInicial() {
  return { incubadora: null, huevos: {}, comida: {}, accesorios: {}, mascotas: [], proximoId: 1 };
}

export function normalizar(est) {
  const e = est && typeof est === "object" ? est : estadoInicial();
  if (!e.incubadora || typeof e.incubadora !== "object") e.incubadora = null;
  if (e.incubadora && !Array.isArray(e.incubadora.huevos)) e.incubadora.huevos = [];
  for (const campo of ["huevos", "comida", "accesorios"]) {
    if (!e[campo] || typeof e[campo] !== "object") e[campo] = {};
  }
  if (e.huevos.epico) {
    e.huevos.mistico = (Number(e.huevos.mistico) || 0) + Number(e.huevos.epico);
    delete e.huevos.epico;
  }
  if (e.incubadora) for (const h of e.incubadora.huevos) if (h.tipo === "epico") h.tipo = "mistico";
  for (const id of Object.keys(HUEVOS)) e.huevos[id] = Number(e.huevos[id]) || 0;
  for (const id of Object.keys(COMIDAS)) e.comida[id] = Number(e.comida[id]) || 0;
  for (const id of Object.keys(ACCESORIOS)) e.accesorios[id] = Number(e.accesorios[id]) || 0;
  if (!e.items || typeof e.items !== "object") e.items = {};
  for (const id of Object.keys(e.items)) if (!(Number(e.items[id]) > 0)) delete e.items[id];
  if (!Array.isArray(e.mascotas)) e.mascotas = [];
  if (!Number.isInteger(e.proximoId) || e.proximoId < 1) {
    e.proximoId = e.mascotas.reduce((a, m) => Math.max(a, m.id || 0), 0) + 1;
  }
  for (const m of e.mascotas) {
    if (MIGRACION_ESPECIE[m.especie]) m.especie = MIGRACION_ESPECIE[m.especie];
    if (!RAREZAS[m.rareza]) m.rareza = MIGRACION_RAREZA[m.calidad] || "comun";
    if (m.calidad === "epico") m.calidad = "mistico";
    if (!m.equipo || typeof m.equipo !== "object") m.equipo = {};
    m.casa = Number(m.casa) || 0;
    m.crec = Number(m.crec) || 0;
    m.xp = Number(m.xp) || 0;
  }
  return e;
}

export function etapaDe(crec) {
  let actual = ETAPAS[0];
  for (const e of ETAPAS) if (crec >= e.desde) actual = e;
  return actual;
}

export function progresoEtapa(crec) {
  const etapa = etapaDe(crec);
  const siguiente = ETAPAS[ETAPAS.indexOf(etapa) + 1] || null;
  if (!siguiente) return { etapa, siguiente: null, fraccion: 1, faltan: 0 };
  const fraccion = limitar((crec - etapa.desde) / (siguiente.desde - etapa.desde), 0, 1);
  return { etapa, siguiente, fraccion, faltan: Math.ceil(siguiente.desde - crec) };
}

export function proteccionLluvia(m) {
  let total = 0;
  for (const espacio of ESPACIOS) {
    const acc = ACCESORIOS[m.equipo?.[espacio]];
    if (acc) total += acc.lluvia;
  }
  return Math.min(0.9, total);
}

export const multiplicadorCrecimiento = (m) => (RAREZAS[m.rareza]?.crecimiento || 1) * (RASGOS[m.especie]?.crecimiento || 1);

export const nivelDe = (m) => 1 + Math.floor(Math.sqrt(((m.crec || 0) + (m.xp || 0)) / 1.2));

export const xpParaNivel = (n) => Math.ceil(1.2 * (n - 1) ** 2);

export const explorando = (m, ahora) => Boolean(m.expedicion && ahora < m.expedicion.fin);

export const comodidadDe = (m) => (m.casa ? CASAS.niveles[m.casa - 1]?.comodidad || 0 : 0);

export function actualizarMascota(m, ahora, precipitacionEn = () => 0) {
  let t = Math.max(m.ts || ahora, ahora - MAX_SIMULACION_MS);
  const calidad = multiplicadorCrecimiento(m);
  const rasgo = RASGOS[m.especie] || {};
  const comodidad = comodidadDe(m);
  const proteccion = proteccionLluvia(m);

  while (t < ahora) {
    const dtMs = Math.min(PASO_MS, ahora - t);
    const dt = dtMs / HORA_MS;
    const medio = t + dtMs / 2;
    const enExpedicion = Boolean(m.expedicion && medio >= m.expedicion.inicio && medio < m.expedicion.fin);
    const llueve = !enExpedicion && precipitacionEn(medio) >= LLUVIA_MINIMA_MM;
    const sinRefugio = llueve && !m.casa;
    const exposicion = sinRefugio && !rasgo.amaLluvia ? (1 - proteccion) * (rasgo.lluvia ?? 1) : 0;
    const bonoLluvia = sinRefugio && rasgo.amaLluvia ? 1.15 : 1;

    if (m.dormido) {
      m.hambre -= DECAIMIENTO.dormido.hambre * dt * (rasgo.hambre ?? 1);
      m.diversion -= DECAIMIENTO.dormido.diversion * dt * (rasgo.diversion ?? 1);
      m.energia += -DECAIMIENTO.dormido.energia * dt * (1 + comodidad);
    } else {
      m.hambre -= DECAIMIENTO.despierto.hambre * dt * (rasgo.hambre ?? 1);
      m.diversion -= DECAIMIENTO.despierto.diversion * dt * (rasgo.diversion ?? 1) * (enExpedicion ? 0.3 : 1);
      m.energia -= DECAIMIENTO.despierto.energia * dt * (rasgo.energia ?? 1) * (enExpedicion ? 0.6 : 1);
    }
    if (exposicion > 0) {
      m.energia -= DECAIMIENTO.lluviaSinRefugio.energia * dt * exposicion;
      m.diversion -= DECAIMIENTO.lluviaSinRefugio.diversion * dt * exposicion;
    }

    m.hambre = limitar(m.hambre);
    m.diversion = limitar(m.diversion);
    m.energia = limitar(m.energia);
    if (enExpedicion) m.energia = Math.max(m.energia, 5);
    if (m.dormido && m.energia >= 100) m.dormido = false;
    else if (!m.dormido && m.energia <= 0) m.dormido = true;

    if (Math.min(m.hambre, m.diversion, m.energia) > 10) {
      const satisfaccion = (m.hambre * 0.4 + m.diversion * 0.3 + m.energia * 0.3) / 100;
      const factor = (m.dormido ? 1.5 : 1) * (1 - 0.5 * exposicion) * (1 + comodidad) * calidad * bonoLluvia;
      m.crec += CRECIMIENTO_POR_HORA * satisfaccion * factor * dt;
    }
    t += dtMs;
  }
  m.ts = Math.max(m.ts || 0, ahora);
  return m;
}

export function felicidad(m) {
  return Math.round((m.hambre + m.diversion + m.energia) / 3);
}

export function estadoActual(m, llueveAhora) {
  if (m.dormido) return { clave: "dormido", texto: "Durmiendo", emoji: "😴" };
  if (m.hambre <= 15) return { clave: "hambriento", texto: "Tiene mucha hambre", emoji: "🍽️" };
  if (m.energia <= 15) return { clave: "cansado", texto: "Está agotado", emoji: "🥱" };
  if (m.diversion <= 15) return { clave: "aburrido", texto: "Está aburrido", emoji: "😒" };
  if (llueveAhora && !m.casa) {
    return proteccionLluvia(m) >= 0.5
      ? { clave: "impermeable", texto: "Protegido con su impermeable", emoji: "🧥" }
      : { clave: "mojado", texto: "Se está mojando", emoji: "🌧️" };
  }
  if (felicidad(m) >= 70) return { clave: "feliz", texto: "Está feliz", emoji: "😊" };
  return { clave: "tranquilo", texto: "Está tranquilo", emoji: "🙂" };
}

export function limpiarNombre(texto) {
  return String(texto || "").replace(/[<>&"'`\\]/g, "").replace(/\s+/g, " ").trim().slice(0, MAX_NOMBRE);
}

export function mascotaPorNumero(est, numero) {
  if (!est.mascotas.length) return null;
  if (!numero) return est.mascotas.length === 1 ? est.mascotas[0] : null;
  return est.mascotas[numero - 1] || null;
}

export function alimentar(est, m, tipo) {
  if (m.dormido) return { ok: false, error: `${m.nombre} está durmiendo. Despiértalo antes de alimentarlo.` };
  if (m.hambre >= 90) return { ok: false, error: `${m.nombre} no tiene hambre en este momento.` };
  let id = tipo;
  if (!id) id = Object.keys(COMIDAS).find((k) => est.comida[k] > 0);
  if (!id || !COMIDAS[id]) return { ok: false, error: "No tienes comida disponible. Puedes comprarla con *.petcomprar comida*." };
  if (est.comida[id] <= 0) return { ok: false, error: `No tienes ${COMIDAS[id].nombre.toLowerCase()}.` };
  const comida = COMIDAS[id];
  est.comida[id] -= 1;
  const antes = m.hambre;
  m.hambre = limitar(m.hambre + comida.hambre);
  m.crec += comida.crecimiento * multiplicadorCrecimiento(m);
  return { ok: true, comida, recuperado: Math.round(m.hambre - antes) };
}

export function jugar(m, ahora) {
  if (m.dormido) return { ok: false, error: `${m.nombre} está durmiendo.` };
  if (m.energia < 15) return { ok: false, error: `${m.nombre} está demasiado cansado para jugar.` };
  if (m.hambre < 15) return { ok: false, error: `${m.nombre} tiene demasiada hambre para jugar.` };
  if (m.diversion >= 95) return { ok: false, error: `${m.nombre} ya se divirtió bastante por ahora.` };
  const restante = (m.ultimoJuego || 0) + ESPERA_JUGAR_MS - ahora;
  if (restante > 0) return { ok: false, espera: restante };
  m.ultimoJuego = ahora;
  m.diversion = limitar(m.diversion + 25 * (RASGOS[m.especie]?.juego ?? 1));
  m.energia = limitar(m.energia - 12);
  m.hambre = limitar(m.hambre - 8);
  m.crec += 3;
  return { ok: true };
}

export function dormir(m) {
  if (m.dormido) return { ok: false, error: `${m.nombre} ya está durmiendo.` };
  if (m.energia >= 95) return { ok: false, error: `${m.nombre} no tiene sueño en este momento.` };
  m.dormido = true;
  return { ok: true };
}

export function despertar(m) {
  if (!m.dormido) return { ok: false, error: `${m.nombre} no está durmiendo.` };
  m.dormido = false;
  const molesto = m.energia < 60;
  if (molesto) m.diversion = limitar(m.diversion - 10);
  return { ok: true, molesto };
}

export function equipar(est, m, id) {
  const acc = ACCESORIOS[id];
  if (!acc) return { ok: false, error: "Ese accesorio no existe." };
  if (m.equipo[acc.espacio] === id) return { ok: false, error: `${m.nombre} ya lleva puesto ese accesorio.` };
  if (est.accesorios[id] <= 0) return { ok: false, error: `No tienes *${acc.nombre}*. Puedes comprarlo con *.petcomprar*.` };
  const anterior = m.equipo[acc.espacio];
  if (anterior) est.accesorios[anterior] += 1;
  est.accesorios[id] -= 1;
  m.equipo[acc.espacio] = id;
  return { ok: true, acc, anterior: ACCESORIOS[anterior] || null };
}

export function quitar(est, m, objetivo) {
  const clave = sinTildes(objetivo || "");
  const espacio = ESPACIOS.includes(clave)
    ? clave
    : ESPACIOS.find((e) => ACCESORIOS[m.equipo[e]] && coincideAccesorio(m.equipo[e], clave));
  if (!espacio || !m.equipo[espacio]) return { ok: false, error: `${m.nombre} no lleva puesto ese accesorio.` };
  const id = m.equipo[espacio];
  delete m.equipo[espacio];
  est.accesorios[id] += 1;
  return { ok: true, acc: ACCESORIOS[id] };
}

const PALABRAS_ACCESORIO = {
  gorrito: ["gorrito", "gorro", "fiesta"],
  corona: ["corona", "rey", "real"],
  collar: ["collar", "placa"],
  bufanda: ["bufanda", "rayada"],
  gafas: ["gafas", "lentes", "sol"],
  impermeable: ["impermeable", "lluvia", "capa"]
};

function coincideAccesorio(id, texto) {
  return id === texto || (PALABRAS_ACCESORIO[id] || []).some((p) => texto.includes(p));
}

export function resolverArticulo(texto) {
  const t = sinTildes(texto);
  const numero = (t.match(/(\d+)\s*$/) || [])[1];
  const n = numero ? Math.min(99, Math.max(1, parseInt(numero, 10))) : null;
  if (/incubadora/.test(t)) return { tipo: "incubadora", numero: n };
  if (/huevo/.test(t)) {
    const id = Object.keys(HUEVOS).find((k) => t.includes(k)) || "comun";
    return { tipo: "huevo", id, numero: n };
  }
  if (/comida|croqueta|banquete/.test(t)) {
    const id = Object.keys(COMIDAS).find((k) => t.includes(k)) || "basica";
    return { tipo: "comida", id, numero: n };
  }
  if (/casa|caseta|mansion/.test(t)) return { tipo: "casa", numero: n };
  const accesorio = Object.keys(ACCESORIOS).find((id) => coincideAccesorio(id, t));
  if (accesorio) return { tipo: "accesorio", id: accesorio, numero: n };
  return null;
}

export function resolverAccesorio(texto) {
  const t = sinTildes(texto);
  return Object.keys(ACCESORIOS).find((id) => coincideAccesorio(id, t)) || null;
}

export function precioDe(articulo, cantidad = 1) {
  if (articulo.tipo === "incubadora") return INCUBADORA.precio;
  if (articulo.tipo === "huevo") return HUEVOS[articulo.id].precio * cantidad;
  if (articulo.tipo === "comida") return COMIDAS[articulo.id].precio * cantidad;
  if (articulo.tipo === "casa") return CASAS.precio;
  if (articulo.tipo === "accesorio") return ACCESORIOS[articulo.id].precio * cantidad;
  return 0;
}

export function incubadoraNivel(est) {
  return est.incubadora ? INCUBADORA.niveles[est.incubadora.nivel - 1] : null;
}

export function incubar(est, tipo, ahora) {
  const nivel = incubadoraNivel(est);
  if (!nivel) return { ok: false, error: "Aún no tienes una incubadora. Puedes comprarla con *.petcomprar incubadora*." };
  if (est.incubadora.huevos.length >= nivel.espacios) {
    return { ok: false, error: `Tu incubadora no tiene espacios libres (${est.incubadora.huevos.length}/${nivel.espacios}).` };
  }
  let id = tipo;
  if (!id) id = Object.keys(HUEVOS).find((k) => est.huevos[k] > 0);
  if (!id || !HUEVOS[id] || est.huevos[id] <= 0) {
    return { ok: false, error: "No tienes ese huevo. Puedes comprarlo con *.petcomprar huevo*." };
  }
  if (est.mascotas.length + est.incubadora.huevos.length >= MAX_MASCOTAS) {
    return { ok: false, error: `Solo puedes tener ${MAX_MASCOTAS} mascotas entre las que ya tienes y los huevos en incubación.` };
  }
  est.huevos[id] -= 1;
  const duracion = HUEVOS[id].horas * HORA_MS * nivel.tiempo;
  est.incubadora.huevos.push({ tipo: id, inicio: ahora, fin: ahora + duracion });
  return { ok: true, huevo: HUEVOS[id], duracion };
}

export function estadoIncubadora(est, ahora) {
  const nivel = incubadoraNivel(est);
  if (!nivel) return null;
  return {
    nivel,
    huevos: est.incubadora.huevos.map((h) => ({
      tipo: h.tipo,
      restante: Math.max(0, h.fin - ahora),
      fraccion: limitar((ahora - h.inicio) / Math.max(1, h.fin - h.inicio), 0, 1),
      listo: h.fin <= ahora
    }))
  };
}

function elegirPonderado(pesos, rnd) {
  const total = Object.values(pesos).reduce((a, b) => a + b, 0);
  let punto = rnd() * total;
  for (const [clave, peso] of Object.entries(pesos)) {
    punto -= peso;
    if (punto < 0) return clave;
  }
  return Object.keys(pesos)[0];
}

function pesosEspecie(rareza) {
  const pesos = {};
  for (const [id, e] of Object.entries(ESPECIES)) pesos[id] = e.peso;
  if (rareza === "comun" || rareza === "poco_comun") delete pesos.dragon;
  else if (rareza === "epico" || rareza === "legendario") pesos.dragon *= 2;
  return pesos;
}

export function eclosionar(est, ahora, rnd = Math.random) {
  if (!est.incubadora) return { nuevas: [], pendientes: 0 };
  const listos = est.incubadora.huevos.filter((h) => h.fin <= ahora);
  const nuevas = [];
  for (const huevo of listos) {
    const rareza = elegirPonderado(HUEVOS[huevo.tipo].rarezas, rnd);
    const especie = elegirPonderado(pesosEspecie(rareza), rnd);
    const nombres = NOMBRES[especie];
    const m = {
      id: est.proximoId++,
      especie,
      nombre: nombres[Math.floor(rnd() * nombres.length)],
      rareza,
      calidad: huevo.tipo,
      crec: 0,
      hambre: 80,
      energia: 80,
      diversion: 80,
      dormido: false,
      ts: ahora,
      casa: 0,
      equipo: {},
      nacio: ahora
    };
    est.mascotas.push(m);
    nuevas.push(m);
    est.incubadora.huevos.splice(est.incubadora.huevos.indexOf(huevo), 1);
  }
  return { nuevas, pendientes: est.incubadora.huevos.length };
}

export const ESPECIE_DE = (m) => ESPECIES[m.especie];
