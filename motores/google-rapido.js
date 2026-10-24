const ZONAS = {
  mexico: ["America/Mexico_City", "México"],
  cdmx: ["America/Mexico_City", "Ciudad de México"],
  chiapas: ["America/Mexico_City", "Chiapas"],
  cancun: ["America/Cancun", "Cancún"],
  tijuana: ["America/Tijuana", "Tijuana"],
  monterrey: ["America/Monterrey", "Monterrey"],
  bogota: ["America/Bogota", "Bogotá"],
  colombia: ["America/Bogota", "Colombia"],
  lima: ["America/Lima", "Lima"],
  peru: ["America/Lima", "Perú"],
  quito: ["America/Guayaquil", "Quito"],
  ecuador: ["America/Guayaquil", "Ecuador"],
  caracas: ["America/Caracas", "Caracas"],
  venezuela: ["America/Caracas", "Venezuela"],
  santiago: ["America/Santiago", "Santiago"],
  chile: ["America/Santiago", "Chile"],
  "buenos aires": ["America/Argentina/Buenos_Aires", "Buenos Aires"],
  argentina: ["America/Argentina/Buenos_Aires", "Argentina"],
  brasil: ["America/Sao_Paulo", "Brasil"],
  "sao paulo": ["America/Sao_Paulo", "São Paulo"],
  "nueva york": ["America/New_York", "Nueva York"],
  "new york": ["America/New_York", "Nueva York"],
  miami: ["America/New_York", "Miami"],
  chicago: ["America/Chicago", "Chicago"],
  "los angeles": ["America/Los_Angeles", "Los Ángeles"],
  madrid: ["Europe/Madrid", "Madrid"],
  espana: ["Europe/Madrid", "España"],
  londres: ["Europe/London", "Londres"],
  paris: ["Europe/Paris", "París"],
  berlin: ["Europe/Berlin", "Berlín"],
  roma: ["Europe/Rome", "Roma"],
  moscu: ["Europe/Moscow", "Moscú"],
  dubai: ["Asia/Dubai", "Dubái"],
  india: ["Asia/Kolkata", "India"],
  pekin: ["Asia/Shanghai", "Pekín"],
  china: ["Asia/Shanghai", "China"],
  tokio: ["Asia/Tokyo", "Tokio"],
  japon: ["Asia/Tokyo", "Japón"],
  seul: ["Asia/Seoul", "Seúl"],
  sidney: ["Australia/Sydney", "Sídney"]
};

const ZONA_POR_DEFECTO = ["America/Mexico_City", "Ciudad de México"];

export const sinTildes = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const limpiar = (s) => sinTildes(s).toLowerCase().replace(/[¿?¡!.,;:]/g, " ").replace(/\s+/g, " ").trim();

function evaluarMatematica(texto) {
  const src = texto.replace(/×|x(?=\s*\d)/gi, "*").replace(/÷/g, "/").replace(/\^/g, "**").replace(/,/g, ".").replace(/\s+/g, "");
  let i = 0;
  const peek = () => src[i];
  function numero() {
    const m = /^\d+(?:\.\d+)?/.exec(src.slice(i));
    if (!m) throw new Error("num");
    i += m[0].length;
    return parseFloat(m[0]);
  }
  function primario() {
    if (peek() === "-") {
      i++;
      return -primario();
    }
    if (peek() === "+") {
      i++;
      return primario();
    }
    if (peek() === "(") {
      i++;
      const v = suma();
      if (peek() !== ")") throw new Error("par");
      i++;
      return v;
    }
    return numero();
  }
  function potencia() {
    let v = primario();
    while (src.startsWith("**", i)) {
      i += 2;
      v = Math.pow(v, primario());
    }
    while (peek() === "%") {
      i++;
      v /= 100;
    }
    return v;
  }
  function producto() {
    let v = potencia();
    while (peek() === "*" || peek() === "/") {
      const op = src[i++];
      const d = potencia();
      v = op === "*" ? v * d : v / d;
    }
    return v;
  }
  function suma() {
    let v = producto();
    while (peek() === "+" || peek() === "-") {
      const op = src[i++];
      const d = producto();
      v = op === "+" ? v + d : v - d;
    }
    return v;
  }
  const r = suma();
  if (i !== src.length || !Number.isFinite(r)) throw new Error("fin");
  return r;
}

function respuestaCalculo(q) {
  const t = q.replace(/^cuanto es\s+/i, "").replace(/=\s*$/, "").trim();
  if (!/^[\d\s+\-*/().,%^x×÷]+$/i.test(t) || !/[+\-*/%^x×÷]/.test(t.replace(/^-/, "")) || !/\d/.test(t)) return null;
  try {
    const r = evaluarMatematica(t);
    const texto = Number.isInteger(r) ? String(r) : String(Number(r.toFixed(8)));
    return { tipo: "calculo", titulo: "Calculadora", grande: texto, detalle: t.replace(/\s+/g, " ") + " =" };
  } catch {
    return null;
  }
}

function buscarZona(q) {
  const t = limpiar(q);
  const claves = Object.keys(ZONAS).sort((a, b) => b.length - a.length);
  for (const k of claves) {
    if (new RegExp("(^|\\s)" + k + "(\\s|$)").test(t)) return ZONAS[k];
  }
  return null;
}

function respuestaHora(q) {
  const t = limpiar(q);
  if (!/(^|\s)hora(\s|$)/.test(t) || t.split(" ").length > 8) return null;
  const [zona, nombre] = buscarZona(q) || ZONA_POR_DEFECTO;
  const ahora = new Date();
  const hora = new Intl.DateTimeFormat("es-MX", { timeZone: zona, hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }).format(ahora);
  const fecha = new Intl.DateTimeFormat("es-MX", { timeZone: zona, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(ahora);
  const gmt = new Intl.DateTimeFormat("en-US", { timeZone: zona, timeZoneName: "shortOffset" }).formatToParts(ahora).find((p) => p.type === "timeZoneName")?.value || "";
  const h24 = Number(new Intl.DateTimeFormat("en-GB", { timeZone: zona, hour: "2-digit", hourCycle: "h23" }).format(ahora));
  return {
    tipo: "hora",
    titulo: "Hora actual",
    grande: hora.replace(/\s?([ap])\.?\s?m\.?/i, (_, l) => " " + l.toLowerCase() + ".m."),
    detalle: `${fecha} (${gmt})`,
    lugar: nombre,
    zona,
    noche: h24 < 6 || h24 >= 19
  };
}

function respuestaFecha(q) {
  const t = limpiar(q);
  if (!/(^|\s)(fecha|que dia es|dia es hoy|que fecha)(\s|$)/.test(t) || t.split(" ").length > 7) return null;
  const [zona, nombre] = buscarZona(q) || ZONA_POR_DEFECTO;
  const ahora = new Date();
  const dia = new Intl.DateTimeFormat("es-MX", { timeZone: zona, weekday: "long" }).format(ahora);
  const resto = new Intl.DateTimeFormat("es-MX", { timeZone: zona, day: "numeric", month: "long", year: "numeric" }).format(ahora);
  return { tipo: "fecha", titulo: "Fecha de hoy", grande: dia.charAt(0).toUpperCase() + dia.slice(1), detalle: resto, lugar: nombre };
}

export function respuestaInstantanea(q) {
  return respuestaCalculo(q) || respuestaHora(q) || respuestaFecha(q);
}
