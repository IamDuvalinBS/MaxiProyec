const PLANTILLA = String.raw`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html{background:#d4e8ff;overflow-x:hidden}
body{background:#d4e8ff;color:#1c2540;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:13px;padding:12px;overflow-x:hidden;overscroll-behavior:none}
button{font:inherit;cursor:pointer;border:0}
small{color:#62708f;font-size:11px}
.cab{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.ball{width:38px;height:38px;flex:none;border-radius:50%;border:3px solid #1c2540;background:linear-gradient(#ee4455 0 45%,#1c2540 45% 55%,#fff 55%);position:relative}
.ball:after{content:"";position:absolute;left:50%;top:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:#fff;border:3px solid #1c2540}
.tit{flex:1;min-width:0}
.tit b{display:block;font-size:18px;line-height:1.15;overflow-wrap:anywhere}
.res{display:flex;justify-content:space-between;align-items:flex-end;gap:8px;margin-bottom:6px}
.res b{display:block;font-size:15px}
.res .v b{color:#c2410c}
.res .d{text-align:right}
.bar{height:8px;border-radius:5px;background:#b9d3f2;overflow:hidden}
.bar i{display:block;height:100%;border-radius:5px}
.rar{display:flex;flex-wrap:wrap;gap:5px;margin:10px 0 12px}
.rc{font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;color:#fff;background:var(--c)}
.det{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 16px rgba(28,37,64,.15);margin-bottom:12px}
.hero{position:relative;padding:14px 10px 12px;text-align:center}
.spw{position:relative;display:inline-block}
.spw.reb{animation:reb .55s ease}
.big{display:block;width:112px;height:112px;image-rendering:pixelated;object-fit:contain;filter:drop-shadow(0 6px 6px rgba(0,0,0,.25));animation:flot 3s ease-in-out infinite}
.sin{display:flex;align-items:center;justify-content:center;font-size:36px;color:#fff}
.fl{position:absolute;bottom:45%;font-size:18px;pointer-events:none;animation:sube 1.2s ease-out forwards}
.bub{position:absolute;top:8px;right:8px;max-width:62%;background:#fff;color:#1c2540;font-size:12px;font-weight:700;padding:5px 9px;border-radius:12px;opacity:0;transform:scale(.8);transition:all .2s}
.bub.on{opacity:1;transform:none}
.hn{font-size:20px;font-weight:800;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.35);margin-top:4px;line-height:1.15;overflow-wrap:anywhere}
.hs{font-size:11.5px;color:#fff;opacity:.92;text-shadow:0 1px 3px rgba(0,0,0,.35);margin-top:2px}
.tps{display:flex;flex-wrap:wrap;justify-content:center;align-content:flex-start;gap:5px;margin-top:8px;min-height:54px}
.tp{font-size:11.5px;font-weight:700;color:#fff;padding:3px 10px;border-radius:20px;border:2px solid rgba(255,255,255,.75);text-shadow:0 1px 2px rgba(0,0,0,.4);height:fit-content}
.cu{padding:12px 14px 14px}
.nv{display:flex;justify-content:space-between;font-size:12px;color:#62708f;margin-bottom:5px}
.nv b{color:#1c2540}
.sr{display:grid;grid-template-columns:62px 34px minmax(0,1fr);align-items:center;gap:8px;margin-top:8px}
.sr span{color:#62708f}
.sr b{text-align:right}
.feed{margin-top:14px;padding:10px;border-radius:14px;background:#eef5ff;text-align:center}
.ft{font-weight:800;font-size:13px}
.fb{display:flex;justify-content:center;gap:10px;margin:8px 0 6px}
.fb button{width:46px;height:46px;border-radius:50%;background:#fff;font-size:22px;box-shadow:0 2px 6px rgba(28,37,64,.18)}
.fb button:active{transform:scale(.9)}
.hr{font-size:15px;letter-spacing:2px;min-height:20px}
.cmd{margin-top:10px;padding:9px 11px;border-radius:12px;background:#eef5ff;font-size:11.5px;line-height:1.5;color:#4a5878}
.cmd b{color:#1c2540}
.frow{display:flex;align-items:center;gap:6px;margin-bottom:10px}
.mv{flex:none;width:30px;height:30px;border-radius:50%;background:#1c2540;color:#fff;font-size:17px;line-height:1}
.fil{flex:1;min-width:0;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px}
.fil::-webkit-scrollbar{display:none}
.ch{flex:none;border:2px solid var(--c,#1c2540);background:#fff;color:#1c2540;border-radius:20px;padding:4px 11px;font-size:12px;font-weight:700}
.ch.on{background:var(--c,#1c2540);color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.45)}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.t{min-width:0;background:#fff;border-radius:14px;padding:6px 5px 7px;text-align:center;border-bottom:4px solid var(--r);box-shadow:0 2px 6px rgba(28,37,64,.12);cursor:pointer}
.t.sel{outline:3px solid #1c2540}
.t.e{visibility:hidden}
.ti{border-radius:50%;width:100%;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center}
.sp{width:90%;height:90%;image-rendering:pixelated;object-fit:contain}
.pn{font-size:24px;font-weight:800;color:#1c2540}
.tn{min-height:2.5em;display:flex;align-items:center;justify-content:center;font-size:10.5px;font-weight:700;line-height:1.2;overflow-wrap:anywhere;margin-top:3px}
.tl{font-size:10px;color:#62708f}
.pag{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:12px}
.pag .fl2{width:44px;height:34px;border-radius:10px;background:#1c2540;color:#fff;font-size:18px}
.pag .fl2:disabled{opacity:.25}
.lib{flex:1;height:34px;border-radius:17px;background:rgba(255,255,255,.65);color:#1c2540;font-size:13px;font-weight:700;border:2px solid transparent}
.lib.on{background:#fff;border-color:#1c2540}
.pie{margin-top:12px;text-align:center;font-size:11px;color:#62708f;line-height:1.6;min-height:36px}
@keyframes flot{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes reb{0%{transform:scale(1)}30%{transform:scale(1.18,.86)}60%{transform:scale(.92,1.12)}100%{transform:scale(1)}}
@keyframes sube{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-70px)}}
</style></head><body>
<div class="cab"><div class="ball"></div><div class="tit"><b id="nom"></b><small>Pokédex personal</small></div></div>
<div class="res"><div class="v"><small>Valor total</small><b id="val"></b></div><div class="d"><small>Registrados</small><b id="pt"></b></div></div>
<div class="bar"><i id="pb" style="background:linear-gradient(90deg,#ee4455,#f59e0b)"></i></div>
<div class="rar" id="rar"></div>
<div class="det" id="det"></div>
<div class="frow"><button class="mv" id="fl">‹</button><div class="fil" id="fil"></div><button class="mv" id="fr">›</button></div>
<div class="grid" id="grid"></div>
<div class="pag"><button class="fl2" id="ant">‹</button><button class="lib" id="lib">📖 <span id="pg"></span></button><button class="fl2" id="sig">›</button></div>
<div class="pie" id="pie"></div>
<script>
(function(){
var D=__DATA__;
var TC={normal:'#a8a77a',fire:'#ee8130',water:'#6390f0',electric:'#f0b90b',grass:'#7ac74c',ice:'#6cc5c2',fighting:'#c22e28',poison:'#a33ea1',ground:'#d1a53f',flying:'#a98ff3',psychic:'#f95587',bug:'#a6b91a',rock:'#b6a136',ghost:'#735797',dragon:'#6f35fc',dark:'#705746',steel:'#9a9ab8',fairy:'#d685ad'};
var RC={'Común':'#9aa0a6','Poco común':'#2fa36b','Rara':'#3b82f6','Épica':'#8b5cf6','Legendaria':'#f59e0b'};
var FRASES=['¡Ñam! 😋','¡Qué rico!','¡Más, por favor!','Mmm… delicioso','¡Gracias, entrenador!'];
var PER=9,fil='',pag=0,libro=false,BOC={},tb=0,sel=D.items.length?D.items[0].id:0;
function $(i){return document.getElementById(i)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function col(t){return TC[t]||'#8a8aa0'}
function rcol(r){return RC[r]||'#ec4899'}
function prim(it){return it&&it.tipos[0]?it.tipos[0].k:''}
function img(it,cls){return it.img?'<img class="'+cls+'" src="'+it.img+'" alt="">':'<div class="'+cls+' sin">?</div>'}
function lista(){if(!fil)return D.items;return D.items.filter(function(it){return it.tipos.some(function(t){return t.k===fil})})}
function buscar(id){for(var i=0;i<D.items.length;i++)if(D.items[i].id===id)return D.items[i];return null}
function paginas(){return Math.max(1,Math.ceil(lista().length/PER))}
function gpag(p){return (D.parte-1)*Math.ceil(D.porParte/PER)+p+1}
function vacios(h,n){for(;n<PER;n++)h+='<div class="t e"><div class="ti"></div><div class="tn"></div><div class="tl">.</div></div>';return h}
function cabecera(){
$('nom').textContent=D.nombre;$('val').textContent=D.valorTxt;
$('pb').style.width=Math.max(2,Math.round(D.n/D.totalDex*100))+'%';
$('pt').textContent=D.n+' / '+D.totalDex;
$('rar').innerHTML=D.rarezas.map(function(r){return '<span class="rc" style="--c:'+rcol(r.n)+'">'+esc(r.n)+' '+r.c+'</span>'}).join('');
$('pie').innerHTML=(D.partes>1?'Parte '+D.parte+' de '+D.partes+' · usa <b>.mispokemon '+(D.parte%D.partes+1)+'</b> para ver otra<br>':'')+'__FIRMA__'}
function filtros(){
var c={},k,h='<button class="ch'+(fil?'':' on')+'" data-f="">Todos '+D.items.length+'</button>';
D.items.forEach(function(it){it.tipos.forEach(function(t){if(!c[t.k])c[t.k]={n:t.n,c:0};c[t.k].c++})});
for(k in c)h+='<button class="ch'+(fil===k?' on':'')+'" data-f="'+k+'" style="--c:'+col(k)+'">'+esc(c[k].n)+' '+c[k].c+'</button>';
$('fil').innerHTML=h}
function grid(){
var L=lista(),n=paginas(),h='',i,p,it,c;
if(pag>=n)pag=n-1;
if(libro){
for(p=0;p<n;p++){it=L[p*PER];c=Math.min(PER,L.length-p*PER);
h+='<div class="t'+(p===pag?' sel':'')+'" data-p="'+p+'" style="--r:#6b7fd7"><div class="ti" style="background:'+col(prim(it))+'33"><span class="pn">'+(fil?p+1:gpag(p))+'</span></div><div class="tn">'+c+(c===1?' Pokémon':' Pokémon')+'</div><div class="tl">página</div></div>'}
h=vacios(h,n)}
else{
var vis=L.slice(pag*PER,pag*PER+PER);
vis.forEach(function(it){
h+='<div class="t'+(it.id===sel?' sel':'')+'" data-id="'+it.id+'" style="--r:'+rcol(it.rareza)+'"><div class="ti" style="background:'+col(prim(it))+'33">'+img(it,'sp')+'</div><div class="tn">'+esc(it.nombre)+'</div><div class="tl">Nv. '+it.nivel+(it.estrellas?' ★'+it.estrellas:'')+'</div></div>'});
h=vacios(h,vis.length)}
$('grid').innerHTML=h;
$('pg').textContent=libro?'Elegir página':'Pág. '+(fil?pag+1:gpag(pag))+' / '+(fil?n:Math.max(1,Math.ceil(D.n/PER)));
$('lib').className='lib'+(libro?' on':'');
$('ant').disabled=pag<=0;$('sig').disabled=pag>=n-1}
function corazones(id){var n=Math.min(5,BOC[id]||0),h='',i;for(i=0;i<5;i++)h+=i<n?'❤️':'🤍';return h}
function detalle(){
var it=buscar(sel);if(!it){$('det').innerHTML='';return}
var c1=col(prim(it)),c2=col(it.tipos[1]?it.tipos[1].k:prim(it)),s=it.st,mx={hp:1,atk:1,def:1,spe:1};
D.items.forEach(function(x){for(var k in mx)if(x.st[k]>mx[k])mx[k]=x.st[k]});
var filas=[['hp','PS','#34c38f'],['atk','Ataque','#f0765a'],['def','Defensa','#f5b83d'],['spe','Velocidad','#ec6fb5']].map(function(r){
return '<div class="sr"><span>'+r[1]+'</span><b>'+s[r[0]]+'</b><div class="bar"><i style="width:'+Math.max(4,Math.round(s[r[0]]/mx[r[0]]*100))+'%;background:'+r[2]+'"></i></div></div>'}).join('');
var tps=it.tipos.map(function(t){return '<span class="tp" style="background:'+col(t.k)+'">'+esc(t.n)+'</span>'}).join('')+'<span class="tp" style="background:'+rcol(it.rareza)+'">'+esc(it.rareza)+'</span>';
$('det').innerHTML='<div class="hero" style="background:linear-gradient(150deg,'+c1+','+c2+')"><div class="bub" id="bub"></div><div class="spw" id="spw">'+img(it,'big')+'</div><div class="hn">'+esc(it.nombre)+(it.estrellas?' '+new Array(it.estrellas+1).join('★'):'')+'</div><div class="hs">N.º '+it.dex+' en la Pokédex · ID #'+it.id+'</div><div class="tps">'+tps+'</div></div>'+
'<div class="cu"><div class="nv"><span>Nivel</span><span><b>'+it.nivel+'</b> / '+it.max+'</span></div><div class="bar"><i style="width:'+Math.min(100,Math.round(it.nivel/it.max*100))+'%;background:linear-gradient(90deg,#6390f0,#8b5cf6)"></i></div>'+filas+
'<div class="feed"><div class="ft">🍽️ Darle de comer <small>(solo visual)</small></div><div class="fb"><button data-c="🍎">🍎</button><button data-c="🍖">🍖</button><button data-c="🍰">🍰</button></div><div class="hr" id="hr">'+corazones(it.id)+'</div></div>'+
'<div class="cmd">Súbelo de nivel de verdad: <b>.pokecomida #'+it.id+'</b><br>Arma tu equipo: <b>.equipo pokemon</b> · <b>.poderes pokemon</b></div></div>'}
function quitar(e){setTimeout(function(){if(e.parentNode)e.parentNode.removeChild(e)},1500)}
function alimentar(c){
var it=buscar(sel);if(!it)return;
BOC[it.id]=(BOC[it.id]||0)+1;
var n=BOC[it.id],sp=$('spw'),b=$('bub'),hr=$('hr'),i,e;
if(hr)hr.textContent=corazones(it.id);
if(b){b.textContent=n>=5?'Estoy lleno y feliz 💖':FRASES[n%FRASES.length];b.className='bub on';clearTimeout(tb);tb=setTimeout(function(){b.className='bub'},1600)}
if(sp){sp.className='spw';void sp.offsetWidth;sp.className='spw reb';
for(i=0;i<3;i++){e=document.createElement('span');e.className='fl';e.textContent=i===1?c:(i?'✨':'💖');e.style.left=(25+Math.random()*50)+'%';e.style.animationDelay=(i*0.12)+'s';sp.appendChild(e);quitar(e)}}}
function mover(d){var f=$('fil'),x=f.scrollLeft+d*110;try{f.scrollTo({left:x,behavior:'smooth'})}catch(e){f.scrollLeft=x}}
$('grid').addEventListener('click',function(e){var t=e.target;
while(t&&t!==this&&!(t.getAttribute&&(t.getAttribute('data-id')||t.getAttribute('data-p')!==null)))t=t.parentNode;
if(!t||t===this)return;
var p=t.getAttribute('data-p');
if(p!==null&&p!==undefined){pag=+p;libro=false;grid();return}
sel=+t.getAttribute('data-id');grid();detalle()});
$('det').addEventListener('click',function(e){var t=e.target;
while(t&&t!==this&&!(t.getAttribute&&t.getAttribute('data-c')))t=t.parentNode;
if(!t||t===this)return;alimentar(t.getAttribute('data-c'))});
$('fil').addEventListener('click',function(e){var t=e.target;if(!t||!t.hasAttribute||!t.hasAttribute('data-f'))return;fil=t.getAttribute('data-f');pag=0;libro=false;filtros();grid()});
$('fl').addEventListener('click',function(){mover(-1)});
$('fr').addEventListener('click',function(){mover(1)});
$('ant').addEventListener('click',function(){if(pag>0){pag--;grid()}});
$('sig').addEventListener('click',function(){if(pag<paginas()-1){pag++;grid()}});
$('lib').addEventListener('click',function(){libro=!libro;grid()});
cabecera();filtros();grid();detalle();
})();
</script>
</body></html>`;

export function htmlPokedex(datos) {
  const json = JSON.stringify(datos).replace(/</g, "\\u003c");
  return PLANTILLA.replace("__FIRMA__", () => datos.firma).replace("__DATA__", () => json);
}
