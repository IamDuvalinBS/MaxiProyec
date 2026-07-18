export default {
  names: [".p", ".ping"],
  desc: "Ver la latencia del bot",
  category: "General",
  handler: async ({ sock, from, msg }) => {
    const inicio = Date.now();
    await sock.sendMessage(from, { text: "🏓 Pong..." }, { quoted: msg });
    const ms = Date.now() - inicio;
    await sock.sendMessage(from, { text: `🏓 Pong! *${ms}ms*` }, { quoted: msg });
  }
};
