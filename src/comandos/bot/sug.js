import fs from "fs";
import path from "path";
import { isOwner } from "../../../motores/owner.js";
import { obtenerBase } from "../../../motores/db.js";
import { limitarEspera } from "../../../motores/herramientas-ui.js";
import { enviarRespuestaRica } from "../../../motores/respuesta-rica.js";
import { aviso, textoTrasComando } from "../../grupos/nucleo.js";

// .sug <texto>: cualquiera sugiere un comando o función nueva. Owners: .sug ver | .sugs listo <n> | .sug limpiar confirmar
// Todo el comando vive en este archivo. Los datos se guardan en MongoDB (colección "sugerencias");
// si el bot está sin base de datos se usa data/sugerencias.json como respaldo.
const COLECCION = "sugerencias";
const ARCHIVO = path.resolve("./data/sugerencias.json");
const EMOJI = "💡";
const TITULO = "SUGERENCIA";
const PLURAL_TITULO = "SUGERENCIAS";
const COMANDO = ".sug";
const MIN_CARACTERES = 8;
const MAX_CARACTERES = 500;
const ESPERA_MS = 60 * 1000;
const MAX_PENDIENTES_POR_USUARIO = 5;
const POR_PAGINA = 10;

const VER = ["ver", "lista", "list"];
const QUITAR = ["listo", "arreglado", "listo", "eliminar", "borrar", "quitar"];
const esperas = new Map();

const recortar = (t, max) => {
  const s = String(t || "").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

// ───────────────────────────── Almacenamiento ─────────────────────────────
let cola = Promise.resolve();
const enCola = (tarea) => {
  const siguiente = cola.then(tarea, tarea);
  cola = siguiente.catch(() => {});
  return siguiente;
};

function coleccion() {
  const base = obtenerBase();
  return base ? base.collection(COLECCION) : null;
}
async function leerLocal() {
  try {
    const lista = JSON.parse(await fs.promises.readFile(ARCHIVO, "utf8"));
    return Array.isArray(lista) ? lista : [];
  } catch (e) {
    return [];
  }
}
async function escribirLocal(lista) {
  await fs.promises.mkdir(path.dirname(ARCHIVO), { recursive: true });
  await fs.promises.writeFile(`${ARCHIVO}.tmp`, JSON.stringify(lista));
  await fs.promises.rename(`${ARCHIVO}.tmp`, ARCHIVO);
}

// Del más antiguo al más nuevo: el número de la lista es la posición en este orden.
function listar() {
  return enCola(async () => {
    const col = coleccion();
    if (col) return col.find({}).sort({ fecha: 1, _id: 1 }).toArray();
    return (await leerLocal()).sort((a, b) => a.fecha - b.fecha);
  });
}
function agregar(item) {
  return enCola(async () => {
    const col = coleccion();
    if (col) return void (await col.insertOne({ ...item }));
    const lista = await leerLocal();
    lista.push({ ...item, _id: `${item.fecha.toString(36)}${Math.random().toString(36).slice(2, 7)}` });
    await escribirLocal(lista);
  });
}
function quitar(id) {
  return enCola(async () => {
    const col = coleccion();
    if (col) return void (await col.deleteOne({ _id: id }));
    await escribirLocal((await leerLocal()).filter((x) => x._id !== id));
  });
}
function vaciar() {
  return enCola(async () => {
    const col = coleccion();
    if (col) return void (await col.deleteMany({}));
    await escribirLocal([]);
  });
}

// ───────────────────────────── Vista de owners ─────────────────────────────
function textoDeLista(trozo, desde, total, paginas, pagina) {
  const cabecera = `${EMOJI} *${PLURAL_TITULO}* (${total})${paginas > 1 ? ` · página ${pagina}/${paginas}` : ""}`;
  const filas = trozo.map((r, i) => `*${desde + i + 1}.* ${r.texto}\n> 👤 ${r.nombre} · 📱 ${r.numero}`);
  return [cabecera, "", ...filas].join("\n");
}

async function mostrarLista({ sock, from, reply, pagina, forzarTexto }) {
  const lista = await listar();
  if (!lista.length) return reply({ text: aviso(EMOJI, PLURAL_TITULO, "No hay sugerencias pendientes.") });

  const paginas = Math.ceil(lista.length / POR_PAGINA);
  const actual = Math.min(Math.max(1, pagina), paginas);
  const desde = (actual - 1) * POR_PAGINA;
  const trozo = lista.slice(desde, desde + POR_PAGINA);

  const pie = `> Para quitar uno de la lista: *${COMANDO} listo <número>*${paginas > 1 ? `\n> Otra página: *${COMANDO} ver <página>*` : ""}`;
  if (!forzarTexto) {
    const ok = await enviarRespuestaRica({
      sock,
      from,
      submensajes: [
        { messageType: 2, messageText: `${EMOJI} *${PLURAL_TITULO}* — ${lista.length} en total${paginas > 1 ? ` · página ${actual}/${paginas}` : ""}` },
        {
          messageType: 4,
          tableMetadata: {
            title: PLURAL_TITULO,
            rows: [
              { items: ["#", "Sugerencia", "Usuario", "Número"], isHeading: true },
              ...trozo.map((r, i) => ({ items: [String(desde + i + 1), recortar(r.texto, 220), recortar(r.nombre, 30), r.numero], isHeading: false }))
            ]
          }
        },
        { messageType: 2, messageText: pie }
      ]
    });
    if (ok) return;
  }
  return reply({ text: `${textoDeLista(trozo, desde, lista.length, paginas, actual)}\n\n${pie}` });
}

// ───────────────────────────── Comando ─────────────────────────────
export default {
  names: [".sug", ".sugs", ".sugerir", ".sugerencia", ".sugerencias"],
  usage: ".sug <tu idea para el bot>",
  desc: "Sugiere un comando o función nueva para el bot (owners: ver y quitar sugerencias)",
  category: "General",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const args = cleanText.trim().split(/\s+/).slice(1).filter(Boolean);
    const primera = (args[0] || "").toLowerCase();
    const resto = args.slice(1);
    const soloNumeros = (xs) => xs.every((x) => /^\d+$/.test(x));
    const dueno = isOwner(sender);
    const soloOwners = () => reply({ text: aviso(EMOJI, TITULO, "Solo los owners pueden ver y eliminar las sugerencias.") });

    // ── ver lista ──
    if (VER.includes(primera) && resto.every((x) => /^\d+$/.test(x) || x.toLowerCase() === "texto")) {
      if (!dueno) return soloOwners();
      const pagina = Number(resto.find((x) => /^\d+$/.test(x))) || 1;
      return mostrarLista({ sock, from, reply, pagina, forzarTexto: resto.some((x) => x.toLowerCase() === "texto") });
    }

    // ── quitar uno ──
    if (QUITAR.includes(primera) && args.length <= 2 && soloNumeros(resto)) {
      if (!dueno) return soloOwners();
      const numero = Number(resto[0]);
      if (!numero) return reply({ text: aviso(EMOJI, TITULO, `Indica el número de la lista.\n\n> Ejemplo: *${COMANDO} listo 1*\n> Mira los números con *${COMANDO} ver*`) });
      const lista = await listar();
      const elegido = lista[numero - 1];
      if (!elegido) return reply({ text: aviso(EMOJI, TITULO, `No existe el número ${numero}. Ahora hay ${lista.length} en la lista.`) });
      await quitar(elegido._id);
      return reply({ text: aviso(EMOJI, TITULO, `✅ Sugerencia marcada como lista (#${numero}) y eliminada de la lista.\n\n> ${recortar(elegido.texto, 200)}\n\n> Los números se recorren: vuelve a usar *${COMANDO} ver* antes de quitar otro.`) });
    }

    // ── vaciar todo ──
    if (primera === "limpiar" && args.length <= 2 && (!resto[0] || resto[0].toLowerCase() === "confirmar")) {
      if (!dueno) return soloOwners();
      if ((resto[0] || "").toLowerCase() !== "confirmar") {
        return reply({ text: aviso(EMOJI, TITULO, `Esto borra TODOS las sugerencias. Si estás seguro usa *${COMANDO} limpiar confirmar*.`) });
      }
      await vaciar();
      return reply({ text: aviso(EMOJI, TITULO, "Se borraron todos las sugerencias.") });
    }

    // ── enviar uno (público) ──
    const texto = textoTrasComando(cleanText).replace(/\s+/g, " ").trim();
    if (!texto) {
      return reply({
        text: aviso(
          EMOJI,
          TITULO,
          "Cuéntame qué comando o función te gustaría que tuviera el bot.\n\n> Uso: *.sug <tu idea para el bot>*\n> Ejemplo: *.sug un comando para ver el clima de mi ciudad*" + (dueno ? `\n\n> Owners: *${COMANDO} ver* · *${COMANDO} listo <número>*` : "")
        )
      });
    }
    if (texto.length < MIN_CARACTERES) return reply({ text: aviso(EMOJI, TITULO, "Cuéntame un poco más tu idea (mínimo 8 caracteres).") });
    if (texto.length > MAX_CARACTERES) return reply({ text: aviso(EMOJI, TITULO, `Es muy largo (${texto.length} caracteres). Máximo ${MAX_CARACTERES}.`) });

    const limpio = String(sender).split(":")[0];
    const digitos = limpio.split("@")[0];
    const numero = limpio.endsWith("@lid") ? `${digitos} (ID)` : `+${digitos}`;

    const falta = limitarEspera(esperas, sender, ESPERA_MS);
    if (falta) return reply({ text: aviso(EMOJI, TITULO, `Espera ${falta}s antes de enviar otro.`) });

    try {
      const lista = await listar();
      if (lista.filter((r) => r.numero === numero).length >= MAX_PENDIENTES_POR_USUARIO) {
        esperas.delete(sender);
        return reply({ text: aviso(EMOJI, TITULO, `Ya tienes ${MAX_PENDIENTES_POR_USUARIO} las sugerencias pendientes. Espera a que los revisen para enviar más.`) });
      }
      if (lista.some((r) => r.numero === numero && r.texto.toLowerCase() === texto.toLowerCase())) {
        esperas.delete(sender);
        return reply({ text: aviso(EMOJI, TITULO, "Ya enviaste exactamente eso y sigue pendiente.") });
      }

      await agregar({
        texto,
        nombre: recortar(String(msg?.pushName || "Sin nombre").replace(/\s+/g, " "), 40),
        numero,
        usuario: sender,
        grupo: String(from).endsWith("@g.us") ? from : null,
        fecha: Date.now()
      });
      return reply({ text: aviso(EMOJI, "SUGERENCIA ENVIADA", `Gracias, tu sugerencia quedó registrada y un owner la va a revisar.\n\n> ${recortar(texto, 200)}`) });
    } catch (e) {
      esperas.delete(sender);
      console.log(`[${COMANDO}] No se pudo guardar: ${e.message}`);
      return reply({ text: aviso(EMOJI, TITULO, "No fue posible guardarlo ahora. Intenta de nuevo en un momento.") });
    }
  }
};
