import { getAllAccounts } from "../../../motores/db.js";
import { gachaListo, arroba, fmt, CAT } from "../../../motores/gacha-core.js";
import { topColeccionistas } from "../../../motores/gacha-db.js";
import { tarjeta } from "../../economia/formato-evento.js";
import { estilo, moneda } from "../../economia/temas.js";
import { rankingXp } from "./xptop.js";

const POR_TOP = 3;

const ESTILOS = {
  normal: {
    medallas: ["🥇", "🥈", "🥉"],
    emoji: "🌺",
    titulo: "TODOS LOS RANKINGS",
    relato: `Los *${POR_TOP} primeros puestos* de cada ranking del bot.`,
    patrimonio: { emoji: "🏆", titulo: "PATRIMONIO" },
    experiencia: { emoji: "✨", titulo: "EXPERIENCIA" },
    nivelXp: (nivel, total) => `Nivel ${nivel} · ${fmt(total)} XP`,
    vacio: "⚠️ Todavía no hay rankings disponibles.",
    tip: "Usa *.top*, *.xptop* o el top de cada categoría para ver los 10 primeros."
  },
  halloween: {
    medallas: ["👑", "🧛", "🧟"],
    emoji: "🎃",
    titulo: "TODOS LOS RANKINGS MACABROS",
    relato: `Los *${POR_TOP} primeros puestos* de cada ranking del reino embrujado. 🦇`,
    patrimonio: { emoji: "💀", titulo: "TESORO MALDITO" },
    experiencia: { emoji: "🔮", titulo: "PODER OSCURO" },
    nivelXp: (nivel, total) => `Nivel ${nivel} · ${fmt(total)} XP de poder oscuro`,
    vacio: "⚠️ 🪦 Todavía no hay rankings disponibles.",
    tip: "Usa *.top*, *.xptop* o el top de cada categoría para ver los 10 primeros. 🕸️"
  }
};

function bloque(emoji, titulo, filas, medallas) {
  const lineas = filas.map((f, i) => `${medallas[i] || `*${i + 1}*`} ${arroba(f.jid)} ›› ${f.texto}`);
  return [`⧼${emoji}⧽ *${titulo}*`, ...lineas].join("\n");
}

function topDinero() {
  return [...getAllAccounts().entries()]
    .map(([jid, cuenta]) => ({ jid, total: cuenta.wallet + cuenta.bank }))
    .filter((u) => u.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, POR_TOP)
    .map((u) => ({ jid: u.jid, texto: `${fmt(u.total)} ${moneda()}` }));
}

function topXp(E) {
  return rankingXp(POR_TOP).map((u) => ({ jid: u.jid, texto: E.nivelXp(u.nivel, u.total) }));
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
    const E = estilo(ESTILOS);

    const secciones = [
      { emoji: E.patrimonio.emoji, titulo: E.patrimonio.titulo, filas: topDinero() },
      { emoji: E.experiencia.emoji, titulo: E.experiencia.titulo, filas: topXp(E) },
      ...Object.keys(CAT).map((clave) => ({
        emoji: CAT[clave].emojiTop,
        titulo: CAT[clave].tituloTop,
        filas: topGacha(clave)
      }))
    ].filter((s) => s.filas.length);

    if (!secciones.length) return reply({ text: E.vacio });

    const jids = [...new Set(secciones.flatMap((s) => s.filas.map((f) => f.jid)))];
    await reply({
      text: tarjeta({
        emoji: E.emoji,
        titulo: E.titulo,
        relato: E.relato,
        lineas: secciones.map((s) => bloque(s.emoji, s.titulo, s.filas, E.medallas)).flatMap((b) => [b, ""]).slice(0, -1),
        tip: E.tip
      }),
      mentions: jids
    });
  }
};
