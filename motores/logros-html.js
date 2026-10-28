const PLANTILLA = String.raw`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html{background:#07091c;overflow-x:hidden}
body{--bg:#0b0f2b;--card:#141a45;--card2:#0e1336;--line:#33409a;--acc:#7c8cff;--acc2:#46e0c2;--txt:#e9ecff;--mut:#8f9bd6;--ok:#ffd34d;--bar:#7c8cff;
background:linear-gradient(180deg,var(--bg),#05061a);color:var(--txt);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:13px;padding:14px 12px 20px;min-height:100vh}
body.h{--bg:#1a0524;--card:#2a0c36;--card2:#1b0624;--line:#ff7a1a;--acc:#ff7a1a;--acc2:#8dff3f;--txt:#fff0e0;--mut:#d3a6e6;--ok:#ffb020;--bar:#ff7a1a;background:radial-gradient(110% 50% at 50% 0,#4a1250,transparent 60%),linear-gradient(180deg,var(--bg),#070209)}
.w{max-width:520px;margin:0 auto}
.hd{display:flex;align-items:center;gap:14px;padding:14px;border-radius:22px;background:var(--card);border:1.5px solid var(--line);margin-bottom:12px}
.ring{position:relative;width:86px;height:86px;flex:none}
.ring svg{width:100%;height:100%;transform:rotate(-90deg)}
.ring b{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:19px;line-height:1}
.ring b small{font-size:9px;font-weight:600;color:var(--mut);margin-top:3px}
.hd h1{font-size:19px;line-height:1.15;overflow-wrap:anywhere}
.hd p{color:var(--mut);margin-top:4px;font-size:12px}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.chip{padding:3px 9px;border-radius:20px;background:var(--card2);border:1px solid var(--line);font-size:11px}
.seg{display:flex;gap:6px;margin-bottom:12px}
.seg button{flex:1;padding:9px 4px;border-radius:14px;border:1.5px solid var(--line);background:var(--card2);color:var(--mut);font:inherit;font-weight:700;font-size:12px;cursor:pointer}
.seg button.on{background:var(--acc);color:#16081f;border-color:var(--acc)}
.row{display:flex;gap:11px;align-items:center;padding:11px;border-radius:16px;background:var(--card);border:1.5px solid var(--line);margin-bottom:9px}
.row.ok{border-color:var(--ok);box-shadow:0 0 14px rgba(255,200,80,.18)}
.row.lk .med{filter:grayscale(1);opacity:.55}
.med{flex:none;width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:23px;background:var(--card2);border:2px solid var(--acc)}
.row.ok .med{border-color:var(--ok)}
.in{flex:1;min-width:0}
.t{font-weight:800;font-size:13.5px;display:flex;justify-content:space-between;gap:6px}
.t em{font-style:normal;color:var(--ok);font-size:12px;white-space:nowrap}
.d{font-size:11.5px;color:var(--mut);margin-top:2px;line-height:1.3}
.bar{height:6px;border-radius:4px;background:rgba(255,255,255,.1);margin-top:7px;overflow:hidden}
.bar i{display:block;height:100%;background:var(--bar);border-radius:4px}
.row.ok .bar i{background:var(--ok)}
.f{font-size:10.5px;color:var(--mut);margin-top:4px;display:flex;justify-content:space-between;gap:6px}
.rw{color:var(--acc2)}
.note{padding:9px 11px;border-radius:12px;border:1px dashed var(--line);color:var(--mut);font-size:11.5px;line-height:1.4;margin:2px 0 10px}
.sub{font-weight:800;font-size:13px;margin:12px 2px 8px}.sub small{color:var(--mut);font-weight:600;font-size:11px}
.pie{margin-top:14px;text-align:center;color:var(--mut);font-size:11.5px}
</style></head><body class="__TEMA__"><div class="w"><div class="hd" id="hd"></div><div class="seg" id="seg"></div><div id="c"></div><div class="pie">__FIRMA__</div></div>
<script>
(function(){
var D=__DATA__,H=!!D.halloween,tab=H?'hw':'auto';
function $(i){return document.getElementById(i)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function pct(a,b){return b?Math.max(0,Math.min(100,Math.round(a/b*100))):0}
function fmt(n){return Number(n).toLocaleString('en-US')}
function cabecera(){
var p=pct(D.obtenidos,D.totalLogros),R=36,C=2*Math.PI*R;
$('hd').innerHTML='<div class="ring"><svg viewBox="0 0 86 86"><circle cx="43" cy="43" r="'+R+'" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="8"/><circle cx="43" cy="43" r="'+R+'" fill="none" stroke="var(--acc)" stroke-width="8" stroke-linecap="round" stroke-dasharray="'+(C*p/100).toFixed(1)+' '+C.toFixed(1)+'"/></svg><b>'+p+'%<small>'+D.obtenidos+'/'+D.totalLogros+'</small></b></div><div><h1>'+(H?'🏆 ':'🏆 ')+'Logros de '+esc(D.nombre)+'</h1><p>'+(H?'Sala de trofeos embrujada':'Tu camino de logros')+'</p><div class="chips"><span class="chip">🏅 '+D.obtenidos+' logros</span>'+(D.misiones.length?'<span class="chip">🎃 '+D.misionesHechas+'/'+D.misiones.length+' misiones</span>':'')+'</div></div>'}
function tabs(){
var t=[];if(D.misiones.length)t.push(['hw',(H?'🎃':'🎯')+' Misiones']);t.push(['temp','🍂 Temporada']);t.push(['auto','🏆 Logros']);
if(!D.misiones.length&&tab==='hw')tab='auto';
$('seg').innerHTML=t.map(function(x){return '<button data-t="'+x[0]+'" class="'+(tab===x[0]?'on':'')+'">'+x[1]+'</button>'}).join('')}
function vistaMisiones(){
var h='<div class="note">'+(D.eventoVivo?'Misiones exclusivas de Halloween. El evento termina el 30 de noviembre a medianoche (hora de México). Completar 10 de ellas cuenta para la insignia Heraldo Maldito.':'El evento terminó. Aquí quedan las misiones que completaste.')+'</div>',i,m;
for(i=0;i<D.misiones.length;i++){m=D.misiones[i];
h+='<div class="row'+(m.hecha?' ok':'')+'"><div class="med">'+m.emoji+'</div><div class="in"><div class="t"><span>'+esc(m.nombre)+'</span>'+(m.hecha?'<em>✔ Hecha</em>':'')+'</div><div class="d">'+esc(m.desc)+'</div><div class="bar"><i style="width:'+pct(m.avance,m.meta)+'%"></i></div><div class="f"><span>'+fmt(m.avance)+' / '+fmt(m.meta)+'</span><span class="rw">🎁 '+esc(m.premio)+'</span></div></div></div>'}
return h}
function vistaTemporada(){
var h='<div class="note">Insignias de '+esc(D.temporadaNombre)+'. Son difíciles, pero se pueden lograr durante todo el evento. Solo cuenta lo que hagas mientras dura. Cada una da un premio grande y dos de ellas, además, una reliquia exclusiva.</div>',i,b,r;
h+='<div class="sub">✨ Reliquias exclusivas <small>solo existen esta temporada</small></div>';
for(i=0;i<D.reliquias.length;i++){r=D.reliquias[i];
h+='<div class="row '+(r.tiene?'ok':'lk')+'"><div class="med">'+esc(r.emoji)+'</div><div class="in"><div class="t"><span>'+esc(r.nombre)+'</span>'+(r.tiene?'<em>✔ Tuya</em>':'')+'</div><div class="d">'+esc(r.efecto)+'</div></div></div>'}
h+='<div class="sub">🍂 Insignias</div>';
for(i=0;i<D.temporada.length;i++){b=D.temporada[i];
h+='<div class="row '+(b.tiene?'ok':'lk')+'"><div class="med">'+(b.tiene?esc(b.emoji):'🔒')+'</div><div class="in"><div class="t"><span>'+esc(b.nombre)+'</span>'+(b.tiene?'<em>✔ Obtenida</em>':'')+'</div><div class="d">'+esc(b.desc)+'</div><div class="bar"><i style="width:'+pct(b.avance,b.meta)+'%"></i></div><div class="f"><span>'+fmt(b.avance)+' / '+fmt(b.meta)+' '+esc(b.unidad)+'</span></div><div class="f"><span class="rw">🎁 '+esc(b.premio)+'</span></div></div></div>'}
return h}
function vistaAuto(){
var h='',i,a;
for(i=0;i<D.auto.length;i++){a=D.auto[i];
h+='<div class="row '+(a.tiene?'ok':'lk')+'"><div class="med">'+(a.tiene?esc(a.emoji):'🔒')+'</div><div class="in"><div class="t"><span>'+esc(a.nombre)+'</span>'+(a.tiene?'<em>✔</em>':'')+'</div><div class="d">'+esc(a.desc)+'</div><div class="bar"><i style="width:'+pct(a.v,a.m)+'%"></i></div><div class="f"><span>'+fmt(a.v)+' / '+fmt(a.m)+'</span></div></div></div>'}
return h}
function pintar(){tabs();$('c').innerHTML=tab==='hw'?vistaMisiones():tab==='temp'?vistaTemporada():vistaAuto()}
$('seg').addEventListener('click',function(e){var t=e.target.closest?e.target.closest('button'):null;if(!t)return;tab=t.getAttribute('data-t');pintar()});
cabecera();pintar();
})();
</script></body></html>`;

export function htmlLogros(datos) {
  const json = JSON.stringify(datos).replace(/</g, "\\u003c");
  return PLANTILLA
    .replace("__TEMA__", datos.halloween ? "h" : "n")
    .replace("__FIRMA__", () => datos.firma)
    .replace("__DATA__", () => json);
}
