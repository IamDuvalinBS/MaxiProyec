import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import pino from "pino";
import http from "http";

// CAMBIA ESTO por tu número completo con código de país, sin +, sin espacios
// Ejemplo Argentina: 5491122334455 | Ejemplo México: 5215512345678
const PHONE_NUMBER = "529616050619";

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

  // Si todavía no está registrado, pedimos el código de emparejamiento
  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(PHONE_NUMBER);
        console.log("=========================================");
        console.log("TU CODIGO DE VINCULACION ES: " + code);
        console.log("=========================================");
      } catch (e) {
        console.log("Error pidiendo el codigo: " + e.message);
      }
    }, 3000);
  }

  sock.ev.on("connection.update", (update) => {
    const connection = update.connection;
    const lastDisconnect = update.lastDisconnect;

    if (connection === "close") {
      const statusCode = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output
        ? lastDisconnect.error.output.statusCode
        : "sin codigo";
      const reason = lastDisconnect && lastDisconnect.error ? lastDisconnect.error.message : "desconocido";
      console.log("Conexion cerrada. Codigo: " + statusCode + ". Motivo: " + reason);

      if (statusCode !== DisconnectReason.loggedOut) {
        setTimeout(startBot, 5000);
      } else {
        console.log("Sesion cerrada. Hay que volver a pedir el codigo.");
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
             
