import { encabezado } from "../src/economia/estilo.js";
import { gachaListo, arroba, fmt, CAT, bloquesDePersonajeParaTicket } from "./gacha-core.js";
import { topColeccionistas } from "./gacha-db.js";
import { ticketsDe, usarTicket } from "./gacha-tickets.js";
import { personajeAleatorio, contarPersonajes } from "./gacha-db.js";
import { hacerRoll, mostrarColeccion } from "./gacha-core.js";
import { esOwnerGacha } from "./gacha-owners.js";
import { COOLDOWN_TIRADA_MS } from "./gacha-config.js";
import { crearComandoClaim } from "./gacha-core.js";
import { crearHandlerPvp } from "./gacha-pvp.js";
import { crearComandoTienda, crearComandoComprar, crearComandoDar } from "./gacha-tienda.js";

const MEDALLAS = ["🥇", "🥈", "🥉"];
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
      const top = topColeccionistas(categoria, 10);
      if (!top.length) return reply({ text: `⚠️ Todavía no hay usuarios con ${cat.unidades} en el bot.` });

      const filas = top.map((u, i) => {
        const puesto = MEDALLAS[i] || `*${i + 1}*`;
        return `${puesto} ${arroba(u.usuario)} ››\n> ${fmt(u.cantidad)} ${u.cantidad === 1 ? cat.unidad : cat.unidades} en el bot.`;
      });

      return reply({
        text: [
          encabezado(cat.emojiTop, "RANKING GLOBAL"),
          "",
          `> La cantidad *global* de las personas con más ${cat.unidades} en el bot.`,
          "",
          ...filas,
          "",
          `> Usa *${cat.coleccionCmd}* para ver tu propia colección.`
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
      const token = cleanText.split(/\s+/)[1] || "";
      const tickets = ticketsDe(sender, categoria);

      if (!/^#?\d+$/.test(token)) {
        return reply({
          text: [
            encabezado("🎟️", `TICKETS - ${cat.tituloTop}`),
            "",
            `> Un ticket te permite obtener ${cat.indef} eligiendo su ID. Se consiguen al azar, con una probabilidad baja, cada vez que usas *${cat.rollCmd}*.`,
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

      if (r.error === "sinticket") return reply({ text: `❌ No tienes tickets de ${cat.plural}. Se consiguen al azar usando *${cat.rollCmd}*.` });
      if (r.error === "noexiste") return reply({ text: `❌ No existe ${cat.indef} con el ID #${charId}.` });
      if (r.error === "repetido") return reply({ text: `📦 Ya tienes a *${r.personaje.nombre}*. El ticket no se gastó.` });
      if (r.error === "ocupado") {
        return reply({
          text: `🔒 *${r.personaje.nombre}* ya pertenece a ${arroba(r.duenos[0])}. Los tickets de ${cat.plural} solo sirven con personajes que no tengan dueño. El ticket no se gastó.`,
          mentions: [r.duenos[0]]
        });
      }

      const cabecera = [
        encabezado("🎟️", "TICKET USADO"),
        "",
        `> ${arroba(sender)} usó un ticket y obtuvo a *${r.personaje.nombre}*.`,
        `> Te quedan ${r.restantes} ${r.restantes === 1 ? "ticket" : "tickets"} de ${cat.plural}.`
      ].join("\n");
      return reply({ text: [cabecera, ...bloquesDePersonajeParaTicket(r.personaje)].join("\n\n"), mentions: [sender] });
    }
  };
}


function crearComandoTiradaBase({ categoria, names, asegurar, sincronizar, textoVacio, descripcion }) {
  const cat = CAT[categoria];
  return {
    names,
    desc: descripcion || `Genera ${cat.indef} al azar para reclamar con ${cat.claimCmd} (cada ${COOLDOWN_TIRADA_MS / 60000} minutos)`,
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
          await reply({ text: `⏳ Cargando la lista de ${cat.plural} por primera vez. Puede tardar unos segundos.` });
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
