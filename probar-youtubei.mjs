import fs from "fs";

const enlace = process.argv[2];
const coincidencia = enlace && /(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/.exec(enlace);
if (!coincidencia) {
  console.log("Uso: node probar-youtubei.mjs <enlace de YouTube>");
  process.exit(1);
}
const id = coincidencia[1];

const { Innertube, Platform } = await import("youtubei.js");

let version = "desconocida";
try {
  version = JSON.parse(fs.readFileSync(new URL("./node_modules/youtubei.js/package.json", import.meta.url), "utf8")).version;
} catch (e) {}
console.log(`youtubei.js instalada: ${version}\n`);

Platform.shim.eval = async (data, env) => {
  const propiedades = [];
  if (env.n) propiedades.push(`n: exportedVars.nFunction("${env.n}")`);
  if (env.sig) propiedades.push(`sig: exportedVars.sigFunction("${env.sig}")`);
  const codigo = `${data.output}\nreturn { ${propiedades.join(", ")} }`;
  return new Function(codigo)();
};

const yt = await Innertube.create();
const clientes = [undefined, "ANDROID", "IOS", "TV", "MWEB"];

for (const cliente of clientes) {
  const etiqueta = (cliente || "WEB (defecto)").padEnd(14);
  try {
    const info = await yt.getInfo(id, cliente ? { client: cliente } : undefined);
    const lista = info.streaming_data?.adaptive_formats || [];
    const video = lista
      .filter((f) => f.has_video && !f.has_audio && /avc1/i.test(f.mime_type || "") && (f.height || 0) <= 720)
      .sort((a, b) => (b.height || 0) - (a.height || 0))[0];
    const audio = lista
      .filter((f) => f.has_audio && !f.has_video && /mp4a/i.test(f.mime_type || ""))
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];

    if (!video || !audio) {
      console.log(`${etiqueta} sin video H264 o audio AAC (${lista.length} formatos en total)`);
      continue;
    }

    const partes = [];
    for (const [nombre, formato] of [["video", video], ["audio", audio]]) {
      const url = await formato.decipher(yt.session.player);
      const res = await fetch(url, { headers: { Range: "bytes=0-0" } });
      partes.push(`${nombre} itag ${formato.itag} -> HTTP ${res.status}`);
      try { await res.body?.cancel(); } catch (e) {}
    }
    console.log(`${etiqueta} ${video.height}p H264: ${partes.join(" | ")}`);
  } catch (e) {
    console.log(`${etiqueta} fallo: ${String(e.message).split("\n")[0]}`);
  }
}
process.exit(0);
