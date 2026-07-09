import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import pino from "pino";
import http from "http";

const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot activo");
  })
  .listen(PORT, () => console.log("Servidor web escuchando en el puerto " + PORT));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    auth: state,
    version: version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"]
  });

  sock.ev.on("connection.update", (update) => {
    const connection = update.connection;
    const qr = update.qr;
    const lastDisconnect = update.lastDisconnect;

    if (qr) {
      console.log("Escaneá este QR:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const statusCode = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output
        ? lastDisconnect.error.output.statusCode
        : "sin codigo";
      const reason = lastDisconnect && lastDisconnect.error ? lastDisconnect.error.message : "desconocido";
      console.log("Conexion cerrada. Codigo: " + statusCode + ". Motivo: " + reason);

      if (statusCode !== DisconnectReason.loggedOut) {
        setTimeout(startBot, 5000);
      } else {
        console.log("Sesion cerrada. Hay que volver a escanear el QR.");
      }
    } else if (connection === "open") {
      console.log("Bot conectado a WhatsApp");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || (msg.message.extendedTextMessage ? msg.message.extendedTextMessage.text : "");

    if (text && text.toLowerCase() === "hola") {
      await sock.sendMessage(from, { text: "Hola! El bot esta funcionando" });
    }
  });
}

startBot();
