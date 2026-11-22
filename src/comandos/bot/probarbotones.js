import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isOwner } from "../../../motores/owner.js";
import { enviarNativeFlow } from "../../../motores/botones-nativos.js";

const PIE = "Pᴏᴡᴇʀᴇᴅ Bʏ • ItsDuva";
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const ARCHIVO_PROPIO = path.basename(fileURLToPath(import.meta.url));
const CARPETAS = ["src", "motores", "juegos"];

const URL_PRUEBA = "https://www.whatsapp.com";
const ID = (tipo) => `.probarbotones ok-${tipo}`;

// Cómo se arma un botón de ejemplo de cada tipo conocido.
const MUESTRAS = {
  quick_reply: () => ({ display_text: "Responder", id: ID("quick_reply") }),
  cta_url: () => ({ display_text: "Abrir enlace", url: URL_PRUEBA, merchant_url: URL_PRUEBA }),
  cta_copy: () => ({ display_text: "Copiar código", copy_code: "MAMBO-1234" }),
  cta_call: () => ({ display_text: "Llamar", phone_number: "+5215555555555" }),
  send_location: () => ({ display_text: "Enviar ubicación" }),
  cta_reminder: () => ({ display_text: "Recordármelo", id: "recordatorio-prueba" }),
  open_webview: () => ({ title: "Abrir página", link: { in_app_webview: true, url: URL_PRUEBA } }),
  single_select: () => ({
    title: "📋 Lista",
    sections: [{ title: "Prueba", rows: [
      { header: "", title: "Opción 1", description: "Primera opción", id: ID("single_select-1") },
      { header: "", title: "Opción 2", description: "Segunda opción", id: ID("single_select-2") }
    ] }]
  })
};

function archivosJs(carpeta, lista = []) {
  let entradas = [];
  try { entradas = fs.readdirSync(carpeta, { withFileTypes: true }); } catch { return lista; }
  for (const e of entradas) {
    const ruta = path.join(carpeta, e.name);
    if (e.isDirectory()) archivosJs(ruta, lista);
    else if (e.name.endsWith(".js") && e.name !== ARCHIVO_PROPIO) lista.push(ruta);
  }
  return lista;
}

// Busca en el código del bot qué tipos de botón nativo se usan de verdad ({ name: "cta_url", params | buttonParamsJson }).
// Así, cualquier botón nuevo que agregues al bot aparece solo aquí.
function botonesDelBot() {
  const usados = new Map();   // tipo -> cuántas veces aparece en el código
  const re = /name:\s*["']([a-z_]+)["']\s*,\s*(?:buttonParamsJson|params)\b/g;
  const archivos = [...CARPETAS.flatMap((c) => archivosJs(path.join(RAIZ, c))), path.join(RAIZ, "index.js")];
  for (const archivo of archivos) {
    let texto;
    try { texto = fs.readFileSync(archivo, "utf8"); } catch { continue; }
    for (const m of texto.matchAll(re)) usados.set(m[1], (usados.get(m[1]) || 0) + 1);
  }
  return [...usados.keys()].sort();
}

const armarBoton = (tipo) => ({
  name: tipo,
  params: MUESTRAS[tipo] ? MUESTRAS[tipo]() : { display_text: tipo, id: ID(tipo) }   // tipo nuevo: muestra genérica
});

async function enviarBotones(contexto, tipos, titulo) {
  return enviarNativeFlow({
    ...contexto,
    texto: `🧪 *${titulo}*\n\nToca cada botón: el bot responde cuál tocaste (enlaces y copiar se abren en tu teléfono).`,
    botones: tipos.map(armarBoton)
  });
}

export default {
  names: [".probarbotones", ".testbotones"],
  usage: ".probarbotones [tipo]",
  desc: "Prueba juntos los botones que usa el bot (detecta los nuevos solos)",
  category: "Owner",

  handler: async ({ sock, from, sender, msg, cleanText }) => {
    if (!isOwner(sender)) return;

    const arg = String(cleanText || "").trim().split(/\s+/).slice(1).join(" ").trim().toLowerCase();
    const responder = (text) => sock.sendMessage(from, { text }, { quoted: msg });

    // Respuesta a un botón de prueba (los ids "ok-..." llegan aquí como comando).
    if (arg.startsWith("ok-")) return responder(`✅ Botón recibido: *${arg.slice(3)}*`);

    const tipos = botonesDelBot();
    if (!tipos.length) return responder("🧪 No encontré botones nativos en el código del bot.");

    if (arg === "lista") {
      const lineas = tipos.map((t) => `> ${t}${MUESTRAS[t] ? "" : " — nuevo (muestra genérica)"}`);
      return responder(["🧪 *BOTONES DETECTADOS EN EL BOT*", "", ...lineas, "", "> .probarbotones — los manda todos juntos"].join("\n"));
    }

    const contexto = { sock, from, msg, footer: PIE };
    const nuevos = tipos.filter((t) => !MUESTRAS[t]);

    // Un tipo en particular
    if (arg) {
      if (!tipos.includes(arg)) return responder(`> ✘ Ese botón no se usa en el bot. Tipos: ${tipos.join(", ")}.`);
      const ok = await enviarBotones(contexto, [arg], arg);
      return responder(`${ok ? "✅" : "❌"} ${arg}`);
    }

    // Todos juntos en un solo mensaje; si WhatsApp no acepta la mezcla, se manda uno por uno.
    let ok = await enviarBotones(contexto, tipos, "PRUEBA DE BOTONES");
    const resumen = [];
    if (ok) {
      resumen.push(`✅ Enviados juntos: ${tipos.join(", ")}`);
    } else {
      resumen.push("⚠️ No se pudieron mandar juntos, se enviaron por separado:");
      for (const t of tipos) {
        let enviado = false;
        try { enviado = await enviarBotones(contexto, [t], t); } catch (e) { console.log(`[probarbotones] ${t}: ${e.message}`); }
        resumen.push(`${enviado ? "✅" : "❌"} ${t}`);
        await new Promise((r) => setTimeout(r, 1200));
      }
    }
    if (nuevos.length) resumen.push("", `🆕 Botones nuevos detectados (muestra genérica): ${nuevos.join(", ")}`);
    resumen.push("", "> ✅ solo significa que se envió; revisa en tu teléfono si se ve y funciona.");
    return responder(["🧪 *RESULTADO*", "", ...resumen].join("\n"));
  }
};
