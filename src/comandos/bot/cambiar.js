import { ownerCommand } from "../../../motores/owner.js";
import { tarjeta } from "../../economia/formato-evento.js";
import { EVENTOS, buscarEvento, eventoActivo, cambiarEvento } from "../../economia/temas.js";

// Presentación al activar cada evento (lo único que cambia es el estilo visual:
// saldos, cooldowns, rachas y demás datos reales siguen siendo los mismos).
const ANUNCIOS = {
  normal: {
    emoji: "🌸",
    titulo: "ESTILO NORMAL RESTAURADO!",
    relato: "La economía y el gacha volvieron a su estilo normal. Todos los textos y diseños son los de siempre.",
    lineas: [
      "💾 *DATOS::* intactos (mismos saldos y guardados)",
      "⏳ *ESPERAS::* intactas (mismos cooldowns reales)"
    ],
    tip: "Usa *.cambiar halloween* para activar el evento de Halloween otra vez."
  },
  halloween: {
    emoji: "🎃",
    titulo: "HALLOWEEN ACTIVADO!",
    relato: "La noche embrujada ha comenzado. La economía, los trabajos, las apuestas, los negocios y el gacha ahora tienen estilo de Halloween.",
    lineas: [
      "💾 *DATOS::* intactos (mismos saldos y guardados) 🧙‍♀️",
      "⏳ *ESPERAS::* intactas (mismos cooldowns reales) 🕯️",
      "🪙 *MONEDA::* se muestra como calabazas 🎃",
      "🕸️ *GACHA::* .misbrawlers, .mispokemon, .perfilgacha e .insignias con diseño de Halloween",
      "🧟 *INSIGNIAS::* las insignias de temporada (telarañas, brujas, zombis y más) se entregan con .insigniaowner"
    ],
    tip: "Usa *.normalizar* para volver todo al estilo normal. 👻"
  }
};

function listaDeEventos() {
  const activo = eventoActivo();
  return Object.values(EVENTOS).map((e) => `${e.emoji} *${e.nombre}*${e.clave === activo ? " ✅ (activo)" : ""}`);
}

export async function activarEvento(reply, clave) {
  if (eventoActivo() === clave) {
    return reply({
      text: tarjeta({
        emoji: EVENTOS[clave].emoji,
        titulo: "EVENTO YA ACTIVO",
        relato: `El estilo *${EVENTOS[clave].nombre}* ya se encuentra activado.`,
        lineas: listaDeEventos()
      })
    });
  }

  const guardado = await cambiarEvento(clave);
  if (!guardado) return reply({ text: "⚠️ No se pudo cambiar el evento." });

  // El anuncio ya sale con el estilo del evento recién activado.
  const a = ANUNCIOS[clave];
  await reply({ text: tarjeta({ emoji: a.emoji, titulo: a.titulo, relato: a.relato, lineas: a.lineas, tip: a.tip }) });
}

export default {
  names: [".cambiar", ".evento"],
  usage: ".cambiar <evento>",
  desc: "Cambiar el estilo de la economía y el gacha a un evento (ej: .cambiar halloween). Usa .normalizar para volver a la normalidad (solo owner)",
  category: "Owner",
  handler: ownerCommand(async ({ cleanText, reply }) => {
    const argumento = cleanText.trim().split(/\s+/).slice(1).join(" ");

    if (!argumento) {
      return reply({
        text: tarjeta({
          emoji: "🎭",
          titulo: "EVENTOS DISPONIBLES",
          relato: "Elige el estilo que quieres para toda la economía.",
          lineas: listaDeEventos(),
          tip: ["Uso: *.cambiar halloween*", "Para volver a la normalidad: *.normalizar*"]
        })
      });
    }

    const evento = buscarEvento(argumento);
    if (!evento) {
      return reply({
        text: tarjeta({
          emoji: "⚠️",
          titulo: "EVENTO NO ENCONTRADO",
          relato: `No existe el evento *${argumento}*.`,
          lineas: listaDeEventos(),
          tip: "Ejemplo: *.cambiar halloween*"
        })
      });
    }

    await activarEvento(reply, evento.clave);
  })
};
