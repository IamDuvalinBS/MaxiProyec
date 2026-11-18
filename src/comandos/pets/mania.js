import { getProfile } from "../../../motores/profile.js";
import { cargarMascotas } from "../../../motores/mascotas-core.js";
import { htmlMania } from "../../../motores/mania-html.js";

const FIRMA = "Powered By ItsDuva";

export default [
  {
    names: [".mania", ".petmania", ".arenapets"],
    usage: ".mania",
    desc: "Pet Mania: isla con tus mascotas, batallas por oleadas y entrenamiento",
    category: "Pets",
    handler: async ({ sock, from, sender, msg, reply }) => {
      try {
        const { est } = await cargarMascotas(sender);
        if (!est.mascotas.length) {
          return reply({ text: "🥚 Aún no tienes mascotas. Compra un huevo con *.petcomprar huevo*, ponlo en la incubadora y vuelve cuando nazca." });
        }
        if (typeof sock.sendHtml !== "function") {
          return reply({ text: "❌ Este Baileys no tiene sendHtml." });
        }
        const nombre = msg?.pushName || getProfile(sender)?.name || "Entrenador";
        const html = htmlMania({ nombre, est, firma: FIRMA });
        await sock.sendHtml(from, html, [], msg, {});
      } catch (e) {
        console.log("[MANIA] ERROR: " + e.stack);
        await reply({ text: "❌ No se pudo abrir Pet Mania: " + e.message });
      }
    }
  }
];
