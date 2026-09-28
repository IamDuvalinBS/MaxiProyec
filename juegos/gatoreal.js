// juegos/gatoreal.js
//
// GATO DE PRUEBA - totalmente aparte de gato.js/gatopremio.js (no comparten
// nada, ni el estado ni el motor). Sirve para probar dos cosas nuevas antes
// de tocar los juegos que ya funcionan:
//
//   1. Botones REALES de WhatsApp (interactiveMessage / quick_reply) via
//      @fer2809fl/baileys - se tocan de verdad, una casilla por boton.
//   2. Render con HTML/CSS (satori + resvg) en vez de canvas a mano -
//      satori convierte un arbol tipo HTML+flexbox a SVG, y resvg lo pasa
//      a PNG. Sin Puppeteer/Chromium (eso no corre en Termux).
//
// Si esto falla, gato.js y gatopremio.js NO se tocan ni se ven afectados.
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUTA_FUENTE = path.join(__dirname, "../assets/fonts/retro.ttf");
const fontData = fs.readFileSync(RUTA_FUENTE); // misma fuente que ya usa gato.js

const partidas = new Map(); // from -> estado (independiente de juegos-core.js)

const LINEAS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function ganador(tablero) {
  for (const [a, b, c] of LINEAS) {
    if (tablero[a] && tablero[a] === tablero[b] && tablero[a] === tablero[c]) return tablero[a];
  }
  return tablero.every((c) => c) ? "empate" : null;
}

function minimax(tablero, jugador) {
  const fin = ganador(tablero);
  if (fin === "O") return { puntaje: 1 };
  if (fin === "X") return { puntaje: -1 };
  if (fin === "empate") return { puntaje: 0 };
  const libres = tablero.map((c, i) => (c ? null : i)).filter((i) => i !== null);
  const jugadas = libres.map((i) => {
    const copia = [...tablero];
    copia[i] = jugador;
    return { indice: i, puntaje: minimax(copia, jugador === "O" ? "X" : "O").puntaje };
  });
  return jugador === "O"
    ? jugadas.reduce((a, b) => (b.puntaje > a.puntaje ? b : a))
    : jugadas.reduce((a, b) => (b.puntaje < a.puntaje ? b : a));
}

function jugadaBot(tablero) {
  const libres = tablero.map((c, i) => (c ? null : i)).filter((i) => i !== null);
  if (Math.random() < 0.3) return libres[Math.floor(Math.random() * libres.length)];
  return minimax(tablero, "O").indice;
}

// --- Render con HTML/CSS (satori) en vez de canvas ---
function celdaHTML(valor, i) {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "130px",
        height: "130px",
        margin: "5px",
        borderRadius: "14px",
        border: `3px solid ${valor === "X" ? "#2dfdc5" : valor === "O" ? "#ff3d81" : "#2dfdc5"}`,
        color: valor === "X" ? "#2dfdc5" : valor === "O" ? "#ff3d81" : "#3a3f4f",
        fontSize: valor ? "64px" : "26px",
      },
      children: String(valor || i + 1),
    },
  };
}

async function renderizarHTML(estado) {
  const arbol = {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "480px",
        height: "700px",
        backgroundColor: "#0a0a0f",
        padding: "24px",
        fontFamily: "Retro",
      },
      children: [
        {
          type: "div",
          props: {
            style: { color: "#2dfdc5", fontSize: "34px", marginBottom: "10px" },
            children: "GATO REAL",
          },
        },
        {
          type: "div",
          props: {
            style: { color: "#8a8fa3", fontSize: "18px", marginBottom: "20px" },
            children: estado.fin
              ? (estado.fin === "empate" ? "EMPATE" : `GANO ${estado.fin}`)
              : `TURNO: ${estado.turno}`,
          },
        },
        {
          type: "div",
          props: {
            style: { display: "flex", flexWrap: "wrap", width: "420px" },
            children: estado.tablero.map((v, i) => celdaHTML(v, i)),
          },
        },
      ],
    },
  };

  const svg = await satori(arbol, {
    width: 480,
    height: 700,
    fonts: [{ name: "Retro", data: fontData, weight: 400, style: "normal" }],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 480 } });
  return resvg.render().asPng();
}

// --- Botones reales (uno por casilla libre, maximo 9) ---
function armarBotones(estado) {
  return estado.tablero
    .map((v, i) => (v ? null : { id: `gatoreal:${i}`, text: String(i + 1) }))
    .filter(Boolean);
}

async function enviarEstado(sock, from, msg, estado) {
  const buffer = await renderizarHTML(estado);
  const terminado = !!estado.fin;
  const caption = terminado
    ? `🏁 ${estado.fin === "empate" ? "Empate!" : `Gano ${estado.fin}! 🎉`}\n\nEscribí *.gatoreal* para jugar de nuevo.`
    : "🎮 Toca un numero para jugar";

  if (terminado) {
    await sock.sendMessage(from, { image: buffer, caption }, { quoted: msg });
    return;
  }

  await sock.sendQuickReplyButtons(
    from,
    caption,
    armarBotones(estado),
    { image: buffer, quoted: msg }
  );
}

export default {
  names: [".gatoreal"],
  desc: "[PRUEBA] Gato con botones reales y render HTML - no afecta a .gato/.gatopremio",
  category: "Juegos (prueba)",
  usage: ".gatoreal",
  handler: async ({ sock, from, sender, msg }) => {
    console.log("[GATOREAL] comando recibido, arrancando partida...");
    try {
      const estado = { tablero: Array(9).fill(null), turno: "X", jugadorX: sender, fin: null };
      partidas.set(from, estado);
      await enviarEstado(sock, from, msg, estado);
      console.log("[GATOREAL] mensaje enviado sin errores");
    } catch (e) {
      console.log("[GATOREAL] ERROR: " + e.stack);
      await sock.sendMessage(from, { text: "❌ Error interno en gatoreal: " + e.message }, { quoted: msg });
    }
  },
};

/** Se llama desde index.js cuando tocan uno de los botones gatoreal:<indice>. */
export async function procesarBotonGatoReal(sock, from, sender, msg, indiceStr) {
  const estado = partidas.get(from);
  if (!estado || estado.fin) return;
  if (sender !== estado.jugadorX || estado.turno !== "X") return; // no le toca / no es el jugador

  const idx = Number(indiceStr);
  if (!Number.isInteger(idx) || estado.tablero[idx]) return;

  const tablero = [...estado.tablero];
  tablero[idx] = "X";
  let fin = ganador(tablero);
  let turno = "O";

  if (!fin) {
    const idxBot = jugadaBot(tablero);
    if (idxBot !== undefined) tablero[idxBot] = "O";
    fin = ganador(tablero);
    turno = "X";
  }

  const nuevoEstado = { ...estado, tablero, turno, fin };
  partidas.set(from, nuevoEstado);
  await enviarEstado(sock, from, msg, nuevoEstado);
}
