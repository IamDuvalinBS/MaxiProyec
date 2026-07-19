import { MongoClient } from "mongodb";

export const CURRENCY = "¥enes";
export const FOTO_PATH = "./botpic.jpg";
export const startTime = Date.now();

const MONGO_URI = "mongodb+srv://jg0455748_db_user:2IBhQ33NazDOoBjg@cluster0.27mrbg5.mongodb.net/?appName=Cluster0";

const accounts = new Map(); // sender -> { wallet, bank, cooldowns: { comando: timestampMs } }
let collection = null;
let configCollection = null;

export const config = {
  botNameShort: "Maximilian Calypse",
  botNameLong: "Maxi",
  ownerName: "It's Duva"
};

export async function connectDB(intentos = 5) {
  for (let i = 1; i <= intentos; i++) {
    try {
      const client = new MongoClient(MONGO_URI);
      await client.connect();
      const db = client.db("whatsappbot");
      collection = db.collection("accounts");
      configCollection = db.collection("config");
      console.log("Conectado a MongoDB");

      const docs = await collection.find({}).toArray();
      for (const doc of docs) {
        accounts.set(doc._id, {
          wallet: doc.wallet || 0,
          bank: doc.bank || 0,
          cooldowns: doc.cooldowns || {}
        });
      }
      console.log(`Datos cargados desde MongoDB: ${accounts.size} cuentas`);

      const cfgDoc = await configCollection.findOne({ _id: "bot" });
      if (cfgDoc) Object.assign(config, cfgDoc);
      return;
    } catch (e) {
      console.log(`Intento ${i}/${intentos} fallo: ${e.message}`);
      if (i < intentos) await new Promise(r => setTimeout(r, 4000));
    }
  }
  console.log("No se pudo conectar a MongoDB tras varios intentos.");
}

export async function saveAccount(sender, intentos = 3) {
  if (!collection) return;
  const acc = getAccount(sender);
  for (let i = 1; i <= intentos; i++) {
    try {
      await collection.updateOne(
        { _id: sender },
        { $set: { wallet: acc.wallet, bank: acc.bank, cooldowns: acc.cooldowns, profile: acc.profile } },
        { upsert: true }
      );
      return;
    } catch (e) {
      console.log(`Error guardando cuenta (intento ${i}/${intentos}): ` + e.message);
      if (i < intentos) await new Promise(r => setTimeout(r, 2000));
    }
  }
  console.log("⚠️ No se pudo guardar la cuenta de " + sender + " tras varios intentos.");
}

export async function saveConfig(intentos = 3) {
  if (!configCollection) return;
  for (let i = 1; i <= intentos; i++) {
    try {
      await configCollection.updateOne({ _id: "bot" }, { $set: config }, { upsert: true });
      return;
    } catch (e) {
      console.log(`Error guardando config (intento ${i}/${intentos}): ` + e.message);
      if (i < intentos) await new Promise(r => setTimeout(r, 2000));
    }
  }
  console.log("⚠️ No se pudo guardar la configuracion tras varios intentos. El cambio puede perderse al reiniciar.");
}

export function getAccount(sender) {
  if (!accounts.has(sender)) {
    accounts.set(sender, { wallet: 0, bank: 0, cooldowns: {} });
  }
  const acc = accounts.get(sender);
  if (!acc.cooldowns) acc.cooldowns = {};
  return acc;
}

export function getAllAccounts() {
  return accounts;
}

export function addToWallet(sender, amount) {
  const acc = getAccount(sender);
  acc.wallet += amount;
  saveAccount(sender);
  return acc;
}

// Cooldown PERSISTENTE: se guarda en MongoDB, sobrevive reinicios del bot.
// Devuelve 0 si puede usar el comando (y lo marca como usado ahora).
// Devuelve los ms restantes si todavia tiene que esperar.
export function checkCooldown(sender, comando, ms) {
  const acc = getAccount(sender);
  const last = acc.cooldowns[comando] || 0;
  const now = Date.now();
  const remaining = last + ms - now;
  if (remaining > 0) return remaining;
  acc.cooldowns[comando] = now;
  saveAccount(sender);
  return 0;
}

export function formatTime(ms) {
  const seg = Math.ceil(ms / 1000);
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatUptime() {
  const seg = Math.floor((Date.now() - startTime) / 1000);
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  return `${h}h ${m}m ${s}s`;
}

export function box(titulo, lineas) {
  return [
    "╔╼┉✦┉╍✦┉╍✦┉╍✦┉╍✦╼⧽⧽",
    `┋✿ *${titulo}*`,
    "┋",
    ...lineas.map(l => `┋ ${l}`),
    "┋",
    "╰╼┉✦┉╍✦┉╍✦┉╍✦┉╍✦┉╼⧽⧽"
  ].join("\n");
}

// Registro compartido de comandos (lo llena economia.js al cargar la carpeta commands/)
export const commandRegistry = new Map(); // primerNombre -> { names, desc, category, usage }

// ============ SISTEMA DE TRIVIA (pregunta y espera respuesta) ============
const pendingTrivia = new Map(); // sender -> { correcta, reward, expira, chatId }

export function setPendingTrivia(sender, data) {
  pendingTrivia.set(sender, data);
}

// Llamado desde index.js en CADA mensaje (no solo comandos), para ver si el
// texto es la respuesta a una trivia pendiente de esa persona.
export async function checkTriviaAnswer(sock, from, sender, text, msg) {
  const pending = pendingTrivia.get(sender);
  if (!pending) return false;
  if (Date.now() > pending.expira) {
    pendingTrivia.delete(sender);
    return false;
  }
  const respuesta = text.trim().toUpperCase();
  if (!["A", "B", "C", "D"].includes(respuesta)) return false;

  pendingTrivia.delete(sender);
  const reply = (content) => sock.sendMessage(from, content, { quoted: msg });

  if (respuesta === pending.correcta) {
    addToWallet(sender, pending.reward);
    await reply({ text: box("¡RESPUESTA CORRECTA!", [`🧠 Ganaste por acertar la trivia...`, `🪙 GANASTE  ›› *${pending.reward} ${CURRENCY}*`]) });
  } else {
    await reply({ text: `❌ Incorrecto. La respuesta era *${pending.correcta}*. Mejor suerte la próxima.` });
  }
  return true;
}

import { execFile } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

function convertirGifLiviano(bufferOriginal) {
  return new Promise((resolve, reject) => {
    const tmpDir = os.tmpdir();
    const entrada = path.join(tmpDir, `in_${Date.now()}.gif`);
    const salida = path.join(tmpDir, `out_${Date.now()}.mp4`);

    fs.writeFileSync(entrada, bufferOriginal);

    // Achicamos resolucion y bajamos calidad para que sea rapido de convertir en un celular
    const args = [
      "-y",
      "-i", entrada,
      "-vf", "scale=320:-2",
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-crf", "28",
      "-preset", "veryfast",
      "-movflags", "faststart",
      "-an",
      salida
    ];

    execFile("ffmpeg", args, { timeout: 20000 }, (error) => {
      try { fs.unlinkSync(entrada); } catch (e) {}
      if (error) {
        try { fs.unlinkSync(salida); } catch (e) {}
        // Si ffmpeg falla o no esta instalado, mandamos el archivo original sin tocar
        resolve(bufferOriginal);
        return;
      }
      try {
        const resultado = fs.readFileSync(salida);
        fs.unlinkSync(salida);
        resolve(resultado);
      } catch (e) {
        resolve(bufferOriginal);
      }
    });
  });
}

// ============ PERFILES DE USUARIO ============
const PERFILES_DIR = "./perfiles";
if (!fs.existsSync(PERFILES_DIR)) fs.mkdirSync(PERFILES_DIR);

export function getProfile(sender) {
  const acc = getAccount(sender);
  if (!acc.profile) {
    acc.profile = {
      name: "",
      birthday: "",
      hobby: "",
      bio: "",
      marriedTo: "",
      marriedSince: "",
      favGame: "",
      level: 1
    };
  }
  return acc.profile;
}

export function pfpPath(sender) {
  const safe = sender.replace(/[^a-zA-Z0-9]/g, "_");
  return path.join(PERFILES_DIR, `${safe}.jpg`);
}

// ============ FABRICA DE COMANDOS DE REACCION (gifs tipo anime) ============
export function reactionCommand({ apiAction, fraseConOtro, fraseSolo }) {
  return async ({ sock, from, sender, msg, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const target = (mentioned && mentioned[0]) || sender;
    const esASiMismo = target === sender;

    let url;
    try {
      const res = await fetch(`https://nekos.best/api/v2/${apiAction}`, {
        headers: { "User-Agent": "MaxiProyecBot/1.0 (WhatsApp bot, contacto en GitHub IamDuvalinBS)" }
      });
      const data = await res.json();
      url = data.results && data.results[0] && data.results[0].url;
      if (!url) throw new Error("Sin url en la respuesta: " + JSON.stringify(data));
    } catch (e) {
      console.log(`❌ ERROR en reaccion "${apiAction}": ${e.message}`);
      await reply({ text: "❌ No se pudo conseguir la imagen ahora mismo, intentá de nuevo." });
      return;
    }

    let buffer;
    try {
      const resArchivo = await fetch(url, {
        headers: { "User-Agent": "MaxiProyecBot/1.0 (WhatsApp bot, contacto en GitHub IamDuvalinBS)" }
      });
      const arrayBuffer = await resArchivo.arrayBuffer();
      const bufferOriginal = Buffer.from(arrayBuffer);
      buffer = await convertirGifLiviano(bufferOriginal);
    } catch (e) {
      console.log(`❌ ERROR descargando/convirtiendo archivo de reaccion "${apiAction}": ${e.message}`);
      await reply({ text: "❌ No se pudo descargar la imagen ahora mismo, intentá de nuevo." });
      return;
    }

    const nombreDe = "@" + sender.split("@")[0];
    const nombrePara = "@" + target.split("@")[0];
    const caption = esASiMismo
      ? `${nombreDe} ${fraseSolo}`
      : `${nombreDe} ${fraseConOtro} ${nombrePara}`;

    const mentions = esASiMismo ? [sender] : [sender, target];

    await sock.sendMessage(from, { video: buffer, gifPlayback: true, caption, mentions }, { quoted: msg });
  };
}

// ============ FABRICA DE COMANDOS DE "TRABAJO" ============
// runWorkOnce hace el calculo puro (cooldown + premio/perdida) sin mandar mensajes.
// La usan tanto el comando individual (workCommand) como el .allw para reclamar todo junto.
export function runWorkOnce(sender, { key, cooldownMs, minReward, maxReward, riesgo, frases }) {
  const wait = checkCooldown(sender, key, cooldownMs);
  if (wait > 0) return { onCooldown: true, wait };

  const acc = getAccount(sender);
  const exito = !riesgo || Math.random() > riesgo.chanceFallo;

  if (exito) {
    // Cada frase puede tener su propio min/max (ej: "anillo de oro"=mucho, "piedra"=poco).
    // Si la frase es un simple texto (sin min/max propio), usa el rango global del comando.
    const pool = frases && frases.exito;
    let fraseTexto, min, max;
    if (pool && typeof pool[0] === "object") {
      const item = pool[Math.floor(Math.random() * pool.length)];
      fraseTexto = item.text;
      min = item.min;
      max = item.max;
    } else {
      fraseTexto = null;
      min = minReward;
      max = maxReward;
    }
    const gano = Math.floor(Math.random() * (max - min + 1)) + min;
    addToWallet(sender, gano);
    return { onCooldown: false, exito: true, monto: gano, fraseTexto };
  } else {
    const poolFallo = frases && frases.fallo;
    let fraseTexto, perdio;
    if (poolFallo && typeof poolFallo[0] === "object") {
      const item = poolFallo[Math.floor(Math.random() * poolFallo.length)];
      fraseTexto = item.text;
      perdio = Math.min(acc.wallet, Math.floor(Math.random() * (item.max - item.min + 1)) + item.min);
    } else {
      fraseTexto = null;
      perdio = riesgo.perdidaTotal
        ? acc.wallet
        : Math.min(acc.wallet, Math.floor(Math.random() * riesgo.maxPerdida) + riesgo.minPerdida);
    }
    acc.wallet -= perdio;
    saveAccount(sender);
    return { onCooldown: false, exito: false, monto: perdio, fraseTexto };
  }
}

export function workCommand(opts) {
  const handler = async ({ sender, reply }) => {
    const r = runWorkOnce(sender, opts);
    const { frases } = opts;

    if (r.onCooldown) {
      return reply({ text: `⏳ Ya usaste este comando. Esperá *${formatTime(r.wait)}*.` });
    }
    if (r.exito) {
      const frase = r.fraseTexto || frases.exito[Math.floor(Math.random() * frases.exito.length)];
      // Si el comando define su propio "renderExito", se usa ese diseño en vez del generico.
      const texto = opts.renderExito
        ? opts.renderExito({ frase, monto: r.monto })
        : box(frases.titulo, [frase, `🪙 GANASTE  ›› *${r.monto} ${CURRENCY}*`]);
      await reply({ text: texto });
    } else {
      const frase = r.fraseTexto || frases.fallo[Math.floor(Math.random() * frases.fallo.length)];
      const texto = opts.renderFallo
        ? opts.renderFallo({ frase, monto: r.monto })
        : box(frases.tituloFallo || frases.titulo, [frase, `💸 PERDISTE  ›› *${r.monto} ${CURRENCY}*`]);
      await reply({ text: texto });
    }
  };
  handler.config = opts; // el .allw lee esto para reusar la misma config exacta
  return handler;
    }
