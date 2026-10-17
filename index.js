import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@fer2809fl/baileys";
import pino from "pino";
import http from "http";
import { manejarComando } from "./src/nucleo/comandos.js";
import { checkTriviaAnswer } from "./src/economia/triviaR.js";
import { procesarEspera } from "./src/nucleo/espera.js";
import { config, manejarCambioParticipantes, getAllAccounts, commandRegistry, startTime, CURRENCY } from "./core.js";
import fs from "fs";
import { intentarProcesarTexto } from "./motores/juegos-core.js";

import readline from "readline";
import cfonts from "cfonts";
import chalk from "chalk";
import { iniciarAvisosRacha } from "./src/economia/avisos.js";
import { tieneAfk, desactivarAfk, textoSalidaAfk } from "./src/economia/afk.js";
import { idDeRespuestaInteractiva } from "./motores/respuestas-botones.js";
import { manejarParticipantes } from "./src/eventos/participantes.js";
import { antilinkActivo, botApagado } from "./src/grupos/estado.js";
import { eliminarEnlace } from "./src/grupos/enlaces.js";
import { olvidarMetadatos } from "./src/grupos/nucleo.js";
import { recordarNombre } from "./motores/profile.js";
import { iniciarChatPagina } from "./src/nucleo/chatpagina.js";
import { pasesParaPagina, pasesReclamados, alReclamarPase } from "./motores/gacha-pases.js";

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

let ultimaSalida = Date.now();
const escribirOriginal = process.stdout.write.bind(process.stdout);
process.stdout.write = (...args) => {
  ultimaSalida = Date.now();
  return escribirOriginal(...args);
};

async function esperarSilencio(msSilencio = 5000, maxMs = 60000) {
  const inicio = Date.now();
  while (Date.now() - ultimaSalida < msSilencio && Date.now() - inicio < maxMs) {
    await new Promise((r) => setTimeout(r, 500));
  }
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
  .on("error", (e) => {
    if (e.code !== "EADDRINUSE") return console.log("Error del servidor web: " + e.message);
    console.log("❌ Ya hay otra copia del bot encendida (puerto ocupado). Ciérrala con: pkill -f node");
    process.exit(1);
  })
  .listen(PORT, () => console.log("Servidor web escuchando en el puerto " + PORT));

process.on("uncaughtException", (err) => {
  console.log("Error no manejado (el bot sigue corriendo): " + err.message);
});
process.on("unhandledRejection", (err) => {
  console.log("Promesa rechazada sin manejar (el bot sigue corriendo): " + (err?.message || err));
});


// ═══════════════ CONEXIÓN CON LA PÁGINA (Firebase) ═══════════════
// Sube el estado del bot, la lista de comandos y los datos de las cuentas vinculadas.
// Si no hay llave de Firebase o algo falla, el bot sigue funcionando normal.
const PAG = { fs: null, FV: null, sock: null, enLinea: false, grupos: 0, msgsHoy: 0, dia: new Date().toDateString(), vinc: new Map(), ult: {} };
const logPag = (e) => console.log("Página: " + (e?.message || e));

async function iniciarPagina() {
  try {
    const clave = process.env.FIREBASE_KEY
      ? JSON.parse(process.env.FIREBASE_KEY)
      : JSON.parse(fs.readFileSync("./firebase-key.json", "utf8"));
    const admin = (await import("firebase-admin")).default;
    admin.initializeApp({ credential: admin.credential.cert(clave) });
    PAG.fs = admin.firestore();
    PAG.FV = admin.firestore.FieldValue;
    PAG.fs.collection("botlink").onSnapshot((s) => {
      PAG.vinc = new Map(s.docs.map((d) => [d.id, { jid: d.data().jid }]));
      for (const u of Object.keys(PAG.ult)) if (!PAG.vinc.has(u)) delete PAG.ult[u];
      for (const u of PAG.vinc.keys()) sincronizarCuenta(u);
    }, logPag);
    console.log(chalk.greenBright("✔ Conectado a la página (Firebase)"));
    subirEstado();
    setInterval(subirEstado, 60000);
    setTimeout(subirComandos, 20000);
    setTimeout(subirPases, 20000);
    setInterval(subirPases, 10 * 60000);
    alReclamarPase((jid) => { for (const [u, v] of PAG.vinc) if (v.jid === jid) sincronizarCuenta(u); });   // la página ve el pase reclamado al instante
    setInterval(subirComandos, 10 * 60000);
    setInterval(() => { for (const u of PAG.vinc.keys()) sincronizarCuenta(u); }, 2 * 60000);
    setInterval(contarGrupos, 30 * 60000);
    try {   // chat con el bot desde la sección Chats de la página
      const { Timestamp } = await import("firebase-admin/firestore");
      iniciarChatPagina({ PAG, Timestamp, config, commandRegistry, getAllAccounts, manejarComando, procesarEspera, intentarProcesarTexto, checkTriviaAnswer });
      console.log(chalk.greenBright("✔ Chat de la página activo"));
    } catch (e) { console.log("Chat de la página no iniciado: " + e.message); }
  } catch (e) {
    console.log("Página no conectada (el bot sigue normal): " + e.message);
  }
}

function subirEstado() {
  if (!PAG.fs) return;
  if (PAG.dia !== new Date().toDateString()) { PAG.dia = new Date().toDateString(); PAG.msgsHoy = 0; }
  PAG.fs.collection("bot").doc("estado").set({
    nombre: config.botNameShort || "Bot",
    enLinea: PAG.enLinea,
    grupos: PAG.grupos,
    mensajesHoy: PAG.msgsHoy,
    cuentas: getAllAccounts().size,
    inicio: startTime,
    t: PAG.FV.serverTimestamp()
  }, { merge: true }).catch(logPag);
}

async function contarGrupos() {
  try { if (PAG.sock && PAG.enLinea) { PAG.grupos = Object.keys(await PAG.sock.groupFetchAllParticipating()).length; subirEstado(); } }
  catch (e) { /* no pasa nada, se intenta después */ }
}

function subirComandos() {
  if (!PAG.fs) return;
  const lista = [...commandRegistry.values()].map((c) => ({
    n: c.names[0],
    a: c.names.slice(1, 4),
    d: String(c.desc || "").slice(0, 160),
    c: c.category || "General",
    u: String(c.usage || c.names[0]).slice(0, 80)
  }));
  if (!lista.length) return;
  lista.push({ n: "vincular", a: [], d: "Vincula tu WhatsApp con tu cuenta de la página", c: "Página", u: ".vincular CÓDIGO" });
  PAG.fs.collection("bot").doc("comandos").set({ lista, t: PAG.FV.serverTimestamp() }).catch(logPag);
}

let ultPases = "";
function subirPases() {
  if (!PAG.fs) return;
  const lista = pasesParaPagina(), firma = JSON.stringify(lista);
  if (firma === ultPases) return;          // solo escribe si algo cambió
  PAG.fs.collection("bot").doc("pases").set({ lista, t: PAG.FV.serverTimestamp() }).then(() => { ultPases = firma; }).catch(logPag);
}

function sincronizarCuenta(uid) {
  const v = PAG.vinc.get(uid);
  if (!PAG.fs || !v) return;
  const acc = getAllAccounts().get(v.jid) || {}, pr = acc.profile || {};
  const datos = {
    wallet: Math.floor(acc.wallet || 0), bank: Math.floor(acc.bank || 0),
    nivel: pr.level || 1, xp: pr.xp || 0, nombre: String(pr.name || "").slice(0, 30), moneda: CURRENCY,
    pases: pasesReclamados(v.jid)
  };
  const firma = JSON.stringify(datos);
  if (PAG.ult[uid] === firma) return;          // solo escribe si algo cambió
  PAG.ult[uid] = firma;
  PAG.fs.collection("botperfil").doc(uid).set({ ...datos, t: PAG.FV.serverTimestamp() }).catch(logPag);
}

// .vincular CÓDIGO  → enlaza este WhatsApp con la cuenta de la página que generó el código
async function vincularPagina(sock, from, sender, resto, msg) {
  const m = resto.match(/^\s*vincular(?:\s+([A-Za-z0-9]+))?\s*$/i);
  if (!m) return false;
  const resp = (t) => sock.sendMessage(from, { text: t }, { quoted: msg }).catch(() => {});
  if (!PAG.fs) { await resp("La conexión con la página no está activa ahora mismo."); return true; }
  const codigo = (m[1] || "").toUpperCase();
  if (!codigo) { await resp("Entra a la página → Mi perfil → Mi WhatsApp, genera tu código y envía:\n.vincular CÓDIGO"); return true; }
  try {
    const ref = PAG.fs.collection("vinculos").doc(codigo), d = await ref.get();
    if (!d.exists || (d.data().exp || 0) < Date.now()) {
      if (d.exists) await ref.delete();
      await resp("Ese código no existe o ya venció. Genera uno nuevo en la página.");
      return true;
    }
    const { uid, nombre } = d.data();
    for (const [otro, v] of PAG.vinc) {          // un WhatsApp solo puede estar en una cuenta
      if (v.jid === sender && otro !== uid) {
        await PAG.fs.collection("botlink").doc(otro).delete();
        await PAG.fs.collection("botperfil").doc(otro).delete().catch(() => {});
      }
    }
    await PAG.fs.collection("botlink").doc(uid).set({ jid: sender, t: PAG.FV.serverTimestamp() });
    await ref.delete();
    PAG.vinc.set(uid, { jid: sender }); delete PAG.ult[uid]; sincronizarCuenta(uid);
    await resp(`✅ Listo, tu WhatsApp quedó vinculado con *${nombre || "tu cuenta"}* de la página.`);
  } catch (e) {
    logPag(e);
    await resp("No pude vincular ahora mismo. Intenta de nuevo en un momento.");
  }
  return true;
}
iniciarPagina();
// ═════════════════════════════════════════════════════════════════

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
    markOnlineOnConnect: false,
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
    generateHighQualityLinkPreview: false
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
        await esperarSilencio();
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
      PAG.enLinea = false; subirEstado();
      setTimeout(startBot, 10000);
    } else if (connection === "open") {
      currentCode = "CONECTADO";
      isConnecting = false;
      console.log(chalk.greenBright.bold("✔ Bot conectado a WhatsApp"));
      iniciarAvisosRacha(sock);
      PAG.sock = sock; PAG.enLinea = true; contarGrupos(); subirEstado();
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("group-participants.update", async (update) => {
    try {
      await manejarCambioParticipantes(sock, update);
    } catch (e) {
      console.log("Error en aviso de admin: " + e.message);
    }
    try {
      if (!botApagado(update.id)) await manejarParticipantes(sock, update);
    } catch (e) {
      console.log("Error en eventos de grupo: " + e.message);
    }
  });

  sock.ev.on("groups.update", (cambios) => {
    for (const cambio of cambios) if (cambio.id) olvidarMetadatos(cambio.id);
  });

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;
    if (m.type === "notify" && !msg.key.fromMe) PAG.msgsHoy++;

    const from = msg.key.remoteJid;
    const sender = msg.key.fromMe
      ? sock.user.id.split(":")[0] + "@s.whatsapp.net"
      : (msg.key.participant || msg.key.remoteJid);

    if (!msg.key.fromMe && m.type === "notify" && msg.pushName) recordarNombre(sender, msg.pushName);

    const idBotonPulsado =
      msg.message.buttonsResponseMessage?.selectedButtonId ||
      msg.message.templateButtonReplyMessage?.selectedId ||
      idDeRespuestaInteractiva(msg) ||
      null;

    if (idBotonPulsado) {
      if (from.endsWith("@g.us") && !msg.key.fromMe && botApagado(from)) return;
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

    if (from.endsWith("@g.us") && !msg.key.fromMe && antilinkActivo(from) && (await eliminarEnlace(sock, msg, from, sender, text))) return;

    const apagadoAqui = from.endsWith("@g.us") && !msg.key.fromMe && botApagado(from);

    if (!msg.key.fromMe && !apagadoAqui) {
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

    const esMambo = Boolean(prefijoUsado) && /^\s*mambo\s+(on|off)\s*$/i.test(text.slice(prefijoUsado.length));
    if (apagadoAqui && !esMambo) return;

    if (!msg.key.fromMe && !apagadoAqui && m.type === "notify" && tieneAfk(sender)) {
      const tipoMensaje = Object.keys(msg.message)[0];
      const ignorado = ["protocolMessage", "reactionMessage", "senderKeyDistributionMessage"].includes(tipoMensaje);
      const esComandoAfk = prefijoUsado && /^\s*afk(\s|$)/i.test(text.slice(prefijoUsado.length));
      if (!ignorado && !esComandoAfk) {
        const datos = desactivarAfk(sender);
        await sock.sendMessage(from, { text: textoSalidaAfk(sender, datos), mentions: [sender] }, { quoted: msg });
      }
    }

    if (prefijoUsado && !msg.key.fromMe && !apagadoAqui && m.type === "notify" && await vincularPagina(sock, from, sender, text.slice(prefijoUsado.length), msg)) return;

    if (prefijoUsado) {
      const resto = text.slice(prefijoUsado.length);
      const match = resto.match(/^\s*(\S+)([\s\S]*)$/);
      const textoTraducido = match
        ? "." + match[1].toLowerCase() + match[2]
        : "." + resto;
      await manejarComando(sock, from, sender, textoTraducido, msg);
    } else if (!apagadoAqui) {
      const clave = `${from}:${sender}`;
      if (await procesarEspera(clave, text, { sock, from, sender, msg })) return;

      const fueJugada = await intentarProcesarTexto(sock, from, sender, text, msg);
      if (!fueJugada) {
        await checkTriviaAnswer(sock, from, sender, text, msg);
      }
    }
  });
}

startBot();
             
