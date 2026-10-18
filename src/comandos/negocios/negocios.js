import { getAccount } from "../../../motores/db.js";
import { monto } from "../../economia/formato-evento.js";
import { tarjetaMarcada } from "../../economia/estilo-evento.js";
import { estilo } from "../../economia/temas.js";
import { CATALOGO, HORAS_CICLO, maximoDe, pagoSemanalDe, negociosDe } from "../../economia/negocios.js";

const ESTILOS = {
  normal: {
    emoji: "🏪",
    titulo: "SHOP - NEGOCIOS",
    hasta: (max, horas) => `> Hasta *${max}* en *${horas} horas*`,
    mantenimiento: (pago) => `> Mantenimiento semanal: *${pago}*`,
    dinero: (n) => `⛁ *DINERO*:: ${monto(n)}`,
    negocios: (a, b) => `✿ *Negocios*:: ${a} de ${b}`,
    tip: ["Para comprar usa *.negocio <número>*", "Consulta tus negocios con *.minegocios*"]
  },
  halloween: {
    emoji: "🏚️",
    titulo: "TIENDA DE NEGOCIOS EMBRUJADOS",
    hasta: (max, horas) => `> Hasta *${max}* en *${horas} horas* de oscuridad 🌙`,
    mantenimiento: (pago) => `> Conjuro semanal de mantenimiento: *${pago}* 🔮`,
    dinero: (n) => `🧙‍♀️ *CALDERO*:: ${monto(n)}`,
    negocios: (a, b) => `🎃 *Negocios malditos*:: ${a} de ${b}`,
    tip: ["Para comprar usa *.negocio <número>* 🕯️", "Consulta tus negocios con *.minegocios* 🦇"]
  }
};

export default {
  names: [".negocios", ".shopnegocios", ".tiendanegocios"],
  usage: ".negocios",
  desc: "Ver la tienda de negocios disponibles para comprar",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const E = estilo(ESTILOS);
    const poseidos = negociosDe(sender);
    const lineas = [];

    CATALOGO.forEach((def, indice) => {
      const marca = poseidos[def.clave] ? " ✅" : "";
      lineas.push(`${def.emoji} *${indice + 1}. ${def.nombre}* ›› *${monto(def.precio)}*${marca}`);
      lineas.push(E.hasta(monto(maximoDe(def)), HORAS_CICLO));
      lineas.push(E.mantenimiento(monto(pagoSemanalDe(def))));
      lineas.push("");
    });

    lineas.push(E.dinero(getAccount(sender).wallet));
    lineas.push(E.negocios(Object.keys(poseidos).length, CATALOGO.length));

    await reply({
      text: tarjetaMarcada({
        emoji: E.emoji,
        titulo: E.titulo,
        lineas,
        tip: E.tip
      })
    });
  }
};
