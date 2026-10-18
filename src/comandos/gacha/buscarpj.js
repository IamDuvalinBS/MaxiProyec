import fs from "fs";
import { gachaListo, CAT, lineasPersonaje, prepararImagen } from "../../../motores/gacha-core.js";
import { personajesDeCategoria, propietarios } from "../../../motores/gacha-db.js";
import { resolverVariante, listaVariantes, FIRMA_CLAIM } from "../../../motores/gacha-claim.js";
import { enviarConBoton } from "../../../motores/botones.js";
import { encabezado } from "../../economia/estilo.js";

const MAX_RESULTADOS = 6;

const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

function distancia(a, b) {
  const fila = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previo = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const guardado = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, previo + (a[i - 1] === b[j - 1] ? 0 : 1));
      previo = guardado;
    }
  }
  return fila[b.length];
}

function puntaje(q, p) {
  let mejor = Infinity;
  for (const campo of [p.nombre, p.clave]) {
    const n = norm(campo);
    if (!n) continue;
    if (n === q) mejor = Math.min(mejor, 0);
    else if (n.includes(q) || (n.length >= 3 && q.includes(n))) mejor = Math.min(mejor, 1);
    else {
      const tolerancia = Math.floor(q.length / 5);
      if (!tolerancia) continue;
      let m = Infinity;
      for (let largo = q.length - tolerancia; largo <= q.length + tolerancia; largo++) {
        for (let i = 0; i + largo <= n.length; i++) m = Math.min(m, distancia(n.slice(i, i + largo), q));
      }
      if (m <= tolerancia) mejor = Math.min(mejor, 2 + m);
    }
  }
  return mejor;
}

function buscar(q, categorias) {
  const out = [];
  for (const categoria of categorias) {
    for (const p of personajesDeCategoria(categoria)) {
      const s = puntaje(q, p);
      if (s !== Infinity) out.push({ p, s });
    }
  }
  return out.sort((a, b) => a.s - b.s || a.p.nombre.localeCompare(b.p.nombre));
}

async function fotoDe(p) {
  let img;
  try {
    img = await prepararImagen([p.img, ...(p.meta?.alt || [])]);
    return fs.readFileSync(img.ruta);
  } catch (e) {
    return null;
  } finally {
    if (img) img.limpiar();
  }
}

export default {
  names: [".buscarpj", ".buscarpersonaje", ".pj"],
  desc: "Busca un personaje por nombre en cualquier categoría del gacha: .buscarpj [categoría] <nombre>",
  category: "Gacha",
  usage: ".buscarpj [categoría] <nombre>",
  handler: async ({ sock, from, msg, cleanText, reply }) => {
    await gachaListo;
    const partes = cleanText.trim().split(/\s+/).slice(1);
    let categorias = Object.keys(CAT);
    const variante = partes.length > 1 ? resolverVariante(partes[0]) : null;
    if (variante) {
      if (variante !== "todos") categorias = [variante];
      partes.shift();
    }
    const consulta = partes.join(" ");
    const q = norm(consulta);
    if (q.length < 2) {
      return reply({ text: `⚙️ Uso: *.buscarpj [categoría] <nombre>*\nEjemplo: .buscarpj Ellen Joe\nCategorías: ${listaVariantes()}.` });
    }

    const encontrados = buscar(q, categorias);
    if (!encontrados.length) {
      return reply({ text: `🔎 No encontré ningún personaje parecido a *${consulta}*${categorias.length === 1 ? ` en ${CAT[categorias[0]].titulo}` : ""}.` });
    }

    for (const { p } of encontrados.slice(0, MAX_RESULTADOS)) {
      const cat = CAT[p.categoria];
      const texto = [
        encabezado(cat.emoji, `${cat.titulo} - ENCONTRADO`),
        "",
        ...lineasPersonaje(p),
        `👥 *Dueños* ›› ${propietarios(p.id).length}`
      ].join("\n");

      const foto = await fotoDe(p);
      const enviado = await enviarConBoton({
        sock, from, msg, texto, footer: FIRMA_CLAIM, foto,
        boton: { texto: "Copiar ID", copiar: String(p.id) }
      });
      if (!enviado) await reply({ text: texto });
    }

    if (encontrados.length > MAX_RESULTADOS) {
      await reply({ text: `🔎 Hay *${encontrados.length - MAX_RESULTADOS}* coincidencias más. Escribe el nombre completo o la categoría, por ejemplo *.buscarpj waifu ${consulta}*.` });
    }
  }
};
