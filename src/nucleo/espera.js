const esperas = new Map();

// ¿Hay alguna espera viva (confirmación, propuesta, elegir de una lista...) en este chat? Las claves son "chat:usuario".
export function hayEsperaEn(chat) {
  const ahora = Date.now();
  for (const [clave, grupo] of esperas) {
    if (!clave.includes(chat)) continue;
    for (const e of grupo.values()) if (e.vence > ahora) return true;
  }
  return false;
}

export function registrarEspera(clave, { duracionMs, alResponder, tipo = "general" }) {
  if (!esperas.has(clave)) esperas.set(clave, new Map());
  esperas.get(clave).set(tipo, { vence: Date.now() + duracionMs, alResponder });
}

export async function procesarEspera(clave, texto, contexto) {
  const grupo = esperas.get(clave);
  if (!grupo) return false;
  for (const [tipo, espera] of [...grupo]) {
    if (Date.now() > espera.vence) {
      grupo.delete(tipo);
      continue;
    }
    if (await espera.alResponder(texto, contexto)) {
      grupo.delete(tipo);
      if (!grupo.size) esperas.delete(clave);
      return true;
    }
  }
  if (!grupo.size) esperas.delete(clave);
  return false;
}

const enfriamientos = new Map();

export function enfriar(clave, ms) {
  const ahora = Date.now();
  const vence = enfriamientos.get(clave) || 0;
  if (vence > ahora) return vence - ahora;
  enfriamientos.set(clave, ahora + ms);
  return 0;
}

export function limpiarEnfriamientos(jid = null) {
  if (!jid) return enfriamientos.clear();
  const numero = String(jid).split("@")[0].split(":")[0];
  for (const clave of [...enfriamientos.keys()]) {
    if (String(clave).split(":").slice(1).join(":").split("@")[0].split(":")[0] === numero) enfriamientos.delete(clave);
  }
}
