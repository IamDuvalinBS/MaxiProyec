import { ownerGacha } from "../../../motores/gacha-owners.js";
import { gachaListo, arroba } from "../../../motores/gacha-core.js";
import { crearExclusiva, borrarExclusiva, listaExclusivas, definicion, otorgar, retirar } from "../../../motores/gacha-insignias.js";
import { encabezado } from "../../../src/economia/estilo.js";

const AYUDA = [
  encabezado("💠", "INSIGNIAS EXCLUSIVAS"),
  "",
  "> Crea insignias únicas para eventos, torneos o temporadas y entrégalas a quien quieras. Solo se pueden dar desde aquí.",
  "",
  "✱ *Crear* ›› .insigniaowner crear <id> | <emoji> | <nombre> | <descripción>",
  "✿ *Dar* ›› .insigniaowner dar <id> @usuario",
  "✦ *Quitar* ›› .insigniaowner quitar <id> @usuario",
  "✧ *Borrar* ›› .insigniaowner borrar <id>",
  "✪ *Lista* ›› .insigniaowner lista",
  "",
  "> El id solo admite letras minúsculas, números y guion bajo (de 2 a 20 caracteres)."
].join("\n");

export default {
  names: [".insigniaowner", ".insigniaex", ".darinsignia"],
  desc: "Crea y entrega insignias exclusivas del gacha (solo owners)",
  category: "Owner",
  usage: ".insigniaowner crear | dar | quitar | borrar | lista",
  handler: ownerGacha(async ({ cleanText, msg, reply }) => {
    await gachaListo;
    const argumentos = cleanText.split(/\s+/).slice(1).join(" ").trim();
    const accion = (argumentos.split(/\s+/)[0] || "").toLowerCase();
    const resto = argumentos.replace(/^\S+\s*/, "");
    const contexto = msg.message?.extendedTextMessage?.contextInfo;
    const destino = contexto?.mentionedJid?.[0] || contexto?.participant || null;

    if (accion === "lista") {
      const lista = listaExclusivas();
      if (!lista.length) return reply({ text: "📭 Todavía no hay insignias exclusivas creadas." });
      return reply({
        text: [encabezado("💠", "EXCLUSIVAS CREADAS"), "", ...lista.map((i) => `${i.emoji} *${i.id}* ›› ${i.nombre} · ${i.desc}`)].join("\n")
      });
    }

    if (accion === "crear") {
      const [id, emoji, nombre, ...desc] = resto.split("|").map((x) => x.trim());
      if (!id || !emoji || !nombre) return reply({ text: AYUDA });
      const r = await crearExclusiva({ id: id.toLowerCase(), emoji, nombre, desc: desc.join(" | ") || "Insignia exclusiva." });
      if (r.error === "formato") return reply({ text: "❌ El id solo admite letras minúsculas, números y guion bajo (de 2 a 20 caracteres)." });
      if (r.error === "reservado") return reply({ text: "❌ Ese id lo usa una insignia automática. Elige otro." });
      return reply({ text: `✅ Insignia exclusiva *${emoji} ${nombre}* creada con el id *${id.toLowerCase()}*. Entrégala con *.insigniaowner dar ${id.toLowerCase()} @usuario*.` });
    }

    if (accion === "dar" || accion === "quitar") {
      const id = (resto.split(/\s+/)[0] || "").toLowerCase();
      const def = definicion(id);
      if (!def || !def.exclusiva) return reply({ text: `❌ No existe una insignia exclusiva con el id *${id || "?"}*. Mira la lista con *.insigniaowner lista*.` });
      if (!destino) return reply({ text: "❌ Menciona a la persona o responde a su mensaje." });
      if (accion === "dar") {
        if (!otorgar(destino, id)) return reply({ text: `📦 ${arroba(destino)} ya tiene esa insignia.`, mentions: [destino] });
        return reply({
          text: [encabezado("💠", "INSIGNIA EXCLUSIVA"), "", `> ${arroba(destino)} recibió ${def.emoji} *${def.nombre}*.`, `> ${def.desc}`].join("\n"),
          mentions: [destino]
        });
      }
      if (!retirar(destino, id)) return reply({ text: `❌ ${arroba(destino)} no tiene esa insignia.`, mentions: [destino] });
      return reply({ text: `✅ Se quitó *${def.nombre}* a ${arroba(destino)}.`, mentions: [destino] });
    }

    if (accion === "borrar") {
      const id = (resto.split(/\s+/)[0] || "").toLowerCase();
      if (!(await borrarExclusiva(id))) return reply({ text: `❌ No existe una insignia exclusiva con el id *${id || "?"}*.` });
      return reply({ text: `✅ Se borró la insignia *${id}*. Quienes la tenían dejarán de verla.` });
    }

    return reply({ text: AYUDA });
  })
};
