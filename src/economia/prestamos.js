import { getAccount, getAllAccounts, saveAccount, addToWallet } from "../../motores/db.js";
import { getProfile } from "../../motores/profile.js";
import { registrarEspera } from "../nucleo/espera.js";
import { tarjeta, monto, elegir } from "./formato-evento.js";
import { estilo } from "./temas.js";

const PRESTAMO_MIN = 1000;
const MAX_DIAS = 6;
const DIA_MS = 86400000;
const RESPUESTA_MS = 60000;
const REVISION_MS = 60000;
const INTERES_BASE = 0.04;
const INTERES_POR_DIA = 0.02;
const MULTA_MORA = 0.1;
const LIMITES = [
  [50, 500000],
  [40, 350000],
  [30, 250000],
  [20, 150000],
  [10, 75000],
  [5, 30000],
  [0, 10000]
];
const CAMPOS_BANCO = ["bank", "banco"];

const ESTILOS = {
  normal: {
    t: {
      solicitud: "SOLICITUD DE PRÉSTAMO",
      aprobado: "PRÉSTAMO APROBADO",
      estado: "ESTADO DEL PRÉSTAMO",
      cuota: "COBRO DE PRÉSTAMO",
      saldado: "PRÉSTAMO SALDADO",
      mora: "PRÉSTAMO EN MORA"
    },
    e: { solicitud: "🏦", aprobado: "✅", estado: "📋", cuota: "💸", saldado: "🎉", mora: "🚨" },
    l: {
      prestamo: "💰 *PRÉSTAMO::*",
      interes: "📈 *INTERÉS::*",
      total: "🧾 *TOTAL A PAGAR::*",
      plazo: "📅 *PLAZO::*",
      modalidad: "💳 *MODALIDAD::*",
      cuota: "🪙 *CUOTA::*",
      pendiente: "⏳ *SALDO PENDIENTE::*",
      vencido: "⚠️ *SALDO VENCIDO::*",
      proximo: "🕐 *PRÓXIMO COBRO::*",
      cobrado: "💸 *DESCONTADO::*",
      limite: "🔓 *TU LÍMITE::*"
    },
    modalidad: { pagos: "Pagos diarios", adjunto: "Pago único al vencimiento" },
    relatos: {
      solicitud: "Para continuar, responde *sin prefijo* en cuántos días deseas pagar el préstamo y bajo qué modalidad.",
      aprobado: [
        "El banco revisó tu solicitud y acreditó el préstamo en tu dinero en mano.",
        "Tu solicitud fue aprobada y los fondos ya se encuentran disponibles.",
        "El banco confió en tu historial y desembolsó el monto solicitado."
      ],
      estado: "Estos son los detalles de tu préstamo vigente.",
      cuota: "El banco descontó el pago programado de tu préstamo.",
      saldado: "Tu deuda quedó liquidada por completo. El banco queda a tu disposición.",
      mora: "No contabas con fondos suficientes en la fecha de cobro. Se aplicó un recargo y el banco descontará el saldo en cuanto dispongas de dinero."
    },
    tipSolicitud: `Tienes 60 segundos para responder. Escribe *cancelar* para anular.\nEjemplos: *5 días / por pago* · *3 días / monto adjunto*`,
    uso: (limite) =>
      `> Uso: *.prestamo <monto>*\n> Ejemplo: *.prestamo 50k*\n> Tu límite actual: *${monto(limite)}*\n> Más opciones: *.prestamo estado* · *.prestamo pagar*`,
    err: {
      invalido: "⚠️ Indica un monto válido. Ejemplo: *.prestamo 50k*",
      minimo: (n) => `⚠️ El préstamo mínimo es de *${monto(n)}*.`,
      maximo: (n) => `⚠️ Tu límite actual es de *${monto(n)}*. Sube de nivel para acceder a montos mayores.`,
      activo: (n) => `⚠️ Ya cuentas con un préstamo activo. Saldo pendiente: *${monto(n)}*. Usa *.prestamo estado* para ver los detalles.`,
      sinPrestamo: "⚠️ No tienes ningún préstamo activo.",
      dias: `⚠️ Indica entre 1 y ${MAX_DIAS} días. Ejemplo: *5 días / por pago*`,
      modalidad: "⚠️ Indica la modalidad: *por pago* o *monto adjunto*. Ejemplo: *5 días / por pago*",
      sinFondos: (n, d) => `⚠️ Fondos insuficientes para saldar el préstamo. Saldo pendiente: *${monto(n)}* · Disponible: *${monto(d)}*.`
    },
    cancelado: "✅ La solicitud de préstamo fue cancelada."
  },
  halloween: {
    t: {
      solicitud: "PACTO CON LA CRIPTA",
      aprobado: "PACTO SELLADO",
      estado: "LIBRO DE DEUDAS",
      cuota: "TRIBUTO COBRADO",
      saldado: "DEUDA SALDADA",
      mora: "DEUDA MALDITA"
    },
    e: { solicitud: "🕯️", aprobado: "🎃", estado: "📜", cuota: "💀", saldado: "🦇", mora: "👻" },
    l: {
      prestamo: "🎃 *PACTO::*",
      interes: "🕸️ *TRIBUTO EXTRA::*",
      total: "⚰️ *TOTAL A ENTREGAR::*",
      plazo: "🌙 *NOCHES::*",
      modalidad: "🔮 *MODALIDAD::*",
      cuota: "🍬 *CUOTA::*",
      pendiente: "⏳ *DEUDA PENDIENTE::*",
      vencido: "👻 *DEUDA VENCIDA::*",
      proximo: "🕯️ *PRÓXIMO COBRO::*",
      cobrado: "💀 *ARREBATADO::*",
      limite: "🗝️ *TU LÍMITE::*"
    },
    modalidad: { pagos: "Tributo diario", adjunto: "Cobro único al final del plazo" },
    relatos: {
      solicitud: "El banquero de ultratumba abre su libro de pactos. Responde *sin prefijo* cuántas noches necesitas y cómo pagarás el tributo 🕯️.",
      aprobado: [
        "El banquero esqueleto selló el pacto con cera negra y te entregó las calabazas 💀.",
        "Un murciélago voló con el contrato firmado y tus calabazas ya tintinean en tu caldero 🦇.",
        "La Catrina firmó de testigo: el préstamo está concedido, pero la cripta siempre cobra 🌹."
      ],
      estado: "Esto dice el libro de pactos sobre tu deuda con la cripta 📜.",
      cuota: "Una mano esquelética se asomó a tu caldero y se llevó el tributo programado 💀.",
      saldado: "El banquero tachó tu nombre del libro maldito. Tu deuda con la cripta quedó saldada 🎃.",
      mora: "Llegó el cobrador fantasma y tu caldero estaba vacío. Se sumó un recargo maldito y la cripta cobrará en cuanto tengas calabazas 👻."
    },
    tipSolicitud: `Tienes 60 segundos para responder. Escribe *cancelar* para romper el pacto. 🕸️\nEjemplos: *5 días / por pago* · *3 días / monto adjunto*`,
    uso: (limite) =>
      `> Uso: *.prestamo <monto>*\n> Ejemplo: *.prestamo 50k*\n> Tu límite actual: *${monto(limite)}* 🕸️\n> Más opciones: *.prestamo estado* · *.prestamo pagar*`,
    err: {
      invalido: "⚠️ 🦇 Indica un monto válido. Ejemplo: *.prestamo 50k*",
      minimo: (n) => `⚠️ 🕸️ El pacto mínimo es de *${monto(n)}*.`,
      maximo: (n) => `⚠️ 💀 La cripta solo te permite pactar hasta *${monto(n)}*. Sube de nivel para acceder a más.`,
      activo: (n) => `⚠️ 💀 Ya tienes un pacto vigente. Deuda pendiente: *${monto(n)}*. Usa *.prestamo estado* para ver los detalles.`,
      sinPrestamo: "⚠️ 🕸️ No tienes ningún pacto vigente con la cripta.",
      dias: `⚠️ 🌙 Indica entre 1 y ${MAX_DIAS} días. Ejemplo: *5 días / por pago*`,
      modalidad: "⚠️ 🔮 Indica la modalidad: *por pago* o *monto adjunto*. Ejemplo: *5 días / por pago*",
      sinFondos: (n, d) => `⚠️ 💀 No tienes calabazas suficientes para saldar el pacto. Deuda: *${monto(n)}* · Disponible: *${monto(d)}*.`
    },
    cancelado: "✅ 🕯️ El pacto fue roto y la solicitud quedó cancelada."
  }
};

let intervalo = null;
let sockActual = null;

function prestamoDe(sender) {
  return getAccount(sender).prestamo || null;
}

function guardarPrestamo(sender, p) {
  getAccount(sender).prestamo = p;
  saveAccount(sender);
}

function tasa(dias) {
  return INTERES_BASE + INTERES_POR_DIA * dias;
}

function pct(valor) {
  return `${Math.round(valor * 100)}%`;
}

function duracion(ms) {
  const minutos = Math.max(1, Math.ceil(ms / 60000));
  const d = Math.floor(minutos / 1440);
  const h = Math.floor((minutos % 1440) / 60);
  const m = minutos % 60;
  return [d ? `${d} d` : "", h ? `${h} h` : "", !d && m ? `${m} min` : ""].filter(Boolean).join(" ") || "menos de 1 min";
}

function nivelDe(sender) {
  const nivel = Number(getProfile(sender).level);
  return Number.isFinite(nivel) && nivel > 0 ? Math.floor(nivel) : 1;
}

function limiteDe(sender) {
  const nivel = nivelDe(sender);
  return LIMITES.find(([minimo]) => nivel >= minimo)[1];
}

function campoBanco(cuenta) {
  return CAMPOS_BANCO.find((campo) => typeof cuenta[campo] === "number");
}

function disponibleDe(sender) {
  const cuenta = getAccount(sender);
  const campo = campoBanco(cuenta);
  return Math.max(0, cuenta.wallet || 0) + (campo ? Math.max(0, cuenta[campo]) : 0);
}

function cobrar(sender, cantidad) {
  const cuenta = getAccount(sender);
  let falta = cantidad;
  const deMano = Math.min(Math.max(0, cuenta.wallet || 0), falta);
  cuenta.wallet -= deMano;
  falta -= deMano;
  const campo = campoBanco(cuenta);
  if (campo && falta > 0) {
    const delBanco = Math.min(Math.max(0, cuenta[campo]), falta);
    cuenta[campo] -= delBanco;
    falta -= delBanco;
  }
  saveAccount(sender);
  return cantidad - falta;
}

function leerMontoPrestamo(texto) {
  const t = String(texto ?? "").trim().toLowerCase().replace(/\s+/g, "");
  if (/^\d{1,3}([.,]\d{3})+$/.test(t)) return Number(t.replace(/[.,]/g, ""));
  const m = t.match(/^(\d+(?:[.,]\d+)?)(k|m)?$/);
  if (!m) return 0;
  const factor = m[2] === "k" ? 1e3 : m[2] === "m" ? 1e6 : 1;
  return Math.floor(Number(m[1].replace(",", ".")) * factor);
}

function leerRespuesta(texto) {
  const t = String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (!t || /^[./#!]/.test(t)) return null;
  if (/^(cancelar|cancel|cancela)$/.test(t)) return { cancelar: true };
  const numero = t.match(/\d+/);
  const adjunto = /adjunt|junto|unico|solo|total|final|una vez/.test(t);
  const pagos = /pago|cuota|diari|parcial|dividid/.test(t);
  if (!numero && !adjunto && !pagos) return null;
  const dias = numero ? Number(numero[0]) : 0;
  if (!dias || dias < 1 || dias > MAX_DIAS) return { error: "dias" };
  if (!adjunto && !pagos) return { error: "modalidad" };
  return { dias, modalidad: adjunto ? "adjunto" : "pagos" };
}

function crearPrestamo(sender, chat, principal, dias, modalidad) {
  const total = Math.round(principal * (1 + tasa(dias)));
  const cuotas = modalidad === "pagos" ? dias : 1;
  const unidad = modalidad === "pagos" ? DIA_MS : dias * DIA_MS;
  const p = {
    chat,
    principal,
    total,
    pendiente: total,
    modalidad,
    dias,
    cuotas,
    unidad,
    cuota: Math.ceil(total / cuotas),
    asignadas: 0,
    asignado: 0,
    vencido: 0,
    mora: false,
    inicio: Date.now()
  };
  guardarPrestamo(sender, p);
  return p;
}

function proximoCobro(p) {
  return p.asignadas < p.cuotas ? p.inicio + (p.asignadas + 1) * p.unidad : null;
}

function lineasDetalle(E, p) {
  const lineas = [
    `${E.l.prestamo} ${monto(p.principal)}`,
    `${E.l.interes} ${pct(tasa(p.dias))}`,
    `${E.l.total} ${monto(p.total)}`,
    `${E.l.plazo} ${p.dias} ${p.dias === 1 ? "día" : "días"}`,
    `${E.l.modalidad} ${E.modalidad[p.modalidad]}`
  ];
  if (p.modalidad === "pagos") lineas.push(`${E.l.cuota} ${monto(p.cuota)} diarios`);
  return lineas;
}

function procesar(sender, p, ahora) {
  const evento = { cuota: false, mora: false, saldado: false, cobrado: 0 };
  while (p.asignadas < p.cuotas && p.inicio + (p.asignadas + 1) * p.unidad <= ahora) {
    const numero = p.asignadas + 1;
    const importe = numero === p.cuotas ? p.total - p.asignado : p.cuota;
    p.asignado += importe;
    p.vencido += importe;
    p.asignadas = numero;
  }
  if (p.vencido <= 0) return evento;

  const pagado = cobrar(sender, p.vencido);
  p.vencido -= pagado;
  p.pendiente -= pagado;
  evento.cobrado = pagado;

  if (p.vencido > 0 && !p.mora) {
    const multa = Math.ceil(p.vencido * MULTA_MORA);
    p.vencido += multa;
    p.pendiente += multa;
    p.mora = true;
    evento.mora = true;
  }
  if (p.pendiente <= 0) evento.saldado = true;
  else if (p.vencido <= 0 && pagado > 0) evento.cuota = true;
  return evento;
}

async function notificar(sender, p, evento) {
  if (!sockActual) return;
  const E = estilo(ESTILOS);
  const mencion = `@${String(sender).split("@")[0]}`;
  let clave = null;
  let lineas = [];
  if (evento.saldado) {
    clave = "saldado";
    lineas = [`${E.l.cobrado} ${monto(evento.cobrado)}`];
  } else if (evento.mora) {
    clave = "mora";
    lineas = [`${E.l.vencido} ${monto(p.vencido)}`, `${E.l.pendiente} ${monto(p.pendiente)}`];
  } else if (evento.cuota) {
    clave = "cuota";
    const siguiente = proximoCobro(p);
    lineas = [`${E.l.cobrado} ${monto(evento.cobrado)}`, `${E.l.pendiente} ${monto(p.pendiente)}`];
    if (siguiente) lineas.push(`${E.l.proximo} ${duracion(siguiente - Date.now())}`);
  }
  if (!clave) return;
  const texto = tarjeta({
    emoji: E.e[clave],
    titulo: E.t[clave],
    relato: `${mencion}\n${E.relatos[clave]}`,
    lineas
  });
  await sockActual.sendMessage(p.chat, { text: texto, mentions: [sender] });
}

async function revisar() {
  const ahora = Date.now();
  for (const [sender, cuenta] of [...getAllAccounts().entries()]) {
    const p = cuenta.prestamo;
    if (!p) continue;
    try {
      const evento = procesar(sender, p, ahora);
      if (evento.saldado) cuenta.prestamo = null;
      if (evento.saldado || evento.cobrado > 0 || evento.mora) saveAccount(sender);
      await notificar(sender, p, evento);
    } catch (error) {
      console.error("[prestamos]", error?.message || error);
    }
  }
}

export function iniciarCobranzaPrestamos(sock) {
  sockActual = sock;
  if (intervalo) return;
  intervalo = setInterval(revisar, REVISION_MS);
  intervalo.unref?.();
  revisar();
}

export function manejarPrestamo(sender, from, argumento) {
  const E = estilo(ESTILOS);
  const arg = String(argumento ?? "").trim().toLowerCase();
  const p = prestamoDe(sender);

  if (["estado", "info", "deuda"].includes(arg)) {
    if (!p) return E.err.sinPrestamo;
    const siguiente = proximoCobro(p);
    const lineas = [...lineasDetalle(E, p), `${E.l.pendiente} ${monto(p.pendiente)}`];
    if (p.vencido > 0) lineas.push(`${E.l.vencido} ${monto(p.vencido)}`);
    else if (siguiente) lineas.push(`${E.l.proximo} ${duracion(siguiente - Date.now())}`);
    return tarjeta({ emoji: E.e.estado, titulo: E.t.estado, relato: E.relatos.estado, lineas });
  }

  if (["pagar", "saldar", "liquidar"].includes(arg)) {
    if (!p) return E.err.sinPrestamo;
    const disponible = disponibleDe(sender);
    if (disponible < p.pendiente) return E.err.sinFondos(p.pendiente, disponible);
    const cobrado = cobrar(sender, p.pendiente);
    guardarPrestamo(sender, null);
    return tarjeta({
      emoji: E.e.saldado,
      titulo: E.t.saldado,
      relato: E.relatos.saldado,
      lineas: [`${E.l.cobrado} ${monto(cobrado)}`]
    });
  }

  const limite = limiteDe(sender);
  if (!arg) return E.uso(limite);
  if (p) return E.err.activo(p.pendiente);

  const cantidad = ["todo", "all", "max"].includes(arg) ? limite : leerMontoPrestamo(arg);
  if (!cantidad) return `${E.err.invalido}\n\n${E.uso(limite)}`;
  if (cantidad < PRESTAMO_MIN) return E.err.minimo(PRESTAMO_MIN);
  if (cantidad > limite) return E.err.maximo(limite);

  registrarEspera(`${from}:${sender}`, {
    tipo: "prestamo",
    duracionMs: RESPUESTA_MS,
    alResponder: (texto, ctx) => responderSolicitud(texto, ctx, cantidad)
  });
  return tarjeta({
    emoji: E.e.solicitud,
    titulo: E.t.solicitud,
    relato: E.relatos.solicitud,
    lineas: [
      `${E.l.prestamo} ${monto(cantidad)}`,
      `${E.l.interes} ${pct(tasa(1))} (1 día) – ${pct(tasa(MAX_DIAS))} (${MAX_DIAS} días)`,
      `${E.l.limite} ${monto(limite)}`
    ],
    tip: E.tipSolicitud
  });
}

async function responderSolicitud(texto, ctx, cantidad) {
  const { sock, from, sender, msg } = ctx;
  const respuesta = leerRespuesta(texto);
  if (!respuesta) return false;

  const E = estilo(ESTILOS);
  const enviar = (contenido) => sock.sendMessage(from, { text: contenido }, { quoted: msg });

  if (respuesta.cancelar) {
    await enviar(E.cancelado);
    return true;
  }
  if (respuesta.error) {
    await enviar(E.err[respuesta.error]);
    return false;
  }

  const activo = prestamoDe(sender);
  if (activo) {
    await enviar(E.err.activo(activo.pendiente));
    return true;
  }
  const limite = limiteDe(sender);
  if (cantidad > limite) {
    await enviar(E.err.maximo(limite));
    return true;
  }

  const p = crearPrestamo(sender, from, cantidad, respuesta.dias, respuesta.modalidad);
  addToWallet(sender, p.principal);

  const lineas = lineasDetalle(E, p);
  if (p.modalidad === "adjunto") lineas.push(`${E.l.proximo} ${duracion(proximoCobro(p) - Date.now())}`);
  await enviar(
    tarjeta({
      emoji: E.e.aprobado,
      titulo: E.t.aprobado,
      relato: elegir(E.relatos.aprobado),
      lineas
    })
  );
  return true;
}
