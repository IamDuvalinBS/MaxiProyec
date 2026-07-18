import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import pino from "pino";
import http from "http";
import { handleEconomyCommand, checkTriviaAnswer } from "./economia.js";

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

  console.log("Intentando conectar con WhatsApp...");

  sock.ev.on("connection.update", async (update) => {
    const connection = update.connection;
    const lastDisconnect = update.lastDisconnect;
    const qr = update.qr;

    if (connection) {
      console.log("Estado de conexion: " + connection);
    }

    if (qr && !sock.authState.creds.registered && !pairingRequested) {
      pairingRequested = true;
      try {
        const code = await sock.requestPairingCode(PHONE_NUMBER);
        currentCode = code;
        codeTime = Date.now();
        console.log("CODIGO GENERADO: " + code);
      } catch (e) {
        console.log("Error pidiendo el codigo: " + e.message);
        pairingRequested = false;
      }
    }

    if (connection === "close") {
      const statusCode = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output
        ? lastDisconnect.error.output.statusCode
        : "sin codigo";
      console.log("Conexion cerrada. Codigo: " + statusCode);
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
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const text = (
      msg.message.conversation ||
      (msg.message.extendedTextMessage ? msg.message.extendedTextMessage.text : "") ||
      (msg.message.imageMessage ? msg.message.imageMessage.caption : "") ||
      ""
    ).trim();

    if (text.startsWith(".")) {
      await handleEconomyCommand(sock, from, sender, text, msg);
    } else {
      await checkTriviaAnswer(sock, from, sender, text, msg);
    }
  });
}

startBot();
  
startBot();
