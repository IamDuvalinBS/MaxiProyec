import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { metadatos } from "../grupos/nucleo.js";
import { mencion } from "../economia/estilo.js";
import { imagenDePerfil, enviarConImagen } from "../grupos/foto.js";

const RUTA_AUDIO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../assets/audios/goodbye.mp3");

const FRASES_DESPEDIDA = [
  "Es una pena terrible... A {usuario} le cayó un meteorito mientras caminaba por la calle.",
  "Se informa con pesar que {usuario} fue visto por última vez persiguiendo una señal de wifi que nunca encontró.",
  "Lamentamos comunicar que {usuario} decidió emprender una expedición sin fecha de retorno.",
  "Nos enteramos de que {usuario} partió rumbo a una tierra donde no existen las notificaciones.",
  "Un minuto de silencio por {usuario}, quien fue reclamado por obligaciones de fuerza mayor.",
  "{usuario} se extravió en el laberinto de su propia lista de pendientes.",
  "Con profundo pesar, {usuario} fue absorbido por una laguna temporal mientras buscaba un cargador."
];

function formatearFecha(fecha) {
  return fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function construirDespedida({ usuario, meta }) {
  const frase = FRASES_DESPEDIDA[Math.floor(Math.random() * FRASES_DESPEDIDA.length)].replace("{usuario}", mencion(usuario));
  return [
    "⧼🪺⧽ ```##``` *USUARIO FUERA*",
    "",
    `> 🪨 ${frase}`,
    "",
    " 〔🧠〕  *¿QUIEN ES ESTE TIPO?*",
    "",
    "⧼📢⧽* ⁂❧ *Usuario*::",
    `> ${mencion(usuario)}`,
    "⧼🪷⧽* ⁂❧ *Fecha*::",
    `> ${formatearFecha(new Date())} fue su último resplandor.`,
    "⧼🏡⧽* ⁂❧ *Usuarios*::",
    `> ${meta ? meta.participantes.length : "No disponible"} actualmente.`,
    "",
    "> *Posiblemente nadie lo quiso en este grupo.*"
  ].join("\n");
}

export async function enviarDespedida(sock, grupo, usuario, ids = [usuario]) {
  const [meta, imagen] = await Promise.all([metadatos(sock, grupo), imagenDePerfil(sock, [usuario, ...ids])]);
  await enviarConImagen(sock, grupo, imagen, construirDespedida({ usuario, meta }), [usuario]);

  if (!fs.existsSync(RUTA_AUDIO)) {
    console.log(`Falta el audio de despedida en ${RUTA_AUDIO}`);
    return;
  }
  try {
    await sock.sendMessage(grupo, { audio: fs.readFileSync(RUTA_AUDIO), mimetype: "audio/mpeg", ptt: false });
  } catch (e) {
    console.log(`No se pudo enviar el audio de despedida: ${e.message}`);
  }
}
