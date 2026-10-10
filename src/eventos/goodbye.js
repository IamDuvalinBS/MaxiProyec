import { metadatos } from "../grupos/nucleo.js";
import { mencion } from "../economia/estilo.js";

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
    `> ${meta.participantes.length} actualmente.`,
    "",
    "> *Posiblemente nadie lo quiso en este grupo.*"
  ].join("\n");
}

export async function enviarDespedida(sock, grupo, usuario) {
  const meta = await metadatos(sock, grupo);
  if (!meta) return;
  await sock.sendMessage(grupo, { text: construirDespedida({ usuario, meta }), mentions: [usuario] });
}
