const PLANTILLA = String.raw`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{--bg1:#2d6bff;--bg2:#1a2f9c;--card:#fff;--ink:#0d1330;--mut:#5c6896;--bd:#0d1330;--acc:#ffce1f;--acc2:#ff5a36;--btn:#0d1330;--btnt:#fff;--soft:#e9efff;--glow:rgba(13,19,48,.28);--hdr:#fff;
background:linear-gradient(170deg,var(--bg1),var(--bg2));color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:13px;padding:12px;overflow-x:hidden;overscroll-behavior:none;min-height:100vh;position:relative}
html{background:#1a2f9c;overflow-x:hidden}
body.h{--bg1:#2a0b3a;--bg2:#0d0414;--card:#1d0c2b;--ink:#ffe9d2;--mut:#c79ad8;--bd:#ff7a1a;--acc:#ff9a1f;--acc2:#8dff3f;--btn:#ff7a1a;--btnt:#1a0826;--soft:#2b1240;--glow:rgba(255,122,26,.35);--hdr:#ffd9a8}
button{font:inherit;cursor:pointer;border:0;color:inherit}
small{color:var(--mut);font-size:11px}
.wb{position:absolute;width:96px;height:96px;pointer-events:none;opacity:.55;display:none}
body.h .wb{display:block}
.wb.a{top:0;left:0}.wb.b{top:0;right:0;transform:scaleX(-1)}
.wb svg{width:100%;height:100%}
.bats{position:absolute;left:0;top:0;right:0;height:80px;overflow:hidden;pointer-events:none;display:none}
body.h .bats{display:block}
.bat{position:absolute;font-size:18px;left:-30px;animation:vuela 9s linear infinite}
@keyframes vuela{0%{transform:translate(0,30px) scale(.8)}50%{transform:translate(55vw,6px) scale(1.1)}100%{transform:translate(115vw,40px) scale(.8)}}
.cab{position:relative;display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:8px 10px;background:var(--card);border:3px solid var(--bd);border-radius:18px;box-shadow:0 4px 0 var(--bd),0 0 18px var(--glow)}
.logo{width:42px;height:42px;flex:none;border-radius:12px;border:3px solid var(--bd);background:var(--acc);display:flex;align-items:center;justify-content:center;font-size:22px;transform:rotate(-6deg)}
.tit{flex:1;min-width:0}
.tit b{display:block;font-size:18px;line-height:1.1;font-weight:900;letter-spacing:.2px;overflow-wrap:anywhere}
.res{display:flex;justify-content:space-between;align-items:flex-end;gap:8px;margin-bottom:6px;color:var(--hdr)}
.res small{color:var(--hdr);opacity:.85}
.res b{display:block;font-size:15px;font-weight:900}
.res .d{text-align:right}
.bar{height:9px;border-radius:6px;background:rgba(0,0,0,.28);overflow:hidden;border:1.5px solid var(--bd)}
.bar i{display:block;height:100%;border-radius:5px}
.rar{display:flex;flex-wrap:wrap;gap:5px;margin:10px 0 12px}
.rc{font-size:11px;font-weight:900;padding:3px 9px;border-radius:20px;color:#fff;background:var(--c);border:2px solid var(--bd);text-shadow:0 1px 2px rgba(0,0,0,.5)}
.det{position:relative;background:var(--card);border:3px solid var(--bd);border-radius:20px;overflow:hidden;box-shadow:0 5px 0 var(--bd),0 0 22px var(--glow);margin-bottom:14px}
.hero{position:relative;padding:14px 10px 12px;text-align:center;overflow:hidden}
.hero .wb{opacity:.7;width:80px;height:80px}
.spw{position:relative;display:inline-block}
.spw.reb{animation:reb .55s ease}
.big{display:block;width:128px;height:128px;object-fit:contain;filter:drop-shadow(0 6px 5px rgba(0,0,0,.4));animation:flot 3s ease-in-out infinite}
.sin{display:flex;align-items:center;justify-content:center;font-size:40px;color:#fff;font-weight:900}
.fl{position:absolute;bottom:45%;font-size:18px;pointer-events:none;animation:sube 1.2s ease-out forwards}
.bub{position:absolute;top:6px;right:6px;max-width:60%;background:#fff;color:#0d1330;font-size:12px;font-weight:800;padding:5px 9px;border-radius:12px;border:2px solid #0d1330;opacity:0;transform:scale(.8);transition:all .2s;z-index:2}
body.h .bub{background:#1a0826;color:#ffd9a8;border-color:#ff7a1a}
.bub.on{opacity:1;transform:none}
.hn{font-size:21px;font-weight:900;color:#fff;text-shadow:-2px -2px 0 #0d1330,2px -2px 0 #0d1330,-2px 2px 0 #0d1330,2px 2px 0 #0d1330,0 4px 0 #0d1330;margin-top:4px;line-height:1.15;overflow-wrap:anywhere}
.hs{font-size:11.5px;color:#fff;opacity:.95;text-shadow:0 1px 3px rgba(0,0,0,.6);margin-top:3px}
.tps{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;margin-top:8px}
.tp{font-size:11.5px;font-weight:900;color:#fff;padding:3px 10px;border-radius:20px;border:2px solid #0d1330;text-shadow:0 1px 2px rgba(0,0,0,.5)}
.cu{padding:12px 14px 14px}
.nv{display:flex;justify-content:space-between;font-size:12px;color:var(--mut);margin-bottom:5px}
.nv b{color:var(--ink)}
.sr{display:grid;grid-template-columns:62px 34px minmax(0,1fr);align-items:center;gap:8px;margin-top:8px}
.sr span{color:var(--mut)}
.sr b{text-align:right}
.feed{margin-top:14px;padding:10px;border-radius:14px;background:var(--soft);text-align:center;border:2px dashed var(--bd)}
.ft{font-weight:900;font-size:13px}
.fb{display:flex;justify-content:center;gap:10px;margin:8px 0 6px}
.fb button{width:48px;height:48px;border-radius:50%;background:var(--card);border:3px solid var(--bd);font-size:22px;box-shadow:0 3px 0 var(--bd)}
.fb button:active{transform:translateY(2px);box-shadow:0 1px 0 var(--bd)}
.hr{font-size:15px;letter-spacing:2px;min-height:20px}
.cmd{margin-top:10px;padding:9px 11px;border-radius:12px;background:var(--soft);font-size:11.5px;line-height:1.55;color:var(--mut)}
.cmd b{color:var(--ink)}
.frow{display:flex;align-items:center;gap:6px;margin-bottom:10px}
.mv{flex:none;width:30px;height:30px;border-radius:50%;background:var(--btn);color:var(--btnt);font-size:17px;line-height:1;border:2px solid var(--bd)}
.fil{flex:1;min-width:0;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px}
.fil::-webkit-scrollbar{display:none}
.ch{flex:none;border:2.5px solid var(--bd);background:var(--card);color:var(--ink);border-radius:20px;padding:4px 11px;font-size:12px;font-weight:900}
.ch.on{background:var(--c,var(--acc));color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.55)}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
.t{min-width:0;background:var(--card);border:3px solid var(--bd);border-radius:16px;padding:6px 5px 7px;text-align:center;border-bottom:7px solid var(--r);box-shadow:0 3px 0 var(--bd);cursor:pointer}
.t.sel{outline:3px solid var(--acc);outline-offset:1px}
.t.e{visibility:hidden}
.ti{border-radius:12px;width:100%;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;overflow:hidden}
.sp{width:92%;height:92%;object-fit:contain}
.pn{font-size:24px;font-weight:900}
.tn{min-height:2.5em;display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:900;line-height:1.2;overflow-wrap:anywhere;margin-top:3px}
.tl{font-size:10px;color:var(--mut);font-weight:700}
.pag{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:14px}
.pag .fl2{width:46px;height:36px;border-radius:12px;background:var(--btn);color:var(--btnt);font-size:18px;font-weight:900;border:2.5px solid var(--bd);box-shadow:0 3px 0 var(--bd)}
.pag .fl2:disabled{opacity:.3}
.lib{flex:1;height:36px;border-radius:18px;background:var(--card);color:var(--ink);font-size:13px;font-weight:900;border:2.5px solid var(--bd);box-shadow:0 3px 0 var(--bd)}
.lib.on{background:var(--acc);color:#0d1330}
.pie{margin-top:14px;text-align:center;font-size:11px;color:var(--hdr);opacity:.9;line-height:1.6;min-height:36px;position:relative}
.pie b{color:var(--acc)}
@keyframes flot{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes reb{0%{transform:scale(1)}30%{transform:scale(1.18,.86)}60%{transform:scale(.92,1.12)}100%{transform:scale(1)}}
@keyframes sube{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-70px)}}
@keyframes cuelga{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}
.ara{position:absolute;top:0;right:54px;transform-origin:top center;animation:cuelga 3.4s ease-in-out infinite;display:none;pointer-events:none;z-index:1}
body.h .ara{display:block}
</style><style>__VARS__</style></head><body class="__TEMA__">
<div class="bats"><span class="bat" style="top:6px;animation-delay:0s">__B1__</span><span class="bat" style="top:24px;animation-delay:3.2s">__B2__</span><span class="bat" style="top:2px;animation-delay:6s">__B3__</span></div>
<div class="wb a" data-w="1"></div><div class="wb b" data-w="1"></div>
<div class="cab"><div class="logo" id="logo"></div><div class="tit"><b id="nom"></b><small id="sub"></small></div></div>
<div class="res"><div class="v"><small>Valor total</small><b id="val"></b></div><div class="d"><small id="regl">Registrados</small><b id="pt"></b></div></div>
<div class="bar"><i id="pb"></i></div>
<div class="rar" id="rar"></div>
<div class="det" id="det"></div>
<div class="frow"><button class="mv" id="fl">‹</button><div class="fil" id="fil"></div><button class="mv" id="fr">›</button></div>
<div class="grid" id="grid"></div>
<div class="pag"><button class="fl2" id="ant">‹</button><button class="lib" id="lib"><span id="pg"></span></button><button class="fl2" id="sig">›</button></div>
<div class="pie" id="pie"></div>
<script>
(function(){
var D=__DATA__;
var H=!!D.halloween;var C=D.cfg,SN=!!C.sinNivel;
var CC={'Tank':'#d9534f','Assassin':'#7b3fe4','Marksman':'#e8890c','Sniper':'#e8890c','Artillery':'#c0392b','Controller':'#16a085','Support':'#27ae60','Damage Dealer':'#f0b90b','Thrower':'#c0392b','Skirmisher':'#2f80ed'};
var CCH={'Tank':'#8e3b5a','Assassin':'#5a1fa8','Marksman':'#a85a0a','Sniper':'#a85a0a','Artillery':'#7a1c12','Controller':'#0b6b58','Support':'#17753f','Damage Dealer':'#a97d00','Thrower':'#7a1c12','Skirmisher':'#1f55a8'};
var RC={'Común':'#8d97a8','Rara':'#2fa36b','Súper rara':'#2d8cf0','Épica':'#9b4dea','Mítica':'#e0344f','Legendaria':'#f59e0b','Ultra legendaria':'#ec4899'};
var FR=H?C.frH:C.fr;
var EM=H?C.emH:C.em;
var PER=9,fil='',pag=0,libro=false,BOC={},tb=0,sel=D.items.length?D.items[0].id:0;
function $(i){return document.getElementById(i)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function hu(c){var h=0,i;c=String(c);for(i=0;i<c.length;i++)h=(h*31+c.charCodeAt(i))%360;return h}
function col(c){return (H?CCH[c]:CC[c])||(H?'hsl('+hu(c)+',42%,30%)':'hsl('+hu(c)+',52%,46%)')}
function rcol(r){return RC[r]||'#ec4899'}
function img(it,cls){return it.img?'<img class="'+cls+'" src="'+it.img+'" alt="">':'<div class="'+cls+' sin">?</div>'}
function lista(){if(!fil)return D.items;return D.items.filter(function(it){return it.clase===fil})}
function buscar(id){for(var i=0;i<D.items.length;i++)if(D.items[i].id===id)return D.items[i];return null}
function paginas(){return Math.max(1,Math.ceil(lista().length/PER))}
function gpag(p){return (D.parte-1)*Math.ceil(D.porParte/PER)+p+1}
function vacios(h,n){for(;n<PER;n++)h+='<div class="t e"><div class="ti"></div><div class="tn"></div><div class="tl">.</div></div>';return h}
function web(){
var a=[0,22.5,45,67.5,90],R=[26,50,76,100],s='',i,j,p,q,m,r;
function pt(g,r){var t=g*Math.PI/180;return [(r*Math.cos(t)).toFixed(1),(r*Math.sin(t)).toFixed(1)]}
for(i=0;i<a.length;i++){p=pt(a[i],100);s+='<line x1="0" y1="0" x2="'+p[0]+'" y2="'+p[1]+'"/>'}
for(j=0;j<R.length;j++){r=R[j];p=pt(a[0],r);s+='<path d="M'+p[0]+' '+p[1];
for(i=1;i<a.length;i++){q=pt(a[i],r);m=pt((a[i]+a[i-1])/2,r*.8);s+=' Q'+m[0]+' '+m[1]+' '+q[0]+' '+q[1]}
s+='" fill="none"/>'}
return '<svg viewBox="0 0 100 100" stroke="#e9e3f5" stroke-width="1.1" stroke-linecap="round">'+s+'</svg>'}
function arana(){return '<svg width="30" height="74" viewBox="0 0 30 74"><line x1="15" y1="0" x2="15" y2="44" stroke="#e9e3f5" stroke-width="1"/><g stroke="#140820" stroke-width="2" fill="none" stroke-linecap="round"><path d="M10 52 L2 46 L0 56"/><path d="M10 56 L1 60 L3 70"/><path d="M11 60 L6 66 L9 73"/><path d="M11 48 L5 40 L1 42"/><path d="M20 52 L28 46 L30 56"/><path d="M20 56 L29 60 L27 70"/><path d="M19 60 L24 66 L21 73"/><path d="M19 48 L25 40 L29 42"/></g><ellipse cx="15" cy="56" rx="7.5" ry="9" fill="#140820"/><circle cx="15" cy="47" r="5" fill="#140820"/><circle cx="13" cy="46" r="1.2" fill="#ff3b3b"/><circle cx="17" cy="46" r="1.2" fill="#ff3b3b"/><path d="M13 55 L15 59 L17 55 Z" fill="#ff7a1a"/></svg>'}
function adornos(){
var w=document.querySelectorAll('[data-w]'),i;
for(i=0;i<w.length;i++)w[i].innerHTML=web();
if(H){var h=document.createElement('div');h.className='ara';h.innerHTML=C.colg?'<div style="font-size:34px;margin-top:-2px">'+C.colg+'</div>':arana();document.querySelector('.cab').appendChild(h)}}
function cabecera(){
$('logo').textContent=H?C.logoH:C.logo;
$('nom').textContent=D.nombre;
$('sub').textContent=H?C.subH:C.sub;
$('regl').textContent=H?C.reglH:C.regl;
$('val').textContent=D.valorTxt;
$('pb').style.width=Math.max(2,Math.round(D.n/D.total*100))+'%';
$('pb').style.background='linear-gradient(90deg,var(--acc),var(--acc2))';
$('pt').textContent=D.n+' / '+D.total;
$('rar').innerHTML=D.rarezas.map(function(r){return '<span class="rc" style="--c:'+rcol(r.n)+'">'+esc(r.n)+' '+r.c+'</span>'}).join('');
$('pie').innerHTML=(D.partes>1?'Parte '+D.parte+' de '+D.partes+' · usa <b>'+C.cmd+' '+(D.parte%D.partes+1)+'</b> para ver otra<br>':'')+'__FIRMA__'}
function filtros(){
var c={},k,h='<button class="ch'+(fil?'':' on')+'" data-f="">Todos '+D.items.length+'</button>';
D.items.forEach(function(it){var k=it.clase;if(!c[k])c[k]={n:it.claseN,c:0};c[k].c++});
for(k in c)h+='<button class="ch'+(fil===k?' on':'')+'" data-f="'+esc(k)+'" style="--c:'+col(k)+'">'+esc(c[k].n)+' '+c[k].c+'</button>';
$('fil').innerHTML=h}
function grid(){
var L=lista(),n=paginas(),h='',p,it,c,vis;
if(pag>=n)pag=n-1;
if(libro){
for(p=0;p<n;p++){it=L[p*PER];c=Math.min(PER,L.length-p*PER);
h+='<div class="t'+(p===pag?' sel':'')+'" data-p="'+p+'" style="--r:'+(H?'#ff7a1a':'#ffce1f')+'"><div class="ti" style="background:'+col(it.clase)+'55"><span class="pn">'+(fil?p+1:gpag(p))+'</span></div><div class="tn">'+c+' '+(c===1?C.u1:C.u2)+'</div><div class="tl">página</div></div>'}
h=vacios(h,n)}
else{
vis=L.slice(pag*PER,pag*PER+PER);
vis.forEach(function(it){
h+='<div class="t'+(it.id===sel?' sel':'')+'" data-id="'+it.id+'" style="--r:'+rcol(it.rareza)+'"><div class="ti" style="background:'+col(it.clase)+'66">'+img(it,'sp')+'</div><div class="tn">'+esc(it.nombre)+'</div><div class="tl">'+(SN?esc(it.rareza):'Nv. '+it.nivel+(it.estrellas?' ★'+it.estrellas:''))+'</div></div>'});
h=vacios(h,vis.length)}
$('grid').innerHTML=h;
$('pg').textContent=libro?'Elegir página':(H?C.pag+' ':'')+'Pág. '+(fil?pag+1:gpag(pag))+' / '+(fil?n:Math.max(1,Math.ceil(D.n/PER)));
$('lib').className='lib'+(libro?' on':'');
$('ant').disabled=pag<=0;$('sig').disabled=pag>=n-1}
function marcas(id){var n=Math.min(5,BOC[id]||0),h='',i,a=H?C.marcaH[0]:C.marca[0],b=H?C.marcaH[1]:C.marca[1];for(i=0;i<5;i++)h+=i<n?a:b;return h}
function detalle(){
var it=buscar(sel);if(!it){$('det').innerHTML='';return}
var c1=col(it.clase),s=it.st,mx={hp:1,atk:1,def:1,spe:1};
D.items.forEach(function(x){if(x.st)for(var k in mx)if(x.st[k]>mx[k])mx[k]=x.st[k]});
var filas=SN?'':[['hp','PS',H?'#8dff3f':'#34c38f'],['atk','Ataque',H?'#ff7a1a':'#f0765a'],['def','Defensa',H?'#b45cff':'#f5b83d'],['spe','Velocidad',H?'#35e0d0':'#ec6fb5']].map(function(r){
return '<div class="sr"><span>'+r[1]+'</span><b>'+s[r[0]]+'</b><div class="bar"><i style="width:'+Math.max(4,Math.round(s[r[0]]/mx[r[0]]*100))+'%;background:'+r[2]+'"></i></div></div>'}).join('');
var tps='<span class="tp" style="background:'+c1+'">'+esc(it.claseN)+'</span><span class="tp" style="background:'+rcol(it.rareza)+'">'+esc(it.rareza)+'</span>';
var fondo=H?'linear-gradient(160deg,'+c1+',#1a0826 85%)':'linear-gradient(150deg,'+c1+',#0d1330 160%)';
var emb=EM.map(function(e){return '<button data-c="'+e+'">'+e+'</button>'}).join('');
$('det').innerHTML='<div class="hero" style="background:'+fondo+'">'+(H?'<div class="wb a" data-w="1"></div><div class="wb b" data-w="1"></div>':'')+'<div class="bub" id="bub"></div><div class="spw" id="spw">'+img(it,'big')+'</div><div class="hn">'+esc(it.nombre)+(it.estrellas?' '+new Array(it.estrellas+1).join('★'):'')+'</div><div class="hs">'+esc(it.serie)+' · ID #'+it.id+'</div><div class="tps">'+tps+'</div></div>'+
'<div class="cu">'+(SN?'<div class="nv"><span>Valor</span><span><b>'+esc(it.valorTxt||'')+'</b></span></div>':'<div class="nv"><span>Nivel</span><span><b>'+it.nivel+'</b> / '+it.max+'</span></div><div class="bar"><i style="width:'+Math.min(100,Math.round(it.nivel/it.max*100))+'%;background:'+(H?'linear-gradient(90deg,#ff7a1a,#b45cff)':'linear-gradient(90deg,#ffce1f,#ff5a36)')+'"></i></div>'+filas)+
'<div class="feed"><div class="ft">'+(H?C.invH:C.inv)+' <small>(solo visual)</small></div><div class="fb">'+emb+'</div><div class="hr" id="hr">'+marcas(it.id)+'</div></div>'+
'<div class="cmd">'+C.cmdTxt.replace('#ID','#'+it.id)+'</div></div>';
var w=$('det').querySelectorAll('[data-w]'),i;for(i=0;i<w.length;i++)w[i].innerHTML=web()}
function quitar(e){setTimeout(function(){if(e.parentNode)e.parentNode.removeChild(e)},1500)}
function emote(c){
var it=buscar(sel);if(!it)return;
BOC[it.id]=(BOC[it.id]||0)+1;
var n=BOC[it.id],sp=$('spw'),b=$('bub'),hr=$('hr'),i,e;
if(hr)hr.textContent=marcas(it.id);
if(b){b.textContent=n>=5?(H?'¡La noche es nuestra! 🌙':'¡Somos imparables! 🏆'):FR[n%FR.length];b.className='bub on';clearTimeout(tb);tb=setTimeout(function(){b.className='bub'},1600)}
if(sp){sp.className='spw';void sp.offsetWidth;sp.className='spw reb';
for(i=0;i<3;i++){e=document.createElement('span');e.className='fl';e.textContent=i===1?c:(i?(H?'🕸️':'✨'):(H?'🔮':'💥'));e.style.left=(25+Math.random()*50)+'%';e.style.animationDelay=(i*0.12)+'s';sp.appendChild(e);quitar(e)}}}
function mover(d){var f=$('fil'),x=f.scrollLeft+d*110;try{f.scrollTo({left:x,behavior:'smooth'})}catch(e){f.scrollLeft=x}}
$('grid').addEventListener('click',function(e){var t=e.target;
while(t&&t!==this&&!(t.getAttribute&&(t.getAttribute('data-id')||t.getAttribute('data-p')!==null)))t=t.parentNode;
if(!t||t===this)return;
var p=t.getAttribute('data-p');
if(p!==null&&p!==undefined){pag=+p;libro=false;grid();return}
sel=+t.getAttribute('data-id');grid();detalle()});
$('det').addEventListener('click',function(e){var t=e.target;
while(t&&t!==this&&!(t.getAttribute&&t.getAttribute('data-c')))t=t.parentNode;
if(!t||t===this)return;emote(t.getAttribute('data-c'))});
$('fil').addEventListener('click',function(e){var t=e.target;if(!t||!t.hasAttribute||!t.hasAttribute('data-f'))return;fil=t.getAttribute('data-f');pag=0;libro=false;filtros();grid()});
$('fl').addEventListener('click',function(){mover(-1)});
$('fr').addEventListener('click',function(){mover(1)});
$('ant').addEventListener('click',function(){if(pag>0){pag--;grid()}});
$('sig').addEventListener('click',function(){if(pag<paginas()-1){pag++;grid()}});
$('lib').addEventListener('click',function(){libro=!libro;grid()});
adornos();cabecera();filtros();grid();detalle();
})();
</script>
</body></html>`;

export function htmlColeccionGeneral(datos) {
  const c = datos.cfg;
  const json = JSON.stringify(datos).replace(/</g, "\\u003c");
  const vars = `body.n{${c.varsN || ""}}body.h{${c.varsH || ""}}`;
  return PLANTILLA
    .replace("__VARS__", () => vars)
    .replace("__TEMA__", datos.halloween ? "h" : "n")
    .replace("__B1__", () => c.bats[0])
    .replace("__B2__", () => c.bats[1])
    .replace("__B3__", () => c.bats[2])
    .replace("__FIRMA__", () => datos.firma)
    .replace("__DATA__", () => json);
}
