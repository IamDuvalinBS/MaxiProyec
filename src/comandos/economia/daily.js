import { addToWallet, getAccount, checkCooldown } from "../../../motores/db.js";
import { tarjeta, monto, textoEspera } from "../../economia/formato-evento.js";
import { textoDias, costoRecuperar, estadoRacha, registrarReclamo } from "../../economia/rachas.js";
import { estilo } from "../../economia/temas.js";
import { extraDaily } from "../../../motores/gacha-muertos.js";

const CLAVE = "daily";
const PREMIO = 20000;
const PREMIO_RACHA_MAXIMA = 2000000;
const ESPERA_MS = 24 * 60 * 60 * 1000;
const VENTANA_MS = 48 * 60 * 60 * 1000;

// Cada evento solo cambia textos y emojis. La lógica es la misma.
const ESTILOS = {
  normal: {
    emoji: "🌻",
    tituloPerdida: "RACHA PERDIDA!",
    relatoPerdida: (cantidad) => `Pasaron más de 48 horas desde tu último reclamo diario. Tu racha de *${textoDias(cantidad)}* se encuentra en riesgo.`,
    lineaCosto: (costo) => `💸 *COSTO DE RECUPERACIÓN::* ${monto(costo)}`,
    tipPerdida: [
      "Usa *.daily pagar* para conservar tu racha y reclamar.",
      "Usa *.daily reiniciar* para comenzar una nueva racha desde 1 día."
    ],
    sinFondos: (costo, enMano) => `⚠️ Fondos insuficientes. Recuperar la racha cuesta *${monto(costo)}* y tienes *${monto(enMano)}* en mano. Usa *.retirar* para sacar dinero del banco o *.daily reiniciar* para comenzar una nueva racha.`,
    lineaGanado: (n) => `🪙 *GANADO::* +${monto(n)}`,
    lineaAnual: (n) => `🎁 *RACHA DE UN AÑO::* +${monto(n)}`,
    lineaRecuperada: (n) => `💸 *RACHA RECUPERADA::* -${monto(n)}`,
    lineaCartera: (n) => `⛁ *CARTERA::* ${monto(n)}`,
    titulo: "DIARIO RECLAMADO!",
    relato: "Reclamaste tu recompensa diaria. Vuelve en *24 horas* para reclamar nuevamente tu recompensa.",
    tip: (racha) => [`Llevas una racha de ${textoDias(racha)}`, "Usa *.dep* para guardar tu dinero."]
  },
  halloween: {
    emoji: "🏵️",
tituloPerdida: "¡OFRENDA OLVIDADA!",
relatoPerdida: (cantidad) => `Han pasado más de 48 horas desde tu última ofrenda. Tu racha de *${textoDias(cantidad)}* está a punto de desaparecer entre las almas del Mictlán. 💀`,
lineaCosto: (costo) => `🕯️ *PRECIO DE LA OFRENDA::* ${monto(costo)}`,
tipPerdida: [
  "Usa *.daily pagar* para ofrecer unas monedas y salvar tu racha antes de que la Catrina se la lleve. 💀",
  "Usa *.daily reiniciar* para comenzar una nueva tradición desde el primer día. 🏵️"
],
sinFondos: (costo, enMano) => `⚠️ 💀 Los espíritus piden *${monto(costo)}* para salvar tu racha, pero solo tienes *${monto(enMano)}* en tu ofrenda. Usa *.retirar* para sacar monedas de tu altar o *.daily reiniciar* para comenzar de nuevo. 🕯️`,
lineaGanado: (n) => `🏵️ *RECOMPENSA DE LA OFRENDA::* +${monto(n)}`,
lineaAnual: (n) => `💀 *UN AÑO DE TRADICIÓN::* +${monto(n)}`,
lineaRecuperada: (n) => `⚰️ *RESCATE DE LA RACHA::* -${monto(n)}`,
lineaCartera: (n) => `🕯️ *MONEDAS EN EL ALTAR::* ${monto(n)}`,
titulo: "¡OFRENDA DIARIA!",
relato: "Llegaste al altar y encontraste una ofrenda llena de monedas y dulces que los difuntos dejaron para ti. Recoge tu recompensa y vuelve en *24 horas* para mantener viva la tradición. 🏵️🍬",
tip: (racha) => [`Llevas una racha de ${textoDias(racha)}; ni la Catrina ha conseguido detenerte. 💀`, "Usa *.dep* para guardar tus monedas en el altar y mantenerlas a salvo. 🕯️"]
  }
};

export default {
  names: [".daily", ".diario"],
  usage: ".daily | .daily pagar | .daily reiniciar",
  desc: "Reclamar la recompensa diaria y mantener tu racha",
  category: "Economía",
  handler: async ({ sender, from, cleanText, reply }) => {
    const E = estilo(ESTILOS);
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
          return reply({ text: E.sinFondos(costo, cuenta.wallet) });
        }
        cuenta.wallet -= costo;
        pagado = costo;
      } else if (opcion === "reiniciar") {
        reiniciar = true;
      } else {
        return reply({
          text: tarjeta({
            emoji: E.emoji,
            titulo: E.tituloPerdida,
            relato: E.relatoPerdida(cantidad),
            lineas: [E.lineaCosto(costo)],
            tip: E.tipPerdida
          })
        });
      }
    }

    checkCooldown(sender, CLAVE, ESPERA_MS);
    const extra = extraDaily(sender, PREMIO);
    addToWallet(sender, PREMIO + extra);
    const { cantidad: racha, completoMaximo } = registrarReclamo(sender, CLAVE, reiniciar, from);
    if (completoMaximo) addToWallet(sender, PREMIO_RACHA_MAXIMA);

    const lineas = [E.lineaGanado(PREMIO)];
    if (extra) lineas.push(`🌼 *BONO DE OFRENDA::* +${monto(extra)}`);
    if (completoMaximo) lineas.push(E.lineaAnual(PREMIO_RACHA_MAXIMA));
    if (pagado) lineas.push(E.lineaRecuperada(pagado));
    lineas.push(E.lineaCartera(getAccount(sender).wallet));

    await reply({
      text: tarjeta({
        emoji: E.emoji,
        titulo: E.titulo,
        relato: E.relato,
        lineas,
        tip: E.tip(racha)
      })
    });
  }
};
