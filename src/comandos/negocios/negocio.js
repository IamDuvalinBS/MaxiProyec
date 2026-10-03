import { getAccount } from "../../../motores/db.js";
import { monto } from "../../economia/formato.js";
import { tarjetaMarcada } from "../../economia/estilo.js";
import { HORAS_CICLO, maximoDe, pagoSemanalDe, definicionPorNumero, comprarNegocio } from "../../economia/negocios.js";

export default {
  names: [".negocio", ".ngcomprar", ".comprarnegocio"],
  usage: ".negocio <número>",
  desc: "Comprar un negocio de la tienda",
  category: "Economía",
  handler: async ({ sender, cleanText, reply }) => {
    const argumento = cleanText.trim().split(/\s+/)[1];
    const def = definicionPorNumero(parseInt(argumento, 10));

    if (!def) {
      return reply({ text: "🏪 Indica el número del negocio que deseas comprar. Ejemplo: *.negocio 1*. Usa *.negocios* para ver la lista." });
    }

    const resultado = comprarNegocio(sender, def);

    if (!resultado.exito && resultado.motivo === "poseido") {
      return reply({ text: `🏪 Ya posees *${def.nombre}*. Usa *.minegocios* para consultar su estado.` });
    }

    if (!resultado.exito) {
      return reply({
        text: `⚠️ Fondos insuficientes. *${def.nombre}* cuesta *${monto(def.precio)}* y te faltan *${monto(resultado.faltante)}* en mano. Usa *.retirar* para sacar dinero del banco.`
      });
    }

    await reply({
      text: tarjetaMarcada({
        emoji: def.emoji,
        titulo: "NEGOCIO ADQUIRIDO!",
        relato: `Adquiriste *${def.nombre}* por *${monto(def.precio)}*. Generará hasta *${monto(maximoDe(def))}* cada *${HORAS_CICLO} horas*.`,
        lineas: [`⛁ *CARTERA*:: ${monto(getAccount(sender).wallet)}`],
        tip: [
          "Usa *.ngreclamar* para cobrar tus ganancias.",
          `El mantenimiento semanal es de *${monto(pagoSemanalDe(def))}* y se paga con *.ngpagar*.`
        ]
      })
    });
  }
};
