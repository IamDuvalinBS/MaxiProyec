import { getAccount, saveAccount, addToWallet } from "../../motores/db.js";
import { datosDe, guardarDatos } from "../../motores/almacen-local.js";

export const HORAS_CICLO = 12;
export const CICLO_MS = HORAS_CICLO * 60 * 60 * 1000;
export const SEMANA_MS = 7 * 24 * 60 * 60 * 1000;
export const VENTANA_PAGO_MS = 3 * 24 * 60 * 60 * 1000;
export const TOPE_GENERACION = 600000;
export const RENDIMIENTO = 0.1;
export const PORCENTAJE_SEMANAL = 0.25;

export const CATALOGO = [
  { clave: "chimichangas", emoji: "🌯", nombre: "Puesto de Chimichangas", precio: 500000 },
  { clave: "abarrotes", emoji: "🛒", nombre: "Tienda de Abarrotes", precio: 1500000 },
  { clave: "cafeteria", emoji: "☕", nombre: "Cafetería", precio: 3000000 },
  { clave: "taqueria", emoji: "🌮", nombre: "Taquería", precio: 6000000 }
];

export function maximoDe(def) {
  return Math.min(TOPE_GENERACION, Math.round(def.precio * RENDIMIENTO));
}

export function pagoSemanalDe(def) {
  return Math.round(def.precio * PORCENTAJE_SEMANAL);
}

export function definicionPorNumero(numero) {
  return CATALOGO[numero - 1] || null;
}

export function negociosDe(sender) {
  return datosDe(sender).negocios;
}

export function pendienteDe(negocio, def, ahora = Date.now()) {
  const maximo = maximoDe(def);
  const fin = Math.min(ahora, negocio.vence);
  const transcurrido = Math.max(0, Math.min(fin - negocio.inicio, CICLO_MS));
  const generado = Math.floor((maximo * transcurrido) / CICLO_MS);
  return Math.min(maximo, (negocio.acumulado || 0) + generado);
}

export function estaVencido(negocio, ahora = Date.now()) {
  return ahora >= negocio.vence;
}

export function comprarNegocio(sender, def) {
  const cuenta = getAccount(sender);
  const negocios = datosDe(sender).negocios;
  if (negocios[def.clave]) return { exito: false, motivo: "poseido" };
  if (cuenta.wallet < def.precio) return { exito: false, motivo: "fondos", faltante: def.precio - cuenta.wallet };
  const ahora = Date.now();
  cuenta.wallet -= def.precio;
  negocios[def.clave] = { compradoEn: ahora, inicio: ahora, vence: ahora + SEMANA_MS, acumulado: 0 };
  saveAccount(sender);
  guardarDatos();
  return { exito: true };
}

export function reclamarNegocios(sender) {
  const negocios = datosDe(sender).negocios;
  const ahora = Date.now();
  const detalle = [];
  const vencidos = [];
  let total = 0;

  for (const def of CATALOGO) {
    const negocio = negocios[def.clave];
    if (!negocio) continue;
    if (estaVencido(negocio, ahora)) vencidos.push(def);
    const pendiente = pendienteDe(negocio, def, ahora);
    if (pendiente <= 0) continue;
    negocio.acumulado = 0;
    negocio.inicio = ahora;
    total += pendiente;
    detalle.push({ def, monto: pendiente });
  }

  if (total > 0) addToWallet(sender, total);
  guardarDatos();
  return { total, detalle, vencidos };
}

export function pagosPendientes(sender, ahora = Date.now()) {
  const negocios = datosDe(sender).negocios;
  const lista = [];
  for (const def of CATALOGO) {
    const negocio = negocios[def.clave];
    if (!negocio) continue;
    if (negocio.vence - ahora <= VENTANA_PAGO_MS) lista.push({ def, negocio });
  }
  return lista;
}

export function pagarMantenimiento(sender) {
  const cuenta = getAccount(sender);
  const ahora = Date.now();
  const lista = pagosPendientes(sender, ahora);
  if (!lista.length) return { exito: false, motivo: "sin_pagos" };

  const total = lista.reduce((suma, { def }) => suma + pagoSemanalDe(def), 0);
  if (cuenta.wallet < total) return { exito: false, motivo: "fondos", total };

  for (const { def, negocio } of lista) {
    if (estaVencido(negocio, ahora)) {
      negocio.acumulado = pendienteDe(negocio, def, ahora);
      negocio.inicio = ahora;
      negocio.vence = ahora + SEMANA_MS;
    } else {
      negocio.vence += SEMANA_MS;
    }
  }
  cuenta.wallet -= total;
  saveAccount(sender);
  guardarDatos();
  return { exito: true, total, pagados: lista.map(({ def }) => def) };
}
