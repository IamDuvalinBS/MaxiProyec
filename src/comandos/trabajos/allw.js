import { getAccount } from "../../../motores/db.js";
import { trabajosRegistrados, ejecutarTrabajo, vistaDe } from "../../economia/trabajos.js";
import { tarjeta, monto, montoConSigno, avisoNivel, fmt } from "../../economia/formato-evento.js";
import { estilo, esHalloween } from "../../economia/temas.js";

// ─────────────────────────────────────────────────────────────
//  .allw con el evento de Halloween activo: se celebra el DÍA DE
//  MUERTOS (1 y 2 de noviembre). Las "calaveritas" 💀 son SOLO
//  VISUALES (texto y nombre de la moneda): el dinero real se guarda
//  en MongoDB como siempre, en la cartera normal (yenes).
//  Fuera del evento, .allw funciona exactamente igual que siempre.
// ─────────────────────────────────────────────────────────────

const montoCalaveritas = (n) => `${fmt(n)} 💀 Calaveritas`;
const conSignoCalaveritas = (n) => `${n < 0 ? "-" : "+"}${montoCalaveritas(Math.abs(n))}`;

const ESTILOS = {
  normal: {
    emoji: "📋",
    titulo: "RESUMEN DE TRABAJOS",
    todosEnEspera: "⏳ Todos los trabajos se encuentran en espera. Intenta nuevamente más tarde.",
    relato: (n) => `Se completaron ${n} trabajos disponibles en esta ocasión.`,
    balance: (n) => `📊 *BALANCE::* ${montoConSigno(n)}`,
    experiencia: (n) => `✨ *EXPERIENCIA::* +${n}`,
    tip: (cartera) => `Tu cartera ahora tiene *${monto(cartera)}*.`
  }
};

// Día de Muertos (se activa con el evento de Halloween del bot).
const MUERTOS = {
  emoji: "💀",
  titulo: "RESUMEN DE TUS CALAVERITAS",
  todosEnEspera: "⏳ 🕯️ Las ánimas todavía no llegan a la ofrenda. Intenta nuevamente más tarde. 🌼",
  relato: (n) => `Pasaste por ${n} trabajos y juntaste calaveritas para la ofrenda. 🌼`,
  balance: (n) => `💀 *BALANCE DE CALAVERITAS::* ${conSignoCalaveritas(n)}`,
  experiencia: (n) => `🌼 *EXPERIENCIA::* +${n}`,
  tip: (saldo) => `Tu ofrenda ahora tiene *${montoCalaveritas(saldo)}*. 🕯️`,
  nivel: (n) => `💀 *¡NUEVO NIVEL!* Tu alma ya va por el nivel *${n}* en el camino de cempasúchil. 🌼`
};

const BANDAS = ["🌼 🕯️ 💀 🕯️ 🌼", "🌺 💀 🌼 💀 🌺", "🕯️ 🌼 🪦 🌼 🕯️", "🌼 🍞 💀 🍬 🌼"];
const CIERRES = ["🌼 🕯️ 🌼", "💀 🍬 💀", "🕯️ 🌺 🕯️"];
const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];

// Emoji de cada trabajo en Día de Muertos.
const EMOJIS_MUERTOS = {
  minar: "⛏️", crimen: "🦉", espiar: "🔮", explorar: "🌼", influencer: "📱", mazmorra: "🏺",
  migajear: "🙏", niñero: "👶", superalbanil: "🧱", trabajar: "🪦", uber: "🚕", vendedor: "🍞", youtuber: "🎥"
};
const EMOJIS_FALLO_MUERTOS = { crimen: "👻", espiar: "🪦", mazmorra: "☠️", niñero: "😭", uber: "🚨", youtuber: "⚠️", influencer: "📉" };

function nombreDe(trabajo) {
  const base = trabajo.names[0].slice(1);
  return base.charAt(0).toUpperCase() + base.slice(1);
}

async function allwMuertos({ sender, reply }) {
  const E = MUERTOS;
  const lineas = [];
  let balance = 0;
  let xpTotal = 0;
  let nivel = null;
  let realizados = 0;

  for (const trabajo of trabajosRegistrados.values()) {
    const r = ejecutarTrabajo(sender, trabajo);
    if (r.enEspera) continue;
    realizados++;
    const delta = r.exito ? r.monto : -r.monto;
    balance += delta;
    xpTotal += r.xp;
    if (r.subioNivel) nivel = r.nivel;
    const emoji = r.exito ? EMOJIS_MUERTOS[trabajo.clave] || trabajo.emoji : EMOJIS_FALLO_MUERTOS[trabajo.clave] || "⚠️";
    lineas.push(`${emoji} *${nombreDe(trabajo)}* ›› ${conSignoCalaveritas(delta)}`);
  }

  if (!realizados) return reply({ text: E.todosEnEspera });

  const texto = [
    azar(BANDAS),
    `⧼${E.emoji}⧽ \`\`\`##\`\`\` *${E.titulo}*`,
    "",
    `> ${E.relato(realizados)}`,
    "",
    ...lineas,
    "",
    E.balance(balance),
    E.experiencia(xpTotal),
    "",
    `> ${E.tip(getAccount(sender).wallet)}`,
    "",
    azar(CIERRES)
  ].join("\n");

  await reply({ text: texto });
  if (nivel) await reply({ text: E.nivel(nivel) });
}

export default {
  names: [".allw", ".todostrabajos"],
  desc: "Reclamar todos los trabajos disponibles (respeta cada espera)",
  category: "Trabajos",
  handler: async (ctx) => {
    if (esHalloween()) return allwMuertos(ctx);

    const { sender, reply } = ctx;
    const E = estilo(ESTILOS);
    const lineas = [];
    let balance = 0;
    let xpTotal = 0;
    let nivel = null;
    let realizados = 0;

    for (const trabajo of trabajosRegistrados.values()) {
      const r = ejecutarTrabajo(sender, trabajo);
      if (r.enEspera) continue;
      realizados++;
      const delta = r.exito ? r.monto : -r.monto;
      balance += delta;
      xpTotal += r.xp;
      if (r.subioNivel) nivel = r.nivel;
      const vista = vistaDe(trabajo);
      lineas.push(`${r.exito ? vista.emoji : vista.emojiFallo || "⚠️"} *${nombreDe(trabajo)}* ›› ${montoConSigno(delta)}`);
    }

    if (!realizados) {
      return reply({ text: E.todosEnEspera });
    }

    await reply({
      text: tarjeta({
        emoji: E.emoji,
        titulo: E.titulo,
        relato: E.relato(realizados),
        lineas: [...lineas, "", E.balance(balance), E.experiencia(xpTotal)],
        tip: E.tip(getAccount(sender).wallet)
      })
    });
    if (nivel) await reply({ text: avisoNivel(nivel) });
  }
};
