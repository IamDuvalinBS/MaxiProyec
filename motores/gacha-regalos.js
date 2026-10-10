import { encabezado } from "../src/economia/estilo.js";
import { registrarEspera } from "../src/nucleo/espera.js";
import { gachaListo, arroba, monto, fmt, CAT, personajePorId } from "./gacha-core.js";
import { categoriaPorAlias } from "./gacha-categorias.js";
import { contarColeccion, leTiene, transferirPersonaje, transferirColeccion } from "./gacha-db.js";

const CONFIRMACION_MS = 60 * 1000;
const PALABRA_CONFIRMAR = "confirmarregalo";
const pendientes = new Map();

function destinatarioDe(msg) {
  const contexto = msg.message?.extendedTextMessage?.contextInfo;
  return contexto?.mentionedJid?.[0] || contexto?.participant || null;
}

function leerFichas(cleanText) {
  return cleanText.split(/\s+/).slice(1).filter((x) => x !== "+" && !x.startsWith("@"));
}

const listaDeCategorias = "*waifu*, *pokemon*, *brawl*, *snake*, *cod*, *dragon* y *clash*";

export function crearComandoRegalar() {
  return {
    names: [".regalar", ".gift", ".regalarpersonaje"],
    desc: "Regala un personaje de cualquier gacha a otro usuario: .regalar <categoría> <ID> <@usuario>",
    category: "Gacha",
    usage: ".regalar <categoría> <ID> <@usuario>",
    handler: async ({ sender, cleanText, msg, reply }) => {
      await gachaListo;
      const fichas = leerFichas(cleanText);
      const categoria = fichas.map(categoriaPorAlias).find(Boolean);
      const idTexto = fichas.find((x) => /^#?\d+$/.test(x));
      const destino = destinatarioDe(msg);

      if (!categoria || !idTexto || !destino) {
        return reply({
          text: [
            encabezado("🎁", "REGALAR PERSONAJE"),
            "",
            "> Regala uno de tus personajes, de cualquier gacha, a otro usuario. El personaje conserva su nivel.",
            "",
            "✱ *Uso* ›› .regalar <categoría> <ID> <@usuario>",
            "✿ *Ejemplo* ›› .regalar pokemon 25 @usuario",
            "",
            `> Categorías: ${listaDeCategorias}.`,
            "> En lugar de mencionar, también puedes responder al mensaje de la persona.",
            "> Para regalar toda una colección usa *.regalartodo <categoría> <@usuario>*."
          ].join("\n")
        });
      }

      const cat = CAT[categoria];
      const charId = parseInt(idTexto.replace("#", ""), 10);
      const personaje = personajePorId(charId);

      if (destino === sender) return reply({ text: "❌ No puedes regalarte un personaje a ti mismo." });
      if (!personaje || personaje.categoria !== categoria) return reply({ text: `❌ No existe ${cat.indef} con el ID #${charId}.` });
      if (!leTiene(sender, charId)) return reply({ text: `❌ No tienes a *${personaje.nombre}* (#${charId}) en tu colección.` });

      const r = transferirPersonaje(sender, destino, charId);
      if (r.estado === "ya_lo_tiene") {
        return reply({ text: `📦 ${arroba(destino)} ya tiene a *${personaje.nombre}*. No se regaló nada.`, mentions: [destino] });
      }

      return reply({
        text: [
          encabezado("🎁", "REGALO ENTREGADO"),
          "",
          `> ${arroba(sender)} le regaló un personaje a ${arroba(destino)}.`,
          "",
          `🆔 *ID* :: #${personaje.id}`,
          `✍🏻 *Nombre* ›› ${personaje.nombre}`,
          `✨ *Rareza* ›› ${personaje.rareza}`,
          `📊 *Nivel* ›› ${r.nivel}`,
          `💴 *Valor* ›› ${monto(personaje.valor)}`
        ].join("\n"),
        mentions: [sender, destino]
      });
    }
  };
}

export function crearComandoRegalarTodo() {
  return {
    names: [".regalartodo", ".regalarharem", ".regalarcoleccion"],
    desc: "Regala toda tu colección de una categoría a un usuario: .regalartodo <categoría> <@usuario>",
    category: "Gacha",
    usage: ".regalartodo <categoría> <@usuario>",
    handler: async ({ from, sender, cleanText, msg, reply }) => {
      await gachaListo;
      const categoria = leerFichas(cleanText).map(categoriaPorAlias).find(Boolean);
      const destino = destinatarioDe(msg);

      if (!categoria || !destino) {
        return reply({
          text: [
            encabezado("🎁", "REGALAR COLECCIÓN"),
            "",
            "> Regala todos tus personajes de una categoría a otro usuario. Antes de entregarlos se te pedirá una confirmación.",
            "",
            "✱ *Uso* ›› .regalartodo <categoría> <@usuario>",
            "✿ *Ejemplo* ›› .regalartodo waifu @usuario",
            "",
            `> Categorías: ${listaDeCategorias}.`,
            "> Los personajes que esa persona ya tenga se quedan contigo."
          ].join("\n")
        });
      }

      const cat = CAT[categoria];
      if (destino === sender) return reply({ text: "❌ No puedes regalarte tu propia colección." });

      const { n, total } = contarColeccion(sender, categoria);
      if (!n) return reply({ text: `❌ No tienes ${cat.unidades} para regalar.` });

      const clave = `${from}:${sender}`;
      pendientes.set(clave, { destino, categoria });

      registrarEspera(clave, {
        duracionMs: CONFIRMACION_MS,
        alResponder: async (texto, ctx) => {
          const palabra = String(texto || "").trim().toLowerCase().replace(/\s+/g, "");
          if (palabra !== PALABRA_CONFIRMAR) return false;
          const plan = pendientes.get(clave);
          if (!plan) return false;
          pendientes.delete(clave);

          const r = transferirColeccion(sender, plan.destino, plan.categoria);
          const respuesta = {
            text: [
              encabezado("🎁", "COLECCIÓN ENTREGADA"),
              "",
              `> ${arroba(sender)} regaló su colección de ${cat.unidades} a ${arroba(plan.destino)}.`,
              "",
              `🎴 *Entregados* ›› ${fmt(r.transferidos)} ${r.transferidos === 1 ? cat.unidad : cat.unidades}`,
              `💴 *Valor entregado* ›› ${monto(r.valor)}`,
              ...(r.omitidos ? [`📦 *Ya los tenía* ›› ${fmt(r.omitidos)} (se quedaron contigo)`] : [])
            ].join("\n"),
            mentions: [sender, plan.destino]
          };
          await ctx.sock.sendMessage(ctx.from, respuesta, { quoted: ctx.msg });
          return true;
        }
      });

      return reply({
        text: [
          encabezado("⚠️", "CONFIRMAR REGALO"),
          "",
          `> Vas a regalar *toda* tu colección de ${cat.unidades} a ${arroba(destino)}.`,
          "",
          `🎴 *Personajes* ›› ${fmt(n)}`,
          `💴 *Valor total* ›› ${monto(total)}`,
          "",
          "> Esta acción no se puede deshacer.",
          "> Para continuar escribe *ConfirmarRegalo* en los próximos 60 segundos. Si no escribes nada, no se entregará nada."
        ].join("\n"),
        mentions: [destino]
      });
    }
  };
}
