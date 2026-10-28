import { ownerGacha, numeroDe } from "../../../motores/gacha-owners.js";
import { encabezado } from "../../../src/economia/estilo.js";
import { gachaListo, arroba, fmt } from "../../../motores/gacha-core.js";
import { registroNivelesDe, restaurarNivelesDesdeRegistro } from "../../../motores/gacha-db.js";

function usuarioDe(msg, partes) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  const directo = ctx?.mentionedJid?.[0] || ctx?.participant || null;
  if (directo) return directo;
  const numero = partes.find((x) => /^\d{6,20}$/.test(x));
  if (!numero) return null;
  for (const sufijo of ["@s.whatsapp.net", "@lid"]) {
    if (registroNivelesDe(numero + sufijo).length) return numero + sufijo;
  }
  return numero + "@s.whatsapp.net";
}

const fecha = (s) => new Date(s * 1000).toLocaleString("es-MX", { timeZone: "America/Mexico_City", dateStyle: "short", timeStyle: "short" });

export default [
  {
    names: [".nivelog", ".registroniveles"],
    desc: "Owner: muestra el registro de niveles guardado en MongoDB de un usuario: .nivelog @usuario (o su número)",
    category: "Owner",
    usage: ".nivelog <@usuario|número>",
    handler: ownerGacha(async ({ cleanText, msg, reply }) => {
      await gachaListo;
      const partes = cleanText.split(/\s+/).slice(1);
      const usuario = usuarioDe(msg, partes);
      if (!usuario) return reply({ text: "✱ *Uso* ›› .nivelog @usuario (o responde a su mensaje, o escribe su número)" });
      const filas = registroNivelesDe(usuario).sort((a, b) => b.nivel - a.nivel);
      if (!filas.length) return reply({ text: `📭 No hay registro de niveles para ${arroba(usuario)}.`, mentions: [usuario] });
      const lineas = filas.slice(0, 40).map((r) => {
        const u = r.historial[r.historial.length - 1];
        return `> #${r.char_id} ${r.nombre || ""} ›› Nv. ${r.nivel}${u ? ` (${u.via}, ${fecha(u.fecha)})` : ""}`;
      });
      return reply({
        text: [
          encabezado("📒", "REGISTRO DE NIVELES"),
          "",
          `👤 *Usuario* ›› ${arroba(usuario)} (ID: ${numeroDe(usuario)})`,
          `📚 *Personajes registrados* ›› ${fmt(filas.length)}`,
          "",
          ...lineas,
          filas.length > 40 ? `\n> …y ${filas.length - 40} más.` : ""
        ].join("\n"),
        mentions: [usuario]
      });
    })
  },
  {
    names: [".restaurarniveles"],
    desc: "Owner: devuelve los niveles perdidos usando el registro de MongoDB: .restaurarniveles @usuario|todos [confirmar]",
    category: "Owner",
    usage: ".restaurarniveles <@usuario|todos> [confirmar]",
    handler: ownerGacha(async ({ cleanText, msg, reply }) => {
      await gachaListo;
      const partes = cleanText.split(/\s+/).slice(1).map((x) => x.toLowerCase());
      const todos = partes.includes("todos");
      const usuario = todos ? null : usuarioDe(msg, partes);
      if (!todos && !usuario) return reply({ text: "✱ *Uso* ›› .restaurarniveles @usuario [confirmar]  |  .restaurarniveles todos [confirmar]" });
      const confirmado = partes.includes("confirmar");
      const r = restaurarNivelesDesdeRegistro({ usuario, soloContar: !confirmado });
      const lineas = r.restaurados.slice(0, 30).map((x) => `> ${numeroDe(x.usuario)} · #${x.id} ${x.nombre} ›› Nv. ${x.de} → ${x.a}`);
      return reply({
        text: [
          encabezado("♻️", confirmado ? "NIVELES RESTAURADOS" : "VISTA PREVIA"),
          "",
          `🔎 *Revisados* ›› ${fmt(r.revisados)}`,
          `${confirmado ? "✅" : "➖"} *${confirmado ? "Restaurados" : "Se restaurarían"}* ›› ${fmt(r.restaurados.length)}`,
          "",
          ...lineas,
          r.restaurados.length > 30 ? `\n> …y ${r.restaurados.length - 30} más.` : "",
          !confirmado && r.restaurados.length ? "\n> Para aplicarlo escribe el mismo comando agregando *confirmar*." : ""
        ].join("\n"),
        mentions: usuario ? [usuario] : []
      });
    })
  }
];
