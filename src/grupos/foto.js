import path from "path";
import { fileURLToPath } from "url";
import { limpiarJid } from "./nucleo.js";

const PREDETERMINADA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../assets/imagenes/perfil-predeterminado.png");
const ESPERA_MS = 6000;

async function buscarFoto(sock, ids) {
  for (const id of ids) {
    for (const tipo of ["image", "preview"]) {
      try {
        const url = await sock.profilePictureUrl(id, tipo);
        if (url) return url;
      } catch (e) {
        continue;
      }
    }
  }
  return null;
}

export async function imagenDePerfil(sock, ids) {
  const unicos = [...new Set(ids.filter(Boolean).map(limpiarJid))];
  let temporizador;
  const limite = new Promise((resolver) => {
    temporizador = setTimeout(() => resolver(null), ESPERA_MS);
  });
  const url = await Promise.race([buscarFoto(sock, unicos), limite]);
  clearTimeout(temporizador);
  return url || PREDETERMINADA;
}

export async function enviarConImagen(sock, grupo, imagen, texto, mentions) {
  try {
    await sock.sendMessage(grupo, { image: { url: imagen }, caption: texto, mentions });
  } catch (e) {
    console.log(`No se pudo enviar la imagen de perfil: ${e.message}`);
    if (imagen !== PREDETERMINADA) {
      try {
        await sock.sendMessage(grupo, { image: { url: PREDETERMINADA }, caption: texto, mentions });
        return;
      } catch (error) {
        console.log(`No se pudo enviar la imagen predeterminada: ${error.message}`);
      }
    }
    await sock.sendMessage(grupo, { text: texto, mentions });
  }
}
