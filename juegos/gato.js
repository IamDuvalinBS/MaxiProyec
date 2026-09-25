// juegos/gato.js
//
// Gato (tic-tac-toe). Dos modos:
//   .gato            -> jugas contra el bot (IA local, gratis, sin API ni
//                        configuracion - un minimax casero que la mayoria
//                        de las veces juega el mejor movimiento posible
//                        pero a veces se equivoca, para que sea ganable).
//   .gato @persona   -> desafias a esa persona del chat, sin apuestas.
//
// Las jugadas son TEXTO PLANO (escribir un numero del 1 al 9), no botones
// - por eso define "entradaTexto" + "validarTexto" en vez de "botones".
import { registrarJuego, iniciarJuego, FUENTE } from "../motores/juegos-core.js";

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

// Minimax sin ninguna libreria ni API - puro calculo local y gratis.
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

// 70% juega el mejor movimiento, 30% al azar - asi es ganable, no imposible.
function jugadaBot(tablero) {
  const libres = tablero.map((c, i) => (c ? null : i)).filter((i) => i !== null);
  if (Math.random() < 0.3) return libres[Math.floor(Math.random() * libres.length)];
  return minimax(tablero, "O").indice;
}

registrarJuego({
  id: "gato",
  nombre: "GATO",
  ancho: 500,
  alto: 640,
  entradaTexto: true,

  crearEstado(sender, opciones = {}) {
    return {
      tablero: Array(9).fill(null),
      turno: "X",
      jugadorX: sender,
      jugadorO: opciones.oponente || null, // null = juega el bot
      jugada: 0,
      fin: null,
    };
  },

  hud(estado) {
    return [
      { etiqueta: "JUGADA", valor: estado.jugada },
      { etiqueta: "TURNO", valor: estado.turno },
    ];
  },

  dibujar(ctx, estado, ancho, alto) {
    const tam = Math.min(ancho, alto - 30) - 10;
    const ox = (ancho - tam) / 2;
    const oy = 30;
    const celda = tam / 3;

    ctx.fillStyle = "#8a8fa3";
    ctx.font = `13px ${FUENTE}`;
    ctx.fillText("X", ox, 15);
    ctx.fillText(estado.jugadorO ? "O: rival" : "O: BOT", ox + tam - 70, 15);

    ctx.strokeStyle = "#2dfdc5";
    ctx.lineWidth = 3;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(ox + celda * i, oy); ctx.lineTo(ox + celda * i, oy + tam); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, oy + celda * i); ctx.lineTo(ox + tam, oy + celda * i); ctx.stroke();
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    estado.tablero.forEach((valor, i) => {
      const fila = Math.floor(i / 3), col = i % 3;
      const cx = ox + col * celda + celda / 2;
      const cy = oy + fila * celda + celda / 2;
      if (valor) {
        ctx.font = `bold ${Math.floor(celda * 0.55)}px ${FUENTE}`;
        ctx.fillStyle = valor === "X" ? "#2dfdc5" : "#ff3d81";
        ctx.fillText(valor, cx, cy);
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
    return []; // este juego se juega por texto, no con botones
  },

  validarTexto(estado, texto, sender) {
    if (estado.fin) return null;
    const esX = estado.jugadorX === sender;
    const esO = estado.jugadorO === sender;
    if (!esX && !esO) return null; // no es ninguno de los dos jugadores
    if ((estado.turno === "X" && !esX) || (estado.turno === "O" && !esO)) return null; // no es su turno

    const n = Number(String(texto).trim());
    if (!Number.isInteger(n) || n < 1 || n > 9) return null;
    if (estado.tablero[n - 1]) return null; // casilla ocupada

    return String(n - 1);
  },

  accion(estado, accionId) {
    if (estado.fin) return estado;
    const idx = Number(accionId);
    const tablero = [...estado.tablero];
    tablero[idx] = estado.turno;

    let fin = ganador(tablero);
    let turno = estado.turno === "X" ? "O" : "X";
    let jugada = estado.jugada + 1;

    // si sigue el bot (no hay jugadorO humano), juega solo de una
    if (!fin && turno === "O" && !estado.jugadorO) {
      const idxBot = jugadaBot(tablero);
      if (idxBot !== undefined) tablero[idxBot] = "O";
      fin = ganador(tablero);
      turno = "X";
      jugada += 1;
    }

    return { ...estado, tablero, turno, jugada, fin };
  },

  terminado(estado) {
    return !!estado.fin;
  },

  mensajeFinal(estado) {
    if (estado.fin === "empate") return "Empate!";
    return estado.fin === "X" ? "Gano X! 🎉" : "Gano O! 🎉";
  },
});

export default {
  names: [".gato"],
  desc: "Gato: solo (.gato) contra el bot, o .gato @persona para desafiarla",
  category: "Juegos",
  usage: ".gato [@persona]",
  handler: async ({ sock, from, sender, msg }) => {
    const mencionado = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    await iniciarJuego(sock, from, sender, msg, "gato", { oponente: mencionado || null });
  },
};
