import { checkCooldown, addToWallet } from "../../../motores/db.js";
import { addXp } from "../../../motores/profile.js";
import { registrarEspera } from "../../nucleo/espera.js";
import { tarjeta, monto, textoEspera, avisoNivel } from "../../economia/formato-evento.js";
import { PROBLEMAS } from "../../economia/calculos-banco.js";

// ───────────── Ajustes (cámbialos aquí) ─────────────
const ESPERA_MS = 17 * 60 * 1000; // cooldown de quien inicia el reto
const MAX_INTENTOS = 3;           // intentos por persona en cada reto
const NIVELES = {
  medio:     { emoji: "🧮", etiqueta: "MEDIO",     segundos: 20, premio: [5000, 9000],   xp: [15, 25], peso: 45 },
  dificil:   { emoji: "🔥", etiqueta: "DIFÍCIL",   segundos: 30, premio: [10000, 16000], xp: [30, 45], peso: 35 },
  imposible: { emoji: "💀", etiqueta: "IMPOSIBLE", segundos: 30, premio: [20000, 32000], xp: [60, 90], peso: 20 }
};

const aleatorio = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

const porNivel = Object.fromEntries(Object.keys(NIVELES).map((n) => [n, []]));
PROBLEMAS.forEach(([nivel], i) => porNivel[nivel]?.push(i));

// Un reto activo por chat; cualquiera del chat puede ganarlo con ".calculo <resultado>".
const retos = new Map();
const recientes = [];

function elegirProblema() {
  const total = Object.values(NIVELES).reduce((a, n) => a + n.peso, 0);
  let tiro = Math.random() * total;
  let nivel = "medio";
  for (const [clave, n] of Object.entries(NIVELES)) {
    if ((tiro -= n.peso) < 0) { nivel = clave; break; }
  }
  const lista = porNivel[nivel];
  let indice = lista[Math.floor(Math.random() * lista.length)];
  for (let i = 0; i < 10 && recientes.includes(indice); i++) indice = lista[Math.floor(Math.random() * lista.length)];
  recientes.push(indice);
  if (recientes.length > 80) recientes.shift();
  const [, texto, respuesta] = PROBLEMAS[indice];
  return { nivel, texto, respuesta };
}

// Convierte lo que escribe la persona a un entero en texto ("1.234", "1,234", "−57", "57.0"…). null si no es un número.
export function leerNumero(texto) {
  let t = String(texto ?? "").trim().replace(/\s+/g, "").replace(/[−–—]/g, "-");
  if (!/^[-+]?[\d.,]+$/.test(t)) return null;
  if (/^[-+]?\d{1,3}([.,]\d{3})+$/.test(t)) t = t.replace(/[.,]/g, "");
  else t = t.replace(",", ".");
  if (!/^[-+]?\d+(\.\d+)?$/.test(t)) return null;
  t = t.replace(/^\+/, "").replace(/\.0+$/, "");
  return t.replace(/^(-?)0+(?=\d)/, "$1");
}

const enviar = (sock, from, msg, text) => sock.sendMessage(from, { text }, msg ? { quoted: msg } : undefined);

// Devuelve "nada" | "invalida" | "correcta" | "incorrecta" | "agotado"
async function responder({ sock, from, sender, msg, texto }) {
  const reto = retos.get(from);
  if (!reto || Date.now() > reto.expira) return "nada";
  const valor = leerNumero(texto);
  if (valor === null) return "invalida";

  const usados = reto.intentos.get(sender) || 0;
  if (usados >= MAX_INTENTOS) {
    await enviar(sock, from, msg, tarjeta({ emoji: "🚫", titulo: "SIN INTENTOS", relato: `Ya usaste tus ${MAX_INTENTOS} intentos en este reto. Deja que otros lo intenten.` }));
    return "agotado";
  }

  if (valor === reto.respuesta) {
    clearTimeout(reto.timer);
    retos.delete(from);
    addToWallet(sender, reto.premio);
    const { leveledUp, newLevel } = addXp(sender, reto.xp);
    await enviar(sock, from, msg, tarjeta({
      emoji: "✅",
      titulo: "¡CÁLCULO CORRECTO!",
      relato: "¡Has resuelto el problema con éxito!",
      lineas: [`🪙 *Recompensa* ›› +${monto(reto.premio)}`, `✨ *Experiencia* ›› +${reto.xp} XP`, `🧠 *Respuesta* ›› ${reto.respuesta}`]
    }));
    if (leveledUp) await enviar(sock, from, msg, avisoNivel(newLevel));
    return "correcta";
  }

  reto.intentos.set(sender, usados + 1);
  const quedan = MAX_INTENTOS - usados - 1;
  await enviar(sock, from, msg, tarjeta({
    emoji: "❌",
    titulo: "RESULTADO INCORRECTO",
    relato: quedan > 0 ? `Ese no es el resultado. Te quedan ${quedan} intento${quedan === 1 ? "" : "s"}.` : "Ese no es el resultado y ya no te quedan intentos."
  }));
  return "incorrecta";
}

export default {
  names: [".calculo", ".cálculo"],
  usage: ".calculo | .calculo <resultado>",
  desc: "Reto de matemáticas (medio, difícil e imposible): el primero en acertar gana monedas y experiencia",
  category: "Economía",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const arg = cleanText.split(/\s+/).slice(1).join(" ").trim();

    // ── Responder ──
    if (arg) {
      if (!retos.get(from) || Date.now() > retos.get(from).expira) {
        return reply({ text: tarjeta({ emoji: "🧮", titulo: "SIN RETO ACTIVO", relato: "No hay ningún reto en este chat. Escribe *.calculo* para iniciar uno." }) });
      }
      const r = await responder({ sock, from, sender, msg, texto: arg });
      if (r === "invalida") return reply({ text: "🧮 Responde solo con un número. Ejemplo: *.calculo 57*" });
      return;
    }

    // ── Iniciar ──
    const activo = retos.get(from);
    if (activo && Date.now() < activo.expira) {
      const seg = Math.max(1, Math.ceil((activo.expira - Date.now()) / 1000));
      return reply({ text: tarjeta({ emoji: "⏱️", titulo: "RETO EN CURSO", relato: `Ya hay un problema activo en este chat. Quedan *${seg} s*. Responde con *.calculo <resultado>*.` }) });
    }

    const restante = checkCooldown(sender, "calculo", ESPERA_MS);
    if (restante > 0) return reply({ text: textoEspera(restante) });

    const { nivel, texto, respuesta } = elegirProblema();
    const N = NIVELES[nivel];
    const premio = aleatorio(...N.premio);
    const xp = aleatorio(...N.xp);
    const reto = {
      respuesta, premio, xp,
      expira: Date.now() + N.segundos * 1000,
      intentos: new Map(),
      timer: null
    };
    retos.set(from, reto);

    reto.timer = setTimeout(async () => {
      if (retos.get(from) !== reto) return;
      retos.delete(from);
      try {
        await sock.sendMessage(from, {
          text: tarjeta({ emoji: "⏰", titulo: "¡TIEMPO AGOTADO!", relato: `Nadie resolvió el problema a tiempo. La respuesta correcta era *${respuesta}*.` })
        });
      } catch {}
    }, N.segundos * 1000 + 300);

    // Quien inicia también puede responder escribiendo solo el número.
    registrarEspera(`${from}:${sender}`, {
      duracionMs: N.segundos * 1000 + 1000,
      tipo: "calculo",
      alResponder: async (t, ctx) => {
        const r = await responder({ sock: ctx.sock, from: ctx.from, sender: ctx.sender, msg: ctx.msg, texto: t });
        return r === "correcta" || r === "incorrecta" || r === "agotado";
      }
    });

    await reply({
      text: tarjeta({
        emoji: N.emoji,
        titulo: `RETO MATEMÁTICO // ${N.etiqueta}`,
        subtitulo: "Resuelve el siguiente problema:",
        relato: texto,
        lineas: [`🪙 *Premio* ›› ${monto(premio)}`, `⏱️ *Tiempo* ›› ${N.segundos} segundos`],
        tip: ["Responde con *.calculo <resultado>*. El primero en acertar gana.", `Tienes ${MAX_INTENTOS} intentos.`]
      })
    });
  }
};
