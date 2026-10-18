import { esHalloween } from "../src/economia/temas.js";

// T("texto normal", "texto de Halloween"): devuelve el que corresponda al evento activo.
// En modo normal todo se ve exactamente igual que siempre.
export const T = (normal, halloween) => (esHalloween() ? halloween : normal);
