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

async function fotoDe(sock, usuario) {
  try {
    return await sock.profilePictureUrl(usuario, "image");
  } catch (e) {
    return null;
  }
}

export async function enviarBienvenida(sock, grupo, usuario) {
  const [meta, enlace, foto] = await Promise.all([
    metadatos(sock, grupo),
    enlaceDeGrupo(sock, grupo),
    fotoDe(sock, usuario)
  ]);
  if (!meta) return;

  const frase = ajustesDe(grupo).textoBienvenida || FRASE_BIENVENIDA;
  const texto = construirBienvenida({ usuario, meta, enlace, frase });

  if (foto) {
    try {
      await sock.sendMessage(grupo, { image: { url: foto }, caption: texto, mentions: [usuario] });
      return;
    } catch (e) {
      console.log(`No se pudo enviar la bienvenida con foto: ${e.message}`);
    }
  }
  await sock.sendMessage(grupo, { text: texto, mentions: [usuario] });
}
