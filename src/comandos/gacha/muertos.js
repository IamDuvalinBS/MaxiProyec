import { ownerGacha } from "../../../motores/gacha-owners.js";
import { gachaListo } from "../../../motores/gacha-core.js";
import { personajesDeCategoria, etiquetarPersonaje, propietarios, personajePorId } from "../../../motores/gacha-db.js";
import { agregarPorLink } from "../../../motores/gacha-yandere.js";
import { getProfile } from "../../../motores/profile.js";
import { esOwnerGacha } from "../../../motores/gacha-owners.js";
import { encabezado } from "../../economia/estilo.js";
import {
  construirDatosMuertos, textoEstado, entregarPendientes, sumarComunidad, totalComunidad, ETIQUETA_WAIFU, META_COMUNIDAD, NOMBRE_EVENTO
} from "../../../motores/gacha-muertos.js";
import { htmlMuertos } from "../../../motores/muertos-html.js";

const muertos = {
  names: [".muertos", ".diademuertos", ".ofrenda", ".altar"],
  desc: "Altar de Día de Muertos y barra del evento comunitario de 10,000 comandos de economía",
  category: "Gacha",
  usage: ".muertos",
  handler: async ({ sock, from, sender, cleanText, msg, reply }) => {
    await gachaListo;
    const accion = (cleanText.split(/\s+/)[1] || "").toLowerCase();
    if (accion === "sumar" && esOwnerGacha(sender)) {
      const cantidad = parseInt(cleanText.split(/\s+/)[2], 10);
      if (!cantidad) return reply({ text: "⚙️ Uso: .muertos sumar <cantidad> (solo owners, sirve para probar las fases)" });
      const total = sumarComunidad(cantidad);
      return reply({ text: `🌼 Se sumaron *${cantidad}* comandos a la comunidad. Total ›› *${total}/${META_COMUNIDAD}*.` });
    }

    const entregas = entregarPendientes(sender);
    if (entregas.length) {
      const partes = [encabezado("🌼", "PREMIOS DE LA OFRENDA"), ""];
      for (const e of entregas) partes.push(`${e.fase.emoji} *Fase ${e.fase.id}: ${e.fase.nombre}*`, ...e.lineas, "");
      await reply({ text: partes.join("\n").trimEnd() });
    }

    if (typeof sock.sendHtml === "function") {
      try {
        const nombre = msg?.pushName || getProfile(sender).name || sender.split("@")[0];
        await sock.sendHtml(from, htmlMuertos(construirDatosMuertos(sender, { nombre })), [], msg, {});
        return;
      } catch (e) {
        console.log("[muertos] ERROR: " + e.stack);
      }
    }
    return reply({
      text: [encabezado("🌼", NOMBRE_EVENTO.toUpperCase()), "", ...textoEstado(sender), "", "> Cada comando de economía suma a la meta. Con 100 comandos recibes los premios de todas las fases."].join("\n")
    });
  }
};

const waifusevento = {
  names: [".waifusevento", ".waifusmuertos", ".waifuevento"],
  desc: "Gestiona las waifus que se entregan como premio del evento (solo owners)",
  category: "Owner",
  usage: ".waifusevento [<link de danbooru> | ultimas <n> | marcar <id> <id>... | quitar <id>...]",
  handler: ownerGacha(async ({ cleanText, reply }) => {
    await gachaListo;
    const argumentos = cleanText.split(/\s+/).slice(1);
    const accion = (argumentos[0] || "").toLowerCase();

    if (/^https?:\/\//i.test(argumentos[0] || "")) {
      let r;
      try {
        r = await agregarPorLink(argumentos[0]);
      } catch (e) {
        return reply({ text: `❌ No pude consultar el sitio: ${e.message}` });
      }
      if (!r.ok) return reply({ text: `❌ No se agregó ninguna waifu: ${r.motivo}.` });
      for (const p of r.agregadas) etiquetarPersonaje(p.id, { evento: ETIQUETA_WAIFU });
      return reply({ text: `🎃 Se agregaron *${r.agregadas.length}* waifus nuevas y quedaron marcadas como premios del evento.` });
    }

    if (accion === "ultimas") {
      const n = Math.min(500, Math.max(1, parseInt(argumentos[1], 10) || 0));
      if (!n) return reply({ text: "⚙️ Uso: .waifusevento ultimas <cantidad>" });
      const ultimas = personajesDeCategoria("waifu").sort((a, b) => b.id - a.id).slice(0, n);
      for (const p of ultimas) etiquetarPersonaje(p.id, { evento: ETIQUETA_WAIFU });
      return reply({ text: `🎃 Se marcaron las últimas *${ultimas.length}* waifus agregadas como premios del evento.` });
    }

    if (accion === "marcar" || accion === "quitar") {
      const ids = argumentos.slice(1).map((x) => parseInt(x, 10)).filter((x) => x > 0);
      if (!ids.length) return reply({ text: `⚙️ Uso: .waifusevento ${accion} <id> <id> ...` });
      let hechos = 0;
      for (const id of ids) {
        const p = personajePorId(id);
        if (!p || p.categoria !== "waifu") continue;
        if (etiquetarPersonaje(id, { evento: accion === "marcar" ? ETIQUETA_WAIFU : null })) hechos++;
      }
      return reply({ text: `🎃 ${accion === "marcar" ? "Marcadas" : "Desmarcadas"} *${hechos}* de ${ids.length} waifus.` });
    }

    const todas = personajesDeCategoria("waifu").filter((p) => p.meta?.evento === ETIQUETA_WAIFU);
    const libres = todas.filter((p) => !propietarios(p.id).length);
    const porRareza = {};
    for (const p of libres) porRareza[p.rareza] = (porRareza[p.rareza] || 0) + 1;
    const lineas = Object.entries(porRareza).map(([r, n]) => `> ${r} ›› ${n}`);
    return reply({
      text: [
        encabezado("🎃", "WAIFUS DEL EVENTO"),
        "",
        `📚 *Marcadas* ›› ${todas.length}`,
        `🆓 *Libres para premios* ›› ${libres.length}`,
        ...lineas,
        "",
        `> Comunidad ›› ${totalComunidad()}/${META_COMUNIDAD}`,
        "> Usa *.waifusevento <link de danbooru>* para traer waifus nuevas, *.waifusevento ultimas <n>* para marcar las más recientes o *.waifusevento marcar <id>* para marcar waifus existentes."
      ].join("\n")
    });
  })
};

export default [muertos, waifusevento];
