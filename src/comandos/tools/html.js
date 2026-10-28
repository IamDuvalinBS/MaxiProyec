import { config } from "../../../motores/db.js";
import { isOwner } from "../../../motores/owner.js";
import { enviarConBoton } from "../../../motores/botones.js";
import { tarjetaUso, tarjetaAviso, campo } from "../../descargas/tarjetas.js";
import { encabezado } from "../../economia/estilo.js";
import { generarTexto, proveedorIA } from "../../../motores/ia-texto.js";
import { textoCitado, normalizar, limitarEspera } from "../../../motores/herramientas-ui.js";
import {
  extraerHtml, htmlCompleto, guardarPagina, leerOriginal, leerPagina, borrarPagina, idDeTexto, urlPagina, vigenciaDias, MAX_BYTES
} from "../../../motores/paginas-web.js";

const ESPERA_MS = 40000;
const MAX_ACTIVOS = 2;
const MAX_PEDIDO = 900;
const esperas = new Map();
let activos = 0;

const PROHIBIDO =
  /phishing|keylogger|stealer|ransomware|malware|clon(?:ar|a)?\s+(?:de\s+)?(?:la\s+)?(?:pagina\s+)?(?:de\s+)?(?:login|inicio de sesion|banco|facebook|instagram|whatsapp|paypal|gmail)|pagina\s+falsa|robar\s+(?:contrasen|datos|cuenta|claves)|capturar\s+(?:contrasen|claves)|porn|xxx|hentai|desnud|sexual|erotic/;

const SISTEMA = `Eres un desarrollador web senior. Conviertes el pedido del usuario en UN solo archivo HTML completo, funcional y bien diseñado.

FORMATO DE SALIDA
- Responde únicamente con el código, empezando en <!DOCTYPE html> y terminando en </html>. Sin explicaciones, sin bloques markdown.
- Un solo archivo: CSS y JavaScript dentro del mismo HTML. Sin comentarios en el código.
- Texto de la interfaz en el idioma del pedido (por defecto español).

RESTRICCIONES TÉCNICAS (la página se ejecuta aislada)
- Sin peticiones de red, sin fetch, sin imágenes ni fuentes externas. Solo se permiten scripts desde https://cdnjs.cloudflare.com, y solo si de verdad hacen falta.
- No uses formularios <form>, alert/confirm/prompt ni popups. No dependas de localStorage ni de cookies (si guardas puntajes, hazlo en variables y que no falle si no persiste).
- Dibuja con CSS, SVG o <canvas>; emojis y caracteres Unicode para íconos. Sonidos solo con WebAudio y solo tras un toque del usuario.

CALIDAD Y RENDIMIENTO
- Pensada para celular primero: <meta viewport>, ocupa toda la pantalla, respeta safe-area, sin scroll horizontal, objetivos táctiles de al menos 44px y touch-action:manipulation. Debe verse bien también en computadora.
- Controles con botones visibles en pantalla (y teclado como extra); evita gestos de deslizar como único control.
- Juegos y animaciones: requestAnimationFrame con delta-time, lógica independiente de los FPS, canvas con devicePixelRatio limitado a 2, sin crear objetos en cada frame, pausa cuando la pestaña no está visible, reinicio fácil y pantalla de inicio clara.
- Código compacto y eficiente: pocas dependencias, sin librerías pesadas, archivo bajo 100 KB.
- Diseño cuidado y con identidad propia: paleta coherente, buena tipografía del sistema, contraste legible, estados hover/activo, transiciones suaves y respeto a prefers-reduced-motion.
- Todo debe funcionar de verdad al abrirlo: sin funciones a medias ni textos de relleno.

SEGURIDAD
- Si el pedido es para engañar, robar datos, imitar un inicio de sesión o sitio real, contenido sexual o dañino, responde únicamente con una página simple que diga que no puedes crear eso.`;

function usuarioNuevo(pedido) {
  return "Pedido del usuario:\n" + pedido;
}

function usuarioEdicion(actual, cambio) {
  return (
    "Esta es la página actual:\n" + actual + "\n\nAplica este cambio y devuelve el archivo COMPLETO actualizado (de <!DOCTYPE html> a </html>), conservando lo que funciona:\n" + cambio
  );
}

async function crear(usuario, compacto = false) {
  const t = await generarTexto({ sistema: SISTEMA, usuario: compacto ? usuario + "\n\nIMPORTANTE: hazlo más compacto (máximo 60 KB) y termina el archivo completo." : usuario });
  return extraerHtml(t);
}

export default {
  names: [".html", ".pagina", ".web", ".crearhtml"],
  desc: "Crea con IA cualquier página, juego o app en HTML y te manda un enlace para abrirla. Responde a un enlace para modificarla",
  category: "Tools",
  usage: ".html <qué quieres crear>",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const args = cleanText.split(/\s+/).slice(1).join(" ").trim();
    const duenio = isOwner(sender);

    const borrar = args.match(/^(?:borrar|eliminar)\s+(\S+)/i);
    if (borrar) {
      if (!duenio) return reply({ text: tarjetaAviso("HTML", "Solo los owners pueden borrar páginas.") });
      const id = idDeTexto(borrar[1]) || borrar[1];
      return reply({ text: borrarPagina(id) ? tarjetaAviso("HTML", "Página eliminada.") : tarjetaAviso("HTML", "No encontré esa página.") });
    }

    if (!args) {
      return reply({
        text: tarjetaUso({
          comando: ".html <qué quieres crear>",
          ejemplo: ".html un juego de snake neón   |   .html calculadora de propinas   |   .html invitación de cumpleaños con confeti",
          nota: `Te mando un enlace que dura ${vigenciaDias} días. Para cambiar algo, responde al enlace con .html y lo que quieres ajustar.`
        })
      });
    }
    if (args.length > MAX_PEDIDO) return reply({ text: tarjetaAviso("HTML", `Describe tu idea en menos de ${MAX_PEDIDO} caracteres.`) });
    if (PROHIBIDO.test(normalizar(args))) {
      return reply({ text: tarjetaAviso("HTML", "No puedo crear ese tipo de página. Prueba con otra idea.") });
    }
    if (activos >= MAX_ACTIVOS) return reply({ text: tarjetaAviso("HTML", "Estoy creando otras páginas. Intenta de nuevo en un minuto.") });
    if (!duenio) {
      const falta = limitarEspera(esperas, sender, ESPERA_MS);
      if (falta) return reply({ text: tarjetaAviso("HTML", `Espera ${falta}s antes de crear otra página.`) });
    }

    const citado = textoCitado(msg);
    const idPrevio = idDeTexto(citado);
    const actual = idPrevio ? leerOriginal(idPrevio) : null;
    const usuario = actual ? usuarioEdicion(actual, args) : usuarioNuevo(args);

    try {
      await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });
    } catch {}
    await sock.sendMessage(from, { text: tarjetaAviso("HTML", actual ? "Aplicando tu cambio… tarda entre 20 y 90 segundos." : "Creando tu página… tarda entre 20 y 90 segundos.") }, { quoted: msg });

    activos++;
    let html = "";
    try {
      html = await crear(usuario);
      if (!htmlCompleto(html)) html = await crear(usuario, true);
    } catch (e) {
      console.log("[HTML] ERROR IA (" + proveedorIA() + "): " + e.message);
      activos--;
      const sinClave = proveedorIA() === "pollinations" ? " Si eres el dueño del bot, configura GEMINI_API_KEY para mejores resultados." : "";
      return reply({ text: tarjetaAviso("HTML", "No pude generar la página ahora mismo. Intenta de nuevo en un momento." + sinClave) });
    }
    activos--;

    if (!htmlCompleto(html)) {
      return reply({ text: tarjetaAviso("HTML", "La página salió incompleta. Prueba con una idea un poco más simple.") });
    }
    if (Buffer.byteLength(html) > MAX_BYTES - 4000) {
      return reply({ text: tarjetaAviso("HTML", "La página quedó demasiado pesada. Pide algo más simple.") });
    }

    let id;
    try {
      id = guardarPagina(html, { por: sender, pedido: args.slice(0, 200), de: idPrevio || undefined });
    } catch (e) {
      console.log("[HTML] no se pudo guardar: " + e.message);
      return reply({ text: tarjetaAviso("HTML", "No pude guardar la página. Intenta de nuevo.") });
    }

    const firma = config.botNameShort || "MaxiProyec";
    const url = urlPagina(id);
    if (!url) {
      try {
        if (typeof sock.sendHtml !== "function") throw new Error("sin sendHtml");
        await sock.sendHtml(from, leerPagina(id), [], msg, {});
        await sock.sendMessage(from, { text: tarjetaAviso("HTML", "Te la mandé aquí mismo porque el bot no tiene dirección pública. El dueño puede definir JUEGOS_URL en .env para recibir enlaces.") }, { quoted: msg });
      } catch (e) {
        console.log("[HTML] envío directo falló: " + e.message);
        await reply({ text: tarjetaAviso("HTML", "La página se creó, pero no pude enviarla.") });
      }
      return;
    }

    const texto =
      encabezado("🌐", actual ? "PÁGINA ACTUALIZADA" : "PÁGINA LISTA") + "\n\n" +
      campo("📝", "Pedido", args.length > 120 ? args.slice(0, 117) + "…" : args) + "\n" +
      campo("🔗", "Enlace", url) + "\n" +
      campo("⏳", "Vigencia", `${vigenciaDias} días`) +
      "\n\n> Responde a este mensaje con .html y lo que quieras cambiar.";
    const enviado = await enviarConBoton({
      sock,
      from,
      msg,
      texto,
      footer: "Powered by " + firma,
      lista: [{ texto: "🌐 Abrir página", url }]
    });
    if (!enviado) await sock.sendMessage(from, { text: texto }, { quoted: msg });
  }
};
