import { addToWallet, getAccount, checkCooldown } from "../../../motores/db.js";
import { tarjeta, monto, textoEspera } from "../../economia/formato.js";
import { textoDias, costoRecuperar, estadoRacha, registrarReclamo } from "../../economia/rachas.js";

const CLAVE = "daily";
const PREMIO = 20000;
const PREMIO_RACHA_MAXIMA = 2000000;
const ESPERA_MS = 24 * 60 * 60 * 1000;
const VENTANA_MS = 48 * 60 * 60 * 1000;

function tarjetaRachaPerdida(cantidad, costo) {
  return tarjeta({
    emoji: "🌻",
    titulo: "RACHA PERDIDA!",
    relato: `Pasaron más de 48 horas desde tu último reclamo diario. Tu racha de *${textoDias(cantidad)}* se encuentra en riesgo.`,
    lineas: [`💸 *COSTO DE RECUPERACIÓN::* ${monto(costo)}`],
    tip: [
      "Usa *.daily pagar* para conservar tu racha y reclamar.",
      "Usa *.daily reiniciar* para comenzar una nueva racha desde 1 día."
    ]
  });
}

export default {
  names: [".daily", ".diario"],
  usage: ".daily | .daily pagar | .daily reiniciar",
  desc: "Reclamar la recompensa diaria y mantener tu racha",
  category: "Economía",
  handler: async ({ sender, cleanText, reply }) => {
    const opcion = (cleanText.trim().split(/\s+/)[1] || "").toLowerCase();
    const cuenta = getAccount(sender);

    const restante = (cuenta.cooldowns[CLAVE] || 0) + ESPERA_MS - Date.now();
    if (restante > 0) return reply({ text: textoEspera(restante) });

    const { cantidad, perdida } = estadoRacha(sender, CLAVE, VENTANA_MS);
    let reiniciar = false;
    let pagado = 0;

    if (perdida) {
      const costo = costoRecuperar(cantidad);

      if (opcion === "pagar") {
        if (cuenta.wallet < costo) {
          return reply({
            text: `⚠️ Fondos insuficientes. Recuperar la racha cuesta *${monto(costo)}* y tienes *${monto(cuenta.wallet)}* en mano. Usa *.retirar* para sacar dinero del banco o *.daily reiniciar* para comenzar una nueva racha.`
          });
        }
        cuenta.wallet -= costo;
        pagado = costo;
      } else if (opcion === "reiniciar") {
        reiniciar = true;
      } else {
        return reply({ text: tarjetaRachaPerdida(cantidad, costo) });
      }
    }

    checkCooldown(sender, CLAVE, ESPERA_MS);
    addToWallet(sender, PREMIO);
    const { cantidad: racha, completoMaximo } = registrarReclamo(sender, CLAVE, reiniciar);
    if (completoMaximo) addToWallet(sender, PREMIO_RACHA_MAXIMA);

    const lineas = [`🪙 *GANADO::* +${monto(PREMIO)}`];
    if (completoMaximo) lineas.push(`🎁 *RACHA DE UN AÑO::* +${monto(PREMIO_RACHA_MAXIMA)}`);
    if (pagado) lineas.push(`💸 *RACHA RECUPERADA::* -${monto(pagado)}`);
    lineas.push(`⛁ *CARTERA::* ${monto(getAccount(sender).wallet)}`);

    await reply({
      text: tarjeta({
        emoji: "🌻",
        titulo: "DIARIO RECLAMADO!",
        relato: "Reclamaste tu recompensa diaria. Vuelve en *24 horas* para reclamar nuevamente tu recompensa.",
        lineas,
        tip: [`Llevas una racha de ${textoDias(racha)}`, "Usa *.dep* para guardar tu dinero."]
      })
    });
  }
};
