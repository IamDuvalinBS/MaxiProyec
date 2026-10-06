const esperas = new Map();

export function registrarEspera(clave, { duracionMs, alResponder }) {
  esperas.set(clave, { vence: Date.now() + duracionMs, alResponder });
}

export async function procesarEspera(clave, texto, contexto) {
  const espera = esperas.get(clave);
  if (!espera) return false;
  if (Date.now() > espera.vence) {
    esperas.delete(clave);
    return false;
  }
  const consumida = await espera.alResponder(texto, contexto);
  if (consumida) esperas.delete(clave);
  return Boolean(consumida);
}

const enfriamientos = new Map();

export function enfriar(clave, ms) {
  const ahora = Date.now();
  const vence = enfriamientos.get(clave) || 0;
  if (vence > ahora) return vence - ahora;
  enfriamientos.set(clave, ahora + ms);
  return 0;
}
