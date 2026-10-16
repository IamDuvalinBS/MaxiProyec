import { addToWallet } from "../../motores/db.js";
import { addXp } from "../../motores/profile.js";
import { botApagado } from "../grupos/estado.js";
import { tarjeta, monto, avisoNivel } from "./formato.js";

const pendientes = new Map();
const PATRON = /^(?:opci[oó]n\s*)?([abcd])\s*[.)\-:!]*$/i;

const normalizar = (clave) => {
  const texto = String(clave);
  const i = texto.indexOf(":");
  if (i === -1) return texto;
  const persona = texto.slice(i + 1).split("@")[0].split(":")[0];
  return `${texto.slice(0, i)}:${persona}`;
};

const textoDe = (text, msg) => {
  const m = msg?.message || {};
  return String(text || m.conversation || m.extendedTextMessage?.text || "")
    .normalize("NFKC")
    .replace(/[​-‏‪-‮⁠﻿]/g, "")
    .trim();
};

export function setPendingTrivia(clave, datos) {
  pendientes.set(normalizar(clave), datos);
}

export async function checkTriviaAnswer(sock, from, sender, text, msg) {
  if (from.endsWith("@g.us") && botApagado(from)) return false;

  const clave = normalizar(`${from}:${sender}`);
  const pendiente = pendientes.get(clave);
  if (!pendiente) return false;
  if (Date.now() > pendiente.expira) {
    pendientes.delete(clave);
    return false;
  }

  const coincidencia = PATRON.exec(textoDe(text, msg));
  if (!coincidencia) return false;
  const respuesta = coincidencia[1].toUpperCase();
  pendientes.delete(clave);

  const enviar = (contenido) => sock.sendMessage(from, contenido, { quoted: msg });

  if (respuesta !== pendiente.correcta) {
    await enviar({
      text: tarjeta({
        emoji: "❌",
        titulo: "RESPUESTA INCORRECTA",
        relato: `La respuesta correcta era la opción ${pendiente.correcta}. Se recomienda intentarlo nuevamente en la próxima ocasión.`
      })
    });
    return true;
  }

  addToWallet(sender, pendiente.premio);
  const { leveledUp, newLevel } = addXp(sender, pendiente.xp);
  await enviar({
    text: tarjeta({
      emoji: "🧠",
      titulo: "RESPUESTA CORRECTA",
      relato: "Se acreditó el premio por responder correctamente la pregunta.",
      lineas: [
        `🪙 *Ganancia* ›› +${monto(pendiente.premio)}`,
        `✨ *Experiencia* ›› +${pendiente.xp}`
      ]
    })
  });
  if (leveledUp) await enviar({ text: avisoNivel(newLevel) });
  return true;
}
