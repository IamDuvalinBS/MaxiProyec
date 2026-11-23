import { tarjeta } from "../../economia/formato-evento.js";
import { getProfile } from "../../../motores/profile.js";
import { cargarMascotas } from "../../../motores/mascotas-core.js";
import { htmlMania } from "../../../motores/mania-html.js";
import { guardarPagina, borrarPagina, urlPagina } from "../../../motores/paginas-web.js";
import { cargarUrl } from "../../../motores/juegos-api.js";

const FIRMA = "ItsDuva";
const paginas = new Map(); // una página por jugador: al abrir de nuevo se borra la anterior

export default {
  names: [".mania", ".petmania"],
  usage: ".mania",
  desc: "Abre Pet Mania: isla, batallas y entrenamiento de tus mascotas",
  category: "Pets",
  handler: async ({ sock, from, sender, msg, reply }) => {
    const { est } = await cargarMascotas(sender);
    const vivas = est.mascotas.filter((m) => !m.perdida);
    if (!vivas.length) {
      return reply({
        text: tarjeta({
          emoji: "🥚",
          titulo: "PET MANIA",
          relato: "Necesitas al menos una mascota para entrar a Pet Mania.",
          lineas: ["1️⃣ *.petcomprar incubadora*", "2️⃣ *.petcomprar huevo*", "3️⃣ *.petincubar*", "4️⃣ *.petnacer* cuando termine"],
          tip: "Usa *.pettienda* para ver todos los precios."
        })
      });
    }
    try {
      const html = htmlMania({ nombre: msg?.pushName || getProfile(sender)?.name || "Entrenador", est, firma: FIRMA });
      await cargarUrl();
      const id = guardarPagina(html, { por: sender, juego: "mania" }, { marca: false });
      if (paginas.has(sender)) borrarPagina(paginas.get(sender));
      paginas.set(sender, id);
      const url = urlPagina(id);
      if (url && typeof sock.sendWebviewButton === "function") {
        // Texto + botón que abre la página dentro de WhatsApp (open_webview)
        await sock.sendWebviewButton(from, "🐾 *PET MANIA*\n\n🏝️ Isla · ⚔️ Batallas · ⬆️ Entrenar\nToca el botón para jugar con tus mascotas.", "🐾 Abrir Pet Mania", url, { footer: "Powered by " + FIRMA, quoted: msg });
        return;
      }
      // Sin URL pública (JUEGOS_URL) o sin botones: se manda la página incrustada
      if (typeof sock.sendHtml !== "function") return reply({ text: "❌ Este bot no puede abrir páginas dentro de WhatsApp." });
      await sock.sendHtml(from, html, [], msg, {});
    } catch (e) {
      console.log("[mania] ERROR: " + (e.stack || e.message));
      await reply({ text: "❌ No pude abrir Pet Mania en este momento." });
    }
  }
};
