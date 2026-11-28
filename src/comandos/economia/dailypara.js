import daily from "./daily.js";
import { jidObjetivo } from "../../economia/formato.js";
import { isDueno } from "../../../motores/owner.js";

const OPCIONES = ["pagar", "reiniciar"];

export default {
  names: [".dailypara", ".dailyde", ".claimdaily"],
  usage: ".dailypara @usuario | .dailypara 5219611234567 | .dailypara @usuario pagar",
  desc: "Reclama el daily de otro usuario (solo dueños): el dinero y la racha son de esa persona",
  category: "Owner",
  handler: async ({ sender, from, msg, cleanText, reply }) => {
    if (!isDueno(sender)) return reply({ text: "🚫 Este comando solo puede ser utilizado por los dueños del bot." });

    const partes = cleanText.trim().split(/\s+/).slice(1);
    let objetivo = jidObjetivo(msg);
    if (!objetivo) {
      const numero = partes.map((p) => p.replace(/\D/g, "")).find((n) => n.length >= 8 && n.length <= 15);
      if (numero) objetivo = `${numero}@s.whatsapp.net`;
    }
    if (!objetivo) {
      return reply({ text: "❌ Indica a quién reclamar el daily: etiqueta al usuario, responde a su mensaje o escribe su número.\nEjemplo: .dailypara @usuario o .dailypara 5219611234567" });
    }

    const opcion = partes.map((p) => p.toLowerCase()).find((p) => OPCIONES.includes(p)) || "";
    const etiqueta = `@${objetivo.split("@")[0].split(":")[0]}`;

    await daily.handler({
      sender: objetivo,
      from,
      msg,
      cleanText: `.daily ${opcion}`.trim(),
      reply: (contenido) => reply({
        ...contenido,
        text: contenido?.text ? `👤 *DAILY DE ${etiqueta}* (reclamado por un dueño)\n\n${contenido.text}` : contenido?.text,
        mentions: [...(contenido?.mentions || []), objetivo]
      })
    });
  }
};
