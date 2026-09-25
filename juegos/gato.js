// juegos/gato.js
//
// Ejemplo mas simple de juego conectado al motor. Sirve de plantilla para
// Mario, Tetris y el avioncito: solo hay que llenar los mismos 8 campos de
// registrarJuego() y exportar un comando default que llame a iniciarJuego().
//
// Como WhatsApp solo da 3 botones comodos, la navegacion es "cursor +
// confirmar" (◀ / ✅ Colocar / ▶), igual que Galaga se mueve con ◀ ▶.
import { registrarJuego, iniciarJuego } from "../motores/juegos-core.js";

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

function jugadaBot(tablero) {
  const libres = tablero.map((c, i) => (c ? null : i)).filter((i) => i !== null);
  return libres[Math.floor(Math.random() * libres.length)];
}

registrarJuego({
  id: "gato",
  nombre: "GATO RETRO",
  ancho: 500,
  alto: 620,

  crearEstado() {
    return { tablero: Array(9).fill(null), cursor: 4, fin: null };
  },

  hud(estado) {
    return [{ etiqueta: "TURNO", valor: estado.fin ? "-" : "VOS (X)" }];
  },

  dibujar(ctx, estado, ancho, alto) {
    const tam = Math.min(ancho, alto) - 20;
    const ox = (ancho - tam) / 2;
    const oy = (alto - tam) / 2;
    const celda = tam / 3;

    ctx.strokeStyle = "#2dfdc5";
    ctx.lineWidth = 3;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(ox + celda * i, oy);
      ctx.lineTo(ox + celda * i, oy + tam);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ox, oy + celda * i);
      ctx.lineTo(ox + tam, oy + celda * i);
      ctx.stroke();
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    estado.tablero.forEach((valor, i) => {
      if (!valor) return;
      const fila = Math.floor(i / 3);
      const col = i % 3;
      const cx = ox + col * celda + celda / 2;
      const cy = oy + fila * celda + celda / 2;
      ctx.font = `bold ${Math.floor(celda * 0.6)}px sans-serif`;
      ctx.fillStyle = valor === "X" ? "#2dfdc5" : "#ff3d81";
      ctx.fillText(valor, cx, cy);
    });
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // resalta la celda donde esta el cursor
    const fc = Math.floor(estado.cursor / 3);
    const cc = estado.cursor % 3;
    ctx.strokeStyle = "#ffd23f";
    ctx.lineWidth = 4;
    ctx.strokeRect(ox + cc * celda + 4, oy + fc * celda + 4, celda - 8, celda - 8);
  },

  botones() {
    return [
      { id: "izq", texto: "◀" },
      { id: "poner", texto: "✅ Colocar" },
      { id: "der", texto: "▶" },
    ];
  },

  accion(estado, accionId) {
    if (estado.fin) return estado;
    let { tablero, cursor } = estado;

    if (accionId === "izq") cursor = (cursor + 8) % 9;
    if (accionId === "der") cursor = (cursor + 1) % 9;

    if (accionId === "poner") {
      if (tablero[cursor]) return { ...estado, cursor }; // ocupada, no pasa nada
      tablero = [...tablero];
      tablero[cursor] = "X";
      let fin = ganador(tablero);
      if (!fin) {
        const idxBot = jugadaBot(tablero);
        if (idxBot !== undefined) tablero[idxBot] = "O";
        fin = ganador(tablero);
      }
      return { tablero, cursor, fin };
    }

    return { ...estado, cursor };
  },

  terminado(estado) {
    return !!estado.fin;
  },

  mensajeFinal(estado) {
    if (estado.fin === "empate") return "Empate!";
    if (estado.fin === "X") return "Ganaste! 🎉";
    return "Gano la maquina 🤖";
  },
});

export default {
  names: [".gato"],
  desc: "Jugar al gato (tic-tac-toe) contra la maquina",
  category: "Juegos",
  usage: ".gato",
  handler: async ({ sock, from, sender, msg }) => {
    await iniciarJuego(sock, from, sender, msg, "gato");
  },
};
