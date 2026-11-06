import fs from "fs";
import path from "path";
import { isOwner } from "../../../motores/owner.js";
import { enviarNativeFlow, enviarCarrusel } from "../../../motores/botones-nativos.js";

const PIE = "Pᴏᴡᴇʀᴇᴅ Bʏ • ItsDuva";

// Busca una imagen cualquiera en ./assets para probar encabezados y tarjetas (si no hay, se prueba sin imagen).
function imagenDePrueba() {
  try {
    const carpeta = path.resolve("assets");
    const archivo = fs.readdirSync(carpeta).find((f) => /\.(jpe?g|png)$/i.test(f));
    return archivo ? fs.readFileSync(path.join(carpeta, archivo)) : undefined;
  } catch (e) {
    return undefined;
  }
}

const PRUEBAS = {
  quick: {
    descripcion: "Respuesta rápida (quick_reply)",
    enviar: (c) => enviarNativeFlow({
      ...c,
      texto: "🔘 *quick_reply*\n\nToca un botón: el bot debe responder cuál tocaste.",
      botones: [
        { name: "quick_reply", params: { display_text: "Uno", id: ".probarbotones ok-quick-1" } },
        { name: "quick_reply", params: { display_text: "Dos", id: ".probarbotones ok-quick-2" } }
      ]
    })
  },
  url: {
    descripcion: "Abrir enlace (cta_url)",
    enviar: (c) => enviarNativeFlow({
      ...c,
      texto: "🔗 *cta_url*\n\nDebe abrir el enlace en el navegador.",
      botones: [{ name: "cta_url", params: { display_text: "Abrir enlace", url: "https://www.whatsapp.com", merchant_url: "https://www.whatsapp.com" } }]
    })
  },
  copy: {
    descripcion: "Copiar texto (cta_copy)",
    enviar: (c) => enviarNativeFlow({
      ...c,
      texto: "📋 *cta_copy*\n\nDebe copiar el código al portapapeles.",
      botones: [{ name: "cta_copy", params: { display_text: "Copiar código", copy_code: "MAMBO-1234" } }]
    })
  },
  call: {
    descripcion: "Llamar (cta_call)",
    enviar: (c) => enviarNativeFlow({
      ...c,
      texto: "📞 *cta_call*\n\nDebe abrir el marcador con el número.",
      botones: [{ name: "cta_call", params: { display_text: "Llamar", phone_number: "+5215555555555" } }]
    })
  },
  ubicacion: {
    descripcion: "Pedir ubicación (send_location)",
    enviar: (c) => enviarNativeFlow({
      ...c,
      texto: "📍 *send_location*\n\nDebe abrir el selector para compartir ubicación.",
      botones: [{ name: "send_location", params: { display_text: "Enviar ubicación" } }]
    })
  },
  recordatorio: {
    descripcion: "Recordatorio (cta_reminder)",
    enviar: (c) => enviarNativeFlow({
      ...c,
      texto: "⏰ *cta_reminder*\n\nExperimental: normalmente solo funciona en cuentas Business.",
      botones: [{ name: "cta_reminder", params: { display_text: "Recordármelo", id: "recordatorio-prueba" } }]
    })
  },
  webview: {
    descripcion: "Página dentro de WhatsApp (open_webview)",
    enviar: (c) => enviarNativeFlow({
      ...c,
      texto: "🌐 *open_webview*\n\nExperimental: puede no verse en bots no oficiales.",
      botones: [{ name: "open_webview", params: { title: "Abrir página", link: { in_app_webview: true, url: "https://www.whatsapp.com" } } }]
    })
  },
  lista: {
    descripcion: "Lista desplegable (single_select)",
    enviar: (c) => enviarNativeFlow({
      ...c,
      texto: "📋 *single_select*\n\nToca *Lista* y elige una opción.",
      botones: [{
        name: "single_select",
        params: {
          title: "📋 Lista",
          sections: [
            { title: "Sección A", rows: [
              { header: "", title: "Opción 1", description: "Primera opción", id: ".probarbotones ok-lista-1" },
              { header: "", title: "Opción 2", description: "Segunda opción", id: ".probarbotones ok-lista-2" }
            ] },
            { title: "Sección B", rows: [
              { header: "", title: "Opción 3", description: "Tercera opción", id: ".probarbotones ok-lista-3" }
            ] }
          ]
        }
      }]
    })
  },
  mixto: {
    descripcion: "Varios tipos juntos + imagen",
    enviar: (c) => enviarNativeFlow({
      ...c,
      imagen: imagenDePrueba(),
      texto: "🧩 *Mixto*\n\nquick_reply + cta_url + cta_copy en el mismo mensaje.",
      botones: [
        { name: "quick_reply", params: { display_text: "Responder", id: ".probarbotones ok-mixto" } },
        { name: "cta_url", params: { display_text: "Abrir enlace", url: "https://www.whatsapp.com", merchant_url: "https://www.whatsapp.com" } },
        { name: "cta_copy", params: { display_text: "Copiar", copy_code: "MAMBO-1234" } }
      ]
    })
  },
  carrusel: {
    descripcion: "Carrusel de tarjetas",
    enviar: (c) => {
      const imagen = imagenDePrueba();
      return enviarCarrusel({
        sock: c.sock, from: c.from, msg: c.msg, footer: PIE,
        texto: "🎠 *Carrusel*\n\nDesliza para ver las tarjetas.",
        tarjetas: [1, 2, 3].map((n) => ({
          titulo: `Tarjeta ${n}`,
          texto: `Contenido de la tarjeta ${n}`,
          footer: PIE,
          imagen,
          botones: [{ name: "quick_reply", params: { display_text: `Elegir ${n}`, id: `.probarbotones ok-carrusel-${n}` } }]
        }))
      });
    }
  },
  encuesta: {
    descripcion: "Encuesta (poll)",
    enviar: async (c) => {
      try {
        await c.sock.sendMessage(c.from, {
          poll: { name: "📊 Encuesta de prueba", values: ["Opción A", "Opción B", "Opción C"], selectableCount: 1 }
        }, { quoted: c.msg });
        return true;
      } catch (e) {
        console.log(`[probarbotones] Falló la encuesta: ${e.message}`);
        return false;
      }
    }
  }
};

export default {
  names: [".probarbotones", ".testbotones"],
  usage: ".probarbotones [tipo|todos]",
  desc: "Prueba cada tipo de botón de WhatsApp para ver cuáles funcionan en tu bot",
  category: "Owner",

  handler: async ({ sock, from, sender, msg, cleanText }) => {
    if (!isOwner(sender)) return;

    const arg = String(cleanText || "").trim().split(/\s+/).slice(1).join(" ").trim().toLowerCase();

    // Respuesta a un botón de prueba (los ids "ok-..." llegan aquí como comando).
    if (arg.startsWith("ok-")) {
      return sock.sendMessage(from, { text: `✅ Botón recibido: *${arg.slice(3)}*` }, { quoted: msg });
    }

    if (!arg || arg === "lista-tipos") {
      const lineas = Object.entries(PRUEBAS).map(([k, p]) => `> .probarbotones ${k} — ${p.descripcion}`);
      return sock.sendMessage(from, {
        text: ["🧪 *PROBAR BOTONES*", "", ...lineas, "> .probarbotones todos — envía todas las pruebas"].join("\n")
      }, { quoted: msg });
    }

    const claves = arg === "todos" ? Object.keys(PRUEBAS) : [arg];
    if (!claves.every((k) => PRUEBAS[k])) {
      return sock.sendMessage(from, { text: "> ✘ Tipo no válido. Usa *.probarbotones* para ver la lista." }, { quoted: msg });
    }

    const resumen = [];
    const contexto = { sock, from, msg, footer: PIE };
    for (const k of claves) {
      let ok = false;
      try { ok = await PRUEBAS[k].enviar(contexto); } catch (e) { console.log(`[probarbotones] ${k}: ${e.message}`); }
      resumen.push(`${ok ? "✅" : "❌"} ${k} — ${PRUEBAS[k].descripcion}`);
      await new Promise((r) => setTimeout(r, 1200));
    }

    await sock.sendMessage(from, {
      text: ["🧪 *RESULTADO DEL ENVÍO*", "", ...resumen, "", "> ✅ solo significa que se envió; revisa en tu teléfono si se ve y funciona."].join("\n")
    }, { quoted: msg });
  }
};
