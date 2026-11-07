import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { metadatos, enlaceDeGrupo } from "../grupos/nucleo.js";
import { ajustesDe } from "../grupos/estado.js";
import { mencion } from "../economia/estilo.js";
import { imagenDePerfil, enviarConImagen } from "../grupos/foto.js";
import { aplicarPlantilla, usaBroche } from "../grupos/plantillas.js";
import { valoresDeBroches } from "./welcome.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RUTAS_AUDIO = ["assets/audios/goodbye.mp3", "assets/fonts/goodbye.mp3", "assets/goodbye.mp3"].map((ruta) => path.join(RAIZ, ruta));

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
  const plantilla = ajustesDe(grupo).plantillaDespedida;
  const pideEnlace = Boolean(plantilla) && usaBroche(plantilla, "link");

  const [meta, enlace, imagen] = await Promise.all([
    metadatos(sock, grupo),
    pideEnlace ? enlaceDeGrupo(sock, grupo) : Promise.resolve(null),
    imagenDePerfil(sock, [usuario, ...ids])
  ]);

  if (plantilla) {
    // Mensaje personalizado: se envía tal cual lo escribió el usuario (sin la frase aleatoria ni el audio).
    const texto = aplicarPlantilla(plantilla, valoresDeBroches({ usuario, meta, enlace }));
    await enviarConImagen(sock, grupo, imagen, texto, [usuario]);
    return;
  }

  await enviarConImagen(sock, grupo, imagen, construirDespedida({ usuario, meta }), [usuario]);

  const ruta = RUTAS_AUDIO.find((r) => fs.existsSync(r));
  if (!ruta) {
    console.log(`Falta el audio de despedida. Búscalo en: ${RUTAS_AUDIO.join(" | ")}`);
    return;
  }
  try {
    await sock.sendMessage(grupo, { audio: fs.readFileSync(ruta), mimetype: "audio/mpeg", ptt: false });
  } catch (e) {
    console.log(`No se pudo enviar el audio de despedida: ${e.message}`);
  }
}
