import { gachaListo, arroba, monto, CAT } from "../../../motores/gacha-core.js";
import { misionesDe, cobrarMisiones } from "../../../motores/gacha-misiones.js";
import { revisarInsignias } from "../../../motores/gacha-insignias.js";
import { msHastaMedianoche } from "../../../motores/gacha-config.js";
import { encabezado, tiempoLargo } from "../../../src/economia/estilo.js";
import { T } from "../../../motores/gacha-tema.js";

function lineasDeMisiones(lista) {
  const lineas = [];
  lista.forEach((m, i) => {
    const estado = m.cobrada ? "✅ Cobrada" : m.completa ? "🎁 Lista para cobrar" : "⏳ En curso";
    lineas.push(`${i + 1}. *${m.texto}*`);
    lineas.push(`> ${estado} ›› ${m.avance}/${m.meta}`);
    const premio = [`${monto(m.dinero)}`];
    if (m.fragmentos) premio.push(`${m.fragmentos} ${m.fragmentos === 1 ? "fragmento" : "fragmentos"}`);
    lineas.push(T(`> 🎁 Recompensa: ${premio.join(" + ")}`, `> 🍬 Botín: ${premio.join(" + ")}`));
  });
  return lineas;
}

export default {
  names: [".misiones", ".misionesgacha", ".quests"],
  desc: "Muestra tus misiones diarias del gacha y cobra las completadas: .misiones [cobrar]",
  category: "Gacha",
  usage: ".misiones [cobrar]",
  handler: async ({ sender, cleanText, reply }) => {
    await gachaListo;
    const cobrar = /^(cobrar|reclamar|claim)$/i.test(cleanText.split(/\s+/)[1] || "");

    if (cobrar) {
      const r = cobrarMisiones(sender);
      if (!r.cobradas.length) {
        return reply({ text: "❌ No tienes misiones completadas por cobrar. Revisa tu avance con *.misiones*." });
      }
      const partes = [
        encabezado("🎁", T("RECOMPENSA COBRADA", "BOTÍN COBRADO")),
        "",
        `> ${arroba(sender)} cobró ${r.cobradas.length} ${r.cobradas.length === 1 ? "misión" : "misiones"}.`,
        "",
        `💴 *Dinero* ›› +${monto(r.dinero)}`
      ];
      if (r.fragmentos) partes.push(`🧩 *Fragmentos de ascensión* ›› +${r.fragmentos}`);
      if (r.bono) {
        partes.push("", `🎟️ *Bono por completar las 3 misiones* ›› +1 ticket de ${CAT[r.ticket].plural}.`);
      } else if (r.pendientes) {
        partes.push("", `> Te ${r.pendientes === 1 ? "falta 1 misión" : `faltan ${r.pendientes} misiones`} para el bono del día.`);
      }
      const nuevas = revisarInsignias(sender);
      for (const i of nuevas) partes.push("", `🏅 *Nueva insignia* ›› ${i.emoji} ${i.nombre}. ${i.desc}`);
      return reply({ text: partes.join("\n"), mentions: [sender] });
    }

    const lista = misionesDe(sender);
    const porCobrar = lista.filter((m) => m.completa && !m.cobrada).length;
    return reply({
      text: [
        encabezado("📋", T("MISIONES DIARIAS", "MISIONES DE LA NOCHE")),
        "",
        T(`> Tres misiones nuevas cada día. Se renuevan en *${tiempoLargo(msHastaMedianoche())}*. Completar las tres da un ticket de bono.`, `> Tres misiones nuevas cada noche. Se renuevan en *${tiempoLargo(msHastaMedianoche())}*. Completar las tres da un ticket de bono.`),
        "",
        ...lineasDeMisiones(lista),
        "",
        porCobrar
          ? `> Tienes ${porCobrar} ${porCobrar === 1 ? "misión lista" : "misiones listas"}. Cóbrala con *.misiones cobrar*.`
          : "> El avance se cuenta solo al usar los comandos del gacha."
      ].join("\n")
    });
  }
};
