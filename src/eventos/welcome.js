import { metadatos, enlaceDeGrupo } from "../grupos/nucleo.js";
import { ajustesDe } from "../grupos/estado.js";
import { mencion } from "../economia/estilo.js";
import { imagenDePerfil, enviarConImagen } from "../grupos/foto.js";
import { aplicarPlantilla, usaBroche } from "../grupos/plantillas.js";
import { ajusteBot } from "../../motores/ajustes-bot.js";

export const FRASE_BIENVENIDA = "Te damos la más cordial bienvenida a nuestra comunidad.";

function formatearFecha(fecha) {
  return fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function construirBienvenida({ usuario, meta, enlace, frase }) {
  const creacion = meta.creacion ? formatearFecha(new Date(meta.creacion * 1000)) : "No disponible";
  return [
    "⏤͟͟͞͞⁂ ⧼🏰⧽ ```##``` *NUEVO MIEMBRO*",
    "",
    `> 📡 ${frase}`,
    "",
    "  〔📚〕//  *INFORMACIÓN*",
    "",
    "⧼📢⧽* ⁂❧ *Usuario*::",
    `> ${mencion(usuario)}`,
    "⧼🪷⧽* ⁂❧ *Fecha*::",
    `> ${formatearFecha(new Date())}`,
    "⧼🦦⧽* ⁂❧ *Link Grupo*::",
    `> ${enlace || "No disponible"}`,
    "",
    "  〔📡〕//  *INFO DEL GRUPO*",
    "",
    "⧼🪼⧽* ⁂❧ *Grupo*::",
    `> ${meta.asunto}`,
    "⧼🏡⧽* ⁂❧ *Usuarios*::",
    `> ${meta.participantes.length} incluyéndote.`,
    "⧼🦕⧽* ⁂❧ *Creación*::",
    `> ${creacion}`,
    "",
    "> *Disfruta tu estadía mientras estés en este grupo. (^ω^)*"
  ].join("\n");
}

// Valores de los broches disponibles para los mensajes editables (los comparte la despedida).
export function valoresDeBroches({ usuario, meta, enlace }) {
  return {
    usuario: mencion(usuario),
    numero: String(usuario).split("@")[0].split(":")[0],
    grupo: meta?.asunto || "este grupo",
    miembros: meta ? meta.participantes.length : "No disponible",
    creacion: meta?.creacion ? formatearFecha(new Date(meta.creacion * 1000)) : "No disponible",
    link: enlace || "No disponible",
    fecha: formatearFecha(new Date()),
    bot: ajusteBot("botNameShort") || "Bot"
  };
}

export async function enviarBienvenida(sock, grupo, usuario, ids = [usuario]) {
  const ajustes = ajustesDe(grupo);
  const plantilla = ajustes.plantillaBienvenida;
  // El enlace solo se pide si el mensaje lo usa (o si es el mensaje por defecto, que siempre lo muestra).
  const pideEnlace = !plantilla || usaBroche(plantilla, "link");

  const [meta, enlace, imagen] = await Promise.all([
    metadatos(sock, grupo),
    pideEnlace ? enlaceDeGrupo(sock, grupo) : Promise.resolve(null),
    imagenDePerfil(sock, [usuario, ...ids])
  ]);
  if (!meta) return;

  const texto = plantilla
    ? aplicarPlantilla(plantilla, valoresDeBroches({ usuario, meta, enlace }))
    : construirBienvenida({ usuario, meta, enlace, frase: ajustes.textoBienvenida || FRASE_BIENVENIDA });
  await enviarConImagen(sock, grupo, imagen, texto, [usuario]);
}
