import fs from "fs";
import path from "path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { fileURLToPath } from "url";
import { limpiarJid } from "./nucleo.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CANDIDATAS = [
  "assets/imagenes/perfil-predeterminado.png",
  "assets/perfil-predeterminado.png",
  "photo/perfil-predeterminado.png"
].map((ruta) => path.join(RAIZ, ruta));
const ESPERA_MS = 8000;
const DESCARGA_MS = 6000;
const MAXIMO_CACHE = 300;
const LADO_FOTO_GRUPO = 640;
const fotosGuardadas = new Map();
let predeterminada;

function fotoPredeterminada() {
  if (predeterminada !== undefined) return predeterminada;
  const ruta = CANDIDATAS.find((r) => fs.existsSync(r));
  predeterminada = ruta ? fs.readFileSync(ruta) : null;
  if (!predeterminada) console.log("Falta la foto predeterminada. Búscala en: " + CANDIDATAS.join(" | "));
  return predeterminada;
}

async function urlDe(sock, id) {
  for (const tipo of ["image", "preview"]) {
    try {
      const url = await sock.profilePictureUrl(id, tipo);
      if (url) return url;
    } catch (e) {
      continue;
    }
  }
  throw new Error("sin foto");
}

async function buscarFoto(sock, ids) {
  try {
    return await Promise.any(ids.map((id) => urlDe(sock, id)));
  } catch (e) {
    return null;
  }
}

async function descargar(url) {
  const respuesta = await fetch(url, { signal: AbortSignal.timeout(DESCARGA_MS) });
  if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);
  return Buffer.from(await respuesta.arrayBuffer());
}

function recordar(ids, buffer) {
  for (const id of ids) {
    fotosGuardadas.delete(id);
    fotosGuardadas.set(id, buffer);
  }
  while (fotosGuardadas.size > MAXIMO_CACHE) fotosGuardadas.delete(fotosGuardadas.keys().next().value);
}

export async function imagenDePerfil(sock, ids) {
  const unicos = [...new Set(ids.filter(Boolean).map(limpiarJid))];
  let temporizador;
  const limite = new Promise((resolver) => {
    temporizador = setTimeout(() => resolver(null), ESPERA_MS);
  });
  const url = await Promise.race([buscarFoto(sock, unicos), limite]);
  clearTimeout(temporizador);

  if (url) {
    try {
      const buffer = await descargar(url);
      recordar(unicos, buffer);
      return buffer;
    } catch (e) {
      return url;
    }
  }

  const guardada = unicos.map((id) => fotosGuardadas.get(id)).find(Boolean);
  return guardada || fotoPredeterminada();
}

const comoImagen = (imagen) => (Buffer.isBuffer(imagen) ? imagen : { url: imagen });

export async function enviarConImagen(sock, grupo, imagen, texto, mentions) {
  if (imagen) {
    try {
      await sock.sendMessage(grupo, { image: comoImagen(imagen), caption: texto, mentions });
      return;
    } catch (e) {
      console.log(`No se pudo enviar la imagen de perfil: ${e.message}`);
    }
  }
  const respaldo = fotoPredeterminada();
  if (respaldo && imagen !== respaldo) {
    try {
      await sock.sendMessage(grupo, { image: respaldo, caption: texto, mentions });
      return;
    } catch (error) {
      console.log(`No se pudo enviar la imagen predeterminada: ${error.message}`);
    }
  }
  await sock.sendMessage(grupo, { text: texto, mentions });
}

async function prepararFotoGrupo(buffer) {
  const origen = await loadImage(buffer);
  const lado = Math.min(origen.width, origen.height);
  const lienzo = createCanvas(LADO_FOTO_GRUPO, LADO_FOTO_GRUPO);
  lienzo.getContext("2d").drawImage(
    origen,
    (origen.width - lado) / 2,
    (origen.height - lado) / 2,
    lado,
    lado,
    0,
    0,
    LADO_FOTO_GRUPO,
    LADO_FOTO_GRUPO
  );
  return lienzo.toBuffer("image/jpeg", 90);
}

export async function cambiarFotoGrupo(sock, grupo, buffer) {
  const imagen = await prepararFotoGrupo(buffer);
  try {
    await sock.updateProfilePicture(grupo, imagen);
  } catch (e) {
    if (!/image processing/i.test(e.message || "")) throw e;
    await sock.query({
      tag: "iq",
      attrs: { target: grupo, to: "@s.whatsapp.net", type: "set", xmlns: "w:profile:picture" },
      content: [{ tag: "picture", attrs: { type: "image" }, content: imagen }]
    });
  }
}
