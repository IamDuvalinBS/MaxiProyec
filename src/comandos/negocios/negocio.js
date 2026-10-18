import { getAccount } from "../../../motores/db.js";
import { monto } from "../../economia/formato-evento.js";
import { tarjetaMarcada } from "../../economia/estilo-evento.js";
import { estilo } from "../../economia/temas.js";
import { HORAS_CICLO, maximoDe, pagoSemanalDe, definicionPorNumero, comprarNegocio } from "../../economia/negocios.js";

const ESTILOS = {
  normal: {
    sinNumero: "🏪 Indica el número del negocio que deseas comprar. Ejemplo: *.negocio 1*. Usa *.negocios* para ver la lista.",
    poseido: (nombre) => `🏪 Ya posees *${nombre}*. Usa *.minegocios* para consultar su estado.`,
    sinFondos: (nombre, precio, falta) => `⚠️ Fondos insuficientes. *${nombre}* cuesta *${monto(precio)}* y te faltan *${monto(falta)}* en mano. Usa *.retirar* para sacar dinero del banco.`,
    titulo: "NEGOCIO ADQUIRIDO!",
    relato: (nombre, precio, max, horas) => `Adquiriste *${nombre}* por *${monto(precio)}*. Generará hasta *${monto(max)}* cada *${horas} horas*.`,
    cartera: (n) => `⛁ *CARTERA*:: ${monto(n)}`,
    tip: (pago) => ["Usa *.ngreclamar* para cobrar tus ganancias.", `El mantenimiento semanal es de *${monto(pago)}* y se paga con *.ngpagar*.`]
  },
  halloween: {
    sinNumero: "🏚️ Indica el número del negocio embrujado que deseas comprar. Ejemplo: *.negocio 1*. Usa *.negocios* para ver la lista. 🕸️",
    poseido: (nombre) => `🏚️ Ya posees *${nombre}*. Usa *.minegocios* para consultar su estado. 👻`,
    sinFondos: (nombre, precio, falta) => `⚠️ 💀 *${nombre}* cuesta *${monto(precio)}* y te faltan *${monto(falta)}* en el caldero. Usa *.retirar* para desenterrar calabazas de la cripta.`,
    titulo: "NEGOCIO EMBRUJADO ADQUIRIDO!",
    relato: (nombre, precio, max, horas) => `Hiciste un pacto y adquiriste *${nombre}* por *${monto(precio)}*. Generará hasta *${monto(max)}* cada *${horas} horas* de oscuridad. 🌙`,
    cartera: (n) => `🧙‍♀️ *CALDERO*:: ${monto(n)}`,
    tip: (pago) => ["Usa *.ngreclamar* para cobrar tus ganancias malditas. 🎃", `El conjuro de mantenimiento semanal cuesta *${monto(pago)}* y se paga con *.ngpagar*. 🔮`]
  }
};

export default {
  names: [".negocio", ".ngcomprar", ".comprarnegocio"],
  usage: ".negocio <número>",
  desc: "Comprar un negocio de la tienda",
  category: "Economía",
  handler: async ({ sender, cleanText, reply }) => {
    const E = estilo(ESTILOS);
    const argumento = cleanText.trim().split(/\s+/)[1];
    const def = definicionPorNumero(parseInt(argumento, 10));

    if (!def) {
      return reply({ text: E.sinNumero });
    }

    const resultado = comprarNegocio(sender, def);

    if (!resultado.exito && resultado.motivo === "poseido") {
      return reply({ text: E.poseido(def.nombre) });
    }

    if (!resultado.exito) {
      return reply({
        text: E.sinFondos(def.nombre, def.precio, resultado.faltante)
      });
    }

    await reply({
      text: tarjetaMarcada({
        emoji: def.emoji,
        titulo: E.titulo,
        relato: E.relato(def.nombre, def.precio, maximoDe(def), HORAS_CICLO),
        lineas: [E.cartera(getAccount(sender).wallet)],
        tip: E.tip(pagoSemanalDe(def))
      })
    });
  }
};
