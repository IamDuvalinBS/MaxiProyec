// Broches ({usuario}, {grupo}, ...) para los mensajes editables de bienvenida y despedida.
// Ninguno es obligatorio: el mensaje que escriba el usuario puede llevar solo los que quiera.

export const LIMITE_PLANTILLA = 1000;

export const BROCHES = [
  { clave: "usuario", alias: ["user"], desc: "menciona a la persona que entró o salió" },
  { clave: "numero", alias: ["number"], desc: "el número de la persona, sin mención" },
  { clave: "grupo", alias: ["group", "asunto"], desc: "nombre del grupo" },
  { clave: "miembros", alias: ["members", "usuarios"], desc: "cantidad de integrantes del grupo" },
  { clave: "creacion", alias: ["creation", "creado"], desc: "fecha en que se creó el grupo" },
  { clave: "link", alias: ["enlace"], desc: "enlace de invitación del grupo" },
  { clave: "fecha", alias: ["date", "hoy"], desc: "fecha de hoy" },
  { clave: "bot", alias: [], desc: "nombre del bot" }
];

const sinAcentos = (t) => String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const CLAVE_DE = new Map();
for (const b of BROCHES) {
  CLAVE_DE.set(b.clave, b.clave);
  for (const a of b.alias) CLAVE_DE.set(a, b.clave);
}

const PATRON = /\{\s*([^{}\s]+)\s*\}/g;

export function claveDeBroche(texto) {
  return CLAVE_DE.get(sinAcentos(texto)) || null;
}

// Devuelve { usados: [claves], desconocidos: ["{xyz}"] } del texto escrito por el usuario.
export function revisarBroches(plantilla) {
  const usados = new Set();
  const desconocidos = new Set();
  for (const m of String(plantilla).matchAll(PATRON)) {
    const clave = claveDeBroche(m[1]);
    if (clave) usados.add(clave);
    else desconocidos.add(`{${m[1]}}`);
  }
  return { usados: [...usados], desconocidos: [...desconocidos] };
}

export function usaBroche(plantilla, clave) {
  return revisarBroches(plantilla).usados.includes(clave);
}

// Cambia cada broche por su valor. Los que no existan se dejan tal cual, para que se note el error al probar.
export function aplicarPlantilla(plantilla, valores) {
  return String(plantilla).replace(PATRON, (completo, nombre) => {
    const clave = claveDeBroche(nombre);
    const valor = clave ? valores[clave] : undefined;
    return valor === undefined || valor === null ? completo : String(valor);
  });
}

export function textoBroches() {
  return BROCHES.map((b) => `• *{${b.clave}}* › ${b.desc}`).join("\n");
}
