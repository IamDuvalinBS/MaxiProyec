export default {
  names: [".p", ".ping"],
  desc: "Ver si el bot esta activo",
  category: "General",
  handler: async ({ sock, from, msg }) => {
    const inicio = Date.now();
    await sock.sendMessage(from, { text: "🏓 Pong..." }, { quoted: msg });
    const ms = Date.now() - inicio;
    await sock.sendMessage(from, { text:  }, { quoted: msg });
  }
};
