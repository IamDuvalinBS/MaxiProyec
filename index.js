import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import pino from "pino";
import http from "http";

// Tu número completo con código de país, sin +, sin espacios, sin guiones
const PHONE_NUMBER = "529616050619";

let currentCode = "Todavia no generado, esperando...";
let codeTime = null;
let pairingRequested = false;

const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    const segundos = codeTime ? Math.floor((Date.now() - codeTime) / 1000) : null;
    res.end(`
      <html>
        <head><meta http-equiv="refresh" content="3"></head>
        <body style="font-family:sans-serif;text-align:center;margin-top:50px;">
          <h1>Codigo de vinculacion</h1>
          <h2 style="font-size:48px;letter-spacing:5px;">${currentCode}</h2>
          ${segundos !== null ? `<p>Generado hace ${segundos} segundos</p>` : ""}
          <p>Esta pagina se actualiza sola cada 3 segundos.</p>
        </body>
      </html>
    `);
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
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    keepAliveIntervalMs: 10000,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000
  });

  sock.ev.on("connection.update", async (update) => {
    const connection = update.connection;
    const lastDisconnect = update.lastDisconnect;
    const qr = update.qr;

    if (qr && !sock.authState.creds.registered && !pairingRequested) {
      pairingRequested = true;
      try {
        const code = await sock.requestPairingCode(PHONE_NUMBER);
        currentCode = code;
        codeTime = Date.now();
        console.log("CODIGO GENERADO: " + code);
      } catch (e) {
        console.log("Error pidiendo el codigo: " + e.message);
        currentCode = "Error, esperando reintento...";
        pairingRequested = false;
      }
    }

    if (connection === "close") {
      const statusCode = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output
        ? lastDisconnect.error.output.statusCode
        : "sin codigo";
      const reason = lastDisconnect && lastDisconnect.error ? lastDisconnect.error.message : "desconocido";
      console.log("Conexion cerrada. Codigo: " + statusCode + ". Motivo: " + reason);
      pairingRequested = false;
      setTimeout(startBot, 10000);
    } else if (connection === "open") {
      currentCode = "CONECTADO";
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
             
