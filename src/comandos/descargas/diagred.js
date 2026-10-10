import { diagnosticarRedes } from "../../descargas/redes.js";
import { tarjetaAviso } from "../../descargas/tarjetas.js";

// Prueba cada servicio de descargas y muestra cuál falla y por qué. Puedes borrar este archivo cuando todo funcione.
let ultimaVez = 0;

export default {
  names: [".diagred"],
  usage: ".diagred",
  desc: "Diagnóstico: prueba cada servicio de descargas (TikTok, Instagram, Pinterest…) y muestra cuál falla",
  category: "Descargas",
  handler: async ({ reply }) => {
    if (Date.now() - ultimaVez < 30000) {
      return reply({ text: tarjetaAviso("DIAGNÓSTICO", "Espera unos segundos antes de repetirlo.") });
    }
    ultimaVez = Date.now();

    await reply({ text: tarjetaAviso("DIAGNÓSTICO", "Probando los servicios. Tarda unos 30 segundos.") }).catch(() => {});
    const lineas = await diagnosticarRedes();
    await reply({ text: tarjetaAviso("DIAGNÓSTICO DE DESCARGAS", lineas.join("\n")) });
  }
};
