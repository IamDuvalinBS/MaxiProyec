import { ownerGacha } from "../../../motores/gacha-owners.js";
import { agregarPorLink, MAX_POSTS_POR_DEFECTO } from "../../../motores/gacha-yandere.js";
import { gachaListo, enviarPersonaje, registrarPendiente, tarjeta, EXCLUSIVO_MS, fmt } from "../../../motores/gacha-core.js";

let ocupado = false;

const USO = [
  "⚙️ Uso: .yandere <link de danbooru.donmai.us> [máximo de posts]",
  "",
  "> Acepta un post, una búsqueda, un pool o la wiki de una serie.",
  `> En series y búsquedas revisa *todos* los posts (hasta ${fmt(MAX_POSTS_POR_DEFECTO)} por defecto, ordenados por popularidad), agrega todos los personajes y guarda una galería de fotos de cada uno.`,
  "> Si el personaje ya existe, solo le suma las fotos que le falten.",
  "",
  "Ejemplo: .yandere https://danbooru.donmai.us/wiki_pages/mahou_shoujo_madoka_magica 100000"
].join("\n");

export default {
  names: [".yandere", ".danbooru"],
  desc: "Agrega waifus desde un link de Danbooru: post, búsqueda, pool o wiki de una serie completa (solo owners)",
  category: "Owner",
  usage: ".yandere <link> [máximo de posts]",
  handler: ownerGacha(async ({ from, sender, cleanText, reply }) => {
    await gachaListo;
    const [, link, maxTexto] = cleanText.split(/\s+/);
    if (!link) return reply({ text: USO });
    if (ocupado) return reply({ text: "⏳ Ya hay una carga en curso, espera a que termine." });

    const max = Math.max(1, parseInt(maxTexto, 10) || MAX_POSTS_POR_DEFECTO);

    ocupado = true;
    try {
      await reply({ text: "🔎 Revisando los posts de Danbooru. Si es una serie grande puede tardar varios minutos, te aviso cuando termine." });
      const alProgreso = async ({ vistos, total, personajes }) => {
        const de = total ? ` de ${fmt(total)}` : "";
        await reply({ text: `⏳ Van *${fmt(vistos)}*${de} posts revisados y *${fmt(personajes)}* personajes encontrados...` });
      };

      let r;
      try {
        r = await agregarPorLink(link, { max, alProgreso });
      } catch (e) {
        return reply({ text: `❌ No pude consultar el sitio: ${e.message}` });
      }
      if (!r.ok) return reply({ text: `❌ No se agregó nada: ${r.motivo}.` });

      const resumen = [
        `📥 *Personajes nuevos* ›› ${fmt(r.agregadas.length)}`,
        `🔁 *Personajes que ya existían* ›› ${fmt(r.actualizadas.length)}`,
        `🖼️ *Fotos agregadas* ›› ${fmt(r.fotosNuevas)}`
      ];
      if (r.vistos) resumen.push(`🔎 *Posts revisados* ›› ${fmt(r.vistos)}${r.total ? ` de ${fmt(r.total)}` : ""}`);
      if (r.incompleto) resumen.push(`⚠️ La revisión se detuvo antes de terminar: ${r.incompleto}. Vuelve a usar el comando para continuar.`);

      if (r.agregadas.length > 1 || !r.agregadas.length) {
        const lineas = r.agregadas.slice(0, 25).map((p, i) => `${i + 1}. *${p.nombre}* — ${p.serie} (${fmt(p.valor)})`);
        if (r.agregadas.length > 25) lineas.push(`… y ${fmt(r.agregadas.length - 25)} más`);
        return reply({ text: tarjeta({ emoji: "📥", titulo: `WAIFUS AGREGADAS ${r.agregadas.length}`, lineas: [...resumen, "", ...lineas] }) });
      }

      const personaje = r.agregadas[0];
      try {
        const enviado = await enviarPersonaje({
          reply, personaje, titulo: "WAIFU AGREGADA",
          lineasExtra: [`✅ Guardada en la base con ${fmt(r.fotosNuevas)} fotos. Responde con *.claim* para reclamarla (${EXCLUSIVO_MS / 1000}s).`]
        });
        if (enviado?.key?.id) registrarPendiente(enviado.key.id, from, personaje, sender);
      } catch (e) {
        await reply({ text: `✅ *${personaje.nombre}* se guardó en la base, pero no pude descargar la imagen para mostrarla.` });
      }
    } finally {
      ocupado = false;
    }
  })
};
