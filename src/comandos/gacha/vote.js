import { gachaListo, fmt, arroba } from "../../../motores/gacha-core.js";
import { personajePorId, registrarVotoPersonaje, propietarios } from "../../../motores/gacha-db.js";
import { buscarWaifus, palabras } from "../../../motores/gacha-busqueda.js";
import { VOTO_ESPERA_MS, VOTO_MIN, VOTO_MAX } from "../../../motores/gacha-config.js";
import { getAccount, saveAccount } from "../../../motores/db.js";
import { encabezado, tiempoLargo } from "../../economia/estilo.js";

const CLAVE_ESPERA = "gachaVote";

const USO = [
  encabezado("🗳️", "VOTAR POR UNA WAIFU"),
  "",
  `> Cada voto sube entre *${fmt(VOTO_MIN)}* y *${fmt(VOTO_MAX)}* el valor de la waifu. Puedes votar una vez cada *${VOTO_ESPERA_MS / 3600000} horas*.`,
  "> Solo se puede votar por waifus, tengan dueño o no.",
  "",
  "Uso: *.vote <nombre o ID>*",
  "Ejemplo: .vote Yakumo Mitama"
];

const esperaRestante = (cuenta) => Math.max(0, (Number(cuenta.cooldowns?.[CLAVE_ESPERA]) || 0) + VOTO_ESPERA_MS - Date.now());

export default {
  names: [".vote", ".votar"],
  desc: "Vota por una waifu para subir su valor, una vez cada 5 horas: .vote <nombre o ID>",
  category: "Waifu",
  usage: ".vote <nombre o ID>",
  handler: async ({ sender, cleanText, reply }) => {
    await gachaListo;
    const argumento = cleanText.trim().split(/\s+/).slice(1).join(" ").trim();
    const cuenta = getAccount(sender);
    const espera = esperaRestante(cuenta);

    if (!argumento) {
      const estado = espera > 0 ? `⏳ Podrás votar de nuevo en *${tiempoLargo(espera)}*.` : "✅ Ya puedes votar.";
      return reply({ text: [...USO, "", estado].join("\n") });
    }

    if (espera > 0) {
      return reply({ text: `⏳ Ya votaste hace poco. Podrás volver a votar en *${tiempoLargo(espera)}*.` });
    }

    let waifu = null;
    const porId = argumento.match(/^#?(\d+)$/);
    if (porId) {
      const p = personajePorId(parseInt(porId[1], 10));
      if (!p) return reply({ text: `❌ No existe ningún personaje con el ID #${porId[1]}.` });
      if (p.categoria !== "waifu") return reply({ text: "❌ Solo se puede votar por waifus, ese personaje es de otro gacha." });
      waifu = p;
    } else {
      if (palabras(argumento).join("").length < 2) return reply({ text: USO.join("\n") });
      const encontrados = buscarWaifus(argumento, 1);
      if (!encontrados.length) return reply({ text: `🔎 No encontré ninguna waifu parecida a *${argumento}*.` });
      waifu = encontrados[0].p;
    }

    cuenta.cooldowns[CLAVE_ESPERA] = Date.now();
    const incremento = VOTO_MIN + Math.floor(Math.random() * (VOTO_MAX - VOTO_MIN + 1));
    const voto = registrarVotoPersonaje(waifu.id, incremento);
    if (!voto) {
      delete cuenta.cooldowns[CLAVE_ESPERA];
      return reply({ text: "❌ No se pudo registrar el voto. Inténtalo de nuevo." });
    }
    await saveAccount(sender);

    const dueno = propietarios(waifu.id)[0];
    const lineas = [
      encabezado("🗳️", "VOTO REGISTRADO"),
      "",
      `> ${arroba(sender)} votó por *${waifu.nombre}* (${waifu.serie || "Desconocida"}).`,
      "",
      `✦ *Valor* ›› ${fmt(voto.antes)} → *${fmt(voto.despues)}* (+${fmt(incremento)})`,
      `🗳️ *Votos totales* ›› ${fmt(voto.votos)}`
    ];
    if (dueno) lineas.push(`👤 *Dueño* ›› ${arroba(dueno)}`);
    lineas.push("", `> Podrás volver a votar en *${tiempoLargo(VOTO_ESPERA_MS)}*.`);

    return reply({ text: lineas.join("\n"), mentions: dueno ? [sender, dueno] : [sender] });
  }
};
