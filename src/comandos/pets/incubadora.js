import { tarjeta } from "../../economia/formato-evento.js";
import { formatTime } from "../../../motores/ui.js";
import { cargarMascotas, guardarMascotas } from "../../../motores/mascotas-core.js";
import { HUEVOS, ESPECIES, RAREZAS } from "../../../motores/mascotas-datos.js";
import { incubar, eclosionar, estadoIncubadora } from "../../../motores/mascotas-logica.js";

const sinTildes = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default [
  {
    names: [".petincubar", ".incubar"],
    usage: ".petincubar [huevo]",
    desc: "Coloca un huevo en tu incubadora (común, raro o épico)",
    category: "Pets",
    handler: async ({ sender, cleanText, reply }) => {
      const { cuenta, est, ahora } = await cargarMascotas(sender);
      const texto = sinTildes(cleanText.trim().split(/\s+/).slice(1).join(" "));
      const tipo = Object.keys(HUEVOS).find((k) => texto.includes(k)) || null;
      if (texto && !tipo) return reply({ text: "⚠️ No reconozco ese huevo. Los tipos son: común, raro, místico y legendario." });
      const r = incubar(est, tipo, ahora);
      if (!r.ok) return reply({ text: `⚠️ ${r.error}` });
      guardarMascotas(sender, cuenta, est);
      await reply({
        text: tarjeta({
          emoji: r.huevo.emoji,
          titulo: "HUEVO EN INCUBACIÓN",
          relato: `Colocaste un *${r.huevo.nombre.toLowerCase()}* en tu incubadora.`,
          lineas: [`⏳ *TIEMPO::* ${formatTime(r.duracion)}`],
          tip: "Cuando termine, usa *.petnacer* para recibir a tu mascota."
        })
      });
    }
  },
  {
    names: [".petincubadora", ".incubadora"],
    usage: ".petincubadora",
    desc: "Consulta el estado de tu incubadora y tus huevos",
    category: "Pets",
    handler: async ({ sender, reply }) => {
      const { est, ahora } = await cargarMascotas(sender);
      const inc = estadoIncubadora(est, ahora);
      if (!inc) return reply({ text: "Aún no tienes una incubadora. Puedes comprarla con *.petcomprar incubadora*." });
      const lineas = inc.huevos.map((h) => `${HUEVOS[h.tipo].emoji} *${HUEVOS[h.tipo].nombre}* — ${h.listo ? "¡listo para nacer!" : `faltan ${formatTime(h.restante)}`}`);
      const libres = inc.nivel.espacios - inc.huevos.length;
      if (libres > 0) lineas.push(`▫️ ${libres} espacio${libres > 1 ? "s" : ""} libre${libres > 1 ? "s" : ""}`);
      const guardados = Object.entries(HUEVOS).filter(([k]) => est.huevos[k] > 0).map(([k, h]) => `${h.emoji} ${est.huevos[k]}`);
      await reply({
        text: tarjeta({
          emoji: "🔥",
          titulo: inc.nivel.nombre.toUpperCase(),
          subtitulo: `Nivel ${inc.nivel.nivel} · tiempo x${inc.nivel.tiempo}`,
          lineas: [...lineas, ...(guardados.length ? ["", `🎒 *HUEVOS GUARDADOS::* ${guardados.join("  ")}`] : [])],
          tip: inc.huevos.some((h) => h.listo) ? "Usa *.petnacer* para recibir a tus mascotas." : undefined
        })
      });
    }
  },
  {
    names: [".petnacer", ".peteclosionar"],
    usage: ".petnacer",
    desc: "Recibe a las mascotas cuyos huevos terminaron de incubarse",
    category: "Pets",
    handler: async ({ sender, reply }) => {
      const { cuenta, est, ahora } = await cargarMascotas(sender);
      if (!est.incubadora) return reply({ text: "Aún no tienes una incubadora. Puedes comprarla con *.petcomprar incubadora*." });
      const { nuevas, pendientes } = eclosionar(est, ahora);
      if (!nuevas.length) {
        return reply({ text: pendientes ? "⏳ Tus huevos aún no están listos. Revisa el tiempo con *.petincubadora*." : "No hay huevos en la incubadora. Coloca uno con *.petincubar*." });
      }
      guardarMascotas(sender, cuenta, est);
      const lineas = nuevas.map((m) => `${ESPECIES[m.especie].emoji} *${m.nombre}* — ${ESPECIES[m.especie].nombre} · ${RAREZAS[m.rareza].emoji} ${RAREZAS[m.rareza].nombre}`);
      await reply({
        text: tarjeta({
          emoji: "🐣",
          titulo: nuevas.length > 1 ? "NACIERON TUS MASCOTAS" : "NACIÓ TU MASCOTA",
          relato: "El huevo se abrió y una nueva mascota llegó a tu familia.",
          lineas,
          tip: ["Mírala con *.mispets*.", "Cámbiale el nombre con *.petnombre <número> <nombre>*."]
        })
      });
    }
  }
];
