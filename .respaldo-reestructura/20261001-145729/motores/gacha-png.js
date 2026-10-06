import zlib from "zlib";

const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABLA_CRC[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function bloque(tipo, datos) {
  const largo = Buffer.alloc(4); largo.writeUInt32BE(datos.length);
  const t = Buffer.from(tipo, "ascii");
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, datos])));
  return Buffer.concat([largo, t, datos, crc]);
}

const limitar = (x, a, b) => (x < a ? a : x > b ? b : x);

export class Lienzo {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.d = new Uint8Array(w * h * 3);
  }

  _px(i, c, a) {
    if (a <= 0) return;
    const d = this.d;
    d[i] = Math.round(d[i] + (c[0] - d[i]) * a);
    d[i + 1] = Math.round(d[i + 1] + (c[1] - d[i + 1]) * a);
    d[i + 2] = Math.round(d[i + 2] + (c[2] - d[i + 2]) * a);
  }

  fondoRadial(centro, borde) {
    const cx = this.w * 0.5, cy = this.h * 0.45, R = this.w * 0.75;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const t = Math.min(1, Math.hypot(x - cx, y - cy) / R);
        const i = (y * this.w + x) * 3;
        this.d[i] = Math.round(centro[0] + (borde[0] - centro[0]) * t);
        this.d[i + 1] = Math.round(centro[1] + (borde[1] - centro[1]) * t);
        this.d[i + 2] = Math.round(centro[2] + (borde[2] - centro[2]) * t);
      }
    }
  }

  _pintar(x0, y0, x1, y1, color, alpha, cobertura) {
    const ax = Math.max(0, Math.floor(x0)), bx = Math.min(this.w - 1, Math.ceil(x1));
    const ay = Math.max(0, Math.floor(y0)), by = Math.min(this.h - 1, Math.ceil(y1));
    for (let y = ay; y <= by; y++) {
      for (let x = ax; x <= bx; x++) {
        const c = cobertura(x + 0.5, y + 0.5);
        if (c > 0) this._px((y * this.w + x) * 3, color, c * alpha);
      }
    }
  }

  circulo(cx, cy, r, color, alpha = 1) {
    this._pintar(cx - r - 1, cy - r - 1, cx + r + 1, cy + r + 1, color, alpha,
      (x, y) => limitar(r + 0.5 - Math.hypot(x - cx, y - cy), 0, 1));
  }

  anillo(cx, cy, r, grosor, color, alpha = 1) {
    const m = r + grosor;
    this._pintar(cx - m, cy - m, cx + m, cy + m, color, alpha,
      (x, y) => limitar(grosor / 2 + 0.5 - Math.abs(Math.hypot(x - cx, y - cy) - r), 0, 1));
  }

  elipseAnillo(cx, cy, rx, ry, grosor, color, alpha = 1) {
    const k = Math.min(rx, ry);
    this._pintar(cx - rx - grosor, cy - ry - grosor, cx + rx + grosor, cy + ry + grosor, color, alpha,
      (x, y) => limitar(grosor / 2 + 0.5 - Math.abs(Math.hypot((x - cx) / rx, (y - cy) / ry) - 1) * k, 0, 1));
  }

  linea(x1, y1, x2, y2, grosor, color, alpha = 1) {
    const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy || 1;
    const m = grosor;
    this._pintar(Math.min(x1, x2) - m, Math.min(y1, y2) - m, Math.max(x1, x2) + m, Math.max(y1, y2) + m, color, alpha,
      (x, y) => {
        const t = limitar(((x - x1) * dx + (y - y1) * dy) / L2, 0, 1);
        return limitar(grosor / 2 + 0.5 - Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)), 0, 1);
      });
  }

  poligono(pts, color, alpha = 1, borde = null, gborde = 3) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const dentro = (px, py) => {
      let ok = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) ok = !ok;
      }
      return ok;
    };
    this._pintar(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), color, alpha, (x, y) => {
      let n = 0;
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (dentro(x - 0.5 + (a + 0.5) / 3, y - 0.5 + (b + 0.5) / 3)) n++;
      return n / 9;
    });
    if (borde) for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      this.linea(p[0], p[1], q[0], q[1], gborde, borde);
    }
  }

  png() {
    const fila = this.w * 3;
    const crudo = Buffer.alloc((fila + 1) * this.h);
    for (let y = 0; y < this.h; y++) {
      crudo[y * (fila + 1)] = 0;
      Buffer.from(this.d.buffer, this.d.byteOffset + y * fila, fila).copy(crudo, y * (fila + 1) + 1);
    }
    const cab = Buffer.alloc(13);
    cab.writeUInt32BE(this.w, 0); cab.writeUInt32BE(this.h, 4);
    cab[8] = 8; cab[9] = 2;
    return Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      bloque("IHDR", cab),
      bloque("IDAT", zlib.deflateSync(crudo, { level: 6 })),
      bloque("IEND", Buffer.alloc(0))
    ]);
  }
}
