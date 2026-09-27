// juegos/gato.js
//
// Gato (tic-tac-toe). Tres formas de arrancarlo:
//   .gato            -> jugas contra el bot (IA local, gratis, sin API).
//   .gato @persona   -> desafias a esa persona del chat, sin apuestas.
//
// Las jugadas son TEXTO PLANO (escribir un numero del 1 al 9), no botones
// (los botones de WhatsApp no funcionan de forma confiable).
//
// La X y la O se dibujan como LINEAS/CIRCULO, no como texto - la fuente
// pixelada no rinde bien en tamaños grandes, pero las lineas siempre andan.
import { registrarJuego, iniciarJuego, FUENTE } from "../motores/juegos-core.js";
import { addToWallet, CURRENCY } from "../motores/db.js";
import { addXp } from "../motores/profile.js";

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

registrarJuego({
  id: "gato",
  nombre: "GATO",
  ancho: 480,
  alto: 860,
  entradaTexto: true,

  crearEstado(sender, opciones = {}, msg) {
    return {
      tablero: Array(9).fill(null),
      turno: "X",
      jugadorX: sender,
      nombreX: msg?.pushName || null,
      jugadorO: opciones.oponente || null, // null = juega el bot
      nombreO: null,
      jugada: 0,
      fin: null,
      conPremio: !!opciones.conPremio, // true solo si arrancó con .gatopremio
    };
  },

  hud(estado) {
    return [
      { etiqueta: "JUGADA", valor: estado.jugada },
      { etiqueta: "TURNO", valor: estado.turno },
    ];
  },

  // Mención REAL de WhatsApp (dispara notificación) - solo tiene sentido
  // contra otra persona; contra el bot no hay a quien avisar. El texto es
  // minimo porque el "TURNO DE ..." grande ya se dibuja adentro de la foto.
  turnoInfo(estado) {
    if (!estado.jugadorO) return null;
    const jidActual = estado.turno === "X" ? estado.jugadorX : estado.jugadorO;
    return { texto: "👉 Te toca", mentions: [jidActual] };
  },

  dibujar(ctx, estado, ancho, alto) {
    const tam = ancho - 40;
    const ox = (ancho - tam) / 2;
    const oy = (alto - tam) / 2;
    const celda = tam / 3;

    // "TURNO DE ..." dibujado adentro de la imagen (nombre real si ya lo
    // sabemos por su pushName, si no el numero, y BOT si juega la maquina)
    const jidActual = estado.turno === "X" ? estado.jugadorX : estado.jugadorO;
    const nombreActual = estado.turno === "X" ? estado.nombreX : estado.nombreO;
    const etiquetaTurno = estado.fin
      ? (estado.fin === "empate" ? "EMPATE" : `GANO ${estado.fin}`)
      : jidActual
        ? `TURNO DE ${nombreActual || "+" + jidActual.split("@")[0]}`
        : "TURNO DEL BOT";
    ctx.textAlign = "center";
    ctx.font = `${Math.floor(celda * 0.16)}px ${FUENTE}`;
    ctx.fillStyle = estado.turno === "X" ? "#2dfdc5" : "#ff3d81";
    ctx.fillText(etiquetaTurno, ancho / 2, oy - 30);
    ctx.textAlign = "left";

    ctx.strokeStyle = "#2dfdc5";
    ctx.lineWidth = 3;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(ox + celda * i, oy); ctx.lineTo(ox + celda * i, oy + tam); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, oy + celda * i); ctx.lineTo(ox + tam, oy + celda * i); ctx.stroke();
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const margen = celda * 0.28;
    estado.tablero.forEach((valor, i) => {
      const fila = Math.floor(i / 3), col = i % 3;
      const cx = ox + col * celda + celda / 2;
      const cy = oy + fila * celda + celda / 2;

      if (valor === "X") {
        ctx.strokeStyle = "#2dfdc5";
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx - margen, cy - margen);
        ctx.lineTo(cx + margen, cy + margen);
        ctx.moveTo(cx + margen, cy - margen);
        ctx.lineTo(cx - margen, cy + margen);
        ctx.stroke();
      } else if (valor === "O") {
        ctx.strokeStyle = "#ff3d81";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(cx, cy, margen, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.font = `${Math.floor(celda * 0.22)}px ${FUENTE}`;
        ctx.fillStyle = "#3a3f4f";
        ctx.fillText(String(i + 1), cx, cy);
      }
    });
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  },

  botones() {
    return [];
  },

  validarTexto(estado, texto, sender) {
    if (estado.fin) return null;
    const esX = estado.jugadorX === sender;
    const esO = estado.jugadorO === sender;
    if (!esX && !esO) return null;
    if ((estado.turno === "X" && !esX) || (estado.turno === "O" && !esO)) return null;

    const n = Number(String(texto).trim());
    if (!Number.isInteger(n) || n < 1 || n > 9) return null;
    if (estado.tablero[n - 1]) return null;

    return String(n - 1);
  },

  accion(estado, accionId, sender, msg) {
    if (estado.fin) return estado;
    const idx = Number(accionId);
    const tablero = [...estado.tablero];
    tablero[idx] = estado.turno;

    // guarda el nombre real (pushName) de quien acaba de jugar, si no lo teniamos
    let nombreX = estado.nombreX;
    let nombreO = estado.nombreO;
    if (sender === estado.jugadorX && !nombreX && msg?.pushName) nombreX = msg.pushName;
    if (sender === estado.jugadorO && !nombreO && msg?.pushName) nombreO = msg.pushName;

    let fin = ganador(tablero);
    let turno = estado.turno === "X" ? "O" : "X";
    let jugada = estado.jugada + 1;

    if (!fin && turno === "O" && !estado.jugadorO) {
      const idxBot = jugadaBot(tablero);
      if (idxBot !== undefined) tablero[idxBot] = "O";
      fin = ganador(tablero);
      turno = "X";
      jugada += 1;
    }

    return { ...estado, tablero, turno, jugada, fin, nombreX, nombreO };
  },

  terminado(estado) {
    return !!estado.fin;
  },

  mensajeFinal(estado) {
    if (estado.fin === "empate") return "Empate!";
    return estado.fin === "X" ? "Gano X! 🎉" : "Gano O! 🎉";
  },

  // Se dispara UNA sola vez, justo cuando la partida termina (lo llama el
  // motor). Si el juego no arranco con premio (.gato normal), no hace nada.
  async alGanar(estado, sender, msg) {
    if (!estado.conPremio) return null;
    if (estado.fin === "empate") {
      return { lineas: ["🤝 Empate - no hay premio esta vez."] };
    }
    const ganadorJid = estado.fin === "X" ? estado.jugadorX : estado.jugadorO;
    if (!ganadorJid) {
      return { lineas: ["🤖 Gano el bot - no hay premio para nadie."] };
    }

    const monto = Math.floor(Math.random() * 61) + 40; // 40 a 100
    addToWallet(ganadorJid, monto);
    const xpGanada = Math.max(1, Math.round(monto / 10));
    const { leveledUp, newLevel } = addXp(ganadorJid, xpGanada);

    const lineas = [
      `🏆 GANADOR: @${ganadorJid.split("@")[0]}`,
      `💰 DINERO: +${monto} ${CURRENCY}`,
      `✨ XP: +${xpGanada}`,
    ];
    if (leveledUp) lineas.push(`🎉 ¡Subió a nivel ${newLevel}!`);
    return { lineas, mentions: [ganadorJid] };
  },
});

export default {
  names: [".gato", ".gatobot"],
  desc: "Gato: solo (.gato) juega contra el bot, o .gato @persona para desafiarla directo",
  category: "Juegos",
  usage: ".gato [@persona]",
  handler: async ({ sock, from, sender, msg }) => {
    const mencionado = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    await iniciarJuego(sock, from, sender, msg, "gato", { oponente: mencionado || null });
  },
};
      
