// Guarda, por chat+persona, que un ".play" dejó pendiente elegir "1"
// (audio) o "2" (video) para tal link. Se consulta desde index.js en la
// cadena de texto sin prefijo (junto a Akinator/juegos/trivia), así el
// usuario no necesita etiquetar ni citar el mensaje del bot: alcanza con
// responder "1" o "2" mientras la espera siga vigente.
const esperas = new Map(); // clave (chat+persona) -> { link, vence }

const DURACION_MS = 5 * 60 * 1000; // 5 minutos, despues se descarta sola

export function registrarEsperaFormato(clave, link) {
  esperas.set(clave, { link, vence: Date.now() + DURACION_MS });
}

// Si "texto" es "1"/"2" y hay una espera vigente para esa clave, devuelve
// el comando interno a ejecutar (".ytaudio <link>" / ".ytvideo <link>")
// y borra la espera. Si no aplica (no hay espera, ya vencio, o el texto
// no es "1"/"2"), devuelve null sin tocar nada — así no interfiere con
// Akinator/juegos/trivia si esta persona no tenia un .play pendiente.
export function resolverEleccionFormato(clave, texto) {
  const espera = esperas.get(clave);
  if (!espera) return null;

  if (Date.now() > espera.vence) {
    esperas.delete(clave);
    return null;
  }

  const opcion = texto.trim();
  if (opcion !== "1" && opcion !== "2") return null;

  esperas.delete(clave);
  return opcion === "1" ? `.ytaudio ${espera.link}` : `.ytvideo ${espera.link}`;
}
