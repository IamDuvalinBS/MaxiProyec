const PLANTILLA = String.raw`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{background:#f3ede3;color:#221f33;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:14px;max-width:460px;margin:0 auto}
button{font:inherit;cursor:pointer}
.cab{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.ball{width:46px;height:46px;flex:none;border-radius:50%;border:3px solid #221f33;background:linear-gradient(#ee4455 0 45%,#221f33 45% 55%,#fff 55%);position:relative}
.ball:after{content:"";position:absolute;left:50%;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#fff;border:3px solid #221f33}
.tit{flex:1;min-width:0}
.tit b{display:block;font-size:19px;line-height:1.15;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tit small,.val small{color:#7b7590;font-size:11px}
.val{text-align:right}
.val b{display:block;font-size:15px;color:#c2410c}
.prog{display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:12px;color:#7b7590}
.bar{flex:1;height:8px;border-radius:5px;background:#e3dccd;overflow:hidden}
.bar i{display:block;height:100%;border-radius:5px}
.rar{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.rc{font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;color:#fff;background:var(--c)}
.det{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 16px rgba(34,31,51,.12);margin-bottom:14px}
.hero{padding:16px 14px 12px;text-align:center}
.big{width:128px;height:128px;image-rendering:pixelated;object-fit:contain;filter:drop-shadow(0 6px 6px rgba(0,0,0,.25))}
.sin{display:flex;align-items:center;justify-content:center;font-size:40px;color:#fff;margin:auto}
.hn{font-size:21px;font-weight:800;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,.35);margin-top:4px}
.hs{font-size:12px;color:#fff;opacity:.9;text-shadow:0 1px 3px rgba(0,0,0,.35)}
.tps{display:flex;justify-content:center;gap:6px;margin-top:8px}
.tp{font-size:12px;font-weight:700;color:#fff;padding:3px 11px;border-radius:20px;border:2px solid rgba(255,255,255,.75);text-shadow:0 1px 2px rgba(0,0,0,.4)}
.cu{padding:12px 16px 14px}
.nv{display:flex;justify-content:space-between;font-size:12px;color:#7b7590;margin-bottom:5px}
.nv b{color:#221f33}
.sr{display:grid;grid-template-columns:72px 38px 1fr;align-items:center;gap:8px;margin-top:9px;font-size:13px}
.sr span{color:#7b7590}
.sr b{text-align:right}
.cmd{margin-top:14px;padding:10px 12px;border-radius:12px;background:#f6f2ea;font-size:12px;line-height:1.5;color:#5b5670}
.cmd b{color:#221f33}
.fil{display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:6px}
.ch{flex:none;border:2px solid var(--c,#221f33);background:transparent;color:#221f33;border-radius:20px;padding:4px 11px;font-size:12px;font-weight:700}
.ch.on{background:var(--c,#221f33);color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.45)}
.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}
.t{background:#fff;border-radius:12px;padding:5px 3px 6px;text-align:center;border-bottom:4px solid var(--r);box-shadow:0 2px 6px rgba(34,31,51,.1)}
.t.sel{outline:3px solid #221f33}
.ti{border-radius:50%;width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center}
.sp{width:92%;height:92%;image-rendering:pixelated;object-fit:contain}
.tn{font-size:9.5px;font-weight:700;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tl{font-size:9.5px;color:#7b7590}
.vacio{grid-column:1/-1;text-align:center;color:#7b7590;font-size:13px;padding:18px 0}
.pag{display:flex;align-items:center;justify-content:space-between;margin-top:12px}
.pag button{width:46px;height:34px;border:0;border-radius:10px;background:#221f33;color:#fff;font-size:18px}
.pag button:disabled{opacity:.25}
.pag span{font-size:13px;color:#7b7590}
.pie{margin-top:14px;text-align:center;font-size:11px;color:#9a94ad;line-height:1.6}
</style></head><body>
<div class="cab"><div class="ball"></div><div class="tit"><b id="nom"></b><small>Pokédex personal</small></div><div class="val"><b id="val"></b><small>valor total</small></div></div>
<div class="prog"><div class="bar"><i id="pb" style="background:linear-gradient(90deg,#ee4455,#f59e0b)"></i></div><span id="pt"></span></div>
<div class="rar" id="rar"></div>
<div class="det" id="det"></div>
<div class="fil" id="fil"></div>
<div class="grid" id="grid"></div>
<div class="pag"><button id="ant">‹</button><span id="pg"></span><button id="sig">›</button></div>
<div class="pie" id="pie"></div>
<script>
(function(){
var D=__DATA__;
var TC={normal:'#a8a77a',fire:'#ee8130',water:'#6390f0',electric:'#f0b90b',grass:'#7ac74c',ice:'#6cc5c2',fighting:'#c22e28',poison:'#a33ea1',ground:'#d1a53f',flying:'#a98ff3',psychic:'#f95587',bug:'#a6b91a',rock:'#b6a136',ghost:'#735797',dragon:'#6f35fc',dark:'#705746',steel:'#9a9ab8',fairy:'#d685ad'};
var RC={'Común':'#9aa0a6','Poco común':'#2fa36b','Rara':'#3b82f6','Épica':'#8b5cf6','Legendaria':'#f59e0b'};
var PER=10,fil='',pag=0,sel=D.items.length?D.items[0].id:0;
function $(i){return document.getElementById(i)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function col(t){return TC[t]||'#8a8aa0'}
function rcol(r){return RC[r]||'#ec4899'}
function prim(it){return it.tipos[0]?it.tipos[0].k:''}
function img(it,cls){return it.img?'<img class="'+cls+'" src="'+it.img+'" alt="">':'<div class="'+cls+' sin">?</div>'}
function lista(){if(!fil)return D.items;return D.items.filter(function(it){return it.tipos.some(function(t){return t.k===fil})})}
function buscar(id){for(var i=0;i<D.items.length;i++)if(D.items[i].id===id)return D.items[i];return null}
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
var L=lista(),n=Math.max(1,Math.ceil(L.length/PER)),h='';
if(pag>=n)pag=n-1;
L.slice(pag*PER,pag*PER+PER).forEach(function(it){
h+='<div class="t'+(it.id===sel?' sel':'')+'" data-id="'+it.id+'" style="--r:'+rcol(it.rareza)+'"><div class="ti" style="background:'+col(prim(it))+'33">'+img(it,'sp')+'</div><div class="tn">'+esc(it.nombre)+'</div><div class="tl">Nv. '+it.nivel+(it.estrellas?' ★'+it.estrellas:'')+'</div></div>'});
if(!L.length)h='<div class="vacio">No tienes Pokémon de este tipo en esta parte.</div>';
$('grid').innerHTML=h;$('pg').textContent=(pag+1)+' / '+n;$('ant').disabled=pag<=0;$('sig').disabled=pag>=n-1}
function detalle(){
var it=buscar(sel);if(!it){$('det').innerHTML='';return}
var c1=col(prim(it)),c2=col(it.tipos[1]?it.tipos[1].k:prim(it)),s=it.st,mx={hp:1,atk:1,def:1,spe:1};
D.items.forEach(function(x){for(var k in mx)if(x.st[k]>mx[k])mx[k]=x.st[k]});
var filas=[['hp','PS','#34c38f'],['atk','Ataque','#f0765a'],['def','Defensa','#f5b83d'],['spe','Velocidad','#ec6fb5']].map(function(r){
return '<div class="sr"><span>'+r[1]+'</span><b>'+s[r[0]]+'</b><div class="bar"><i style="width:'+Math.max(4,Math.round(s[r[0]]/mx[r[0]]*100))+'%;background:'+r[2]+'"></i></div></div>'}).join('');
var tps=it.tipos.map(function(t){return '<span class="tp" style="background:'+col(t.k)+'">'+esc(t.n)+'</span>'}).join('')+'<span class="tp" style="background:'+rcol(it.rareza)+'">'+esc(it.rareza)+'</span>';
$('det').innerHTML='<div class="hero" style="background:linear-gradient(150deg,'+c1+','+c2+')">'+img(it,'big')+'<div class="hn">'+esc(it.nombre)+(it.estrellas?' '+new Array(it.estrellas+1).join('★'):'')+'</div><div class="hs">N.º '+it.dex+' en la Pokédex · ID #'+it.id+'</div><div class="tps">'+tps+'</div></div>'+
'<div class="cu"><div class="nv"><span>Nivel</span><span><b>'+it.nivel+'</b> / '+it.max+'</span></div><div class="bar"><i style="width:'+Math.min(100,Math.round(it.nivel/it.max*100))+'%;background:linear-gradient(90deg,#6390f0,#8b5cf6)"></i></div>'+filas+
'<div class="cmd">Súbelo de nivel: <b>.pokecomida #'+it.id+'</b><br>Arma tu equipo: <b>.equipo pokemon</b> · <b>.poderes pokemon</b></div></div>'}
$('grid').addEventListener('click',function(e){var t=e.target;while(t&&t!==this&&!t.getAttribute('data-id'))t=t.parentNode;if(!t||t===this)return;sel=+t.getAttribute('data-id');grid();detalle();try{$('det').scrollIntoView({behavior:'smooth',block:'start'})}catch(x){}});
$('fil').addEventListener('click',function(e){var t=e.target;if(!t||!t.hasAttribute||!t.hasAttribute('data-f'))return;fil=t.getAttribute('data-f');pag=0;filtros();grid()});
$('ant').addEventListener('click',function(){if(pag>0){pag--;grid()}});
$('sig').addEventListener('click',function(){pag++;grid()});
cabecera();filtros();grid();detalle();
})();
</script>
</body></html>`;

export function htmlPokedex(datos) {
  const json = JSON.stringify(datos).replace(/</g, "\\u003c");
  return PLANTILLA.replace("__FIRMA__", () => datos.firma).replace("__DATA__", () => json);
}
