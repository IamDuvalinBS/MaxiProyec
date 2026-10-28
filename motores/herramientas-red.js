export async function pedirJson(url, { metodo = "GET", cuerpo, cabeceras = {}, espera = 12000 } = {}) {
  const r = await fetch(url, {
    method: metodo,
    headers: { "User-Agent": "Mozilla/5.0 MaxiProyec", ...(cuerpo ? { "Content-Type": "application/json" } : {}), ...cabeceras },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    signal: AbortSignal.timeout(espera)
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error("HTTP " + r.status + " " + t.slice(0, 160).replace(/\s+/g, " "));
  }
  return r.json();
}
