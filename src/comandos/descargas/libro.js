import { pedirJson } from "../../../motores/herramientas-red.js";
import { limitarEspera } from "../../../motores/herramientas-ui.js";
import { enviarConReintento } from "../../descargas/envio.js";
import { tarjetaDescarga, tarjetaUso, tarjetaError, tarjetaAviso, campo } from "../../descargas/tarjetas.js";
import { nombreSeguro, LIMITE_DOCUMENTO_MB } from "../../descargas/core.js";

// .libro <nombre> -> busca el libro en fuentes con PDF de descarga libre y lo manda como documento.
//  1) Internet Archive (archive.org): millones de libros de dominio público / acceso abierto (sin préstamo).
//  2) Google Libros: respaldo, solo ediciones gratuitas que ofrecen PDF.
// Con ".libro 2 <nombre>" eliges el resultado #2 de la búsqueda, y así con los demás.
const ESPERA_MS = 8000;
const MAX_RESULTADOS = 10;
const LIMITE_MB = Math.min(Number(process.env.LIMITE_LIBRO_MB) || 150, LIMITE_DOCUMENTO_MB);
const esperas = new Map();

const mb = (b) => (b / 1048576).toFixed(b > 104857600 ? 0 : 1);
const recortar = (t, max) => {
  const s = String(t || "").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};
const unir = (v) => (Array.isArray(v) ? v.filter(Boolean).join(", ") : String(v || "")).trim();

// Quita los caracteres especiales de la sintaxis de búsqueda para que el nombre del libro no la rompa.
const palabras = (t) =>
  String(t || "")
    .replace(/[+\-&|!(){}\[\]^"~*?:\\/]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);

async function buscarArchive(consulta) {
  const ps = palabras(consulta);
  if (!ps.length) return [];
  const q = `${ps.map((w) => `(title:${w} OR creator:${w})`).join(" AND ")} AND mediatype:texts AND NOT access-restricted-item:true`;
  const p = new URLSearchParams();
  p.set("q", q);
  for (const f of ["identifier", "title", "creator", "year", "language"]) p.append("fl[]", f);
  p.append("sort[]", "downloads desc");
  p.set("rows", String(MAX_RESULTADOS));
  p.set("output", "json");
  const j = await pedirJson(`https://archive.org/advancedsearch.php?${p}`, { espera: 20000 });
  return (j?.response?.docs || [])
    .filter((d) => d?.identifier)
    .map((d) => ({
      fuente: "Internet Archive",
      tipo: "ia",
      id: d.identifier,
      titulo: unir(d.title) || d.identifier,
      autor: unir(d.creator),
      anio: String(d.year || "").slice(0, 4)
    }));
}

async function buscarGoogle(consulta) {
  const p = new URLSearchParams({ q: consulta, filter: "free-ebooks", printType: "books", maxResults: String(MAX_RESULTADOS) });
  const j = await pedirJson(`https://www.googleapis.com/books/v1/volumes?${p}`, { espera: 20000 });
  return (j?.items || [])
    .filter((it) => it?.accessInfo?.pdf?.isAvailable && it.accessInfo.pdf.downloadLink)
    .map((it) => ({
      fuente: "Google Libros",
      tipo: "gb",
      id: it.id,
      titulo: unir([it.volumeInfo?.title, it.volumeInfo?.subtitle].filter(Boolean).join(": ")) || it.id,
      autor: unir(it.volumeInfo?.authors),
      anio: String(it.volumeInfo?.publishedDate || "").slice(0, 4),
      url: String(it.accessInfo.pdf.downloadLink).replace(/^http:\/\//i, "https://")
    }));
}

// Busca en todas las fuentes; si una falla, sigue con la otra.
async function buscar(consulta) {
  const salida = [];
  for (const fuente of [buscarArchive, buscarGoogle]) {
    try {
      salida.push(...(await fuente(consulta)));
    } catch (e) {
      console.log(`[libro] ${fuente.name} falló: ${String(e.message).split("\n")[0]}`);
    }
  }
  return salida;
}

// Devuelve { url, tamano } del mejor PDF de ese resultado, o null si no tiene uno descargable que quepa.
async function resolverPdf(libro) {
  if (libro.tipo === "gb") return { url: libro.url, tamano: 0 };

  const m = await pedirJson(`https://archive.org/metadata/${encodeURIComponent(libro.id)}`, { espera: 20000 });
  if (!m || m.is_dark || String(m.metadata?.["access-restricted-item"]) === "true") return null;

  const puntos = (f) => (/^text pdf$/i.test(f.format) ? 3 : /image container pdf/i.test(f.format) ? 2 : 1);
  const pdfs = (m.files || [])
    .filter((f) => /\.pdf$/i.test(f.name || "") && !/_text\.pdf$/i.test(f.name))
    .map((f) => ({ ...f, tamano: Number(f.size) || 0 }))
    .filter((f) => !f.tamano || f.tamano / 1048576 <= LIMITE_MB)
    .sort((a, b) => puntos(b) - puntos(a) || a.tamano - b.tamano);
  if (!pdfs.length) return null;

  const f = pdfs[0];
  const ruta = f.name.split("/").map(encodeURIComponent).join("/");
  return { url: `https://archive.org/download/${encodeURIComponent(libro.id)}/${ruta}`, tamano: f.tamano };
}

export default {
  names: [".libro", ".libros", ".book", ".pdf"],
  usage: ".libro <nombre>",
  desc: "Busca un libro y te manda el PDF",
  category: "Descargas",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const args = cleanText.trim().split(/\s+/).slice(1);
    let elegido = 1;
    if (args.length > 1 && /^\d{1,2}$/.test(args[0])) elegido = Math.max(1, Number(args.shift()));
    const consulta = args.join(" ").trim();

    if (!consulta) {
      return reply({
        text: tarjetaUso({
          comando: ".libro <nombre del libro>",
          ejemplo: ".libro don quijote de la mancha\n.libro 2 cien años de soledad\n.libro cervantes",
          nota: "Busco libros de acceso libre y te mando el PDF. Si no es el que querías, usa .libro <n> <nombre> con el número de otra opción."
        }),
        mentions: [sender]
      });
    }

    const falta = limitarEspera(esperas, sender, ESPERA_MS);
    if (falta) return reply({ text: tarjetaAviso("LIBRO", `Espera ${falta}s antes de buscar de nuevo.`) });

    const reaccionar = (emoji) => sock.sendMessage(from, { react: { text: emoji, key: msg.key } }).catch(() => {});
    await reaccionar("🔎");

    const libros = await buscar(consulta);
    if (!libros.length) {
      await reaccionar("❌");
      return reply({ text: tarjetaError("No encontré ese libro con PDF de descarga libre. Prueba con el título completo o con el autor.") });
    }

    // Desde el número elegido hacia adelante: se usa el primero que tenga un PDF descargable.
    let usado = -1;
    let archivo = null;
    for (let i = Math.min(elegido, libros.length) - 1; i < libros.length; i++) {
      try {
        archivo = await resolverPdf(libros[i]);
      } catch (e) {
        console.log(`[libro] no pude revisar ${libros[i].id}: ${String(e.message).split("\n")[0]}`);
      }
      if (archivo) {
        usado = i;
        break;
      }
    }

    if (!archivo) {
      await reaccionar("❌");
      return reply({ text: tarjetaAviso("LIBRO", `Encontré resultados, pero ninguno tiene un PDF descargable que quepa en WhatsApp (máx. ${LIMITE_MB} MB).`) });
    }

    const libro = libros[usado];
    const otros = libros
      .map((l, i) => (i === usado ? null : `${i + 1}. ${recortar(l.titulo, 40)}${l.autor ? ` — ${recortar(l.autor, 24)}` : ""}`))
      .filter(Boolean)
      .slice(0, 5);

    await reply({
      text: tarjetaDescarga({
        emoji: "📚",
        titulo: "LIBRO PDF",
        sender,
        campos: [
          campo("📖", "Libro", recortar(libro.titulo, 90)),
          ...(libro.autor ? [campo("✍️", "Autor", recortar(libro.autor, 80))] : []),
          ...(libro.anio ? [campo("📅", "Año", libro.anio)] : []),
          campo("🌐", "Fuente", libro.fuente),
          ...(archivo.tamano ? [campo("💾", "Tamaño", `${mb(archivo.tamano)} MB`)] : []),
          ...(otros.length ? [campo("🔎", "Otras opciones (.libro <n> <nombre>)", otros.join("\n> "))] : [])
        ],
        nota: "Enviando el PDF. Los libros grandes pueden tardar un poco."
      }),
      mentions: [sender]
    }).catch(() => {});

    try {
      await enviarConReintento(reply, {
        document: { url: archivo.url },
        mimetype: "application/pdf",
        fileName: `${nombreSeguro(libro.titulo, "libro")}.pdf`
      });
      await reaccionar("✅");
    } catch (e) {
      console.log(`[libro] falló el envío de ${libro.id}: ${String(e.message).split("\n")[0]}`);
      await reaccionar("❌");
      await reply({ text: tarjetaError("No pude enviar el PDF (el servidor falló o WhatsApp cortó la subida). Intenta de nuevo o prueba otra opción con .libro <n> <nombre>.", e.message) });
    }
  }
};
