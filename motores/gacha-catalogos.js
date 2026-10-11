import axios from "axios";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { crearPersonaje, contarPersonajes } from "./gacha-db.js";
import { buscarCategorias, miembrosDeCategoriaRecursiva, paginasPorPatron, urlDeArchivo } from "./gacha-mediawiki.js";

const CABECERAS = { "User-Agent": "MaxiBot/1.0 (importador del gacha)" };

const RAREZAS = [
  { nombre: "Común", peso: 45, rango: 1, base: 1000 },
  { nombre: "Poco común", peso: 25, rango: 2, base: 2500 },
  { nombre: "Rara", peso: 15, rango: 3, base: 5500 },
  { nombre: "Súper rara", peso: 8, rango: 4, base: 11000 },
  { nombre: "Épica", peso: 4, rango: 5, base: 22000 },
  { nombre: "Mítica", peso: 2, rango: 6, base: 40000 },
  { nombre: "Legendaria", peso: 1, rango: 7, base: 80000 }
];

export function semilla(texto) {
  let h = 2166136261;
  for (const c of String(texto)) {
    h ^= c.codePointAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function rarezaEstable(clave) {
  const total = RAREZAS.reduce((suma, r) => suma + r.peso, 0);
  let x = semilla(`rareza:${clave}`) % total;
  for (const r of RAREZAS) {
    if ((x -= r.peso) < 0) return r;
  }
  return RAREZAS[0];
}

export const rarezaPorRango = (rango) => RAREZAS.find((r) => r.rango === rango) || RAREZAS[0];

export function estadisticasDeRango(clave, rango, ajuste = {}) {
  const j = (n) => semilla(`${clave}:${n}`) % 21;
  return {
    hp: 60 + rango * 11 + j(1) + (ajuste.hp || 0),
    atk: 60 + rango * 9 + j(2) + (ajuste.atk || 0),
    def: 55 + rango * 8 + j(3) + (ajuste.def || 0),
    spe: 60 + rango * 7 + j(4) + (ajuste.spe || 0),
    tipos: []
  };
}

const valorDe = (st, rarezaInfo, clave) => (st.hp + st.atk + st.def + st.spe) * 10 + rarezaInfo.base + (semilla(`valor:${clave}`) % 400);

export const slug = (texto) =>
  String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const FUENTES_CLASH = (process.env.GACHA_CLASH_FUENTES ??
  "https://raw.githubusercontent.com/RoyaleAPI/cr-api-data/master/json/cards.json,https://raw.githubusercontent.com/RoyaleAPI/cr-api-data/main/json/cards.json,https://royaleapi.github.io/cr-api-data/json/cards.json")
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);

const RAREZA_CLASH = { common: 1, rare: 3, epic: 5, legendary: 7, champion: 6 };
const TIPO_CLASH = { troop: "Tropa", spell: "Hechizo", building: "Estructura" };

export function convertirCartaClash(carta) {
  const nombre = carta.name || carta.key;
  const clave = carta.key || slug(nombre);
  if (!nombre || !clave) return null;

  const rango = RAREZA_CLASH[String(carta.rarity || "").toLowerCase()] || 1;
  const elixir = Number(carta.elixir);
  const costo = Number.isFinite(elixir) ? elixir : 3;
  const tipoBase = String(carta.type || "").toLowerCase();
  const ajuste = { hp: costo * 6, atk: costo * 5, def: costo * 3, spe: -costo * 2 };
  if (tipoBase === "spell") Object.assign(ajuste, { atk: ajuste.atk + 18, hp: ajuste.hp - 20 });
  if (tipoBase === "building") Object.assign(ajuste, { def: ajuste.def + 15, spe: ajuste.spe - 20 });

  const rareza = rarezaPorRango(rango);
  const st = estadisticasDeRango(`clash:${clave}`, rango, ajuste);
  return {
    categoria: "clash",
    clave: String(clave),
    nombre,
    serie: "Clash Royale",
    rareza: rareza.nombre,
    valor: valorDe(st, rareza, clave),
    img: `https://raw.githubusercontent.com/RoyaleAPI/cr-api-assets/master/cards/${clave}.png`,
    stats: st,
    meta: {
      tipo: TIPO_CLASH[tipoBase] || carta.type || "Carta",
      elixir: Number.isFinite(elixir) ? elixir : null,
      alt: [`https://cdn.royaleapi.com/static/img/cards-150/${clave}.png`]
    }
  };
}

export async function sincronizarClash() {
  let lista = null;
  let ultimoError = null;
  for (const url of FUENTES_CLASH) {
    try {
      const { data } = await axios.get(url, { timeout: 12000, family: 4, headers: CABECERAS });
      lista = Array.isArray(data) ? data : data?.items || data?.cards || null;
      if (lista?.length) break;
    } catch (e) {
      ultimoError = e;
    }
  }
  if (!lista?.length) throw new Error(ultimoError ? ultimoError.message : "la fuente no devolvió cartas");

  let nuevos = 0;
  for (const carta of lista) {
    const convertida = convertirCartaClash(carta);
    if (convertida && crearPersonaje(convertida)) nuevos++;
  }
  return { total: lista.length, nuevos };
}

export async function asegurarClash() {
  if (contarPersonajes("clash") === 0) await sincronizarClash();
}

export function convertirDragon(base, miembro) {
  const titulo = miembro.titulo;
  if (!titulo || /[:/]/.test(titulo) || /^(list|table|category)\b/i.test(titulo)) return null;
  const clave = `dml-${slug(titulo)}`;
  const rareza = rarezaEstable(clave);
  const st = estadisticasDeRango(clave, rareza.rango);
  const principal = miembro.imagen || urlDeArchivo(base, titulo);
  const alt = miembro.imagen ? [urlDeArchivo(base, titulo)] : [];
  return {
    categoria: "dragon",
    clave,
    nombre: titulo,
    serie: "Dragon Mania Legends",
    rareza: rareza.nombre,
    valor: valorDe(st, rareza, clave),
    img: principal,
    stats: st,
    meta: { tipo: titulo.replace(/\s*Dragon\s*$/i, "").trim() || "Dragón", wiki: `${base}/wiki/${encodeURIComponent(titulo.replace(/ /g, "_"))}`, alt }
  };
}

export const WIKIS_DRAGONES = (process.env.GACHA_DRAGONES_WIKIS ?? "https://dragon-mania-legends.fandom.com,https://dragon-mania-legend.fandom.com,https://dragon-mania-legends-unofficial.fandom.com,https://dragon-mania-legends.wiki,https://dml.wiki")
  .split(",")
  .map((x) => x.trim().replace(/\/+$/, ""))
  .filter(Boolean);
export const WIKI_DRAGONES = WIKIS_DRAGONES[0];
export const WIKI_COD = "https://callofduty.fandom.com";

export const ARCHIVO_DRAGONES = new URL("../data/dragones.json", import.meta.url);
const BASE_DRAGONES_ARCHIVO = "https://dml.wiki";

export const hayArchivoDragones = () => existsSync(ARCHIVO_DRAGONES);

export async function sincronizarDragonesArchivo() {
  const lista = JSON.parse(await readFile(ARCHIVO_DRAGONES, "utf8"));
  if (!Array.isArray(lista)) throw new Error("data/dragones.json debe ser una lista");

  const miembros = lista
    .map((x) => (typeof x === "string" ? { titulo: x, imagen: null } : { titulo: x?.titulo, imagen: x?.imagen || null }))
    .filter((x) => x.titulo);

  let nuevos = 0;
  for (const miembro of miembros) {
    const dragon = convertirDragon(BASE_DRAGONES_ARCHIVO, miembro);
    if (dragon && crearPersonaje(dragon)) nuevos++;
  }
  return { total: miembros.length, nuevos, fuente: "archivo data/dragones.json", categorias: 0, porNombre: 0, local: true };
}

const MINIMO_ESPERADO_DRAGONES = 100;
const PATRON_NOMBRE_DRAGON = /^(?:[A-Z0-9][\w'’.&-]*\s)+Dragon$/;

export async function sincronizarDragones(categoria = "Dragons", base = null) {
  const bases = base ? [base] : WIKIS_DRAGONES;
  const fallos = [];
  let fuente = null;
  let miembros = [];
  let categorias = 0;
  let porNombre = 0;

  for (const candidata of bases) {
    try {
      const resultado = await miembrosDeCategoriaRecursiva(candidata, categoria, { profundidad: 3 });
      const combinados = new Map(resultado.miembros.map((m) => [m.titulo, m]));

      if (combinados.size < MINIMO_ESPERADO_DRAGONES) {
        const antes = combinados.size;
        const extra = await paginasPorPatron(candidata, PATRON_NOMBRE_DRAGON);
        for (const pagina of extra) if (!combinados.has(pagina.titulo)) combinados.set(pagina.titulo, pagina);
        porNombre = combinados.size - antes;
      }

      if (combinados.size) {
        fuente = candidata;
        miembros = [...combinados.values()];
        categorias = resultado.categorias;
        break;
      }
      fallos.push(`${candidata.replace("https://", "")}: no se encontraron dragones`);
    } catch (e) {
      fallos.push(e.message);
    }
  }

  if (!fuente) throw new Error(fallos.join(" | ") || "no se pudo consultar ninguna wiki");

  let nuevos = 0;
  for (const miembro of miembros) {
    const dragon = convertirDragon(fuente, miembro);
    if (dragon && crearPersonaje(dragon)) nuevos++;
  }
  return { total: miembros.length, nuevos, fuente, categorias, porNombre };
}

export async function buscarCategoriasDragones(texto, base = null) {
  const bases = base ? [base] : WIKIS_DRAGONES;
  const fallos = [];
  for (const candidata of bases) {
    try {
      return { fuente: candidata, categorias: await buscarCategorias(candidata, texto) };
    } catch (e) {
      fallos.push(e.message);
    }
  }
  throw new Error(fallos.join(" | ") || "no se pudo consultar ninguna wiki");
}

export function convertirItemCod(base, miembro, tipo) {
  const titulo = miembro.titulo;
  if (!titulo || /[:/]/.test(titulo)) return null;
  const clave = `cod-${slug(tipo)}-${slug(titulo)}`;
  const rareza = rarezaEstable(clave);
  const st = estadisticasDeRango(clave, rareza.rango, tipo.toLowerCase().includes("arma") ? { atk: 14, spe: -6 } : {});
  return {
    categoria: "cod",
    clave,
    nombre: titulo,
    serie: `Call of Duty · ${tipo}`,
    rareza: rareza.nombre,
    valor: valorDe(st, rareza, clave),
    img: miembro.imagen || urlDeArchivo(base, titulo),
    stats: st,
    meta: { tipo, wiki: `${base}/wiki/${encodeURIComponent(titulo.replace(/ /g, "_"))}`, alt: miembro.imagen ? [urlDeArchivo(base, titulo)] : [] }
  };
}

export async function sincronizarCod(categoria, tipo = "Operador", base = WIKI_COD) {
  const { miembros } = await miembrosDeCategoriaRecursiva(base, categoria, { profundidad: 2 });
  let nuevos = 0;
  for (const miembro of miembros) {
    const item = convertirItemCod(base, miembro, tipo);
    if (item && crearPersonaje(item)) nuevos++;
  }
  return { total: miembros.length, nuevos };
}

export const buscarCategoriasCod = (texto, base = WIKI_COD) => buscarCategorias(base, texto);
