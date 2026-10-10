import { enviarLote } from "./envio.js";
import { tarjetaDescarga, tarjetaUso, tarjetaError, tarjetaAviso, campo } from "./tarjetas.js";
import { LIMITE_VIDEO_WHATSAPP_MB } from "./core.js";
import { reenviarCacheado, guardarMedioEnviado } from "../../motores/cache-medios.js";

const CANTIDAD_POR_DEFECTO = 5;
const CANTIDAD_MAXIMA = 10;
const LIMITE_VIDEO_BUSQUEDA_MB = 30; // en búsquedas se omiten videos muy pesados para que el lote salga rápido

// Una sola búsqueda a la vez en todo el bot (cuida la RAM, el disco y los datos del teléfono).
let BUSQUEDA_EN_CURSO = false;

const URL_GENERICA = /^https?:\/\//i;

/**
 * Crea el comando de una red social.
 *  - obtenerPorLink(link) -> lista de medias
 *  - buscar(consulta, cantidad) -> lista de medias (opcional; si no existe, el comando solo acepta enlaces)
 */
export function crearComandoRed({
  names,
  usage,
  desc,
  emoji,
  titulo,
  regexLink,
  ejemploLink,
  ejemploBusqueda,
  obtenerPorLink,
  buscar
}) {
  const comando = names[0];
  const etiquetaUso = buscar ? `${comando} <enlace o búsqueda>` : `${comando} <enlace>`;

  return {
    names,
    usage: usage || etiquetaUso,
    desc,
    category: "Descargas",

    handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
      const args = cleanText.trim().split(/\s+/).slice(1);

      const mostrarUso = (nota) =>
        reply({
          text: tarjetaUso({
            comando: etiquetaUso,
            ejemplo: buscar && ejemploBusqueda ? `${ejemploLink}\n${ejemploBusqueda}` : ejemploLink,
            nota
          }),
          mentions: [sender]
        });

      if (!args.length) {
        return mostrarUso(buscar ? "Envía un enlace o escribe lo que quieres buscar." : "Envía un enlace válido.");
      }

      // ¿Enlace o búsqueda?
      const primero = args[0];
      const esDeEstaRed = regexLink.test(primero);
      if (!esDeEstaRed && URL_GENERICA.test(primero)) {
        return mostrarUso("Ese enlace no es de esta plataforma.");
      }
      if (!esDeEstaRed && !buscar) {
        return mostrarUso("Envía un enlace válido.");
      }

      // ───────────── Por enlace ─────────────
      if (esDeEstaRed) {
        const link = URL_GENERICA.test(primero) ? primero : `https://${primero}`;
        const claveCache = `red:${titulo}:${link}`;

        if (await reenviarCacheado(sock, from, claveCache, msg)) return;

        const aviso = reply({
          text: tarjetaDescarga({
            emoji,
            titulo,
            sender,
            campos: [campo("🔗", "Enlace", link)],
            nota: "Descargando el contenido. Esto puede tardar unos segundos."
          }),
          mentions: [sender]
        }).catch(() => {});

        let medias;
        try {
          medias = await obtenerPorLink(link);
        } catch (e) {
          await aviso;
          return reply({ text: tarjetaError("No se pudo obtener el contenido de ese enlace.", e.message) });
        }
        await aviso;

        const r = await enviarLote(medias, reply, { sock, from, msg });

        if (r.enviados === 0) {
          return reply({
            text: r.omitidos > 0
              ? tarjetaAviso("ARCHIVO MUY PESADO", `El contenido supera el límite de WhatsApp (${LIMITE_VIDEO_WHATSAPP_MB} MB). Se omitió.`)
              : tarjetaError("No se pudo enviar el contenido.")
          });
        }

        // Solo se guarda en caché lo que fue un único archivo.
        if (r.enviados === 1 && medias.length === 1 && r.ultimo && r.ultimo !== true) {
          try { guardarMedioEnviado(claveCache, r.ultimo); } catch (e) {}
        }
        return;
      }

      // ───────────── Por búsqueda ─────────────
      let cantidad = CANTIDAD_POR_DEFECTO;
      if (args.length > 1 && /^\d{1,2}$/.test(args[0])) {
        cantidad = Math.min(CANTIDAD_MAXIMA, Math.max(1, Number(args.shift())));
      }
      const consulta = args.join(" ");

      if (BUSQUEDA_EN_CURSO) {
        return reply({
          text: tarjetaAviso("BÚSQUEDA EN CURSO", "Ya hay una búsqueda enviándose. Espera a que termine e inténtalo de nuevo."),
          mentions: [sender]
        });
      }

      BUSQUEDA_EN_CURSO = true;
      try {
        const aviso = reply({
          text: tarjetaDescarga({
            emoji,
            titulo,
            sender,
            campos: [campo("💭", "Búsqueda", consulta), campo("🎞️", "Resultados a enviar", String(cantidad))],
            nota: "Buscando y descargando. Esto puede tardar un poco; los videos llegarán uno tras otro."
          }),
          mentions: [sender]
        }).catch(() => {});

        let medias;
        try {
          medias = await buscar(consulta, cantidad);
        } catch (e) {
          await aviso;
          return reply({ text: tarjetaError("No se pudo completar la búsqueda.", e.message) });
        }
        await aviso;

        if (!medias.length) {
          return reply({ text: tarjetaError("No encontré resultados descargables para esa búsqueda. Prueba con otras palabras.") });
        }

        const r = await enviarLote(medias, reply, {
          sock,
          from,
          msg,
          objetivo: cantidad,
          limiteMB: Math.min(LIMITE_VIDEO_BUSQUEDA_MB, LIMITE_VIDEO_WHATSAPP_MB)
        });

        if (r.enviados === 0) {
          return reply({ text: tarjetaError("Encontré resultados, pero no se pudo descargar ninguno. Intenta de nuevo en unos minutos.") });
        }
        if (r.enviados < cantidad) {
          await reply({
            text: tarjetaAviso("RESULTADOS", `Solo se pudieron enviar ${r.enviados} de ${cantidad} (algunos pesaban demasiado o no estaban disponibles).`)
          }).catch(() => {});
        }
      } finally {
        BUSQUEDA_EN_CURSO = false;
      }
    }
  };
}
