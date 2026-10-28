import { enviarLote } from "./envio.js";
import { tarjetaDescarga, tarjetaUso, tarjetaError, tarjetaAviso, campo } from "./tarjetas.js";
import { LIMITE_VIDEO_WHATSAPP_MB, LIMITE_DOCUMENTO_MB } from "./core.js";
import { reenviarCacheado, guardarMedioEnviado } from "../../motores/cache-medios.js";

const CANTIDAD_POR_DEFECTO = 5;
const CANTIDAD_MAXIMA = 10;

// Una sola búsqueda a la vez en todo el bot (cuida la RAM, el disco y los datos del teléfono).
let BUSQUEDA_EN_CURSO = false;

const URL_GENERICA = /^https?:\/\//i;

// Convierte los datos de cada archivo en la tarjeta de texto (mismo estilo que .play).
function conTarjeta(medias, { emoji, titulo, sender, enlace }) {
  const decorar = (m, esUnico) => {
    const campos = m.campos || (enlace ? [["🔗", "Link", enlace]] : null);
    if (!campos || (!esUnico && !m.campos)) return m;
    const { campos: _, ...resto } = m;
    return {
      ...resto,
      caption: tarjetaDescarga({
        emoji,
        titulo,
        sender,
        campos: campos.filter((x) => x[2]).map((x) => campo(x[0], x[1], x[2]))
      })
    };
  };
  return medias.map((m, i) => {
    if (m.resolver) {
      const original = m.resolver;
      return { ...m, resolver: async () => (await original()).map((x) => decorar(x, true)) };
    }
    return decorar(m, medias.length === 1 || i === 0);
  });
}

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
  buscar,
  notaSinBusqueda,
  notaSinArgumentos
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
        return mostrarUso(notaSinArgumentos || (buscar ? "Envía un enlace o escribe lo que quieres buscar." : (notaSinBusqueda || "Envía un enlace válido.")));
      }

      // ¿Enlace o búsqueda?
      const primero = args[0];
      const esDeEstaRed = regexLink.test(primero);
      if (!esDeEstaRed && URL_GENERICA.test(primero)) {
        return mostrarUso("Ese enlace no es de esta plataforma.");
      }
      if (!esDeEstaRed && !buscar) {
        return mostrarUso(notaSinBusqueda || "Envía un enlace válido.");
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

        const inicio = Date.now();
        let medias;
        try {
          medias = await obtenerPorLink(link);
        } catch (e) {
          await aviso;
          return reply({ text: tarjetaError("No se pudo obtener el contenido de ese enlace.", e.message) });
        }
        await aviso;

        const tDescarga = Date.now();
        medias = conTarjeta(medias, { emoji, titulo, sender, enlace: link });
        const r = await enviarLote(medias, reply, { sock, from, msg });
        console.log(`[${titulo}] envío en ${((Date.now() - tDescarga) / 1000).toFixed(1)}s · total ${((Date.now() - inicio) / 1000).toFixed(1)}s`);

        if (r.enviados === 0) {
          return reply({
            text: r.omitidos > 0
              ? tarjetaAviso("ARCHIVO MUY PESADO", `El contenido pesa más de lo que WhatsApp admite como archivo (${LIMITE_DOCUMENTO_MB} MB). Se omitió.`)
              : tarjetaError("No se pudo enviar el contenido.", r.ultimoError)
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

        const inicioBusqueda = Date.now();
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

        medias = conTarjeta(medias, { emoji, titulo, sender });
        const r = await enviarLote(medias, reply, {
          sock,
          from,
          msg,
          objetivo: cantidad,
          limiteMB: LIMITE_VIDEO_WHATSAPP_MB // lo que pase de ahí se manda como .zip
        });

        console.log(`[${titulo}] búsqueda "${consulta}": ${r.enviados} enviados, ${r.fallidos} fallidos, ${r.omitidos} omitidos · total ${((Date.now() - inicioBusqueda) / 1000).toFixed(1)}s`);

        if (r.enviados === 0) {
          return reply({ text: tarjetaError("Encontré resultados, pero no se pudo descargar ninguno. Intenta de nuevo en unos minutos.", r.ultimoError) });
        }
        if (r.enviados < cantidad) {
          await reply({
            text: tarjetaAviso("RESULTADOS", `Solo se pudieron enviar ${r.enviados} de ${cantidad} (algunos no estaban disponibles o fallaron al descargarse).`)
          }).catch(() => {});
        }
      } finally {
        BUSQUEDA_EN_CURSO = false;
      }
    }
  };
}
