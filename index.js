import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import pino from "pino";
import http from "http";

// Servidor web mínimo, requerido por Render para mantener el proyecto activo
const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot activo ✅");
  })
  .listen(PORT, () => console.log(`Servidor web escuchando en el puerto ${PORT}`));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    auth: state,
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"]
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("Escaneá este código QR con tu WhatsApp:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const reason = lastDisconnect?.error?.message || "desconocido";
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`❌ Conexión cerrada. Código: ${statusCode}. Motivo: ${reason}. Reconectando: ${shouldReconnect}`);

      if (shouldReconnect) {
        setTimeout(startBot, 5000);
      } else {
        console.log("Sesión cerrada (logout). Borra la carpeta auth_info y volvé a escanear el QR.");
      }
    } else if (connection === "open") {
      console.log("✅ Bot conectado a WhatsApp");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    console.log(`Mensaje de ${from}: ${text}`);

    if (text.toLowerCase() === "hola") {
      await sock.sendMessage(from, { text: "¡Hola! El bot está funcionando 🎉" });
    }
  });
}

startBot();
