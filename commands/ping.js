export default {
  names: [".p", ".ping"],
  usage: ".p / .ping",
  desc: "Ver la latencia del bot",
  category: "General",
  handler: async ({ sock, from, msg }) => {
    // Reacciona al mensaje del usuario que puso .p / .ping
    await sock.sendMessage(from, { react: { text: "🏓", key: msg.key } });

    const inicio = Date.now();
    const enviado = await sock.sendMessage(
      from,
      { text: "📡 *Detectando latencia del bot...*" },
      { quoted: msg }
    );

    const ms = Date.now() - inicio;
    const estado = ms < 500 ? "Normal" : "Alto"; // ajustable segun tu umbral

    const texto =
      `📡 *LATENCIA - PING*\n` +
      `Ping:: *${ms}ms*\n` +
      `Estado:: *${estado}*`;

    // Edita el mismo mensaje "Detectando..." con el resultado final
    await sock.sendMessage(from, { text: texto, edit: enviado.key });
  }
};
