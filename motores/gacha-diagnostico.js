import axios from "axios";
import dns from "dns";
import { fuentesDeDescarga } from "./gacha-core.js";

const TIEMPO_PRUEBA_MS = 10000;

async function medirDns(host, familia) {
  const inicio = Date.now();
  try {
    await Promise.race([
      dns.promises.lookup(host, { family: familia }),
      new Promise((_, rechazar) => setTimeout(() => rechazar(new Error("sin respuesta")), TIEMPO_PRUEBA_MS))
    ]);
    return { ok: true, ms: Date.now() - inicio };
  } catch (e) {
    return { ok: false, ms: Date.now() - inicio, motivo: e.code || e.message };
  }
}

async function medirPeticion(url, familia = 4) {
  const inicio = Date.now();
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_PRUEBA_MS);
  try {
    const res = await axios.get(url, {
      responseType: "stream",
      family: familia,
      timeout: 0,
      signal: controlador.signal,
      headers: { Range: "bytes=0-0", "User-Agent": "Mozilla/5.0 (compatible; MaxiBot/1.0)", "Accept-Encoding": "identity" },
      validateStatus: () => true
    });
    res.data.destroy();
    return { ok: res.status === 200 || res.status === 206, estado: res.status, ms: Date.now() - inicio };
  } catch (e) {
    return { ok: false, ms: Date.now() - inicio, motivo: axios.isCancel(e) ? "sin respuesta en 10 s" : e.code || e.message };
  } finally {
    clearTimeout(temporizador);
  }
}

const texto = (r) => (r.ok ? `correcto${r.estado ? ` (${r.estado})` : ""} en ${r.ms} ms` : `falló: ${r.motivo || `estado ${r.estado}`} (${r.ms} ms)`);

export async function diagnosticarRed(urlMuestra) {
  const host = new URL(urlMuestra).hostname;
  const [general, dns4, dns6, directa] = await Promise.all([
    medirPeticion("https://www.gstatic.com/generate_204"),
    medirDns(host, 4),
    medirDns(host, 6),
    medirPeticion(urlMuestra)
  ]);
  const proxies = [];
  for (const fuente of fuentesDeDescarga(urlMuestra).filter((f) => f.indice > 0)) {
    proxies.push({ nombre: fuente.nombre, resultado: await medirPeticion(fuente.url) });
  }

  let conclusion;
  if (!general.ok) conclusion = "Tu conexión a internet no está respondiendo bien en este momento.";
  else if (directa.ok) conclusion = "La descarga directa funciona. Si aún hay fallos, son cortes momentáneos de la conexión; el bot reanuda las descargas interrumpidas.";
  else if (proxies.some((p) => p.resultado.ok)) conclusion = "La página de las imágenes no responde desde tu conexión, pero un proxy sí. El bot usará el proxy automáticamente.";
  else conclusion = "Ni la página ni los proxies responden. Revisa tu conexión o prueba con otra red.";

  return { host, general, dns4, dns6, directa, proxies, conclusion, texto };
}
