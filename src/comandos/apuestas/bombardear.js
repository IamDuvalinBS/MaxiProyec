import { getAccount, addToWallet, saveAccount, checkCooldown } from "../../../motores/db.js";
import { addXp } from "../../../motores/profile.js";
import { tarjeta, monto, elegir, entre, textoEspera, avisoNivel } from "../../economia/formato-evento.js";
import { buscarPais, paisAlAzar, PAISES } from "../../economia/paises.js";

const ESPERA_MS = 30 * 60 * 1000;

// Cuanto más fuerte es la defensa del país (nivel 1 a 5), menos probable ganar, pero más se gana y más se pierde.
const CHANCE_VICTORIA = { 1: 0.7, 2: 0.6, 3: 0.5, 4: 0.42, 5: 0.35 };
const GANANCIA = (nivel) => [150 * nivel, 450 * nivel];
const PERDIDA = (nivel) => [80 * nivel, 220 * nivel];

const estrellas = (nivel) => "★".repeat(nivel) + "☆".repeat(5 - nivel);

const VICTORIAS = [
  (p) => `¡Felicidades! Bombardeaste ${p.bandera} *${p.nombre}* con éxito, te comiste ${p.plato || "un banquete típico del lugar 🍽️"} de la victoria.`,
  (p) => `Tu escuadrón de aviones de papel arrasó ${p.bandera} *${p.nombre}* y los habitantes te recibieron con ${p.plato || "un banquete 🍽️"}.`,
  (p) => `Misión cumplida en ${p.bandera} *${p.nombre}*: la defensa se quedó sin batería y tú celebraste con ${p.plato || "algo rico 🍽️"}.`,
  (p) => `${p.bandera} *${p.nombre}* no vio venir tu ataque sorpresa. Volviste a casa con el botín y ${p.plato || "un banquete 🍽️"}.`
];

const DERROTAS = [
  (p) => `La defensa de ${p.bandera} *${p.nombre}* derribó tu avión en pleno vuelo y tuviste que pagar la reparación.`,
  (p) => `Tu misión contra ${p.bandera} *${p.nombre}* falló: te confundieron con un dron de pizza y te cobraron la multa.`,
  (p) => `${p.bandera} *${p.nombre}* contraatacó con más fuerza de la esperada. Huiste, pero dejaste dinero en el camino.`,
  (p) => `Te quedaste sin combustible sobre ${p.bandera} *${p.nombre}* y la grúa aérea no fue nada barata.`
];

export default {
  names: [".bombardear", ".bomb"],
  usage: ".bombardear <país> (sin país, ataca uno al azar)",
  desc: `Bombardea un país (hay ${PAISES.length}): puedes ganar la batalla y dinero, o perder y pagar los daños (cada 30 minutos)`,
  category: "Apuestas",
  handler: async ({ sender, cleanText, reply }) => {
    const argumento = cleanText.split(/\s+/).slice(1).join(" ").trim();
    let pais;
    if (argumento) {
      pais = buscarPais(argumento);
      if (!pais) {
        return reply({ text: `⚠️ No encontré el país *${argumento}*.\n\n> Escríbelo en español o inglés, ej: *.bomb peru*, *.bomb japón*, *.bomb usa*. Sin país ataco uno al azar.` });
      }
    } else {
      pais = paisAlAzar();
    }

    const espera = checkCooldown(sender, "bombardear", ESPERA_MS);
    if (espera > 0) return reply({ text: textoEspera(espera) });

    const cuenta = getAccount(sender);
    const chance = CHANCE_VICTORIA[pais.nivel];
    const gana = Math.random() < chance;
    const infoPais = [`🌍 *País* ›› ${pais.bandera} ${pais.nombre}`, `🛡️ *Defensa* ›› ${estrellas(pais.nivel)} (${Math.round(chance * 100)}% de victoria)`];

    if (gana) {
      const [min, max] = GANANCIA(pais.nivel);
      const ganancia = entre(min, max);
      addToWallet(sender, ganancia);
      const xp = Math.max(1, Math.round(ganancia / 10));
      const { leveledUp, newLevel } = addXp(sender, xp);
      await reply({
        text: tarjeta({
          emoji: "💣",
          titulo: "BOMBARDEO EXITOSO",
          relato: elegir(VICTORIAS)(pais),
          lineas: [...infoPais, `🪙 *Ganancia* ›› +${monto(ganancia)}`, `✨ *Experiencia* ›› +${xp}`, `💰 *En mano* ›› ${monto(getAccount(sender).wallet)}`],
          tip: "Usa *.dep* para guardar tu dinero."
        })
      });
      if (leveledUp) await reply({ text: avisoNivel(newLevel) });
      return;
    }

    const [min, max] = PERDIDA(pais.nivel);
    const perdida = Math.min(cuenta.wallet, entre(min, max));
    cuenta.wallet -= perdida;
    saveAccount(sender);
    await reply({
      text: tarjeta({
        emoji: "💥",
        titulo: "BOMBARDEO FALLIDO",
        relato: elegir(DERROTAS)(pais),
        lineas: [...infoPais, `💸 *Pérdida* ›› -${monto(perdida)}`, `💰 *En mano* ›› ${monto(cuenta.wallet)}`],
        tip: "Los países con más estrellas pagan más, pero también son más difíciles."
      })
    });
  }
};
