import { getAllAccounts, CURRENCY } from "../../../motores/db.js";
import { gachaListo, arroba, fmt, CAT } from "../../../motores/gacha-core.js";
import { topColeccionistas } from "../../../motores/gacha-db.js";
import { tarjeta } from "../../economia/formato.js";
import { rankingXp } from "./xptop.js";

const MEDALLAS = ["🥇", "🥈", "🥉"];
const POR_TOP = 3;

function bloque(emoji, titulo, filas) {
  const lineas = filas.map((f, i) => `${MEDALLAS[i] || `*${i + 1}*`} ${arroba(f.jid)} ›› ${f.texto}`);
  return [`⧼${emoji}⧽ *${titulo}*`, ...lineas].join("\n");
}

function topDinero() {
  return [...getAllAccounts().entries()]
    .map(([jid, cuenta]) => ({ jid, total: cuenta.wallet + cuenta.bank }))
    .filter((u) => u.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, POR_TOP)
    .map((u) => ({ jid: u.jid, texto: `${fmt(u.total)} ${CURRENCY}` }));
}

function topXp() {
  return rankingXp(POR_TOP).map((u) => ({ jid: u.jid, texto: `Nivel ${u.nivel} · ${fmt(u.total)} XP` }));
}

function topGacha(categoria) {
  const cat = CAT[categoria];
  return topColeccionistas(categoria, POR_TOP).map((u) => ({
    jid: u.usuario,
    texto: `${fmt(u.cantidad)} ${u.cantidad === 1 ? cat.unidad : cat.unidades}`
  }));
}

export default {
  names: [".alltop", ".tops"],
  desc: "Ver los primeros puestos de todos los rankings en un solo mensaje",
  category: "Economía",
  handler: async ({ reply }) => {
    await gachaListo;

    const secciones = [
      { emoji: "🏆", titulo: "PATRIMONIO", filas: topDinero() },
      { emoji: "✨", titulo: "EXPERIENCIA", filas: topXp() },
      ...Object.keys(CAT).map((clave) => ({
        emoji: CAT[clave].emojiTop,
        titulo: CAT[clave].tituloTop,
        filas: topGacha(clave)
      }))
    ].filter((s) => s.filas.length);

    if (!secciones.length) return reply({ text: "⚠️ Todavía no hay rankings disponibles." });

    const jids = [...new Set(secciones.flatMap((s) => s.filas.map((f) => f.jid)))];
    await reply({
      text: tarjeta({
        emoji: "🌺",
        titulo: "TODOS LOS RANKINGS",
        relato: `Los *${POR_TOP} primeros puestos* de cada ranking del bot.`,
        lineas: secciones.map((s) => bloque(s.emoji, s.titulo, s.filas)).flatMap((b) => [b, ""]).slice(0, -1),
        tip: "Usa *.top*, *.xptop* o el top de cada categoría para ver los 10 primeros."
      }),
      mentions: jids
    });
  }
};
