// Este archivo NO tiene logica propia - solo reune todo lo de los archivos
// chicos (db.js, ui.js, profile.js, trivia.js, reactions.js, work.js, sticker.js)
// para que los comandos puedan seguir haciendo "import ... from ../core.js" como
// siempre, sin tener que cambiar nada en cada archivo de comando.
export * from "./db.js";
export * from "./ui.js";
export * from "./profile.js";
export * from "./trivia.js";
export * from "./reactions.js";
export * from "./work.js";
export * from "./sticker.js";
export * from "./descargas-core.js";
export * from "./redes-core.js";
export * from "./youtube-core.js";
export * from "./spotify-core.js";
export * from "./motores/db.js";
export * from "./motores/ui.js";
export * from "./motores/profile.js";
export * from "./motores/trivia.js";
export * from "./motores/reactions.js";
export * from "./motores/work.js";
export * from "./motores/owner.js";
export * from "./motores/antiban.js";
export * from "./motores/adminwelcome.js";
