import { execFile } from "child_process";
import { promisify } from "util";

const ejecutar = promisify(execFile);
const enlace = process.argv[2];

if (!enlace) {
  console.log("Uso: node probar-codec.mjs <enlace de YouTube>");
  process.exit(1);
}

const vreden = await import("@vreden/youtube_scraper");
const btch = await import("btch-downloader");

const conLimite = (promesa, ms) =>
  Promise.race([
    promesa,
    new Promise((_, rechazar) => setTimeout(() => rechazar(new Error(`sin respuesta en ${ms / 1000}s`)), ms))
  ]);

async function codecDe(url) {
  const { stdout } = await ejecutar(
    "ffprobe",
    ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,profile,width,height", "-of", "csv=p=0", url],
    { timeout: 60000 }
  );
  return stdout.trim();
}

const proveedores = [
  ...[720, 480, 360].map((calidad) => ({
    nombre: `Vreden ${calidad}p`,
    tiempoMs: 45000,
    obtener: async () => {
      const d = await vreden.ytmp4(enlace, calidad);
      return d?.status ? d.download?.url : null;
    }
  })),
  {
    nombre: "Btch",
    tiempoMs: 30000,
    obtener: async () => {
      const d = await btch.youtube(enlace);
      return d?.status ? d.mp4 : null;
    }
  }
];

console.log(`Probando ${proveedores.length} proveedores a la vez, espera un momento...\n`);

const resultados = await Promise.all(
  proveedores.map(async (p) => {
    const inicio = Date.now();
    try {
      const url = await conLimite(p.obtener(), p.tiempoMs);
      const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
      if (!url) return `${p.nombre.padEnd(12)} sin enlace (${segundos}s)`;
      const info = await codecDe(url);
      const [codec] = info.split(",");
      const veredicto = codec === "h264" ? "OK, sirve directo" : "hay que convertir";
      return `${p.nombre.padEnd(12)} ${info}  -> ${veredicto}  (enlace en ${segundos}s)`;
    } catch (e) {
      return `${p.nombre.padEnd(12)} fallo: ${String(e.message).split("\n")[0]}`;
    }
  })
);

console.log(resultados.join("\n"));
process.exit(0);
