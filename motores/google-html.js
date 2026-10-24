const PLANTILLA = String.raw`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{--bg:#0b0a1f;--a1:#8b5cf6;--a2:#22d3ee;--a3:#f472b6;--g1:rgba(139,92,246,.38);--g2:rgba(34,211,238,.26);--g3:rgba(244,114,182,.24);--tx:#f2f4ff;--mu:#a3a9d4;--ln:rgba(255,255,255,.13);--cd:rgba(255,255,255,.065)}
html{background:var(--bg);overflow-x:hidden}
body{background:radial-gradient(70% 22% at 8% 4%,var(--g1),transparent),radial-gradient(60% 20% at 100% 38%,var(--g2),transparent),radial-gradient(70% 24% at 0% 78%,var(--g3),transparent),var(--bg);min-height:100vh;color:var(--tx);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:13px;padding:14px 12px 16px;overflow-x:hidden;overscroll-behavior:none}
small{color:var(--mu);font-size:10.5px;letter-spacing:1.6px;font-weight:800}
@keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes pulso{0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.7)}50%{box-shadow:0 0 0 5px rgba(74,222,128,0)}}
.top{display:flex;align-items:center;gap:11px;margin-bottom:14px;animation:up .5s both}
.orb{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,var(--a1),var(--a2));display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px var(--g1);flex:none}
.orb svg{width:22px;height:22px}
.tit{flex:1;min-width:0}
.tit b{display:block;font-size:19px;letter-spacing:.3px}
.via{font-size:11px;font-weight:800;padding:5px 11px;border-radius:20px;background:var(--cd);border:1px solid var(--ln);color:var(--a2);white-space:nowrap}
.hero{margin-bottom:12px;animation:up .5s .06s both}
.hero h1{font-size:25px;line-height:1.15;margin-top:5px;font-weight:900;overflow-wrap:anywhere;background:linear-gradient(100deg,#fff 20%,var(--a2) 60%,var(--a3));-webkit-background-clip:text;background-clip:text;color:transparent;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.st{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;animation:up .5s .12s both}
.st span{padding:5px 11px;border-radius:20px;background:var(--cd);border:1px solid var(--ln);font-size:11.5px;font-weight:700;color:var(--mu)}
.st b{color:var(--tx)}
.tabs{display:flex;gap:6px;overflow-x:auto;margin-bottom:14px;padding-bottom:2px;scrollbar-width:none;animation:up .5s .18s both}
.tabs::-webkit-scrollbar{display:none}
.tb{flex:none;padding:8px 15px;border-radius:22px;background:var(--cd);border:1px solid var(--ln);color:var(--mu);font-weight:800;font-size:12.5px}
.tb.on{background:linear-gradient(120deg,var(--a1),var(--a3));border-color:transparent;color:#fff;box-shadow:0 5px 16px var(--g1)}
.pn{display:none}
.pn.on{display:block;animation:up .35s both}
.sec{display:flex;align-items:center;justify-content:space-between;margin:16px 3px 9px}
.sec a{font-size:11.5px;font-weight:800;color:var(--a2)}
.cd{background:var(--cd);border:1px solid var(--ln);border-radius:20px;padding:13px 14px;margin-bottom:10px;position:relative;overflow:hidden;cursor:pointer;animation:up .5s both;animation-delay:calc(var(--i,0)*55ms)}
.cd:active{transform:scale(.985)}
.hd{display:flex;align-items:center;gap:9px;margin-bottom:7px}
.av{width:30px;height:30px;border-radius:10px;background:var(--c);color:#fff;font-weight:900;font-size:14px;display:flex;align-items:center;justify-content:center;flex:none}
.mt{min-width:0}
.mt b{display:block;font-size:12px;color:var(--tx);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mt i{display:block;font-style:normal;font-size:10.5px;color:var(--mu);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tt{font-size:15px;font-weight:800;line-height:1.28;color:#fff;overflow-wrap:anywhere}
.wb .tt{color:var(--a2)}
.sn{font-size:12.5px;line-height:1.45;color:var(--mu);margin-top:5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.src{padding:3px 10px;border-radius:20px;background:var(--c);color:#fff;font-size:10.5px;font-weight:900;max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tm{margin-left:auto;font-size:11px;color:var(--mu);font-weight:700;display:flex;align-items:center;gap:6px}
.tm u{width:8px;height:8px;border-radius:50%;background:#4ade80;animation:pulso 1.6s infinite}
.ex{display:none;margin-top:10px;padding:10px;border-radius:14px;background:rgba(0,0,0,.28)}
.ex span{display:block;font-size:11px;color:var(--mu);overflow-wrap:anywhere;user-select:all;-webkit-user-select:all;margin-bottom:9px}
.ex button{border:0;padding:8px 15px;border-radius:16px;background:linear-gradient(120deg,var(--a1),var(--a3));color:#fff;font-weight:800;font-size:12px}
.cd.on .sn{-webkit-line-clamp:unset}
.cd.on .ex{display:block}
.vd{padding:0}
.th{position:relative;aspect-ratio:16/9;background:linear-gradient(135deg,var(--a1),var(--a3))}
.th img{width:100%;height:100%;object-fit:cover;display:block}
.pl{position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;background:rgba(255,0,60,.92);display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;padding-left:3px;box-shadow:0 4px 14px rgba(0,0,0,.5)}
.du{position:absolute;right:8px;bottom:8px;background:rgba(0,0,0,.85);padding:2px 7px;border-radius:7px;font-size:11px;font-weight:800;color:#fff}
.nu{position:absolute;left:8px;top:8px;background:#4ade80;color:#052e16;padding:3px 9px;border-radius:20px;font-size:10px;font-weight:900;letter-spacing:.8px}
.vd .in{padding:11px 14px 13px}
.car{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -12px;padding:0 12px 6px;scrollbar-width:none}
.car::-webkit-scrollbar{display:none}
.mv{flex:none;width:158px;scroll-snap-align:start;border-radius:16px;background:var(--cd);border:1px solid var(--ln);overflow:hidden;cursor:pointer}
.mv .mi{padding:8px 10px 10px}
.mv .tt{font-size:12.5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.mv .sn{font-size:11px;-webkit-line-clamp:1}
.ans{background:linear-gradient(145deg,rgba(255,255,255,.1),rgba(255,255,255,.04));border:1px solid var(--ln);border-radius:26px;padding:18px;margin-bottom:12px;display:flex;align-items:center;gap:15px;animation:up .5s both;box-shadow:0 10px 30px rgba(0,0,0,.3)}
.ans .cu{flex:1;min-width:0}
.gr{font-size:33px;font-weight:900;line-height:1.1;margin-top:5px;overflow-wrap:anywhere;text-shadow:0 0 26px var(--a1)}
.dt{font-size:12.5px;color:var(--mu);margin-top:6px;text-transform:capitalize}
.lg{display:inline-block;margin:10px 6px 0 0;padding:4px 12px;border-radius:20px;background:rgba(255,255,255,.1);font-size:11.5px;font-weight:800}
.ck{width:108px;height:108px;flex:none}
.wk{align-items:flex-start}
.wk img{width:92px;height:92px;border-radius:18px;object-fit:cover;flex:none}
.wk .wt{display:block;font-size:18px;margin:4px 0 5px;font-weight:900}
.wk p{font-size:12.5px;line-height:1.5;color:#d6dafc;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}
.wk.on p{-webkit-line-clamp:unset}
table{width:100%;border-collapse:separate;border-spacing:0;border-radius:18px;overflow:hidden;border:1px solid var(--ln);margin-bottom:12px;background:var(--cd)}
th{background:rgba(255,255,255,.1);font-size:10.5px;letter-spacing:1.5px;text-align:left;padding:10px 13px;color:var(--mu)}
td{padding:11px 13px;border-top:1px solid var(--ln);font-size:13px}
td b{color:var(--a2);font-size:14.5px}
.vacio{background:var(--cd);border:1px dashed var(--ln);border-radius:24px;padding:30px 18px;text-align:center;color:var(--mu);line-height:1.6}
.vacio b{display:block;font-size:34px;margin-bottom:6px}
.pie{margin-top:16px;text-align:center;font-size:11px;color:var(--mu);line-height:1.8}
.pie svg{vertical-align:-2px;margin-right:4px}
.ts{position:fixed;left:50%;bottom:18px;transform:translate(-50%,30px);background:#fff;color:#111;padding:9px 17px;border-radius:20px;font-size:12.5px;font-weight:800;opacity:0;transition:all .25s;pointer-events:none;white-space:nowrap}
.ts.on{opacity:1;transform:translate(-50%,0)}
</style></head><body>
<div class="top"><div class="orb"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg></div><div class="tit"><b>Buscador</b><small>TOOLS</small></div><div class="via" id="via"></div></div>
<div class="hero"><small>RESULTADOS PARA</small><h1 id="q"></h1></div>
<div class="st" id="st"></div>
<div id="main"></div>
<div class="pie" id="pie"></div>
<div class="ts" id="ts"></div>
<script>
(function(){
var D=__DATA__;
var PAL=[['#0b0a1f','#8b5cf6','#22d3ee','#f472b6'],['#06141f','#38bdf8','#34d399','#818cf8'],['#1a0b14','#fb7185','#fbbf24','#c084fc'],['#07140f','#4ade80','#a3e635','#2dd4bf'],['#160a1f','#f0abfc','#67e8f9','#fde68a'],['#170b06','#fb923c','#f43f5e','#facc15']];
var ALL=[],tt=0;
function $(i){return document.getElementById(i)}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function hash(s){var h=0;s=String(s);for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%100000;return h}
function hue(s){return 'hsl('+(hash(s)%360)+',62%,46%)'}
function rgba(x,a){var n=parseInt(x.slice(1),16);return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a+')'}
function reg(it){ALL.push(it);return ALL.length-1}
function tog(el){el.className=/(^| )on( |$)/.test(el.className)?el.className.replace(/ ?\bon\b/,''):el.className+' on'}
function toast(m){var t=$('ts');t.textContent=m;t.className='ts on';clearTimeout(tt);tt=setTimeout(function(){t.className='ts'},1700)}
function copiar(u){var ok=false;
try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u);ok=true}}catch(x){}
if(!ok){try{var a=document.createElement('textarea');a.value=u;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();ok=document.execCommand('copy');document.body.removeChild(a)}catch(x){}}
toast(ok?'🔗 Enlace copiado':'Mantén pulsado el enlace para copiarlo')}
var A=D.ans,idx=A&&A.tipo==='hora'?(A.noche?0:1):D.modo==='youtube'?2:D.modo==='noticias'?1:D.modo==='precio'?5:hash(D.q)%6,P=PAL[idx],st=document.documentElement.style;
st.setProperty('--bg',P[0]);st.setProperty('--a1',P[1]);st.setProperty('--a2',P[2]);st.setProperty('--a3',P[3]);st.setProperty('--g1',rgba(P[1],.38));st.setProperty('--g2',rgba(P[2],.26));st.setProperty('--g3',rgba(P[3],.24));
function ruta(u){return u.replace(/^https?:\/\/[^\/]+/,'').slice(0,46)||'/'}
function ex(i,u){return '<div class="ex"><span>'+esc(u)+'</span><button data-cp="'+i+'">Copiar enlace</button></div>'}
function cWeb(it,n){var i=reg(it);return '<div class="cd wb" style="--i:'+n+';--c:'+hue(it.dominio)+'"><div class="hd"><div class="av">'+esc((it.dominio||'?').charAt(0).toUpperCase())+'</div><div class="mt"><b>'+esc(it.dominio)+'</b><i>'+esc(ruta(it.url))+'</i></div></div><div class="tt">'+esc(it.titulo)+'</div>'+(it.texto?'<div class="sn">'+esc(it.texto)+'</div>':'')+ex(i,it.url)+'</div>'}
function cNot(it,n){var i=reg(it);return '<div class="cd nw" style="--i:'+n+';--c:'+hue(it.dominio)+'"><div class="hd"><span class="src">'+esc(it.dominio)+'</span><span class="tm">'+(it.nuevo?'<u></u>':'')+esc(it.hace)+'</span></div><div class="tt">'+esc(it.titulo)+'</div>'+(it.texto?'<div class="sn">'+esc(it.texto)+'</div>':'')+ex(i,it.url)+'</div>'}
function thumb(it){return '<div class="th">'+(it.img?'<img src="'+it.img+'" alt="">':'')+'<div class="pl">▶</div><div class="du">'+esc(it.duracion)+'</div>'+(it.nuevo?'<div class="nu">NUEVO</div>':'')+'</div>'}
function cVid(it,n){var i=reg(it);return '<div class="cd vd" style="--i:'+n+'">'+thumb(it)+'<div class="in"><div class="tt">'+esc(it.titulo)+'</div><div class="sn">'+esc(it.canal)+' · '+esc(it.fecha)+'</div>'+ex(i,it.url)+'</div></div>'}
function mini(it){var i=reg(it);return '<div class="mv" data-cp="'+i+'">'+thumb(it)+'<div class="mi"><div class="tt">'+esc(it.titulo)+'</div><div class="sn">'+esc(it.canal)+' · '+esc(it.fecha)+'</div></div></div>'}
function lista(arr,fn,max){var h='';arr.slice(0,max||99).forEach(function(it,n){h+=fn(it,n)});return h}
function respuesta(){if(!A)return '';
if(A.tipo==='hora'){var t='';for(var i=0;i<12;i++)t+='<line x1="60" y1="8" x2="60" y2="'+(i%3?14:19)+'" stroke="#fff" stroke-opacity="'+(i%3?.55:1)+'" stroke-width="'+(i%3?2:3.4)+'" stroke-linecap="round" transform="rotate('+i*30+' 60 60)"/>';
return '<div class="ans"><svg class="ck" viewBox="0 0 120 120"><circle cx="60" cy="60" r="56" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.4)" stroke-width="3"/>'+t+'<line id="hh" x1="60" y1="60" x2="60" y2="33" stroke="#fff" stroke-width="5" stroke-linecap="round"/><line id="mm" x1="60" y1="60" x2="60" y2="21" stroke="'+P[2]+'" stroke-width="3.6" stroke-linecap="round"/><line id="ss" x1="60" y1="69" x2="60" y2="17" stroke="'+P[3]+'" stroke-width="1.8" stroke-linecap="round"/><circle cx="60" cy="60" r="4.5" fill="'+P[3]+'"/></svg><div class="cu"><small>HORA ACTUAL</small><div class="gr" id="dg">'+esc(A.grande)+'</div><div class="dt">'+esc(A.detalle)+'</div><span class="lg">📍 '+esc(A.lugar)+'</span><span class="lg">'+(A.noche?'🌙 Noche':'☀️ Día')+'</span></div></div>'}
if(A.tipo==='wiki')return '<div class="ans wk cd" style="margin-bottom:12px">'+(A.img?'<img src="'+A.img+'" alt="">':'')+'<div class="cu"><small>📚 WIKIPEDIA</small><b class="wt">'+esc(A.titulo)+'</b><p>'+esc(A.texto)+'</p></div></div>';
return '<div class="ans"><div class="cu"><small>'+esc(String(A.titulo).toUpperCase())+'</small><div class="gr">'+esc(A.grande)+'</div><div class="dt">'+esc(A.detalle)+'</div>'+(A.lugar?'<span class="lg">📍 '+esc(A.lugar)+'</span>':'')+'</div></div>'}
function reloj(){var f=new Intl.DateTimeFormat('es-MX',{timeZone:A.zona,hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true});
var g=new Intl.DateTimeFormat('en-GB',{timeZone:A.zona,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
function tick(){if(document.hidden)return;var d=new Date(),h=0,m=0,s=0;
g.formatToParts(d).forEach(function(x){if(x.type==='hour')h=+x.value;if(x.type==='minute')m=+x.value;if(x.type==='second')s=+x.value});
$('dg').textContent=f.format(d).replace(/\s?([ap])\.?\s?m\.?/i,function(z,l){return ' '+l.toLowerCase()+'.m.'});
$('hh').setAttribute('transform','rotate('+((h%12)*30+m*.5)+' 60 60)');
$('mm').setAttribute('transform','rotate('+(m*6+s*.1)+' 60 60)');
$('ss').setAttribute('transform','rotate('+(s*6)+' 60 60)')}
tick();setInterval(tick,1000)}
function precios(){if(!D.precios||!D.precios.length)return '';var h='<div class="sec"><small>TABLA DE PRECIOS</small></div><table><tr><th>SITIO</th><th>PRECIO</th></tr>';D.precios.forEach(function(p){h+='<tr><td>'+esc(p.sitio)+'</td><td><b>'+esc(p.precio)+'</b></td></tr>'});return h+'</table>'}
function sec(t,go){return '<div class="sec"><small>'+t+'</small>'+(go?'<a data-go="'+go+'">Ver todo ›</a>':'')+'</div>'}
var W=D.web||[],N=D.noticias||[],PO=D.populares||[],RE=D.recientes||[],V=PO.concat(RE);
var TABS=[['todo','✨ Todo',1]];
if(W.length)TABS.push(['web','🌐 Web '+W.length,1]);
if(N.length)TABS.push(['not','📰 Noticias '+N.length,1]);
if(V.length)TABS.push(['vid','▶️ Videos '+V.length,1]);
var ini=D.modo==='youtube'&&V.length?'vid':D.modo==='noticias'&&N.length?'not':D.modo==='precio'&&W.length?'web':'todo';
var pTodo=respuesta()+precios();
if(W.length)pTodo+=sec('🌐 WEB',W.length>3?'web':'')+lista(W,cWeb,3);
if(N.length)pTodo+=sec('📰 ÚLTIMAS NOTICIAS',N.length>3?'not':'')+lista(N,cNot,3);
if(V.length){pTodo+=sec('▶️ VIDEOS',V.length>0?'vid':'')+'<div class="car">'+lista(RE.concat(PO),mini,8)+'</div>'}
if(!A&&!W.length&&!N.length&&!V.length)pTodo='<div class="vacio"><b>🫥</b>No pude traer resultados esta vez.<br>Prueba con otras palabras o usa el botón <b style="display:inline;font-size:inherit">Ver en Google</b> del mensaje de abajo.</div>';
var pWeb=precios()+lista(W,cWeb);
var pNot=lista(N,cNot);
var pVid=(RE.length?sec('🆕 MÁS RECIENTES'):'')+lista(RE,cVid)+(PO.length?sec('🔥 POPULARES'):'')+lista(PO,cVid);
var tabs='<div class="tabs">'+TABS.map(function(t){return '<div class="tb'+(t[0]===ini?' on':'')+'" id="t-'+t[0]+'" data-go="'+t[0]+'">'+t[1]+'</div>'}).join('')+'</div>';
function pn(k,h){return '<div class="pn'+(k===ini?' on':'')+'" id="p-'+k+'">'+h+'</div>'}
$('main').innerHTML=(TABS.length>1?tabs:'')+pn('todo',pTodo)+(W.length?pn('web',pWeb):'')+(N.length?pn('not',pNot):'')+(V.length?pn('vid',pVid):'');
function abrir(k){TABS.forEach(function(t){var a=$('t-'+t[0]),b=$('p-'+t[0]);if(a)a.className='tb'+(t[0]===k?' on':'');if(b)b.className='pn'+(t[0]===k?' on':'')})}
$('main').addEventListener('click',function(e){
var go=e.target.closest('[data-go]');if(go){abrir(go.getAttribute('data-go'));return}
var cp=e.target.closest('[data-cp]');if(cp){e.stopPropagation();copiar(ALL[+cp.getAttribute('data-cp')].url);return}
var c=e.target.closest('.cd');if(c)tog(c)});
$('q').textContent=D.q;
$('via').textContent=D.via?('vía '+D.via):'';
$('via').style.display=D.via?'':'none';
var chips=[];
if(W.length)chips.push('🌐 <b>'+W.length+'</b> web');
if(N.length)chips.push('📰 <b>'+N.length+'</b> noticias');
if(V.length)chips.push('▶️ <b>'+V.length+'</b> videos');
chips.push('⚡ <b>'+(D.ms/1000).toFixed(1)+'</b> s');
$('st').innerHTML=A&&A.tipo!=='wiki'?'':chips.map(function(c){return '<span>'+c+'</span>'}).join('');
$('pie').innerHTML=(W.length||N.length||V.length?'Toca una tarjeta para ver más · abre los enlaces con los botones del chat<br>':'')+'<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6.7"/><path d="M8 7v4.2M8 4.7v.1" stroke-linecap="round"/></svg>Powered by '+esc(D.firma);
if(A&&A.tipo==='hora'){try{reloj()}catch(x){}}
})();
</script></body></html>`;

export function htmlGoogle(datos) {
  const json = JSON.stringify(datos).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  return PLANTILLA.replace("__DATA__", () => json);
}
