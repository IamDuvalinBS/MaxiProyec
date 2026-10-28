import { pityMaximoDe } from "../../../motores/gacha-reliquias.js";
import { gachaListo, arroba, monto, fmt, CAT } from "../../../motores/gacha-core.js";
import { filasUsuario } from "../../../motores/gacha-db.js";
import { ticketsDe } from "../../../motores/gacha-tickets.js";
import { fragmentosDe } from "../../../motores/gacha-niveles.js";
import { pityDe } from "../../../motores/gacha-banner.js";
import { misionesDe } from "../../../motores/gacha-misiones.js";
import { estadistica, insigniasDe, revisarInsignias, AUTOMATICAS } from "../../../motores/gacha-insignias.js";
import { PITY_TIRADAS } from "../../../motores/gacha-config.js";
import { encabezado } from "../../../src/economia/estilo.js";
import { T } from "../../../motores/gacha-tema.js";
import { getProfile } from "../../../motores/profile.js";
import { htmlPerfilDe } from "../../../motores/perfil-gacha-datos.js";
import { candidatosDeUsuario, buscarUsuarioConDatos } from "../../../motores/gacha-usuario.js";

export default {
  names: [".perfilgacha", ".gachaperfil", ".micolecciongacha"],
  desc: "Muestra el perfil de coleccionista de una persona: .perfilgacha [@usuario]",
  category: "Gacha",
  usage: ".perfilgacha [@usuario]",
  handler: async ({ sock, from, sender, msg, reply }) => {
    await gachaListo;
    const contexto = msg.message?.extendedTextMessage?.contextInfo;
    const mencionado = contexto?.mentionedJid?.[0] || contexto?.participant || null;
    const propio = !mencionado || mencionado === sender;
    const objetivo = propio
      ? await buscarUsuarioConDatos(candidatosDeUsuario(sock, msg, sender), (u) => filasUsuario(u).length, "perfilgacha")
      : mencionado;
    if (propio) revisarInsignias(objetivo);

    if (typeof sock.sendHtml === "function") {
      try {
        const nombre = (propio && msg?.pushName) || getProfile(objetivo).name || objetivo.split("@")[0];
        await sock.sendHtml(from, await htmlPerfilDe(objetivo, { nombre }), [], msg, {});
        return;
      } catch (e) {
        console.log("[perfilgacha] ERROR: " + e.stack);
      }
    }

    const filas = filasUsuario(objetivo);
    const porCategoria = {};
    let valor = 0;
    let estrellas = 0;
    for (const f of filas) {
      porCategoria[f.categoria] = (porCategoria[f.categoria] || 0) + 1;
      valor += f.valor;
      estrellas += f.estrellas || 0;
    }

    const insignias = insigniasDe(objetivo);
    const misiones = misionesDe(objetivo);
    const lineas = [
      encabezado("🪪", T("PERFIL DE COLECCIONISTA", "PERFIL DE CAZADOR DE ALMAS")),
      "",
      `> Perfil de ${arroba(objetivo)}.`,
      "",
      `🎴 *Personajes* ›› ${fmt(filas.length)}`,
      T(`💎 *Valor total* ›› ${monto(valor)}`, `💎 *Tesoro total* ›› ${monto(valor)}`),
      `🌟 *Estrellas de ascensión* ›› ${fmt(estrellas)}`,
      `🧩 *Fragmentos* ›› ${fmt(fragmentosDe(objetivo))}`,
      ""
    ];

    for (const clave of Object.keys(CAT)) {
      const cat = CAT[clave];
      const n = porCategoria[clave] || 0;
      const tickets = ticketsDe(objetivo, clave);
      lineas.push(`${cat.emoji} *${cat.titulo}* ›› ${fmt(n)} · 🎟️ ${tickets} · 🍀 ${pityDe(objetivo, clave)}/${pityMaximoDe(objetivo)}`);
    }

    lineas.push(
      "",
      `⚔️ *Victorias PvP* ›› ${fmt(estadistica(objetivo, "pvp_victorias"))}`,
      `🛡️ *Victorias por equipos* ›› ${fmt(estadistica(objetivo, "equipos_victorias"))}`,
      `📋 *Misiones de hoy* ›› ${misiones.filter((m) => m.completa).length}/${misiones.length}`,
      `🏅 *Insignias* ›› ${insignias.length} (${AUTOMATICAS.length} automáticas disponibles)`
    );
    const exclusivas = insignias.filter((i) => i.exclusiva);
    if (exclusivas.length) lineas.push(`💠 *Exclusivas* ›› ${exclusivas.map((i) => `${i.emoji} ${i.nombre}`).join(", ")}`);
    lineas.push("", "> 🎟️ tickets · 🍀 progreso de garantía. Mira tus insignias con *.insignias*.");
    return reply({ text: lineas.join("\n"), mentions: [objetivo] });
  }
};
