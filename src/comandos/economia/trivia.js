import { addToWallet } from "../../motores/db.js";
import { addXp } from "../../motores/profile.js";
import { tarjeta, monto, avisoNivel } from "./formato-evento.js";
import { estilo } from "./temas.js";

const pendientes = new Map();
const LETRAS = ["A", "B", "C", "D"];

const ESTILOS = {
  normal: {
    incorrectaEmoji: "❌",
    incorrectaTitulo: "RESPUESTA INCORRECTA",
    incorrecta: (letra) => `La respuesta correcta era la opción ${letra}. Se recomienda intentarlo nuevamente en la próxima ocasión.`,
    correctaEmoji: "🧠",
    correctaTitulo: "RESPUESTA CORRECTA",
    correcta: "Se acreditó el premio por responder correctamente la pregunta.",
    ganancia: (n) => `🪙 *Ganancia* ›› +${monto(n)}`,
    experiencia: (n) => `✨ *Experiencia* ›› +${n}`
  },
  halloween: {
    incorrectaEmoji: "💀",
    incorrectaTitulo: "RESPUESTA MALDITA",
    incorrecta: (letra) => {
      const frases = [
        `Un fantasma sopló la respuesta correcta: era la opción ${letra}. Tarde, como siempre 👻`,
        `La Llorona lloró al escuchar tu respuesta; la correcta era la opción ${letra} 😭`,
        `El esqueleto del salón negó con la cabeza: la respuesta era la opción ${letra} 💀`,
        `Un cuervo graznó la verdad: la opción correcta era la ${letra} 🐦‍⬛`
      ];
      return `${frases[Math.floor(Math.random() * frases.length)]}. Vuelve a intentarlo cuando el reloj de la torre lo permita. 🕸️`;
    },
    correctaEmoji: "🔮",
    correctaTitulo: "RESPUESTA ENCANTADA",
    correcta: "La bola de cristal confirma tu acierto; hasta el murciélago de la esquina aplaudió y los espíritus te dejaron un botín 🦇.",
    ganancia: (n) => `🎃 *Botín* ›› +${monto(n)}`,
    experiencia: (n) => `🦇 *Experiencia* ›› +${n}`
  }
};

function idBase(jid) {
  return String(jid ?? "").split("@")[0].split(":")[0];
}

function normalizarClave(clave) {
  const partes = String(clave).match(/^(.+?@[a-z.]+):(.+)$/i);
  return partes ? `${idBase(partes[1])}:${idBase(partes[2])}` : String(clave);
}

function leerLetra(texto) {
  const limpio = String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const coincidencia = limpio.match(/^(?:(?:LA|LO|OPCION|RESPUESTA|INCISO|ES|R)\s+)*([ABCD])$/);
  return coincidencia ? coincidencia[1] : null;
}

function letraCorrecta(valor) {
  if (typeof valor === "number") return LETRAS[valor] ?? null;
  const limpio = String(valor ?? "").trim().toUpperCase();
  return LETRAS.includes(limpio) ? limpio : null;
}

function haExpirado(pendiente) {
  let expira = Number(pendiente.expira ?? pendiente.expiraEn ?? pendiente.expires);
  if (!Number.isFinite(expira)) return false;
  if (expira < 1e12) expira *= 1000;
  return Date.now() > expira;
}

export function setPendingTrivia(clave, datos) {
  pendientes.set(normalizarClave(clave), datos);
  if (process.env.DEBUG_TRIVIA) console.log("[trivia] pregunta creada para", normalizarClave(clave));
}

export async function checkTriviaAnswer(sock, from, sender, text, msg) {
  const clave = normalizarClave(`${from}:${sender}`);
  const pendiente = pendientes.get(clave);
  if (!pendiente) {
    if (process.env.DEBUG_TRIVIA && leerLetra(text)) console.log("[trivia] letra sin pendiente para", clave, "| pendientes ahora:", [...pendientes.keys()]);
    return false;
  }
  if (haExpirado(pendiente)) {
    pendientes.delete(clave);
    return false;
  }

  const respuesta = leerLetra(text);
  if (!respuesta) return false;
  pendientes.delete(clave);

  const enviar = (contenido) => sock.sendMessage(from, contenido, { quoted: msg });
  const E = estilo(ESTILOS);
  const correcta = letraCorrecta(pendiente.correcta);

  if (respuesta !== correcta) {
    await enviar({
      text: tarjeta({
        emoji: E.incorrectaEmoji,
        titulo: E.incorrectaTitulo,
        relato: E.incorrecta(correcta ?? pendiente.correcta)
      })
    });
    return true;
  }

  addToWallet(sender, pendiente.premio);
  const { leveledUp, newLevel } = addXp(sender, pendiente.xp);
  await enviar({
    text: tarjeta({
      emoji: E.correctaEmoji,
      titulo: E.correctaTitulo,
      relato: E.correcta,
      lineas: [E.ganancia(pendiente.premio), E.experiencia(pendiente.xp)]
    })
  });
  if (leveledUp) await enviar({ text: avisoNivel(newLevel) });
  return true;
}
