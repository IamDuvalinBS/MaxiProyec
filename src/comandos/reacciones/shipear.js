const BLOQUES = 10;
const ESPERA_MS = 2500;

const numero = (jid) => String(jid || "").split("@")[0].split(":")[0];

const contextoDe = (msg) => {
  const m = msg.message || {};
  return Object.values(m).find((v) => v?.contextInfo)?.contextInfo || {};
};

const barra = (pct) => {
  const llenos = Math.round((pct / 100) * BLOQUES);
  return "█".repeat(llenos) + "▒".repeat(BLOQUES - llenos) + pct + "%";
};

const frase = (pct) => {
  if (pct < 10) return "Entre ellos no existe ninguna conexión por ahora.";
  if (pct < 30) return "La compatibilidad es baja, aunque todo puede cambiar con el tiempo.";
  if (pct < 50) return "Hay cierta química, pero todavía les falta conocerse mejor.";
  if (pct < 70) return "Existe una buena compatibilidad, con potencial para algo más.";
  if (pct < 90) return "Tienen una conexión muy fuerte, hacen una excelente pareja.";
  return "Compatibilidad excepcional, parecen hechos el uno para el otro.";
};

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
  names: [".shipear", ".ship"],
  usage: ".shipear @usuario @usuario",
  desc: "Calcula el porcentaje de compatibilidad entre dos personas",
  category: "Diversión",
  handler: async ({ sock, from, sender, msg, reply }) => {
    const info = contextoDe(msg);
    const personas = [...new Set([...(info.mentionedJid || []), ...(info.participant ? [info.participant] : [])])];
    if (personas.length === 1) personas.unshift(sender);
    const pareja = personas.slice(0, 2);

    if (pareja.length < 2 || numero(pareja[0]) === numero(pareja[1])) {
      await reply({ text: "⧼💘⧽ *COMPATIBILIDAD*\n\nEtiqueta a dos personas para calcular su compatibilidad.\n\n> Usa *.shipear @usuario @usuario*." });
      return;
    }

    const enviado = await sock.sendMessage(from, { text: "*Calculando amor entre esas dos personas...*", mentions: pareja }, { quoted: msg });
    await esperar(ESPERA_MS);

    const pct = Math.round(Math.random() * 1000) / 10;
    const texto =
      `⧼💘⧽ *COMPATIBILIDAD*\n\n` +
      `@${numero(pareja[0])} 💞 @${numero(pareja[1])}\n\n` +
      `${barra(pct)}\n\n` +
      `${frase(pct)}\n\n` +
      `> Usa *.shipear @usuario @usuario* para calcular otra pareja.`;

    try {
      await sock.sendMessage(from, { text: texto, mentions: pareja, edit: enviado.key });
    } catch (e) {
      console.log("❌ Error editando el mensaje de .shipear: " + e.message);
      await sock.sendMessage(from, { text: texto, mentions: pareja }, { quoted: msg });
    }
  }
};
