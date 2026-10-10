import { metadatos, enlaceDeGrupo } from "../grupos/nucleo.js";
import { ajustesDe } from "../grupos/estado.js";
import { mencion } from "../economia/estilo.js";

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

export async function enviarBienvenida(sock, grupo, usuario) {
  const [meta, enlace] = await Promise.all([metadatos(sock, grupo), enlaceDeGrupo(sock, grupo)]);
  if (!meta) return;
  const frase = ajustesDe(grupo).textoBienvenida || FRASE_BIENVENIDA;
  await sock.sendMessage(grupo, {
    text: construirBienvenida({ usuario, meta, enlace, frase }),
    mentions: [usuario]
  });
}
