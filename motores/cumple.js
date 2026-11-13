const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const pad = (n) => String(n).padStart(2, "0");

function diasDelMes(mes, anio) {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

// Acepta DD/MM, DD/MM/AA y DD/MM/AAAA (también con - o .). Devuelve { dia, mes, anio|null } o null.
export function leerCumple(texto) {
  const m = String(texto || "").trim().match(/^(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2}|\d{4}))?$/);
  if (!m) return null;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  let anio = null;
  if (m[3]) {
    anio = Number(m[3]);
    if (m[3].length === 2) anio += anio <= (new Date().getFullYear() % 100) ? 2000 : 1900;
  }
  if (mes < 1 || mes > 12 || dia < 1) return null;
  if (dia > diasDelMes(mes, anio || 2000)) return null;
  if (anio !== null && (anio < 1900 || anio > new Date().getFullYear())) return null;
  return { dia, mes, anio };
}

export function guardarCumple({ dia, mes, anio }) {
  return anio ? `${pad(dia)}/${pad(mes)}/${anio}` : `${pad(dia)}/${pad(mes)}`;
}

// "Viernes 13 de Noviembre" o "Viernes 13 de Noviembre de 2026".
// Sin año, el día de la semana es el de la próxima vez que cae el cumpleaños.
export function textoCumple(guardado) {
  const c = leerCumple(guardado);
  if (!c) return guardado || "";
  let anio = c.anio;
  if (!anio) {
    const hoy = new Date();
    const inicioHoy = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    anio = hoy.getFullYear();
    while (Date.UTC(anio, c.mes - 1, c.dia) < inicioHoy || c.dia > diasDelMes(c.mes, anio)) {
      anio++;
      if (anio > hoy.getFullYear() + 8) { anio = hoy.getFullYear(); break; }
    }
  }
  const semana = DIAS[new Date(Date.UTC(anio, c.mes - 1, c.dia)).getUTCDay()];
  const base = `${semana} ${c.dia} de ${MESES[c.mes - 1]}`;
  return c.anio ? `${base} de ${c.anio}` : base;
}

// Fecha corta DD/MM/AA a partir de un timestamp.
export function fechaCorta(ms) {
  const d = new Date(ms);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${pad(d.getFullYear() % 100)}`;
}
