import { crearSesion } from "./utilidades-parches.mjs";

const sesion = crearSesion();

const BLOQUEO =
  '  if (comando !== ".afk" && estaAfk(sender)) {\n' +
  '    await reply({ text: "🌙 Te encuentras en modo AFK. Usa *.afk* para salir antes de utilizar otros comandos." });\n' +
  "    return true;\n" +
  "  }\n\n";

const IMPORTACION = 'import { estaAfk } from "../economia/afk.js";\n';

const comandos = sesion.leer("src/nucleo/comandos.js");
if (comandos) {
  if (comandos.texto.includes(BLOQUEO)) {
    comandos.texto = comandos.texto.replace(BLOQUEO, "");
    sesion.nota("APLICADO       src/nucleo/comandos.js: se quitó el bloqueo de comandos durante el AFK");
  } else {
    sesion.nota("YA ESTABA      src/nucleo/comandos.js: sin bloqueo de comandos durante el AFK");
  }
  if (comandos.texto.includes(IMPORTACION)) {
    comandos.texto = comandos.texto.replace(IMPORTACION, "");
    sesion.nota("APLICADO       src/nucleo/comandos.js: se quitó el import sin uso de estaAfk");
  }
  sesion.guardar(comandos);
}

sesion.terminar();
