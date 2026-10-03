import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@fer2809fl/baileys";
import pino from "pino";
import http from "http";
import { manejarComando } from "./src/nucleo/comandos.js";
import { checkTriviaAnswer } from "./src/economia/trivia.js";
import { procesarEspera } from "./src/nucleo/espera.js";
import { config, manejarCambioParticipantes, procesarTextoAkinator } from "./core.js";
import { intentarProcesarTexto } from "./motores/juegos-core.js";

import readline from "readline";
import cfonts from "cfonts";
import chalk from "chalk";
import { iniciarAvisosRacha } from "./src/economia/avisos.js";
import { tieneAfk, desactivarAfk, textoSalidaAfk } from "./src/economia/afk.js";

function imprimirBanner() {
  console.clear();
  cfonts.say("MAXI-BOT", {
    font: "block",
    align: "center",
    gradient: ["cyan", "magenta"]
  });
  const firma = "powered by • It's Duva";
  const espacios = " ".repeat(Math.max(0, Math.floor((process.stdout.columns || 60) / 2) - Math.floor(firma.length / 2)));
  console.log(espacios + chalk.gray("powered by ") + chalk.cyanBright("• ") + chalk.magentaBright("It's Duva") + "\n");
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

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

process.on("uncaughtException", (err) => {
  console.log("Error no manejado (el bot sigue corriendo): " + err.message);
});
process.on("unhandledRejection", (err) => {
  console.log("Promesa rechazada sin manejar (el bot sigue corriendo): " + (err?.message || err));
});

let isConnecting = false;

let bannerImpreso = false;

async function startBot() {
  if (!bannerImpreso) {
    bannerImpreso = true;
    imprimirBanner();
  }

  if (isConnecting) {
    console.log(chalk.yellow("Ya hay un intento de conexion en curso, se ignora este pedido duplicado."));
    return;
  }
  isConnecting = true;

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
    defaultQueryTimeoutMs: 60000,
    markOnlineOnConnect: false
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
        const numero = (await question("\n📱 Ingresá el número a vincular (con código de país, sin +, sin espacios): ")).trim();
        const CODIGO_PERSONALIZADO = "MAXIBOTS";
        const code = await sock.requestPairingCode(numero, CODIGO_PERSONALIZADO);
        currentCode = code;
        codeTime = Date.now();
        console.log(chalk.bgMagenta.white.bold(" CODIGO DE VINCULACION ") + " " + chalk.bold.cyanBright(code));
      } catch (e) {
        console.log("Error pidiendo el codigo: " + e.message);
        pairingRequested = false;
      }
    }

    if (connection === "close") {
      const statusCode = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output
        ? lastDisconnect.error.output.statusCode
        : "sin codigo";
      console.log(chalk.red("Conexion cerrada. Codigo: " + statusCode));
      pairingRequested = false;
      isConnecting = false;
      setTimeout(startBot, 10000);
    } else if (connection === "open") {
      currentCode = "CONECTADO";
      isConnecting = false;
      console.log(chalk.greenBright.bold("✔ Bot conectado a WhatsApp"));
      iniciarAvisosRacha(sock);
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("group-participants.update", async (update) => {
    try {
      await manejarCambioParticipantes(sock, update);
    } catch (e) {
      console.log("Error en aviso de admin: " + e.message);
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const sender = msg.key.fromMe
      ? sock.user.id.split(":")[0] + "@s.whatsapp.net"
      : (msg.key.participant || msg.key.remoteJid);

    const idBotonPulsado =
      msg.message.buttonsResponseMessage?.selectedButtonId ||
      msg.message.templateButtonReplyMessage?.selectedId ||
      null;

    if (idBotonPulsado) {
      await manejarComando(sock, from, sender, idBotonPulsado.trim(), msg);
      return;
    }

    const text = (
      msg.message.conversation ||
      (msg.message.extendedTextMessage ? msg.message.extendedTextMessage.text : "") ||
      (msg.message.imageMessage ? msg.message.imageMessage.caption : "") ||
      (msg.message.documentMessage ? msg.message.documentMessage.caption : "") ||
      (msg.message.documentWithCaptionMessage?.message?.documentMessage?.caption || "") ||
      ""
    ).trim();

    if (!msg.key.fromMe) {
      sock.sendPresenceUpdate("composing", from)
        .then(() => new Promise(r => setTimeout(r, 1500 + Math.floor(Math.random() * 1000))))
        .then(() => sock.sendPresenceUpdate("paused", from))
        .catch(() => {});
    }

    const prefijosConfigurados = (config.prefixes && config.prefixes.length)
      ? config.prefixes
      : [config.prefix || "."];
    const prefijoUsado = [...prefijosConfigurados]
      .sort((a, b) => b.length - a.length)
      .find((p) => text.startsWith(p));

    if (!msg.key.fromMe && m.type === "notify" && tieneAfk(sender)) {
      const tipoMensaje = Object.keys(msg.message)[0];
      const ignorado = ["protocolMessage", "reactionMessage", "senderKeyDistributionMessage"].includes(tipoMensaje);
      const esComandoAfk = prefijoUsado && /^\s*afk(\s|$)/i.test(text.slice(prefijoUsado.length));
      if (!ignorado && !esComandoAfk) {
        const datos = desactivarAfk(sender);
        await sock.sendMessage(from, { text: textoSalidaAfk(sender, datos), mentions: [sender] }, { quoted: msg });
      }
    }

    if (prefijoUsado) {
      const resto = text.slice(prefijoUsado.length);
      const match = resto.match(/^\s*(\S+)([\s\S]*)$/);
      const textoTraducido = match
        ? "." + match[1].toLowerCase() + match[2]
        : "." + resto;
      await manejarComando(sock, from, sender, textoTraducido, msg);
    } else {
      const clave = `${from}:${sender}`;
      if (await procesarEspera(clave, text, { sock, from, sender, msg })) return;

      const fueAkinator = await procesarTextoAkinator(sock, from, sender, text, msg);
      if (!fueAkinator) {
        const fueJugada = await intentarProcesarTexto(sock, from, sender, text, msg);
        if (!fueJugada) {
          await checkTriviaAnswer(sock, from, sender, text, msg);
        }
      }
    }
  });
}

startBot();
             
