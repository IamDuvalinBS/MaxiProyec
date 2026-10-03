import { getAccount } from "../../../motores/db.js";
import { monto } from "../../economia/formato.js";
import { tarjetaMarcada } from "../../economia/estilo.js";
import { CATALOGO, HORAS_CICLO, maximoDe, pagoSemanalDe, negociosDe } from "../../economia/negocios.js";

export default {
  names: [".negocios", ".shopnegocios", ".tiendanegocios"],
  usage: ".negocios",
  desc: "Ver la tienda de negocios disponibles para comprar",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const poseidos = negociosDe(sender);
    const lineas = [];

    CATALOGO.forEach((def, indice) => {
      const marca = poseidos[def.clave] ? " ✅" : "";
      lineas.push(`${def.emoji} *${indice + 1}. ${def.nombre}* ›› *${monto(def.precio)}*${marca}`);
      lineas.push(`> Hasta *${monto(maximoDe(def))}* en *${HORAS_CICLO} horas*`);
      lineas.push(`> Mantenimiento semanal: *${monto(pagoSemanalDe(def))}*`);
      lineas.push("");
    });

    lineas.push(`⛁ *DINERO*:: ${monto(getAccount(sender).wallet)}`);
    lineas.push(`✿ *Negocios*:: ${Object.keys(poseidos).length} de ${CATALOGO.length}`);

    await reply({
      text: tarjetaMarcada({
        emoji: "🏪",
        titulo: "SHOP - NEGOCIOS",
        lineas,
        tip: ["Para comprar usa *.negocio <número>*", "Consulta tus negocios con *.minegocios*"]
      })
    });
  }
};
