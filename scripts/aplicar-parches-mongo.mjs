import { crearSesion } from "./utilidades-parches.mjs";
import { ARMAR_OPERACION } from "./texto-guardado.mjs";

const sesion = crearSesion();

const db = sesion.leer("motores/db.js");
if (db) {
  sesion.reemplazarRegion(
    db,
    "MongoDB guarda solo números: días de racha, negocios compactos y AFK",
    "function armarOperacion(sender) {",
    "\nexport async function guardarCuentasPendientes",
    ARMAR_OPERACION,
    "const opcionales = {"
  );
  sesion.guardar(db);
}

sesion.terminar();
