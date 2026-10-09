import fs from "fs";
import os from "os";
import path from "path";
import zlib from "zlib";
import { execFile } from "child_process";
import { promisify } from "util";
import { descargarAudioConProveedores } from "./youtube-engine.js";

const execFileAsync = promisify(execFile);

const MAX_CANCIONES_ALBUM = 40;
const PAUSA_REINTENTO_MS = 2000;

// ---------- ZIP sin compresión, escrito directo a disco ----------
// El mp3 ya viene comprimido, así que no se comprime (casi no gasta CPU) y solo hay una canción en memoria a la vez.
const TABLA_CRC = (() => {
  const tabla = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabla[n] = c >>> 0;
  }
  return tabla;
})();

function crc32(datos) {
  if (typeof zlib.crc32 === "function") return zlib.crc32(datos) >>> 0;
  let c = 0xffffffff;
  for (let i = 0; i < datos.length; i++) c = TABLA_CRC[(c ^ datos[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function fechaDos(d) {
  return {
    hora: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    fecha: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
  };
}

class ZipSinCompresion {
  constructor(ruta) {
    this.ruta = ruta;
    this.entradas = [];
    this.offset = 0;
    this.archivo = null;
  }

  async abrir() {
    this.archivo = await fs.promises.open(this.ruta, "w");
  }

  async escribir(buffer) {
    let escrito = 0;
    while (escrito < buffer.length) {
      const { bytesWritten } = await this.archivo.write(buffer, escrito, buffer.length - escrito, null);
      escrito += bytesWritten;
    }
    this.offset += buffer.length;
  }

  async agregar(nombre, datos) {
    if (this.entradas.length >= 65000 || this.offset + datos.length > 4e9) throw new Error("el ZIP es demasiado grande");
    const nombreBuf = Buffer.from(nombre, "utf8");
    const crc = crc32(datos);
    const { hora, fecha } = fechaDos(new Date());

    const cab = Buffer.alloc(30);
    cab.writeUInt32LE(0x04034b50, 0);
    cab.writeUInt16LE(20, 4); // versión necesaria
    cab.writeUInt16LE(0x0800, 6); // nombres en UTF-8
    cab.writeUInt16LE(0, 8); // sin compresión
    cab.writeUInt16LE(hora, 10);
    cab.writeUInt16LE(fecha, 12);
    cab.writeUInt32LE(crc, 14);
    cab.writeUInt32LE(datos.length, 18);
    cab.writeUInt32LE(datos.length, 22);
    cab.writeUInt16LE(nombreBuf.length, 26);
    cab.writeUInt16LE(0, 28);

    const offsetLocal = this.offset;
    await this.escribir(Buffer.concat([cab, nombreBuf]));
    await this.escribir(datos);
    this.entradas.push({ nombreBuf, crc, tamano: datos.length, offsetLocal, hora, fecha });
  }

  async cerrar() {
    const inicioDirectorio = this.offset;
    for (const e of this.entradas) {
      const c = Buffer.alloc(46);
      c.writeUInt32LE(0x02014b50, 0);
      c.writeUInt16LE(20, 4);
      c.writeUInt16LE(20, 6);
      c.writeUInt16LE(0x0800, 8);
      c.writeUInt16LE(0, 10);
      c.writeUInt16LE(e.hora, 12);
      c.writeUInt16LE(e.fecha, 14);
      c.writeUInt32LE(e.crc, 16);
      c.writeUInt32LE(e.tamano, 20);
      c.writeUInt32LE(e.tamano, 24);
      c.writeUInt16LE(e.nombreBuf.length, 28);
      c.writeUInt32LE(e.offsetLocal, 42);
      await this.escribir(Buffer.concat([c, e.nombreBuf]));
    }
    const tamanoDirectorio = this.offset - inicioDirectorio;

    const fin = Buffer.alloc(22);
    fin.writeUInt32LE(0x06054b50, 0);
    fin.writeUInt16LE(this.entradas.length, 8);
    fin.writeUInt16LE(this.entradas.length, 10);
    fin.writeUInt32LE(tamanoDirectorio, 12);
    fin.writeUInt32LE(inicioDirectorio, 16);
    await this.escribir(fin);
    await this.archivo.close();
    this.archivo = null;
  }

  async descartar() {
    try { if (this.archivo) await this.archivo.close(); } catch (e) {}
    this.archivo = null;
    try { fs.unlinkSync(this.ruta); } catch (e) {}
  }
}

// ---------- Utilidades ----------
function limpiarNombre(texto, maximo = 80) {
  const limpio = String(texto || "")
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximo)
    .trim();
  return limpio || "sin nombre";
}

// Escribe título, artista, álbum y número de pista dentro del mp3 (copia el audio, tarda una fracción de segundo).
async function etiquetarMp3(buffer, meta) {
  const base = path.join(os.tmpdir(), `tag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const entrada = `${base}-in.mp3`;
  const salida = `${base}-out.mp3`;
  try {
    fs.writeFileSync(entrada, buffer);
    const args = [
      "-y", "-i", entrada, "-map", "0:a", "-c", "copy", "-id3v2_version", "3",
      "-metadata", `title=${meta.titulo}`,
      "-metadata", `artist=${meta.artista}`,
      "-metadata", `album=${meta.album}`,
      "-metadata", `track=${meta.pista}/${meta.total}`
    ];
    if (meta.anio) args.push("-metadata", `date=${meta.anio}`);
    args.push(salida);
    await execFileAsync("ffmpeg", args, { timeout: 60000 });
    return fs.readFileSync(salida);
  } catch (e) {
    console.log(`[album] No pude etiquetar "${meta.titulo}": ${String(e.message).split("\n")[0]}`);
    return buffer; // sin etiquetas, pero la canción sirve igual
  } finally {
    for (const ruta of [entrada, salida]) { try { if (fs.existsSync(ruta)) fs.unlinkSync(ruta); } catch (e) {} }
  }
}

async function descargarPista(pista) {
  const link = `https://www.youtube.com/watch?v=${pista.id}`;
  try {
    return await descargarAudioConProveedores(link);
  } catch (e) {
    console.log(`[album] Falló "${pista.titulo}" (${String(e.message).split("\n")[0]}); se reintenta una vez`);
    await new Promise((r) => setTimeout(r, PAUSA_REINTENTO_MS));
    return descargarAudioConProveedores(link);
  }
}

// Descarga todas las canciones, una por una, y las junta en un ZIP en disco.
// Devuelve { ruta, nombre, pesoMB, agregadas, fallidas: [títulos] }. Quien lo reciba debe borrar `ruta`.
export async function descargarAlbumComoZip(album, { alProgreso } = {}) {
  if (album.pistas.length > MAX_CANCIONES_ALBUM) {
    throw new Error(`Ese álbum tiene ${album.pistas.length} canciones; el máximo permitido es ${MAX_CANCIONES_ALBUM}.`);
  }

  const ruta = path.join(os.tmpdir(), `album-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.zip`);
  const zip = new ZipSinCompresion(ruta);
  const fallidas = [];
  let agregadas = 0;

  await zip.abrir();
  try {
    const total = album.pistas.length;
    for (let i = 0; i < total; i++) {
      const pista = album.pistas[i];
      const numero = String(i + 1).padStart(2, "0");
      try {
        let mp3 = await descargarPista(pista);
        mp3 = await etiquetarMp3(mp3, {
          titulo: pista.titulo,
          artista: album.artista,
          album: album.nombre,
          pista: i + 1,
          total,
          anio: album.anio
        });
        await zip.agregar(`${numero} - ${limpiarNombre(pista.titulo)}.mp3`, mp3);
        agregadas++;
      } catch (e) {
        console.log(`[album] Se omite "${pista.titulo}": ${String(e.message).split("\n")[0]}`);
        fallidas.push(pista.titulo);
      }
      if (alProgreso) { try { alProgreso(i + 1, total); } catch (e) {} }
    }

    if (agregadas === 0) throw new Error("No se pudo descargar ninguna canción del álbum.");
    await zip.cerrar();
  } catch (e) {
    await zip.descartar();
    throw e;
  }

  const pesoMB = fs.statSync(ruta).size / (1024 * 1024);
  return {
    ruta,
    nombre: `${limpiarNombre(album.artista, 40)} - ${limpiarNombre(album.nombre, 60)}.zip`,
    pesoMB,
    agregadas,
    fallidas
  };
}
