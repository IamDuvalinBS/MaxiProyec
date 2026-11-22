import axios from "axios";
import { enviarConReintento } from "../../descargas/envio.js";
import { tarjetaDescarga, tarjetaUso, tarjetaError, tarjetaAviso, campo } from "../../descargas/tarjetas.js";
import { LIMITE_DOCUMENTO_MB, nombreSeguro } from "../../descargas/core.js";
import { buscarMediafire, resolverMediafire, esEnlaceMediafire } from "../../descargas/mediafire.js";

// Fuente principal: MediaFire (apps de todo tipo y versiones recientes). Respaldo: Aptoide.
// Aptoide: tienda con API pública (JSON). Tiene apps de todo tipo y versiones recientes, y da el enlace DIRECTO del APK.
// El teléfono no scrapea nada: solo consulta el JSON y WhatsApp recibe el archivo en streaming desde el servidor de Aptoide
// (Baileys lo cifra y sube por partes, sin cargarlo en RAM y sin tocar el archivo, así que queda idéntico al original).
const HOSTS = ["https://ws75.aptoide.com/api/7", "https://ws2.aptoide.com/api/7"];
const MAX_RESULTADOS = 8;
const http = axios.create({ timeout: 20000, headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36" } });

async function pedir(ruta) {
  let ultimo;
  for (const host of HOSTS) {
    try {
      const { data } = await http.get(host + ruta);
      return data;
    } catch (e) { ultimo = e; }
  }
  throw ultimo;
}

const normalizar = (a) => ({
  nombre: a.name,
  paquete: a.package,
  version: a.file?.vername || "",
  tamano: Number(a.file?.filesize || a.size || 0),
  url: a.file?.path || a.file?.path_alt || "",
  descargas: Number(a.stats?.downloads || 0),
  actualizado: a.updated || a.modified || ""
});

async function buscarApps(consulta) {
  const j = await pedir(`/apps/search?query=${encodeURIComponent(consulta)}&limit=${MAX_RESULTADOS}`);
  return (j?.datalist?.list || []).map(normalizar).filter((a) => a.url);
}

async function porPaquete(paquete) {
  const j = await pedir(`/app/getMeta?package_name=${encodeURIComponent(paquete)}`);
  return j?.data ? [normalizar(j.data)].filter((a) => a.url) : [];
}

const mb = (b) => (b / 1048576).toFixed(b > 104857600 ? 0 : 1);
const compacto = (n) => new Intl.NumberFormat("en", { notation: "compact" }).format(n);

export default {
  names: [".apk", ".app", ".apkdl"],
  usage: ".apk <nombre>",
  desc: "Busca y descarga un APK",
  category: "Descargas",
  handler: async ({ from, sender, cleanText, reply }) => {
    const args = cleanText.trim().split(/\s+/).slice(1);
    let elegido = 1;
    if (args.length > 1 && /^[1-8]$/.test(args[0])) elegido = Number(args.shift());
    const consulta = args.join(" ").trim();

    if (!consulta) {
      return reply({
        text: tarjetaUso({
          comando: ".apk <nombre o paquete>",
          ejemplo: ".apk whatsapp\n.apk 2 spotify\n.apk https://www.mediafire.com/file/xxxx/app.apk",
          nota: "Te mando el archivo .apk listo para instalar. Si la app es muy pesada puede tardar."
        }),
        mentions: [sender]
      });
    }

    let resultados = [];
    const esAPK = (a) => /\.(apk|xapk|apks)$/i.test(a.nombre || "");
    const desdeMediafire = async (enlaces) => {
      const hechos = await Promise.allSettled(enlaces.map((e) => resolverMediafire(e)));
      return hechos
        .map((h) => (h.status === "fulfilled" ? h.value : null))
        .filter((a) => a && a.url && esAPK(a))
        .map((a) => ({ nombre: a.nombre.replace(/\.(apk|xapk|apks)$/i, ""), ext: a.nombre.split(".").pop().toLowerCase(), version: "", tamano: a.tamano, url: a.url, paquete: "", fuente: "MediaFire" }));
    };

    try {
      if (esEnlaceMediafire(consulta)) {
        resultados = await desdeMediafire([consulta.split(/\s+/)[0]]);
      } else {
        try { resultados = (await desdeMediafire(await buscarMediafire(consulta, 10))).slice(0, MAX_RESULTADOS); }
        catch (e) { console.log(`[apk] MediaFire falló: ${String(e.message).split("\n")[0]}`); }
        if (!resultados.length) {
          const aptoide = /^[a-z][\w]*(\.[\w]+){2,}$/i.test(consulta) ? await porPaquete(consulta) : [];
          resultados = (aptoide.length ? aptoide : await buscarApps(consulta)).map((a) => ({ ...a, ext: "apk", fuente: "Aptoide" }));
        }
      }
    } catch (e) {
      return reply({ text: tarjetaError("No pude buscar esa app ahora mismo.", e.message) });
    }
    if (!resultados.length) {
      return reply({ text: tarjetaError("No encontré un APK de eso. Prueba con otro nombre, o pega directo un enlace de MediaFire.") });
    }

    const app = resultados[Math.min(elegido, resultados.length) - 1];
    const pesoMB = app.tamano / 1048576;
    if (pesoMB > LIMITE_DOCUMENTO_MB) {
      return reply({ text: tarjetaAviso("APP MUY PESADA", `${app.nombre} pesa ${mb(app.tamano)} MB, más de lo que WhatsApp admite como archivo.`) });
    }

    const otros = resultados
      .map((r, i) => (i + 1 === elegido ? null : `${i + 1}. ${r.nombre.slice(0, 40)} ${r.tamano ? `(${mb(r.tamano)} MB)` : ""}`.trim()))
      .filter(Boolean)
      .slice(0, 5);

    const aviso = reply({
      text: tarjetaDescarga({
        emoji: "📦",
        titulo: "APK DOWNLOAD",
        sender,
        campos: [
          campo("📱", "App", app.nombre),
          campo("🌐", "Fuente", app.fuente),
          ...(app.version ? [campo("🏷️", "Versión", app.version)] : []),
          campo("💾", "Tamaño", app.tamano ? `${mb(app.tamano)} MB` : "?"),
          ...(app.paquete ? [campo("🧩", "Paquete", app.paquete)] : []),
          ...(app.descargas ? [campo("⬇️", "Descargas", compacto(app.descargas))] : []),
          ...(otros.length ? [campo("🔎", "Otras opciones (.apk <n> <nombre>)", otros.join("\n> "))] : [])
        ],
        nota: "Enviando el APK. Las apps grandes pueden tardar un poco."
      }),
      mentions: [sender]
    }).catch(() => {});

    const nombreArchivo = `${nombreSeguro(app.nombre, app.paquete || "app")}${app.version ? ` v${app.version}` : ""}.${app.ext || "apk"}`;
    try {
      await Promise.race([aviso, new Promise((r) => setTimeout(r, 4000))]);
      await enviarConReintento(reply, {
        document: { url: app.url },
        mimetype: app.ext === "apk" || !app.ext ? "application/vnd.android.package-archive" : "application/octet-stream",
        fileName: nombreArchivo
      });
    } catch (e) {
      console.log(`[apk] falló el envío de ${app.paquete}: ${String(e.message).split("\n")[0]}`);
      await reply({ text: tarjetaError("No pude enviar el APK (el servidor de descarga falló o WhatsApp cortó la subida). Intenta de nuevo o prueba otra opción.", e.message) });
    }
  }
};
