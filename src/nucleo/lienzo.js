export function envolver(ctx, texto, anchoMax) {
  const palabras = String(texto || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lineas = [];
  let actual = "";
  for (const palabra of palabras) {
    const prueba = actual ? actual + " " + palabra : palabra;
    if (actual && ctx.measureText(prueba).width > anchoMax) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

export function rectRedondeado(ctx, x, y, ancho, alto, radio) {
  const r = Math.min(radio, ancho / 2, alto / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + ancho, y, x + ancho, y + alto, r);
  ctx.arcTo(x + ancho, y + alto, x, y + alto, r);
  ctx.arcTo(x, y + alto, x, y, r);
  ctx.arcTo(x, y, x + ancho, y, r);
  ctx.closePath();
}
