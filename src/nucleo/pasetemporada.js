// Entrega automática de premios del pase: la página deja una solicitud en Firestore (pasereclamos) y aquí se aplica
// a la cuenta de WhatsApp vinculada. Cada premio se entrega una sola vez (queda marcado en el inventario del gacha).
import { addToWallet } from "../../motores/db.js";
import { cantidadItem, sumarItem } from "../../motores/gacha-db.js";
import { darTickets } from "../../motores/gacha-tickets.js";
import { PASES, reclamarPase } from "../../motores/gacha-pases.js";
import { TEMPORADA, catalogoParaPagina, nivelPorNumero, vaAlBot } from "../../motores/pase-temporada.js";

const GRACIA_MS = 24 * 3600000;   // margen después de que termina la temporada
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

export function iniciarPaseTemporada({ PAG, sincronizar }) {
  const log = (e) => console.log("Pase: " + (e?.message || e));
  let cola = Promise.resolve(), ultima = "";

  function publicar() {
    const cat = catalogoParaPagina(), firma = JSON.stringify(cat);
    if (firma === ultima) return;
    PAG.fs.collection("bot").doc("temporada").set({ ...cat, t: PAG.FV.serverTimestamp() }).then(() => { ultima = firma; }).catch(log);
  }

  async function jidDe(uid) {
    for (let i = 0; i < 4; i++) {            // al arrancar, la lista de vinculados puede tardar unos segundos
      const j = PAG.vinc.get(uid)?.jid;
      if (j) return j;
      await pausa(4000);
    }
    return null;
  }

  async function entregarNivel(uid, jid, clave) {
    const [temp, ns] = String(clave).split("-"), n = Number(ns);
    if (temp !== TEMPORADA.id || Date.now() > TEMPORADA.fin + GRACIA_MS) return;
    const lv = nivelPorNumero(n);
    if (!lv || !vaAlBot(lv.r)) return;
    const item = `pt:${TEMPORADA.id}:${n}`;
    if (cantidadItem(jid, item) > 0) return;                                  // ya entregado
    const [pf, ow] = await Promise.all([PAG.fs.collection("perfiles").doc(uid).get(), PAG.fs.collection("owners").doc(uid).get()]);
    const p = pf.data()?.pase, xp = p && p.t === TEMPORADA.id ? Number(p.xp) || 0 : 0;
    if (!ow.exists && xp < n * TEMPORADA.xpNivel) { log(`${uid}: nivel ${n} sin XP suficiente, no se entrega`); return; }
    if (cantidadItem(jid, item) > 0) return;
    sumarItem(jid, item, 1);                                                  // se marca antes de entregar
    if (lv.r.t === "yenes") addToWallet(jid, lv.r.v); else darTickets(jid, lv.r.cat, lv.r.v);
    console.log(`Pase: nivel ${n} entregado a ${uid}`);
  }

  async function atender(doc) {
    try {
      const d = doc.data(), uid = d.uid;
      if (!uid || doc.id.split("_")[0] !== uid) return;
      const jid = await jidDe(uid);
      if (!jid) return;
      const { gachaListo } = await import("../../motores/gacha-core.js");     // el gacha ya está cargado a estas alturas
      await gachaListo;
      if (d.k === "pt") await entregarNivel(uid, jid, d.i);
      else if (d.k === "gp") { const p = PASES.find((x) => x.id === d.i); if (p) reclamarPase(jid, p.codigo); }
      sincronizar(uid);
    } catch (e) { log(e); }
    finally { await doc.ref.delete().catch(() => {}); }
  }

  function escuchar() {
    PAG.fs.collection("pasereclamos").onSnapshot((s) => {
      for (const ch of s.docChanges()) if (ch.type === "added") cola = cola.then(() => atender(ch.doc)).catch(log);
    }, (e) => { log(e); setTimeout(escuchar, 30000); });
  }

  publicar();
  setInterval(publicar, 10 * 60000);
  escuchar();
}
