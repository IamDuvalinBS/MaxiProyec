import { ownerCommand } from "../../../motores/owner.js";
import { buscarBesos, unirBesos, fijarBesos } from "../../../motores/db.js";

const ultimaBusqueda = new Map();

const numeroDe = (jid) => String(jid || "").split("@")[0].split(":")[0];
const ultimosDiez = (jid) => numeroDe(jid).replace(/\D/g, "").slice(-10);
const mostrarClave = (clave) => clave.split("|").map((j) => `${numeroDe(j)}@${String(j).split("@")[1] || "?"}`).join("  ↔  ");

export default {
  names: [".besosrecuperar"],
  usage: ".besosrecuperar @pareja  |  .besosrecuperar <número de la lista>",
  desc: "Busca y recupera el contador de besos de una pareja cuando cambió el identificador de alguno (solo owner)",
  category: "Owner",
  handler: ownerCommand(async ({ sender, msg, cleanText, reply }) => {
    const partes = cleanText.trim().split(/\s+/);
    const arg = partes[1];
    const info = msg.message?.extendedTextMessage?.contextInfo;
    const target = info?.mentionedJid?.[0] || info?.participant || null;

    if (arg && arg.toLowerCase() === "todos") {
      if (!target) return reply({ text: "❌ Uso: *.besosrecuperar todos @pareja*" });
      const todos = buscarBesos(["@"]).slice(0, 25);
      ultimaBusqueda.set(sender, { pareja: target, resultados: todos });
      const filas = todos.map((r, i) => `*${i + 1}.* ${r.total} besos\n> ${mostrarClave(r.clave)}`);
      return reply({ text: ["💋 *TODOS LOS CONTADORES (los 25 más altos)*", "", ...filas, "", "Si ves el tuyo, elígelo con *.besosrecuperar <número>*"].join("\n") });
    }

    if (arg && arg.toLowerCase() === "fijar") {
      const total = Number(partes[2]);
      if (!target || !Number.isInteger(total) || total < 0) return reply({ text: "❌ Uso: *.besosrecuperar fijar <total> @pareja*" });
      const r = fijarBesos(sender, target, total);
      return reply({ text: `✅ El contador de besos de ustedes ahora marca *${total}*.\n> Antes marcaba ${r.anterior}.` });
    }

    if (arg && /^\d{1,3}$/.test(arg) && !target) {
      const lista = ultimaBusqueda.get(sender);
      const elegido = lista?.resultados[Number(arg) - 1];
      if (!elegido) return reply({ text: "❌ Primero usa *.besosrecuperar @pareja* para ver la lista y luego elige un número." });
      const r = unirBesos(elegido.clave, sender, lista.pareja);
      if (!r) return reply({ text: "❌ Ese contador ya no existe." });
      if (r.igual) return reply({ text: "ℹ️ Ese contador ya es el de ustedes dos, no hay nada que recuperar." });
      return reply({ text: `✅ Recuperados *${r.total}* besos. El contador de ustedes ahora marca *${r.nuevoTotal}*.\n> El registro anterior quedó en 0 para no sumarlo dos veces.` });
    }

    if (!target) return reply({ text: "❌ Menciona a tu pareja o responde a su mensaje: *.besosrecuperar @pareja*" });

    const diezA = ultimosDiez(sender);
    const diezB = ultimosDiez(target);
    const resultados = buscarBesos([diezA, diezB])
      .filter(({ clave }) => clave.includes(diezA) && clave.includes(diezB))
      .slice(0, 15);
    if (!resultados.length) {
      return reply({ text: "📭 No hay ningún contador de besos con esos números en los datos cargados. Si el bot arrancó sin conectar a MongoDB, revisa la conexión y reinicia." });
    }
    ultimaBusqueda.set(sender, { pareja: target, resultados });
    const lineas = resultados.map((r, i) => `*${i + 1}.* ${r.total} besos\n> ${mostrarClave(r.clave)}`);
    return reply({
      text: ["💋 *CONTADORES ENCONTRADOS*", "", ...lineas, "", "Elige el que era el tuyo: *.besosrecuperar <número>*"].join("\n")
    });
  })
};
