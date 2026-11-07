import { tarjeta } from "../../economia/formato-evento.js";
import { getProfile } from "../../../motores/profile.js";
import { cargarMascotas, esDeNoche } from "../../../motores/mascotas-core.js";
import { htmlMascotas } from "../../../motores/mascotas-html.js";
import { ESPECIES, RAREZAS, HUEVOS, CIUDAD } from "../../../motores/mascotas-datos.js";
import { etapaDe, estadoActual } from "../../../motores/mascotas-logica.js";

const FIRMA = "Powered By ItsDuva";

function textoMascotas(est, clima) {
  const lineas = est.mascotas.map((m, i) => {
    const estado = estadoActual(m, clima.llueve);
    return `*${i + 1}.* ${ESPECIES[m.especie].emoji} *${m.nombre}* — ${etapaDe(m.crec).nombre} · ${estado.emoji} ${estado.texto}\n     🍖 ${Math.round(m.hambre)}  ⚡ ${Math.round(m.energia)}  🎾 ${Math.round(m.diversion)}`;
  });
  return tarjeta({ emoji: "🐾", titulo: "TUS MASCOTAS", lineas, tip: "Alimenta con *.petalimentar*, juega con *.petjugar* y descansa con *.petdormir*." });
}

export default [
  {
    names: [".mispets", ".mismascotas", ".mascotas", ".pets"],
    usage: ".mispets [número]",
    desc: "Muestra tus mascotas, su crecimiento, su casa, sus accesorios y tu incubadora",
    category: "Pets",
    handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
      const { est, clima, ahora } = await cargarMascotas(sender);
      const sinNada = !est.mascotas.length && !est.incubadora && !Object.values(est.huevos).some((n) => n > 0);
      if (sinNada) {
        return reply({
          text: tarjeta({
            emoji: "🥚",
            titulo: "SIN MASCOTAS",
            relato: "Aún no tienes mascotas ni incubadora. Todo se compra con tus ¥enes.",
            lineas: ["1️⃣ *.petcomprar incubadora*", "2️⃣ *.petcomprar huevo*", "3️⃣ *.petincubar*", "4️⃣ *.petnacer* cuando termine"],
            tip: "Usa *.pettienda* para ver todos los precios."
          })
        });
      }
      if (typeof sock.sendHtml !== "function" || !est.mascotas.length && !est.incubadora) {
        return reply({ text: est.mascotas.length ? textoMascotas(est, clima) : "Tienes huevos guardados. Colócalos en una incubadora con *.petincubar*." });
      }
      try {
        const numero = parseInt(cleanText.trim().split(/\s+/)[1], 10);
        const html = htmlMascotas({
          nombre: msg?.pushName || getProfile(sender)?.name || "Entrenador",
          est,
          ahora,
          clima,
          noche: esDeNoche(ahora),
          inicial: Number.isInteger(numero) ? numero - 1 : 0,
          firma: FIRMA
        });
        await sock.sendHtml(from, html, [], msg, {});
      } catch (e) {
        console.log("[mispets] ERROR: " + (e.stack || e.message));
        await reply({ text: est.mascotas.length ? textoMascotas(est, clima) : "❌ No pude mostrar tus mascotas en este momento." });
      }
    }
  },
  {
    names: [".petespecies", ".petrazas"],
    usage: ".petespecies",
    desc: "Muestra las especies de mascotas, sus rasgos y las rarezas de cada huevo",
    category: "Pets",
    handler: async ({ reply }) => {
      const especies = Object.values(ESPECIES).map((e) => `${e.emoji} *${e.nombre}* — ${e.rasgo}`);
      const huevos = Object.values(HUEVOS).map((h) => `${h.emoji} *${h.nombre}*: ${Object.keys(h.rarezas).map((r) => `${RAREZAS[r].emoji} ${RAREZAS[r].nombre}`).join(" / ")}`);
      await reply({
        text: tarjeta({
          emoji: "📖",
          titulo: "ESPECIES Y HUEVOS",
          lineas: [...especies, "", ...huevos],
          tip: "El dragón solo puede nacer con rareza Raro o superior."
        })
      });
    }
  },
  {
    names: [".petclima", ".petweather"],
    usage: ".petclima",
    desc: "Muestra el clima real que afecta a tus mascotas",
    category: "Pets",
    handler: async ({ sender, reply }) => {
      const { clima } = await cargarMascotas(sender);
      if (!clima.disponible) return reply({ text: `🌤️ No pude consultar el clima de *${CIUDAD.nombre}* en este momento. Se considerará que no llueve.` });
      await reply({
        text: tarjeta({
          emoji: clima.llueve ? "🌧️" : "☀️",
          titulo: `CLIMA EN ${CIUDAD.nombre.toUpperCase()}`,
          relato: clima.llueve ? "Está lloviendo. Las mascotas sin casa ni impermeable se están mojando." : "No está lloviendo. Tus mascotas pueden estar tranquilas.",
          lineas: clima.temperatura !== null ? [`🌡️ *TEMPERATURA::* ${Math.round(clima.temperatura)}°C`] : [],
          tip: "Una casa protege por completo de la lluvia; el impermeable amarillo protege en gran parte."
        })
      });
    }
  }
];
