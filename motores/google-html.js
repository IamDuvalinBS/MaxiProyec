const PLANTILLA = String.raw`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{--bg:#0b0a1f;--a1:#8b5cf6;--a2:#22d3ee;--a3:#f472b6;--g1:rgba(139,92,246,.38);--g2:rgba(34,211,238,.26);--g3:rgba(244,114,182,.24);--tx:#f2f4ff;--mu:#a3a9d4;--ln:rgba(255,255,255,.13);--cd:rgba(255,255,255,.065)}
html{background:var(--bg);overflow-x:hidden;height:auto}
body{background:radial-gradient(70% 22% at 8% 4%,var(--g1),transparent),radial-gradient(60% 20% at 100% 38%,var(--g2),transparent),radial-gradient(70% 24% at 0% 78%,var(--g3),transparent),var(--bg);color:var(--tx);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:13px;padding:14px 12px 16px;overflow-x:hidden;overscroll-behavior:none;height:auto;word-break:break-word}
small{color:var(--mu);font-size:10.5px;letter-spacing:1.6px;font-weight:800}
@keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes pulso{0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.7)}50%{box-shadow:0 0 0 5px rgba(74,222,128,0)}}
.top{display:flex;align-items:center;gap:11px;margin-bottom:14px;animation:up .5s both}
.orb{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,var(--a1),var(--a2));display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px var(--g1);flex:none}
.orb svg{width:22px;height:22px}
.tit{flex:1;min-width:0;overflow:hidden}
.tit b{display:block;font-size:19px;letter-spacing:.3px}
.hl{display:flex;align-items:center;justify-content:space-between;gap:8px}
.via{font-size:10.5px;font-weight:800;padding:4px 10px;border-radius:20px;background:var(--cd);border:1px solid var(--ln);color:var(--a2);white-space:nowrap;flex:none}
.hero{margin-bottom:13px;animation:up .5s .06s both}
.hero h1{font-size:25px;line-height:1.15;margin-top:5px;font-weight:900;overflow-wrap:anywhere;background:linear-gradient(100deg,#fff 20%,var(--a2) 60%,var(--a3));-webkit-background-clip:text;background-clip:text;color:transparent;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.tabs{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:15px;animation:up .5s .12s both}
.tb{padding:9px 14px;border-radius:22px;background:var(--cd);border:1px solid var(--ln);color:var(--tx);font-weight:800;font-size:12.5px;cursor:pointer}
.tb:active{transform:scale(.94)}
.tb b{color:var(--a2);margin-left:3px}
.tb.on{background:linear-gradient(120deg,var(--a1),var(--a3));border-color:transparent;color:#fff;box-shadow:0 5px 16px var(--g1)}
.tb.on b{color:#fff}
.pn{display:none}
.pn.on{display:block;animation:up .35s both}
.sec{display:flex;align-items:center;justify-content:space-between;margin:16px 3px 9px}
.sec a{font-size:11.5px;font-weight:800;color:var(--a2);cursor:pointer}
.cd{background:var(--cd);border:1px solid var(--ln);border-radius:20px;padding:13px 14px;margin-bottom:10px;position:relative;overflow:hidden;cursor:pointer;animation:up .5s both;animation-delay:calc(min(var(--i,0),9)*55ms)}
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
.ni{margin:-13px -14px 11px;aspect-ratio:16/9;background:linear-gradient(135deg,var(--a1),var(--a3));overflow:hidden}
.ni img{width:100%;height:100%;object-fit:cover;display:block}
.rd{display:none;margin-top:11px;padding-top:11px;border-top:1px solid var(--ln)}
.rd p{font-size:13.5px;line-height:1.62;color:#e1e4ff;margin-bottom:10px;overflow-wrap:anywhere}
.rd h4{font-size:14px;margin:14px 0 6px;color:var(--a2)}
.ex{display:none;margin-top:10px;padding:10px;border-radius:14px;background:rgba(0,0,0,.28)}
.ex span{display:block;font-size:11px;color:var(--mu);overflow-wrap:anywhere;user-select:all;-webkit-user-select:all;margin-bottom:9px}
.ex button,.bt{border:0;padding:8px 15px;border-radius:16px;background:linear-gradient(120deg,var(--a1),var(--a3));color:#fff;font-weight:800;font-size:12px;font-family:inherit}
.cd.on .sn{-webkit-line-clamp:unset}
.cd.on .ex,.cd.on .rd{display:block}
.vd{padding:0}
.th{position:relative;aspect-ratio:16/9;background:linear-gradient(135deg,var(--a1),var(--a3));cursor:pointer}
.th img{width:100%;height:100%;object-fit:cover;display:block}
.th iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}
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
.gal{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.ph{position:relative;border-radius:16px;overflow:hidden;aspect-ratio:4/3;background:var(--cd);border:1px solid var(--ln);cursor:pointer;scroll-snap-align:start}
.ph img{width:100%;height:100%;object-fit:cover;display:block}
.ph span{position:absolute;left:0;right:0;bottom:0;padding:18px 8px 6px;font-size:10.5px;font-weight:700;background:linear-gradient(transparent,rgba(0,0,0,.85));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.car .ph{flex:none;width:132px}
.ans{background:linear-gradient(145deg,rgba(255,255,255,.1),rgba(255,255,255,.04));border:1px solid var(--ln);border-radius:26px;padding:18px;margin-bottom:12px;display:flex;align-items:center;gap:15px;animation:up .5s both;box-shadow:0 10px 30px rgba(0,0,0,.3)}
.ans .cu{flex:1;min-width:0}
.gr{font-size:33px;font-weight:900;line-height:1.1;margin-top:5px;overflow-wrap:anywhere;text-shadow:0 0 26px var(--a1)}
.dt{font-size:12.5px;color:var(--mu);margin-top:6px;text-transform:capitalize}
.lg{display:inline-block;margin:10px 6px 0 0;padding:4px 12px;border-radius:20px;background:rgba(255,255,255,.1);font-size:11.5px;font-weight:800}
.ck{width:108px;height:108px;flex:none}
.wk{align-items:flex-start;cursor:pointer}
.wk img{width:92px;height:92px;border-radius:18px;object-fit:cover;flex:none}
.wk .wt{display:block;font-size:18px;margin:4px 0 5px;font-weight:900}
.wk p{font-size:12.5px;line-height:1.5;color:#d6dafc;overflow-wrap:anywhere}
.rr{display:block;cursor:default;border-color:var(--a2)}
.rr p{font-size:14px;line-height:1.55;color:#fff;margin:7px 0 4px;overflow-wrap:anywhere}
.rr i{display:block;font-style:normal;font-size:11px;color:var(--a2);font-weight:800;margin-bottom:6px}
.hint{font-size:11.5px;color:var(--mu);line-height:1.5;margin-bottom:9px}
.wk a{display:inline-block;margin-top:8px;font-size:12px;font-weight:800;color:var(--a2)}
.inf{cursor:default}
.inf .top2{display:flex;gap:13px;align-items:flex-start;margin-bottom:6px}
.inf .top2 img{width:96px;height:96px;border-radius:18px;object-fit:cover;flex:none}
.inf .rd{display:block;border-top:0;margin-top:4px;padding-top:0}
table{width:100%;border-collapse:separate;border-spacing:0;border-radius:18px;overflow:hidden;border:1px solid var(--ln);margin-bottom:12px;background:var(--cd)}
th{background:rgba(255,255,255,.1);font-size:10.5px;letter-spacing:1.5px;text-align:left;padding:10px 13px;color:var(--mu)}
td{padding:11px 13px;border-top:1px solid var(--ln);font-size:13px}
td b{color:var(--a2);font-size:14.5px}
.vacio{background:var(--cd);border:1px dashed var(--ln);border-radius:24px;padding:30px 18px;text-align:center;color:var(--mu);line-height:1.6}
.vacio b{display:block;font-size:34px;margin-bottom:6px}
.pie{margin-top:16px;text-align:center;font-size:11px;color:var(--mu);line-height:1.8}
.pie svg{vertical-align:-2px;margin-right:4px}
.ts{position:fixed;left:50%;bottom:18px;transform:translate(-50%,30px);background:#fff;color:#111;padding:9px 17px;border-radius:20px;font-size:12.5px;font-weight:800;opacity:0;transition:all .25s;pointer-events:none;white-space:nowrap;z-index:20}
.ts.on{opacity:1;transform:translate(-50%,0)}
.lb{display:none;position:fixed;left:0;right:0;top:0;bottom:0;background:rgba(0,0,0,.93);z-index:15;flex-direction:column;align-items:center;justify-content:center;padding:14px;text-align:center}
.lb.on{display:flex}
.lb img{max-width:100%;max-height:430px;border-radius:14px}
.lb div{color:#fff;margin-top:12px;font-size:12.5px;font-weight:700;line-height:1.4}
.lb small{display:block;margin-top:6px}
</style></head><body>
<div class="top"><div class="orb"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg></div><div class="tit"><b>Buscador</b><small>TOOLS</small></div></div>
<div class="hero"><div class="hl"><small>RESULTADOS PARA</small><div class="via" id="via"></div></div><h1 id="q"></h1></div>
<div id="main"></div>
<div class="pie" id="pie"></div>
<div class="ts" id="ts"></div>
<div class="lb" id="lb"><img id="lbi" alt=""><div id="lbt"></div><small>Toca para cerrar</small></div>
<script>
(function(){
var D=__DATA__;
var PAL=[['#0b0a1f','#8b5cf6','#22d3ee','#f472b6'],['#06141f','#38bdf8','#34d399','#818cf8'],['#1a0b14','#fb7185','#fbbf24','#c084fc'],['#07140f','#4ade80','#a3e635','#2dd4bf'],['#160a1f','#f0abfc','#67e8f9','#fde68a'],['#170b06','#fb923c','#f43f5e','#facc15']];
var ALL=[],FOT=[],tt=0;
function $(i){return document.getElementById(i)}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function hash(s){var h=0;s=String(s);for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%100000;return h}
function hue(s){return 'hsl('+(hash(s)%360)+',62%,46%)'}
function rgba(x,a){var n=parseInt(x.slice(1),16);return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a+')'}
function reg(it){ALL.push(it);return ALL.length-1}
function tog(el){el.className=/(^| )on( |$)/.test(el.className)?el.className.replace(/ ?\bon\b/,''):el.className+' on'}
function toast(m){var t=$('ts');t.textContent=m;t.className='ts on';clearTimeout(tt);tt=setTimeout(function(){t.className='ts'},1900)}
function copiar(u){var ok=false;
try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u);ok=true}}catch(x){}
if(!ok){try{var a=document.createElement('textarea');a.value=u;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();ok=document.execCommand('copy');document.body.removeChild(a)}catch(x){}}
toast(ok?'🔗 Enlace copiado':'Mantén pulsado el enlace para copiarlo')}
var A=D.ans,W=D.web||[],N=D.noticias||[],PO=D.populares||[],RE=D.recientes||[],V=RE.concat(PO),FW=D.fotos||[];
var idx=A&&A.tipo==='hora'?(A.noche?0:1):D.modo==='youtube'?2:D.modo==='noticias'?1:D.modo==='precio'?5:hash(D.q)%6,P=PAL[idx],st=document.documentElement.style;
st.setProperty('--bg',P[0]);st.setProperty('--a1',P[1]);st.setProperty('--a2',P[2]);st.setProperty('--a3',P[3]);st.setProperty('--g1',rgba(P[1],.38));st.setProperty('--g2',rgba(P[2],.26));st.setProperty('--g3',rgba(P[3],.24));
FW.forEach(function(f){FOT.push({img:f.img,titulo:f.titulo,fuente:'Wikipedia / Commons'})});
N.forEach(function(n){if(n.img)FOT.push({img:n.img,titulo:n.titulo,fuente:n.dominio})});
var WIKI=A&&A.tipo==='wiki'?A:null,CLARGO=WIKI&&WIKI.largo&&WIKI.largo.length;
var FUENTES=W.filter(function(w){return w.cuerpo&&w.cuerpo.length});
function ruta(u){return u.replace(/^https?:\/\/[^\/]+/,'').slice(0,46)||'/'}
function ex(i,u,h){return '<div class="ex">'+(h?'<div class="hint">'+h+'</div>':'')+'<span>'+esc(u)+'</span><button data-cp="'+i+'">Copiar enlace</button></div>'}
function cuerpo(arr){if(!arr||!arr.length)return '';return '<div class="rd">'+arr.map(function(t){return t.indexOf('## ')===0?'<h4>'+esc(t.slice(3))+'</h4>':'<p>'+esc(t)+'</p>'}).join('')+'</div>'}
function cWeb(it,n,abierto){var i=reg(it);return '<div class="cd wb'+(abierto?' on':'')+'" style="--i:'+n+';--c:'+hue(it.dominio)+'"><div class="hd"><div class="av">'+esc((it.dominio||'?').charAt(0).toUpperCase())+'</div><div class="mt"><b>'+esc(it.dominio)+'</b><i>'+esc(ruta(it.url))+'</i></div></div><div class="tt">'+esc(it.titulo)+'</div>'+(it.texto&&!(abierto&&it.cuerpo)?'<div class="sn">'+esc(it.texto)+'</div>':'')+cuerpo(it.cuerpo)+ex(i,it.url)+'</div>'}
function cNot(it,n){var i=reg(it);return '<div class="cd nw" style="--i:'+n+';--c:'+hue(it.dominio)+'">'+(it.img?'<div class="ni"><img src="'+it.img+'" alt=""></div>':'')+'<div class="hd"><span class="src">'+esc(it.dominio)+'</span><span class="tm">'+(it.nuevo?'<u></u>':'')+esc(it.hace)+'</span></div><div class="tt">'+esc(it.titulo)+'</div>'+(it.texto?'<div class="sn">'+esc(it.texto)+'</div>':'')+cuerpo(it.cuerpo)+ex(i,it.url)+'</div>'}
function thumb(it,i,play){return '<div class="th"'+(play?' data-play="'+i+'"':'')+'>'+(it.img?'<img src="'+it.img+'" alt="">':'')+'<div class="pl">▶</div><div class="du">'+esc(it.duracion)+'</div>'+(it.nuevo?'<div class="nu">NUEVO</div>':'')+'</div>'}
function cVid(it,n){var i=reg(it);return '<div class="cd vd" style="--i:'+n+'">'+thumb(it,i,true)+'<div class="in"><div class="tt">'+esc(it.titulo)+'</div><div class="sn">'+esc(it.canal)+' · '+esc(it.fecha)+'</div>'+ex(i,it.url,'¿Pantalla negra? Tu visor no deja reproducir aquí: copia el enlace o usa los botones del chat.')+'</div></div>'}
function mini(it){return '<div class="mv" data-go="vid">'+thumb(it,0,false)+'<div class="mi"><div class="tt">'+esc(it.titulo)+'</div><div class="sn">'+esc(it.canal)+' · '+esc(it.fecha)+'</div></div></div>'}
function foto(f,k){return '<div class="ph" data-lb="'+k+'"><img src="'+f.img+'" alt=""><span>'+esc(f.titulo)+'</span></div>'}
function lista(arr,fn,max){var h='';arr.slice(0,max||999).forEach(function(it,n){h+=fn(it,n)});return h}
function sec(t,go){return '<div class="sec"><small>'+t+'</small>'+(go?'<a data-go="'+go+'">Ver todo ›</a>':'')+'</div>'}
function respuesta(){if(!A)return '';
if(A.tipo==='hora'){var t='';for(var i=0;i<12;i++)t+='<line x1="60" y1="8" x2="60" y2="'+(i%3?14:19)+'" stroke="#fff" stroke-opacity="'+(i%3?.55:1)+'" stroke-width="'+(i%3?2:3.4)+'" stroke-linecap="round" transform="rotate('+i*30+' 60 60)"/>';
return '<div class="ans"><svg class="ck" viewBox="0 0 120 120"><circle cx="60" cy="60" r="56" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.4)" stroke-width="3"/>'+t+'<line id="hh" x1="60" y1="60" x2="60" y2="33" stroke="#fff" stroke-width="5" stroke-linecap="round"/><line id="mm" x1="60" y1="60" x2="60" y2="21" stroke="'+P[2]+'" stroke-width="3.6" stroke-linecap="round"/><line id="ss" x1="60" y1="69" x2="60" y2="17" stroke="'+P[3]+'" stroke-width="1.8" stroke-linecap="round"/><circle cx="60" cy="60" r="4.5" fill="'+P[3]+'"/></svg><div class="cu"><small>HORA ACTUAL</small><div class="gr" id="dg">'+esc(A.grande)+'</div><div class="dt">'+esc(A.detalle)+'</div><span class="lg">📍 '+esc(A.lugar)+'</span><span class="lg">'+(A.noche?'🌙 Noche':'☀️ Día')+'</span></div></div>'}
if(WIKI)return '<div class="ans wk"'+(CLARGO?' data-go="inf"':'')+'>'+(WIKI.img?'<img src="'+WIKI.img+'" alt="">':'')+'<div class="cu"><small>📚 WIKIPEDIA</small><b class="wt">'+esc(WIKI.titulo)+'</b><p>'+esc(WIKI.texto)+'</p>'+(CLARGO?'<a>Leer información completa ›</a>':'')+'</div></div>';
return '<div class="ans"><div class="cu"><small>'+esc(String(A.titulo).toUpperCase())+'</small><div class="gr">'+esc(A.grande)+'</div><div class="dt">'+esc(A.detalle)+'</div>'+(A.lugar?'<span class="lg">📍 '+esc(A.lugar)+'</span>':'')+'</div></div>'}
function rapida(){var R=D.respuesta;if(!R||!R.length)return '';return '<div class="ans rr"><small>💡 RESPUESTA RÁPIDA</small>'+R.map(function(r){return '<p>'+esc(r.texto)+'</p><i>— '+esc(r.fuente)+'</i>'}).join('')+'</div>'}
function resumenWeb(){if(WIKI||!FUENTES.length)return '';var f=FUENTES[0],t=f.cuerpo.filter(function(x){return x.indexOf('## ')!==0}).slice(0,2).join(' ');if(t.length>430)t=t.slice(0,429)+'…';
return '<div class="ans wk" data-go="inf"><div class="cu"><small>📖 RESUMEN · '+esc(f.dominio.toUpperCase())+'</small><b class="wt">'+esc(f.titulo)+'</b><p>'+esc(t)+'</p><a>Leer información completa ›</a></div></div>'}
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
var TABS=[['todo','✨ Todo','']];
if(CLARGO||FUENTES.length)TABS.push(['inf','📖 Info','']);
if(W.length)TABS.push(['web','🌐 Web',W.length]);
if(N.length)TABS.push(['not','📰 Noticias',N.length]);
if(FOT.length)TABS.push(['fot','🖼️ Fotos',FOT.length]);
if(V.length)TABS.push(['vid','▶️ Videos',V.length]);
function existe(k){return TABS.some(function(t){return t[0]===k})}
var ini=D.modo==='youtube'&&existe('vid')?'vid':D.modo==='noticias'&&existe('not')?'not':D.modo==='precio'&&existe('web')?'web':D.modo==='fotos'&&existe('fot')?'fot':'todo';
var RR=rapida(),pTodo=respuesta()+(RR||resumenWeb())+precios();
if(FOT.length)pTodo+=sec('🖼️ FOTOS',FOT.length>3?'fot':'')+'<div class="car">'+lista(FOT,foto,8)+'</div>';
if(W.length)pTodo+=sec('🌐 WEB',W.length>3?'web':'')+lista(W,cWeb,3);
if(N.length)pTodo+=sec('📰 ÚLTIMAS NOTICIAS',N.length>3?'not':'')+lista(N,cNot,3);
if(V.length)pTodo+=sec('▶️ VIDEOS','vid')+'<div class="car">'+lista(V,mini,8)+'</div>';
if(!A&&!W.length&&!N.length&&!V.length&&!FOT.length)pTodo='<div class="vacio"><b>🫥</b>No pude traer resultados esta vez.<br>Prueba con otras palabras o usa el botón <b style="display:inline;font-size:inherit">Ver en Google</b> del mensaje de abajo.</div>';
var pInf='';
if(CLARGO){var wi=reg({url:WIKI.url});pInf+='<div class="cd inf"><div class="top2">'+(WIKI.img?'<img src="'+WIKI.img+'" alt="">':'')+'<div><small>📚 WIKIPEDIA</small><b class="wt" style="display:block;font-size:19px;margin:4px 0 8px;font-weight:900">'+esc(WIKI.titulo)+'</b><button class="bt" data-cp="'+wi+'">Copiar enlace</button></div></div>'+cuerpo(WIKI.largo)+'</div>'}
if(FUENTES.length)pInf+=sec('📑 DE LAS FUENTES')+lista(FUENTES,function(it,n){return cWeb(it,n,true)});
var pWeb=precios()+lista(W,cWeb);
var pNot=lista(N,cNot);
var pFot='<div class="gal">'+lista(FOT,foto)+'</div>';
var pVid=(RE.length?sec('🆕 MÁS RECIENTES'):'')+lista(RE,cVid)+(PO.length?sec('🔥 POPULARES'):'')+lista(PO,cVid);
var tabs='<div class="tabs">'+TABS.map(function(t){return '<div class="tb'+(t[0]===ini?' on':'')+'" id="t-'+t[0]+'" data-go="'+t[0]+'">'+t[1]+(t[2]!==''?'<b>'+t[2]+'</b>':'')+'</div>'}).join('')+'</div>';
function pn(k,h){return '<div class="pn'+(k===ini?' on':'')+'" id="p-'+k+'">'+h+'</div>'}
$('main').innerHTML=(TABS.length>1?tabs:'')+pn('todo',pTodo)+(existe('inf')?pn('inf',pInf):'')+(W.length?pn('web',pWeb):'')+(N.length?pn('not',pNot):'')+(FOT.length?pn('fot',pFot):'')+(V.length?pn('vid',pVid):'');
function abrir(k){TABS.forEach(function(t){var a=$('t-'+t[0]),b=$('p-'+t[0]);if(a)a.className='tb'+(t[0]===k?' on':'');if(b)b.className='pn'+(t[0]===k?' on':'')})}
$('main').addEventListener('click',function(e){
var go=e.target.closest('[data-go]');if(go){abrir(go.getAttribute('data-go'));return}
var lb=e.target.closest('[data-lb]');if(lb){var f=FOT[+lb.getAttribute('data-lb')];$('lbi').src=f.img;$('lbt').textContent=f.titulo+' · '+f.fuente;$('lb').className='lb on';return}
var pl=e.target.closest('[data-play]');if(pl){var v=ALL[+pl.getAttribute('data-play')];if(v&&v.id){pl.removeAttribute('data-play');pl.innerHTML='<iframe src="https://www.youtube.com/embed/'+v.id+'?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';var cv=pl.closest?pl.closest('.cd'):null;if(cv&&cv.className.indexOf(' on')<0)cv.className+=' on';setTimeout(function(){toast('¿No carga? Ábrelo con los botones del chat')},6000)}return}
var cp=e.target.closest('[data-cp]');if(cp){e.stopPropagation();copiar(ALL[+cp.getAttribute('data-cp')].url);return}
var c=e.target.closest('.cd');if(c&&c.className.indexOf('inf')<0)tog(c)});
$('lb').addEventListener('click',function(){$('lb').className='lb'});
$('q').textContent=D.q;
var via=[];if(D.via)via.push('vía '+D.via);if(D.ms)via.push((D.ms/1000).toFixed(1)+' s');
$('via').textContent=via.join(' · ');$('via').style.display=via.length?'':'none';
$('pie').innerHTML=(TABS.length>1?'Toca una tarjeta para leerla aquí · abre los enlaces con los botones del chat<br>':'')+'<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6.7"/><path d="M8 7v4.2M8 4.7v.1" stroke-linecap="round"/></svg>Powered by '+esc(D.firma);
if(A&&A.tipo==='hora'){try{reloj()}catch(x){}}
})();
</script></body></html>`;

export function htmlGoogle(datos) {
  const json = JSON.stringify(datos, (k, v) => (v === "" || v === null || (Array.isArray(v) && v.length === 0) ? undefined : v)).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  return PLANTILLA.replace("__DATA__", () => json);
}
