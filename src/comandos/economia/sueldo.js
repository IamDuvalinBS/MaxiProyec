import { getAccount } from "../../../motores/db.js";
import { tarjeta, monto, fmt } from "../../economia/formato-evento.js";
import {
  resumenCarrera, cobrarSueldo, bonoRacha, descuentoFaltas,
  DIAS_POR_SEMANA, TOPE_TRABAJOS_DIA, BONO_RACHA_MAX, DESCUENTO_POR_FALTA, DESCUENTO_MAX
} from "../../economia/carrera.js";

const dias = (n) => `${n} ${n === 1 ? "día" : "días"}`;

function textoHoras(h) {
  if (h === null) return "Aún no has trabajado";
  if (h < 1) return "Menos de 1 hora";
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${dias(d)} y ${h % 24} h`;
}

function vistaEstado(r) {
  if (r.sinDatos) {
    return tarjeta({
      emoji: "💼",
      titulo: "TU SUELDO",
      relato: "Aquí cobras por ser constante. Cada trabajo que haces suma sueldo, y se cobra cada 7 días.",
      lineas: [
        "📌 *Cómo funciona*",
        `> 🔥 Trabaja días seguidos: la racha sube tu sueldo (+${BONO_RACHA_MAX}% máx.)`,
        `> 💪 Cada trabajo suma, hasta ${TOPE_TRABAJOS_DIA} por día`,
        `> 🚫 Cada día sin trabajar es una falta (-${DESCUENTO_POR_FALTA}% y pierdes la racha)`,
        "> 😴 Tienes 1 día de descanso gratis por semana"
      ],
      tip: "Haz tu primer trabajo con *.trabajar* para empezar tu carrera."
    });
  }

  const lineas = [
    `${r.puesto.emoji} *Puesto* ›› ${r.puesto.nombre} · ${dias(r.jornadas)} trabajados${r.siguiente ? `\n> Próximo: ${r.siguiente.nombre} a los ${r.siguiente.desde} días` : ""}`,
    `📅 *Semana* ›› día ${Math.min(r.diaDeSemana, DIAS_POR_SEMANA)} de ${DIAS_POR_SEMANA} · ${r.puedeCobrar ? "ya puedes cobrar" : `cobras en ${dias(r.diasParaCobrar)}`}`,
    `🔥 *Racha* ›› ${dias(r.racha)} (+${bonoRacha(r.racha)}% de sueldo) · récord ${r.mejorRacha}`,
    `💪 *Esfuerzo de hoy* ›› ${r.trabajosHoy}/${TOPE_TRABAJOS_DIA} trabajos pagados`,
    `🚫 *Faltas* ›› ${r.faltas}${r.faltas ? ` (-${descuentoFaltas(r.faltas)}% al cobrar)` : ""}`,
    `⏱️ *Sin trabajar* ›› ${textoHoras(r.horasSinTrabajar)}`,
    "",
    `💰 *Sueldo acumulado* ›› ${monto(r.acumulado)}`
  ];

  const tip = [];
  if (r.trabajosHoy === 0) {
    tip.push(r.descansoDisponible
      ? "😴 Hoy aún no trabajas. Tu descanso gratis de la semana sigue libre."
      : `⚠️ Hoy aún no trabajas. Si pasa el día así, será una falta (-${DESCUENTO_POR_FALTA}% y pierdes la racha).`);
  }
  tip.push("Suma sueldo con cualquier trabajo: *.trabajar*, *.minar*, *.allw*...");

  return tarjeta({
    emoji: "💼",
    titulo: "TU SUELDO",
    relato: "Trabajas, acumulas sueldo y lo cobras cada 7 días. Constancia = más dinero.",
    lineas,
    tip
  });
}

function vistaCobro(sender, c) {
  if (c.bruto <= 0) {
    return tarjeta({
      emoji: "💼",
      titulo: "SEMANA SIN SUELDO",
      relato: "Terminó la semana y no trabajaste, así que no hubo sueldo que cobrar.",
      lineas: [],
      tip: "Empieza una nueva semana con cualquier trabajo, por ejemplo *.trabajar*."
    });
  }
  const lineas = [`📄 *Sueldo bruto* ›› ${monto(c.bruto)}`];
  if (c.faltas) lineas.push(`🚫 *Faltas (${c.faltas})* ›› -${c.pct}% = -${monto(c.descuento)}`);
  else lineas.push("✅ *Faltas* ›› ninguna, ¡sin descuentos!");
  lineas.push(`💵 *Cobraste* ›› +${monto(c.neto)}`, `⛁ *Cartera* ›› ${monto(getAccount(sender).wallet)}`);

  return tarjeta({
    emoji: "💼",
    titulo: "SUELDO COBRADO",
    relato: c.faltas
      ? `Cobraste tu semana, pero las faltas te costaron ${c.pct}%${c.pct >= DESCUENTO_MAX ? " (descuento máximo)" : ""}.`
      : "Semana perfecta: cobraste todo tu sueldo. Ya empezó una nueva semana laboral.",
    lineas,
    tip: "Guarda tu dinero con *.dep* antes de arriesgarlo en apuestas."
  });
}

export default {
  names: [".sueldo", ".salario", ".nomina"],
  usage: ".sueldo",
  desc: "Tu sueldo semanal: racha, faltas, esfuerzo y cobro (cada 7 días)",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const r = resumenCarrera(sender);
    if (r.puedeCobrar) {
      const c = cobrarSueldo(sender);
      if (c.ok) return reply({ text: vistaCobro(sender, c) });
    }
    return reply({ text: vistaEstado(r) });
  }
};
