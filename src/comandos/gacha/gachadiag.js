import { ownerGacha } from "../../../motores/gacha-owners.js";
import { gachaListo } from "../../../motores/gacha-core.js";
import { personajeAleatorio } from "../../../motores/gacha-db.js";
import { diagnosticarRed } from "../../../motores/gacha-diagnostico.js";
import { encabezado } from "../../../src/economia/estilo.js";

export default {
  names: [".gachadiag", ".diagnosticogacha"],
  desc: "Prueba la conexión que usa el gacha para descargar imágenes (solo owners)",
  category: "Gacha",
  usage: ".gachadiag",
  handler: ownerGacha(async ({ reply }) => {
    await gachaListo;
    const muestra = personajeAleatorio("waifu", {});
    if (!muestra) return reply({ text: "⚠️ No hay waifus cargadas para usar como muestra." });

    await reply({ text: "⏳ Ejecutando las pruebas de conexión. Tardan hasta 20 segundos." });
    const r = await diagnosticarRed(muestra.img);

    const lineas = [
      encabezado("🩺", "DIAGNÓSTICO DE RED"),
      "",
      "> Pruebas de la conexión que usa el gacha para descargar las imágenes de las waifus.",
      "",
      `🌐 *Internet general* ›› ${r.texto(r.general)}`,
      `🔎 *DNS ${r.host} (IPv4)* ›› ${r.texto(r.dns4)}`,
      `🔎 *DNS ${r.host} (IPv6)* ›› ${r.texto(r.dns6)}`,
      `📥 *Descarga directa* ›› ${r.texto(r.directa)}`,
      ...r.proxies.map((p) => `🛰️ *Proxy ${p.nombre}* ›› ${r.texto(p.resultado)}`),
      "",
      `> ${r.conclusion}`
    ];
    return reply({ text: lineas.join("\n") });
  })
};
