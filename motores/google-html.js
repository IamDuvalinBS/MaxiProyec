const PLANTILLA = String.raw`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html{background:#e9e4ff;overflow-x:hidden}
body{background:linear-gradient(165deg,#ebe5ff 0%,#dff2ff 55%,#e6fbef 100%);min-height:100vh;color:#1f2347;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:13px;padding:12px;overflow-x:hidden;overscroll-behavior:none}
button{font:inherit;cursor:pointer;border:0}
small{color:#6b7096;font-size:10.5px;letter-spacing:1.4px;font-weight:700}
.cab{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.lupa{width:40px;height:40px;flex:none;border-radius:50%;background:conic-gradient(#4285f4 0 25%,#ea4335 0 50%,#fbbc05 0 75%,#34a853 0);position:relative}
.lupa:after{content:"";position:absolute;inset:7px;border-radius:50%;background:#fff}
.lupa:before{content:"";position:absolute;right:-3px;bottom:-1px;width:14px;height:6px;border-radius:4px;background:#1f2347;transform:rotate(45deg);z-index:2}
.tit{flex:1;min-width:0}
.tit b{display:block;font-size:19px;line-height:1.1}
.via{font-size:11px;font-weight:700;color:#4b50d6;background:rgba(255,255,255,.7);padding:4px 10px;border-radius:20px;white-space:nowrap}
.q{display:flex;align-items:center;gap:9px;background:#fff;border-radius:24px;padding:11px 16px;box-shadow:0 4px 16px rgba(31,35,71,.12);margin-bottom:10px}
.q b{flex:1;min-width:0;font-size:15px;line-height:1.25;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.mods{display:flex;gap:6px;margin-bottom:12px}
.md{flex:1;text-align:center;padding:7px 4px;border-radius:20px;background:rgba(255,255,255,.65);color:#6b7096;font-weight:700;font-size:12px}
.md.on{background:#1f2347;color:#fff;box-shadow:0 3px 8px rgba(31,35,71,.3)}
.ans{background:#fff;border-radius:22px;padding:16px;box-shadow:0 4px 16px rgba(31,35,71,.14);margin-bottom:12px;display:flex;align-items:center;gap:14px;position:relative;overflow:hidden}
.ans:before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:linear-gradient(#4285f4,#ea4335,#fbbc05,#34a853)}
.ans .cu{flex:1;min-width:0;padding-left:4px}
.gr{font-size:32px;font-weight:800;line-height:1.1;margin-top:4px;overflow-wrap:anywhere}
.dt{font-size:12.5px;color:#4a5078;margin-top:5px;text-transform:capitalize}
.lg{display:inline-block;margin-top:9px;padding:3px 11px;border-radius:20px;background:#eef0ff;color:#4b50d6;font-size:11.5px;font-weight:700}
.ck{width:104px;height:104px;flex:none;filter:drop-shadow(0 4px 6px rgba(31,35,71,.25))}
.wk img{width:84px;height:84px;border-radius:16px;object-fit:cover;flex:none}
.wk .wt{display:block;font-size:17px;margin:3px 0 4px}
.wk p{font-size:12.5px;line-height:1.45;color:#3b4168;display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical;overflow:hidden}
.sec{font-size:10.5px;letter-spacing:1.6px;font-weight:800;color:#6b7096;margin:4px 4px 8px}
.rc{background:#fff;border-radius:18px;margin-bottom:9px;padding:12px 13px 12px 15px;box-shadow:0 3px 10px rgba(31,35,71,.1);border-left:6px solid var(--c);cursor:pointer}
.rc:active{transform:scale(.99)}
.top{display:flex;align-items:center;gap:7px;margin-bottom:5px}
.rk{width:20px;height:20px;border-radius:50%;background:var(--c);color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex:none}
.dm{font-size:11px;font-weight:700;color:var(--c);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tt{font-size:14.5px;font-weight:800;color:#1b3fbf;line-height:1.25;overflow-wrap:anywhere}
.sn{font-size:12.5px;color:#4a5078;margin-top:4px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ex{display:none;margin-top:9px;padding:9px 10px;border-radius:12px;background:#f1f3ff}
.ex span{display:block;font-size:11px;color:#4a5078;overflow-wrap:anywhere;user-select:all;-webkit-user-select:all;margin-bottom:8px}
.ex button{padding:7px 14px;border-radius:16px;background:#1f2347;color:#fff;font-size:12px;font-weight:700}
.ex button:active{transform:scale(.94)}
.rc.on .sn{-webkit-line-clamp:unset}
.rc.on .ex{display:block}
.yt{padding:0;overflow:hidden}
.yt .in{padding:10px 13px 12px 15px}
.th{position:relative;background:#1f2347;aspect-ratio:16/9}
.th img{width:100%;height:100%;object-fit:cover;display:block}
.th .pl{position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(255,0,0,.9);color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;padding-left:3px}
.th .du{position:absolute;right:8px;bottom:8px;background:rgba(0,0,0,.82);color:#fff;font-size:11px;font-weight:700;padding:2px 7px;border-radius:6px}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 3px 10px rgba(31,35,71,.1);margin-bottom:12px}
th{background:#1f2347;color:#fff;font-size:10.5px;letter-spacing:1.4px;text-align:left;padding:9px 12px}
td{padding:10px 12px;border-top:1px solid #eceefb;font-size:12.5px}
td b{color:#c2410c;font-size:14px}
.vacio{background:#fff;border-radius:20px;padding:26px 16px;text-align:center;color:#4a5078;line-height:1.5;box-shadow:0 3px 10px rgba(31,35,71,.1)}
.vacio b{display:block;font-size:30px;margin-bottom:6px}
.pie{margin-top:12px;text-align:center;font-size:11px;color:#6b7096;line-height:1.7}
.pie svg{vertical-align:-2px;margin-right:4px}
.ts{position:fixed;left:50%;bottom:18px;transform:translate(-50%,30px);background:#1f2347;color:#fff;padding:9px 16px;border-radius:20px;font-size:12.5px;font-weight:700;opacity:0;transition:all .25s;pointer-events:none;white-space:nowrap}
.ts.on{opacity:1;transform:translate(-50%,0)}
</style></head><body>
<div class="cab"><div class="lupa"></div><div class="tit"><b>Buscador</b><small>TOOLS</small></div><div class="via" id="via"></div></div>
<div class="q"><span>🔎</span><b id="q"></b></div>
<div class="mods" id="mods"></div>
<div id="ans"></div>
<div id="lst"></div>
<div class="pie" id="pie"></div>
<div class="ts" id="ts"></div>
<script>
(function(){
var D=__DATA__;
var MODS=[['info','📖','Info'],['precio','🏷️','Precio'],['youtube','▶️','YouTube']];
var tt=0;
function $(i){return document.getElementById(i)}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function hue(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%360;return 'hsl('+h+',58%,46%)'}
function toast(m){var t=$('ts');t.textContent=m;t.className='ts on';clearTimeout(tt);tt=setTimeout(function(){t.className='ts'},1700)}
function copiar(u){var ok=false;
try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u);ok=true}}catch(x){}
if(!ok){try{var a=document.createElement('textarea');a.value=u;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();ok=document.execCommand('copy');document.body.removeChild(a)}catch(x){}}
toast(ok?'🔗 Enlace copiado':'Mantén pulsado el enlace para copiarlo')}
function reloj(){var a=D.ans;
var f=new Intl.DateTimeFormat('es-MX',{timeZone:a.zona,hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true});
var g=new Intl.DateTimeFormat('en-GB',{timeZone:a.zona,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
function tick(){if(document.hidden)return;var d=new Date(),h=0,m=0,s=0;
g.formatToParts(d).forEach(function(x){if(x.type==='hour')h=+x.value;if(x.type==='minute')m=+x.value;if(x.type==='second')s=+x.value});
$('dg').textContent=f.format(d).replace(/\s?([ap])\.?\s?m\.?/i,function(z,l){return ' '+l.toLowerCase()+'.m.'});
$('hh').setAttribute('transform','rotate('+((h%12)*30+m*.5)+' 60 60)');
$('mm').setAttribute('transform','rotate('+(m*6+s*.1)+' 60 60)');
$('ss').setAttribute('transform','rotate('+(s*6)+' 60 60)')}
tick();setInterval(tick,1000)}
function dibujarRespuesta(){var a=D.ans;if(!a)return;var h='';
if(a.tipo==='hora'){var t='';for(var i=0;i<12;i++)t+='<line x1="60" y1="9" x2="60" y2="'+(i%3?14:18)+'" stroke="#1f2347" stroke-width="'+(i%3?2:3.4)+'" stroke-linecap="round" transform="rotate('+i*30+' 60 60)"/>';
h='<div class="ans"><svg class="ck" viewBox="0 0 120 120"><circle cx="60" cy="60" r="56" fill="#fff" stroke="#1f2347" stroke-width="5"/>'+t+'<line id="hh" x1="60" y1="60" x2="60" y2="32" stroke="#1f2347" stroke-width="5" stroke-linecap="round"/><line id="mm" x1="60" y1="60" x2="60" y2="20" stroke="#4285f4" stroke-width="3.6" stroke-linecap="round"/><line id="ss" x1="60" y1="68" x2="60" y2="16" stroke="#ea4335" stroke-width="1.8" stroke-linecap="round"/><circle cx="60" cy="60" r="4.5" fill="#ea4335"/></svg><div class="cu"><small>HORA ACTUAL</small><div class="gr" id="dg">'+esc(a.grande)+'</div><div class="dt">'+esc(a.detalle)+'</div><span class="lg">📍 '+esc(a.lugar)+'</span></div></div>'}
else if(a.tipo==='wiki'){h='<div class="ans wk">'+(a.img?'<img src="'+a.img+'" alt="">':'')+'<div class="cu"><small>📚 WIKIPEDIA</small><b class="wt">'+esc(a.titulo)+'</b><p>'+esc(a.texto)+'</p></div></div>'}
else{h='<div class="ans"><div class="cu"><small>'+esc(String(a.titulo).toUpperCase())+'</small><div class="gr">'+esc(a.grande)+'</div><div class="dt">'+esc(a.detalle)+'</div>'+(a.lugar?'<span class="lg">📍 '+esc(a.lugar)+'</span>':'')+'</div></div>'}
$('ans').innerHTML=h;if(a.tipo==='hora'){try{reloj()}catch(x){}}}
function tarjeta(it,i){var c=hue(it.dominio||it.canal||'x');var ex='<div class="ex"><span>'+esc(it.url)+'</span><button data-cp="'+i+'">Copiar enlace</button></div>';
if(D.modo==='youtube'){return '<div class="rc yt" style="--c:'+c+'"><div class="th">'+(it.img?'<img src="'+it.img+'" alt="">':'')+'<div class="pl">▶</div><div class="du">'+esc(it.duracion)+'</div></div><div class="in"><div class="tt">'+esc(it.titulo)+'</div><div class="sn">'+esc(it.canal)+' · '+esc(it.fecha)+'</div>'+ex+'</div></div>'}
return '<div class="rc" style="--c:'+c+'"><div class="top"><div class="rk">'+(i+1)+'</div><div class="dm">'+esc(it.dominio)+'</div></div><div class="tt">'+esc(it.titulo)+'</div>'+(it.texto?'<div class="sn">'+esc(it.texto)+'</div>':'')+ex+'</div>'}
function dibujarLista(){if(!D.items)return;var h='';
if(D.precios&&D.precios.length){h+='<div class="sec">TABLA DE PRECIOS</div><table><tr><th>SITIO</th><th>PRECIO</th></tr>';D.precios.forEach(function(p){h+='<tr><td>'+esc(p.sitio)+'</td><td><b>'+esc(p.precio)+'</b></td></tr>'});h+='</table>'}
if(!D.items.length){h+='<div class="vacio"><b>🫥</b>No pude traer resultados esta vez.<br>Usa el botón <b style="display:inline;font-size:inherit">Ver en Google</b> del mensaje de abajo.</div>'}
else{h+='<div class="sec">'+(D.modo==='youtube'?'VIDEOS':'FUENTES')+' · '+D.items.length+'</div>';D.items.forEach(function(it,i){h+=tarjeta(it,i)})}
$('lst').innerHTML=h}
$('q').textContent=D.q;
$('via').textContent=D.via?('vía '+D.via):'';
$('via').style.display=D.via?'':'none';
$('mods').innerHTML=MODS.map(function(m){return '<div class="md'+(m[0]===D.modo?' on':'')+'">'+m[1]+' '+m[2]+'</div>'}).join('');
$('pie').innerHTML=(D.items&&D.items.length?'Toca un resultado para ver más · abre los enlaces con los botones del chat<br>':'')+'<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6.7"/><path d="M8 7v4.2M8 4.7v.1" stroke-linecap="round"/></svg>Powered by '+esc(D.firma);
$('lst').addEventListener('click',function(e){var cp=e.target.closest('[data-cp]');if(cp){e.stopPropagation();copiar(D.items[+cp.getAttribute('data-cp')].url);return}
var c=e.target.closest('.rc');if(c)c.classList.toggle('on')});
dibujarRespuesta();dibujarLista();
})();
</script></body></html>`;

export function htmlGoogle(datos) {
  const json = JSON.stringify(datos).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  return PLANTILLA.replace("__DATA__", () => json);
}
