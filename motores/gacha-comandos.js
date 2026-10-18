import { encabezado } from "../src/economia/estilo.js";
import { estilo } from "../src/economia/temas.js";
import { gachaListo, arroba, fmt, CAT, bloquesDePersonajeParaTicket } from "./gacha-core.js";
import { topColeccionistas } from "./gacha-db.js";
import { ticketsDe, usarTicket } from "./gacha-tickets.js";
import { personajeAleatorio, contarPersonajes } from "./gacha-db.js";
import { hacerRoll, mostrarColeccion } from "./gacha-core.js";
import { esOwnerGacha } from "./gacha-owners.js";
import { crearComandoClaim } from "./gacha-core.js";
import { crearHandlerPvp } from "./gacha-pvp.js";
import { crearComandoTienda, crearComandoComprar, crearComandoDar } from "./gacha-tienda.js";

const MEDALLAS = ["🥇", "🥈", "🥉"];

const ESTILOS = {
  normal: {
    medallas: MEDALLAS,
    tituloTop: "RANKING GLOBAL",
    relatoTop: (cat) => `La cantidad *global* de las personas con más ${cat.unidades} en el bot.`,
    vacioTop: (cat) => `⚠️ Todavía no hay usuarios con ${cat.unidades} en el bot.`,
    filaTop: (puesto, quien, n, cat) => `${puesto} ${quien} ››\n> ${fmt(n)} ${n === 1 ? cat.unidad : cat.unidades} en el bot.`,
    tipTop: (cat) => `Usa *${cat.coleccionCmd}* para ver tu propia colección.`,
    tituloTicketInfo: (cat) => `TICKETS - ${cat.tituloTop}`,
    relatoTicketInfo: (cat) => `Un ticket te permite obtener ${cat.indef} eligiendo su ID. Se consiguen al azar, con una probabilidad baja, cada vez que usas *${cat.rollCmd}*.`,
    sinTicket: (cat) => `❌ No tienes tickets de ${cat.plural}. Se consiguen al azar usando *${cat.rollCmd}*.`,
    repetido: (nombre) => `📦 Ya tienes a *${nombre}*. El ticket no se gastó.`,
    ocupado: (nombre, dueno) => `🔒 *${nombre}* ya pertenece a ${dueno}. Los tickets solo sirven con personajes que no tengan dueño. El ticket no se gastó.`,
    tituloUsado: "TICKET USADO",
    usado: (quien, nombre) => `> ${quien} usó un ticket y obtuvo a *${nombre}*.`,
    cargando: (cat) => `⏳ Cargando la lista de ${cat.plural} por primera vez. Puede tardar unos segundos.`
  },
  halloween: {
    medallas: MEDALLAS,
    tituloTop: "RANKING MACABRO",
    relatoTop: (cat) => `Las almas con más ${cat.unidades} en todo el bot.`,
    vacioTop: (cat) => `⚠️ Todavía no hay almas con ${cat.unidades} en el bot.`,
    filaTop: (puesto, quien, n, cat) => `${puesto} ${quien} ››\n> ${fmt(n)} ${n === 1 ? cat.unidad : cat.unidades} en su cripta.`,
    tipTop: (cat) => `Usa *${cat.coleccionCmd}* para ver tu propia colección.`,
    tituloTicketInfo: (cat) => `TICKETS MALDITOS - ${cat.tituloTop}`,
    relatoTicketInfo: (cat) => `Un ticket te permite invocar ${cat.indef} eligiendo su ID. Un espíritu los deja al azar, con una probabilidad baja, cada vez que usas *${cat.rollCmd}*.`,
    sinTicket: (cat) => `❌ No tienes tickets de ${cat.plural}. Los espíritus los dejan al azar al usar *${cat.rollCmd}*.`,
    repetido: (nombre) => `📦 *${nombre}* ya está en tu colección. El ticket no se gastó.`,
    ocupado: (nombre, dueno) => `🔒 *${nombre}* ya tiene dueño: ${dueno}. Los tickets solo sirven con personajes libres. El ticket no se gastó.`,
    tituloUsado: "TICKET INVOCADO",
    usado: (quien, nombre) => `> ${quien} usó un ticket y el más allá le entregó a *${nombre}*.`,
    cargando: (cat) => `⏳ Invocando la lista de ${cat.plural} por primera vez. Puede tardar unos segundos.`
  }
};
const ESPERA_LISTO_MS = 15000;

function esperarListo() {
  let temporizador;
  const limite = new Promise((_, rechazar) => {
    temporizador = setTimeout(
      () => rechazar(new Error("la base de datos del gacha no respondió a tiempo, revisa la conexión de MongoDB")),
      ESPERA_LISTO_MS
    );
  });
  return Promise.race([gachaListo, limite]).finally(() => clearTimeout(temporizador));
}

function envolver(comando, nombre) {
  const original = comando.handler;
  return {
    ...comando,
    handler: async (contexto) => {
      try {
        return await original(contexto);
      } catch (e) {
        console.log(`[gacha] ${nombre}:`, e.message);
        try {
          await contexto.reply({ text: `❌ No se pudo completar el comando: ${e.message}` });
        } catch {}
      }
    }
  };
}

function crearComandoTopBase({ categoria, names }) {
  const cat = CAT[categoria];
  return {
    names,
    desc: `Muestra a las 10 personas con más ${cat.unidades} en todo el bot`,
    category: "Gacha",
    usage: cat.topCmd,
    handler: async ({ reply }) => {
      await esperarListo();
      const E = estilo(ESTILOS);
      const top = topColeccionistas(categoria, 10);
      if (!top.length) return reply({ text: E.vacioTop(cat) });

      const filas = top.map((u, i) => {
        const puesto = MEDALLAS[i] || `*${i + 1}*`;
        return E.filaTop(puesto, arroba(u.usuario), u.cantidad, cat);
      });

      return reply({
        text: [
          encabezado(cat.emojiTop, E.tituloTop),
          "",
          `> ${E.relatoTop(cat)}`,
          "",
          ...filas,
          "",
          `> ${E.tipTop(cat)}`
        ].join("\n"),
        mentions: top.map((u) => u.usuario)
      });
    }
  };
}

function crearComandoTicketBase({ categoria, names }) {
  const cat = CAT[categoria];
  return {
    names,
    desc: `Usa un ticket para obtener ${cat.indef} eligiendo su ID: ${cat.ticketCmd} <ID>`,
    category: "Gacha",
    usage: `${cat.ticketCmd} <ID>`,
    handler: async ({ sender, cleanText, reply }) => {
      await esperarListo();
      const E = estilo(ESTILOS);
      const token = cleanText.split(/\s+/)[1] || "";
      const tickets = ticketsDe(sender, categoria);

      if (!/^#?\d+$/.test(token)) {
        return reply({
          text: [
            encabezado("🎟️", E.tituloTicketInfo(cat)),
            "",
            `> ${E.relatoTicketInfo(cat)}`,
            "",
            `🎟️ *Tus tickets* ›› ${tickets}`,
            "",
            `> Uso *${cat.ticketCmd} <ID>*`,
            `> Consulta los ID de tus ${cat.unidades} con *${cat.coleccionCmd}*.`
          ].join("\n")
        });
      }

      const charId = parseInt(token.replace("#", ""), 10);
      const r = usarTicket({ sender, categoria, charId });

      if (r.error === "sinticket") return reply({ text: E.sinTicket(cat) });
      if (r.error === "noexiste") return reply({ text: `❌ No existe ${cat.indef} con el ID #${charId}.` });
      if (r.error === "repetido") return reply({ text: E.repetido(r.personaje.nombre) });
      if (r.error === "ocupado") {
        return reply({
          text: E.ocupado(r.personaje.nombre, arroba(r.duenos[0])),
          mentions: [r.duenos[0]]
        });
      }

      const cabecera = [
        encabezado("🎟️", E.tituloUsado),
        "",
        E.usado(arroba(sender), r.personaje.nombre),
        `> Te quedan ${r.restantes} ${r.restantes === 1 ? "ticket" : "tickets"} de ${cat.plural}.`
      ].join("\n");
      return reply({ text: [cabecera, ...bloquesDePersonajeParaTicket(r.personaje)].join("\n\n"), mentions: [sender] });
    }
  };
}

const COOLDOWN_TIRADA_MS = 10 * 60 * 1000;

function crearComandoTiradaBase({ categoria, names, asegurar, sincronizar, textoVacio, descripcion }) {
  const cat = CAT[categoria];
  return {
    names,
    desc: descripcion || `Genera ${cat.indef} al azar para reclamar con ${cat.claimCmd} (cada 10 minutos)`,
    category: "Gacha",
    usage: cat.rollCmd,
    handler: async ({ from, sender, cleanText, reply }) => {
      await esperarListo();

      if (sincronizar && cleanText.split(/\s+/)[1]?.toLowerCase() === "actualizar") {
        if (!esOwnerGacha(sender)) return reply({ text: `🚫 Solo los owners pueden actualizar la lista de ${cat.plural}.` });
        try {
          const r = await sincronizar();
          return reply({ text: `✅ Lista de ${cat.plural} actualizada. Total en la fuente: ${r.total}. Nuevos: ${r.nuevos}.` });
        } catch (e) {
          console.log(`[gacha] Actualización de ${categoria}:`, e.message);
          return reply({ text: `❌ No se pudo consultar la fuente de datos: ${e.message}` });
        }
      }

      if (asegurar) {
        if (!contarPersonajes(categoria)) {
          await reply({ text: estilo(ESTILOS).cargando(cat) });
        }
        try {
          await asegurar();
        } catch (e) {
          console.log(`[gacha] Carga de ${categoria}:`, e.message);
          return reply({ text: `❌ No se pudo cargar la lista de ${cat.plural}: ${e.message}` });
        }
      }

      if (!contarPersonajes(categoria)) return reply({ text: textoVacio });

      await hacerRoll({
        categoria,
        obtener: async () => personajeAleatorio(categoria),
        reply, sender, from,
        cooldownMs: COOLDOWN_TIRADA_MS,
        textoVacio
      });
    }
  };
}

function crearComandoColeccionBase({ categoria, names }) {
  const cat = CAT[categoria];
  return {
    names,
    desc: `Muestra tus ${cat.unidades} con su nivel`,
    category: "Gacha",
    usage: `${cat.coleccionCmd} [página]`,
    handler: async ({ sender, cleanText, reply }) => {
      await esperarListo();
      await mostrarColeccion({ categoria, sender, cleanText, reply });
    }
  };
}

export const crearComandoTop = (opciones) => envolver(crearComandoTopBase(opciones), "Top");
export const crearComandoTicket = (opciones) => envolver(crearComandoTicketBase(opciones), "Ticket");
export const crearComandoTirada = (opciones) => envolver(crearComandoTiradaBase(opciones), `Tirada ${opciones.categoria}`);
export const crearComandoColeccion = (opciones) => envolver(crearComandoColeccionBase(opciones), "Colección");

export {
  crearComandoClaim, crearHandlerPvp, crearComandoTienda, crearComandoComprar, crearComandoDar
};
