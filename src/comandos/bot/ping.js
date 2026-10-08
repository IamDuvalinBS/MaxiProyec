const UMBRAL_ALTO_MS = 500;

export default {
  names: [".p", ".ping"],
  desc: "Ver la latencia del bot",
  category: "General",
  handler: async ({ sock, from, msg }) => {
    await sock.sendMessage(from, { react: { text: "🏓", key: msg.key } });

    const inicio = Date.now();
    const enviado = await sock.sendMessage(from, { text: "📡 *Detectando latencia del bot...*" }, { quoted: msg });
    const ms = Date.now() - inicio;
    const estado = ms < UMBRAL_ALTO_MS ? "Normal" : "Alto";

    const texto = ["📡 *PING - ¡PONG! //Latencia*", `Ping:: *${ms}ms*`, `Estado:: *${estado}*`].join("\n");
    await sock.sendMessage(from, { text: texto, edit: enviado.key });
  }
};
