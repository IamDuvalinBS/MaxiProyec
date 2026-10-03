import { crearSesion } from "./utilidades-parches.mjs";

const sesion = crearSesion();

const formato = sesion.leer("src/economia/formato.js");
if (formato) {
  sesion.reemplazar(
    formato,
    "encabezado con el sello ```##``` en todas las tarjetas",
    "const partes = [`⧼${emoji}⧽ *${titulo}*`];",
    "const partes = [`⧼${emoji}⧽ \\`\\`\\`##\\`\\`\\` *${titulo}*`];",
    "\\`\\`\\`##"
  );
  sesion.guardar(formato);
}

const motor = sesion.leer("src/descargas/youtube-engine.js");
if (motor) {
  sesion.reemplazar(
    motor,
    "hashtags del video en la información",
    "    fecha: fechaCruda,",
    "    fecha: fechaCruda,\n    etiquetas: Array.isArray(basico.tags) ? basico.tags : Array.isArray(basico.keywords) ? basico.keywords : [],",
    "etiquetas: Array.isArray(basico.tags)"
  );
  sesion.guardar(motor);
}

const indice = sesion.leer("index.js");
if (indice) {
  sesion.agregarImport(
    indice,
    'import { idDeRespuestaInteractiva } from "./motores/respuestas-botones.js";',
    "idDeRespuestaInteractiva } from"
  );
  sesion.reemplazar(
    indice,
    "lectura de los botones de respuesta rápida",
    "      msg.message.templateButtonReplyMessage?.selectedId ||\n      null;",
    "      msg.message.templateButtonReplyMessage?.selectedId ||\n      idDeRespuestaInteractiva(msg) ||\n      null;",
    "idDeRespuestaInteractiva(msg)"
  );
  sesion.guardar(indice);
}

sesion.terminar();
