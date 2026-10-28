import { gachaListo, arroba } from "../../../motores/gacha-core.js";
import { AUTOMATICAS, insigniasDe, revisarInsignias, tieneInsignia, listaExclusivas } from "../../../motores/gacha-insignias.js";
import { encabezado } from "../../../src/economia/estilo.js";
import { T } from "../../../motores/gacha-tema.js";
import { getProfile } from "../../../motores/profile.js";
import { htmlPerfilDe } from "../../../motores/perfil-gacha-datos.js";
import { candidatosDeUsuario, buscarUsuarioConDatos } from "../../../motores/gacha-usuario.js";
import { filasUsuario } from "../../../motores/gacha-db.js";
import { revisarInsigniasHalloween } from "../../../motores/gacha-halloween-misiones.js";
import { construirDatosLogros } from "../../../motores/logros-datos.js";
import { htmlLogros } from "../../../motores/logros-html.js";

const insignias = {
  names: [".insignias", ".badges"],
  desc: "Muestra tus insignias del gacha o las de otra persona: .insignias [@usuario]",
  category: "Gacha",
  usage: ".insignias [@usuario]",
  handler: async ({ sock, from, sender, msg, reply }) => {
    await gachaListo;
    const contexto = msg.message?.extendedTextMessage?.contextInfo;
    const mencionado = contexto?.mentionedJid?.[0] || contexto?.participant || null;
    const propio = !mencionado || mencionado === sender;
    const objetivo = propio
      ? await buscarUsuarioConDatos(candidatosDeUsuario(sock, msg, sender), (u) => filasUsuario(u).length, "insignias")
      : mencionado;
    if (propio) { revisarInsignias(objetivo); revisarInsigniasHalloween(objetivo); }

    if (typeof sock.sendHtml === "function") {
      try {
        const nombre = (propio && msg?.pushName) || getProfile(objetivo).name || objetivo.split("@")[0];
        await sock.sendHtml(from, await htmlPerfilDe(objetivo, { nombre, tabInicial: "ins" }), [], undefined, {});
        return;
      } catch (e) {
        console.log("[insignias] ERROR: " + e.stack);
      }
    }

    const tiene = insigniasDe(objetivo);
    const exclusivas = tiene.filter((i) => i.exclusiva);
    const automaticas = tiene.filter((i) => !i.exclusiva);
    const total = AUTOMATICAS.length;

    const lineas = [
      encabezado("🏅", T("INSIGNIAS", "INSIGNIAS DE LA NOCHE")),
      "",
      `> Insignias de ${arroba(objetivo)}. Automáticas: *${automaticas.length}/${total}*.`,
      ""
    ];

    const deTemporada = exclusivas.filter((i) => i.temporada);
    const otras = exclusivas.filter((i) => !i.temporada);
    if (deTemporada.length) {
      lineas.push(T("🍂 *De temporada* ››", "🎃 *De temporada (Halloween)* ››"));
      for (const i of deTemporada) lineas.push(`> ${i.emoji} *${i.nombre}* · ${i.desc}`);
      lineas.push("");
    }
    if (otras.length) {
      lineas.push("💠 *Exclusivas* ››");
      for (const i of otras) lineas.push(`> ${i.emoji} *${i.nombre}* · ${i.desc}`);
      lineas.push("");
    }

    lineas.push("🏆 *Automáticas* ››");
    for (const i of AUTOMATICAS) {
      const logrado = tieneInsignia(objetivo, i.id);
      lineas.push(logrado ? `> ${i.emoji} *${i.nombre}* · ${i.desc}` : `> 🔒 ${i.nombre} · ${i.desc}`);
    }

    const existentes = listaExclusivas().filter((i) => !i.temporada).length;
    lineas.push("", `> Las insignias exclusivas solo las entrega el equipo del bot por eventos, torneos y temporadas${existentes ? ` (hay ${existentes} creadas hasta ahora)` : ""}.`);
    return reply({ text: lineas.join("\n"), mentions: [objetivo] });
  }
};

const logros = {
  names: [".logros", ".achievements"],
  desc: "Tu panel de logros: misiones de Halloween, insignias de temporada y progreso de cada logro: .logros [@usuario]",
  category: "Gacha",
  usage: ".logros [@usuario]",
  handler: async (ctx) => {
    const { sock, from, sender, msg, reply } = ctx;
    await gachaListo;
    const contexto = msg.message?.extendedTextMessage?.contextInfo;
    const mencionado = contexto?.mentionedJid?.[0] || contexto?.participant || null;
    const propio = !mencionado || mencionado === sender;
    const objetivo = propio
      ? await buscarUsuarioConDatos(candidatosDeUsuario(sock, msg, sender), (u) => filasUsuario(u).length, "logros")
      : mencionado;
    if (propio) revisarInsignias(objetivo);

    if (typeof sock.sendHtml === "function") {
      try {
        const nombre = (propio && msg?.pushName) || getProfile(objetivo).name || objetivo.split("@")[0];
        await sock.sendHtml(from, htmlLogros(construirDatosLogros(objetivo, { nombre })), [], undefined, {});
        return;
      } catch (e) {
        console.log("[logros] ERROR: " + e.stack);
      }
    }
    return insignias.handler(ctx);
  }
};

export default [insignias, logros];
