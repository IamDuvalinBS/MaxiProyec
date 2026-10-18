import { gachaListo, CAT, restanteCooldown } from "../../../motores/gacha-core.js";
import { ticketsDe } from "../../../motores/gacha-tickets.js";
import { COOLDOWN_TIRADA_MS } from "../../../motores/gacha-config.js";
import { jidObjetivo } from "../../economia/formato.js";
import { encabezado, mencion, tiempoLargo } from "../../economia/estilo.js";

export default {
  names: [".rwinfo", ".gachacd", ".cooldownsgacha"],
  desc: "Muestra el tiempo de espera de las tiradas de todos los gachas: .rwinfo [@usuario]",
  category: "Gacha",
  usage: ".rwinfo [@usuario]",
  handler: async ({ sender, msg, reply }) => {
    await gachaListo;
    const objetivo = jidObjetivo(msg) || sender;
    const lineas = [
      encabezado("⏳", "Cooldown del Gacha"),
      "",
      `> El tiempo que falta para volver a tirar en cada gacha (${COOLDOWN_TIRADA_MS / 60000} minutos entre tiradas). ${mencion(objetivo)}`,
      ""
    ];

    for (const clave of Object.keys(CAT)) {
      const cat = CAT[clave];
      const restante = restanteCooldown(`roll:${clave}:${objetivo}`);
      lineas.push(`${cat.emoji} ${cat.titulo} » *${cat.rollCmd}*`);
      lineas.push(restante > 0 ? `> *En cooldown, ${tiempoLargo(restante)}.*` : "> *Puedes usarlo*");
      const tickets = ticketsDe(objetivo, clave);
      if (tickets) lineas.push(`> 🎟️ ${tickets} ${tickets === 1 ? "ticket" : "tickets"}`);
    }

    lineas.push("", "> Mira tus misiones con *.misiones* y los destacados de la semana con *.banner*.");
    await reply({ text: lineas.join("\n"), mentions: [objetivo] });
  }
};
