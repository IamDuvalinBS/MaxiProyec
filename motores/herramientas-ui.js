export const esc = (t) =>
  String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const json = (d) =>
  JSON.stringify(d).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

export function normalizar(t) {
  return String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[°º]/g, "")
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .replace(/\s+/g, " ")
    .trim();
}

export function textoCitado(msg) {
  const c = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!c) return "";
  return String(
    c.conversation ||
      c.extendedTextMessage?.text ||
      c.imageMessage?.caption ||
      c.videoMessage?.caption ||
      c.interactiveMessage?.body?.text ||
      c.buttonsMessage?.contentText ||
      c.templateMessage?.hydratedTemplate?.hydratedContentText ||
      c.viewOnceMessage?.message?.interactiveMessage?.body?.text ||
      c.documentWithCaptionMessage?.message?.documentMessage?.caption ||
      ""
  ).trim();
}

export function parseNumero(s) {
  let t = String(s || "").trim().replace(/\s/g, "");
  if (!t) return NaN;
  const c = t.lastIndexOf(",");
  const p = t.lastIndexOf(".");
  if (c >= 0 && p >= 0) t = c > p ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  else if (c >= 0) t = /^-?\d{1,3}(,\d{3})+$/.test(t) ? t.replace(/,/g, "") : t.replace(",", ".");
  else if (p >= 0 && /^-?\d{1,3}(\.\d{3}){2,}$/.test(t)) t = t.replace(/\./g, "");
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

const CSS_BASE = `*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html{color-scheme:dark light}
:root{--bg:#13151a;--pn:#1c1f26;--pn2:#272b35;--ln:#343a46;--ink:#eef0f5;--mut:#929bab;--acc:__A__;--on:#10131a}
@media (prefers-color-scheme:light){:root{--bg:#f1f2f5;--pn:#fff;--pn2:#e9ebf0;--ln:#d4d8e0;--ink:#171a21;--mut:#596273}}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;min-height:100vh;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}
.app{max-width:460px;margin:0 auto;padding:14px 14px 22px}
.top{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.logo{width:36px;height:36px;border-radius:11px;background:var(--acc);color:var(--on);display:grid;place-items:center;font-size:19px;flex:none}
.top b{font-size:17px;font-weight:650}
.top span{margin-left:auto;color:var(--mut);font-size:13px;text-align:right}
.pn{background:var(--pn);border:1px solid var(--ln);border-radius:16px;padding:14px;margin-bottom:10px}
button,select,input{font:inherit;color:inherit}
button{cursor:pointer}
:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
.btn{border:0;border-radius:12px;background:var(--pn2);padding:10px 14px;min-height:44px}
.btn.p{background:var(--acc);color:var(--on);font-weight:650}
.btn:active{filter:brightness(1.18)}
.row{display:flex;gap:8px;flex-wrap:wrap}
.in{width:100%;background:var(--pn2);border:1px solid var(--ln);border-radius:12px;padding:10px 12px;min-height:44px}
.mut{color:var(--mut);font-size:13px}
.foot{text-align:center;color:var(--mut);font-size:12px;margin-top:16px}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}`;

export function pagina({ titulo, acento, cuerpo, css = "", script = "", firma = "MaxiProyec" }) {
  return (
    '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    "<title>" + esc(titulo) + "</title><style>" + CSS_BASE.replace("__A__", acento) + css + "</style></head><body>" +
    '<div class="app">' + cuerpo + '<div class="foot">ⓘ Powered by ' + esc(firma) + "</div></div>" +
    (script ? "<script>" + script + "</script>" : "") +
    "</body></html>"
  );
}

export function limitarEspera(mapa, clave, ms) {
  const ahora = Date.now();
  const falta = ms - (ahora - (mapa.get(clave) || 0));
  if (falta > 0) return Math.ceil(falta / 1000);
  mapa.set(clave, ahora);
  if (mapa.size > 800) mapa.delete(mapa.keys().next().value);
  return 0;
}
