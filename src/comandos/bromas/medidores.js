import { MEDIDORES, PAREJAS } from "./_lib/bromas-datos.js";
import { numero, personasDe, porcentaje, barra, tramo, enviarResultado } from "./_lib/bromas-core.js";

const comandoMedidor = (def) => ({
  names: def.names,
  usage: `${def.names[0]} @mencion`,
  desc: def.desc,
  category: "Bromas",
  handler: async ({ sock, from, sender, msg }) => {
    const objetivo = personasDe(msg)[0] || sender;
    const pct = porcentaje();
    const texto =
      `⧼${def.emoji}⧽ *${def.titulo}*\n\n` +
      `Persona analizada: @${numero(objetivo)}\n\n` +
      `*${def.adj}* → ${barra(pct)}\n\n` +
      `${tramo(pct, def.frases)}\n\n` +
      `> Usa *${def.names[0]} @usuario* para medir a otra persona.`;

    await enviarResultado(sock, from, msg, {
      clave: def.names[0],
      inicio: `*Midiendo el nivel de ${def.adj}...*`,
      mentions: [objetivo],
      texto,
      etiqueta: def.names[0]
    });
  }
});

const comandoPareja = (def) => ({
  names: def.names,
  usage: `${def.names[0]} @mencion @mencion`,
  desc: def.desc,
  category: "Bromas",
  handler: async ({ sock, from, sender, msg, reply }) => {
    const personas = personasDe(msg);
    if (personas.length === 1) personas.unshift(sender);
    const pareja = personas.slice(0, 2);

    if (pareja.length < 2 || numero(pareja[0]) === numero(pareja[1])) {
      await reply({ text: `⧼${def.emoji}⧽ *${def.titulo}*\n\nEtiqueta a dos personas (o a una, para medirte con ella).\n\n> Usa *${def.names[0]} @usuario @usuario*.` });
      return;
    }

    const pct = porcentaje();
    const texto =
      `⧼${def.emoji}⧽ *${def.titulo}*\n\n` +
      `@${numero(pareja[0])} ${def.union} @${numero(pareja[1])}\n\n` +
      `${barra(pct)}\n\n` +
      `${tramo(pct, def.frases)}\n\n` +
      `> Usa *${def.names[0]} @usuario @usuario* para calcular otra pareja.`;

    await enviarResultado(sock, from, msg, {
      clave: def.names[0],
      inicio: "*Calculando entre esas dos personas...*",
      mentions: pareja,
      texto,
      etiqueta: def.names[0]
    });
  }
});

export default [...MEDIDORES.map(comandoMedidor), ...PAREJAS.map(comandoPareja)];
