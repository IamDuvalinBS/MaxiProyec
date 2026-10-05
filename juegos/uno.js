import { config } from "../motores/db.js";

const GAME_HTML = String.raw`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
html,body{margin:0;padding:0;background:#0c0a18;color:#fff;font-family:Roboto,Arial,sans-serif;touch-action:manipulation;overscroll-behavior:none}
#root{max-width:520px;margin:0 auto;padding:12px;position:relative}
.panel{padding:14px;background:linear-gradient(160deg,#241046,#0d0a1c);border:2px solid #ff4fa3;border-radius:22px;box-shadow:0 0 30px rgba(255,79,163,.18)}
.brand{font-size:9px;letter-spacing:3px;color:#ff4fa3;text-transform:uppercase}
.ttl{font-size:26px;font-weight:900;margin-top:2px}
.top{display:flex;align-items:center;justify-content:space-between}
.sbtn{padding:8px 12px;border-radius:11px;border:1px solid #ff4fa3;background:rgba(255,79,163,.1);color:#ff4fa3;font-size:11px;font-weight:900;letter-spacing:1px;font-family:inherit;cursor:pointer}
.hero{text-align:center;margin:14px 0 6px}
.logo{display:inline-block;background:#e53935;color:#ffe66d;font-weight:900;font-size:40px;font-style:italic;padding:6px 22px;border-radius:50%;border:4px solid #fff;transform:rotate(-8deg);text-shadow:2px 2px 0 #000;letter-spacing:2px}
.lab{font-size:11px;letter-spacing:2px;color:#b9a6d9;font-weight:700;margin:16px 2px 8px}
.row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.opt{padding:14px 4px;border-radius:14px;border:1px solid #3a2a63;background:#1a1236;color:#fff;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;text-align:center}
.opt small{display:block;font-weight:400;font-size:10px;opacity:.65;margin-top:3px}
.opt.on{border-color:#ff4fa3;background:rgba(255,79,163,.16);box-shadow:0 0 0 1px #ff4fa3 inset}
.tog{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px;border-radius:14px;border:1px solid #3a2a63;background:#1a1236;cursor:pointer;font-size:13px}
.tog small{display:block;font-size:10px;opacity:.65;margin-top:2px;font-weight:400}
.sw{width:42px;height:24px;border-radius:12px;background:#3a2a63;position:relative;flex:0 0 auto}
.sw:after{content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .15s}
.tog.on .sw{background:#ff4fa3}.tog.on .sw:after{transform:translateX(18px)}
.go{width:100%;margin-top:14px;padding:15px;border-radius:14px;border:0;background:linear-gradient(90deg,#ff4fa3,#ff8a3d);color:#fff;font-size:15px;font-weight:900;letter-spacing:1px;font-family:inherit;cursor:pointer}
.go:active{transform:scale(.98)}
.stat{text-align:center;font-size:11px;color:#ffe66d;margin-top:12px}
.opps{display:flex;gap:8px;justify-content:center;margin:10px 0 6px}
.opp{flex:1;min-width:0;max-width:150px;text-align:center;padding:8px 4px;border-radius:14px;border:2px solid transparent;background:rgba(255,255,255,.06)}
.opp.act{border-color:#ffe66d;box-shadow:0 0 14px rgba(255,230,109,.35)}
.opp .av{font-size:24px;line-height:1}
.opp .nm{font-size:11px;font-weight:700;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.opp .cn{display:inline-block;min-width:22px;padding:1px 7px;border-radius:9px;background:#ff4fa3;font-size:12px;font-weight:900;margin-top:3px}
.opp .mini{display:flex;justify-content:center;margin-top:5px;height:16px}
.opp .mini i{width:11px;height:16px;border-radius:3px;background:#1a1a1a;border:1px solid #fff;margin-left:-5px;flex:0 0 auto}
.opp .mini i:first-child{margin-left:0}
.table{display:flex;align-items:center;justify-content:center;gap:18px;margin:10px 0 4px;position:relative}
.pile{position:relative;cursor:pointer}
.pile .badge{position:absolute;right:-8px;top:-8px;min-width:22px;padding:2px 6px;border-radius:10px;background:#ff4fa3;font-size:11px;font-weight:900;text-align:center;z-index:3}
.hint{animation:pul 1s infinite}
@keyframes pul{50%{box-shadow:0 0 0 4px #ffe66d,0 0 18px #ffe66d}}
.mid{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:46px}
.col{width:34px;height:34px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 14px currentColor}
.dir{font-size:20px;opacity:.8}
.pend{position:absolute;left:50%;top:-14px;transform:translateX(-50%);background:#ffe66d;color:#222;font-weight:900;font-size:11px;padding:2px 8px;border-radius:9px;white-space:nowrap;z-index:4}
.msg{text-align:center;font-size:12px;color:#ffd1ea;min-height:32px;margin:8px 4px;line-height:1.4}
.hand{display:flex;align-items:flex-end;overflow-x:auto;padding:16px 8px 6px;min-height:118px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.hand::-webkit-scrollbar{display:none}
.cd{width:58px;height:86px;border-radius:9px;border:3px solid #fff;position:relative;flex:0 0 auto;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.55);background:var(--c);transition:transform .12s}
.cd:before{content:"";position:absolute;width:76%;height:64%;background:#fff;border-radius:50%;transform:rotate(-24deg)}
.cd b{position:relative;z-index:1;font-size:26px;font-weight:900;color:var(--c);font-style:italic;white-space:nowrap}
.cd .tl,.cd .br{position:absolute;font-size:11px;font-weight:900;font-style:normal;color:#fff;text-shadow:0 1px 1px rgba(0,0,0,.5);z-index:1}
.cd .tl{left:4px;top:2px}.cd .br{right:4px;bottom:2px;transform:rotate(180deg)}
.c-r{--c:#e53935}.c-y{--c:#f6b800}.c-g{--c:#2e9e4a}.c-b{--c:#1e7be0}
.c-k{background:conic-gradient(#e53935 0 25%,#f6b800 0 50%,#2e9e4a 0 75%,#1e7be0 0);--c:#222}
.c-n{--c:#1a1a1a}.c-n:before{background:#e53935}.c-n b{color:#ffe66d;font-size:16px;transform:rotate(-24deg)}
.lg{width:80px;height:118px;border-radius:12px}.lg b{font-size:38px}.lg .tl,.lg .br{font-size:14px}
.hand .cd{cursor:pointer}
.hand .cd.no{opacity:.5;filter:saturate(.6)}
.hand .cd.ok{transform:translateY(-12px);box-shadow:0 0 0 2px #ffe66d,0 4px 12px rgba(0,0,0,.6)}
.hand .cd:active{transform:translateY(-18px) scale(1.04)}
.acts{display:flex;gap:8px;justify-content:center;margin-top:8px}
.ab{flex:1;max-width:200px;padding:13px 8px;border-radius:13px;border:1px solid #ff4fa3;background:rgba(255,79,163,.1);color:#ff4fa3;font-size:14px;font-weight:900;letter-spacing:1px;font-family:inherit;cursor:pointer}
.ab.uno.on{background:#e53935;border-color:#fff;color:#ffe66d;box-shadow:0 0 16px #e53935}
.ab:active{transform:scale(.97)}
.foot{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 0 2px;font-size:11px;color:#b98aa6}
.ov{position:absolute;inset:0;display:none;align-items:center;justify-content:center;padding:22px;background:rgba(12,10,24,.92);z-index:50}
.ov.show{display:flex}
.md{width:100%;max-width:320px;text-align:center;background:#241046;border:2px solid #ff4fa3;border-radius:20px;padding:22px;box-shadow:0 0 35px rgba(255,79,163,.3)}
.mt{font-size:24px;font-weight:900;color:#ff4fa3}
.mx{font-size:13px;color:rgba(255,255,255,.75);margin:8px 0 14px;line-height:1.6}
.mb{width:100%;padding:12px;margin-top:7px;border-radius:12px;border:1px solid #ff4fa3;background:rgba(255,79,163,.1);color:#ff4fa3;font-weight:900;font-size:13px;cursor:pointer;font-family:inherit}
.cp{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px}
.cp button{height:70px;border-radius:14px;border:3px solid #fff;font-size:15px;font-weight:900;color:#fff;cursor:pointer;font-family:inherit}
.hide{display:none!important}
</style>
</head>
<body>
<div id="root">
<div class="panel">
<div class="top"><div><div class="brand">MAXIPROYEC · CARD LAB</div><div class="ttl">🃏 UNO</div></div><button id="bMenu" class="sbtn hide">MENÚ</button></div>

<div id="scSet">
<div class="hero"><span class="logo">UNO</span></div>
<div class="lab">OPONENTES</div>
<div class="row" id="nOpt">
<button class="opt" data-n="1">1<small>Duelo</small></button>
<button class="opt on" data-n="2">2<small>Clásico</small></button>
<button class="opt" data-n="3">3<small>Caos</small></button>
</div>
<div class="lab">REGLAS</div>
<div class="tog on" id="tStack"><div>Acumular +2 y +4<small>Responde con otro +2 / +4 para pasar el castigo</small></div><div class="sw"></div></div>
<button id="bGo" class="go">▶ JUGAR</button>
<div id="stat" class="stat"></div>
</div>

<div id="scGame" class="hide">
<div id="opps" class="opps"></div>
<div class="table">
<div class="pile" id="pDraw"><div class="cd c-n lg" id="dCard"><b>UNO</b></div><span class="badge" id="dCnt">0</span></div>
<div class="mid"><div id="dir" class="dir">↻</div><div id="colr" class="col"></div></div>
<div class="pile" style="cursor:default"><div id="tCard" class="cd lg c-r"><i class="tl"></i><b></b><i class="br"></i></div><span id="pend" class="pend hide"></span></div>
</div>
<div id="msg" class="msg"></div>
<div id="hand" class="hand"></div>
<div class="acts"><button id="bUno" class="ab uno">¡UNO!</button><button id="bPass" class="ab hide">PASAR</button></div>
</div>
</div>
<div class="foot"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6.7"/><path d="M8 7v4.2M8 4.7v.1" stroke-linecap="round"/></svg>Powered by __FIRMA__</div>

<div id="ovCol" class="ov"><div class="md"><div class="mt">Elige un color</div><div class="cp">
<button data-c="r" style="background:#e53935">ROJO</button><button data-c="y" style="background:#f6b800">AMARILLO</button><button data-c="g" style="background:#2e9e4a">VERDE</button><button data-c="b" style="background:#1e7be0">AZUL</button></div></div></div>
<div id="ovEnd" class="ov"><div class="md"><div id="mT" class="mt">FIN</div><div id="mX" class="mx"></div><button id="mAgain" class="mb">▶ JUGAR DE NUEVO</button><button id="mMenu" class="mb">☰ MENÚ</button></div></div>
</div>
<script>
function UnoCore(){
var COLORS=['r','y','g','b'],S={};
function shuffle(a){var i,j,t;for(i=a.length-1;i>0;i--){j=Math.floor(Math.random()*(i+1));t=a[i];a[i]=a[j];a[j]=t}return a}
function mkDeck(){var d=[],ci,c,v,k,vs=['1','2','3','4','5','6','7','8','9','S','R','D'];
 for(ci=0;ci<4;ci++){c=COLORS[ci];d.push({c:c,v:'0'});for(k=0;k<vs.length;k++){d.push({c:c,v:vs[k]});d.push({c:c,v:vs[k]})}}
 for(k=0;k<4;k++){d.push({c:'k',v:'W'});d.push({c:'k',v:'F'})}
 return shuffle(d)}
function norm(i){return((i%S.n)+S.n)%S.n}
function nextP(k){return norm(S.cur+S.dir*(k||1))}
function advance(k){S.cur=norm(S.cur+S.dir*(k||1));S.drawn=-1}
function refill(){if(S.deck.length>0||S.disc.length<=1)return;var top=S.disc.pop();S.deck=shuffle(S.disc);S.disc=[top]}
function drawCards(p,k){var out=[],c;while(k-->0){refill();if(!S.deck.length)break;c=S.deck.pop();S.hands[p].push(c);out.push(c)}return out}
function init(n,stack){var i,c;S={n:n,stack:!!stack,deck:mkDeck(),disc:[],hands:[],cur:0,dir:1,color:'r',topV:'0',pend:0,pendT:'',drawn:-1,winner:-1};
 for(i=0;i<n;i++)S.hands.push([]);
 for(i=0;i<7;i++){for(var p=0;p<n;p++)S.hands[p].push(S.deck.pop())}
 do{c=S.deck.pop();if(c.c==='k'||'SRD'.indexOf(c.v)>=0){S.deck.unshift(c);c=null}}while(!c);
 S.disc.push(c);S.color=c.c;S.topV=c.v;return S}
function canPlay(c){if(S.pend>0)return c.v===S.pendT;return c.c==='k'||c.c===S.color||c.v===S.topV}
function playable(p){var h=S.hands[p],o=[],i;for(i=0;i<h.length;i++){if(S.drawn>=0&&p===S.cur&&i!==S.drawn)continue;if(canPlay(h[i]))o.push(i)}return o}
function play(p,i,col){var c=S.hands[p].splice(i,1)[0],ev={p:p,c:c,victim:-1,cnt:0},q;
 S.disc.push(c);S.color=c.c==='k'?col:c.c;S.topV=c.v;
 if(!S.hands[p].length){S.winner=p;S.drawn=-1;return ev}
 switch(c.v){
  case'S':advance(2);break;
  case'R':S.dir=-S.dir;advance(S.n===2?2:1);break;
  case'D':case'F':var k=c.v==='D'?2:4;
   if(S.stack){S.pend+=k;S.pendT=c.v;advance(1)}else{q=nextP(1);drawCards(q,k);ev.victim=q;ev.cnt=k;advance(2)}break;
  default:advance(1)}
 return ev}
function drawTurn(p){var r={cards:[],playable:false,forced:0};
 if(S.pend>0){r.forced=S.pend;r.cards=drawCards(p,S.pend);S.pend=0;S.pendT='';advance(1);return r}
 r.cards=drawCards(p,1);
 if(r.cards.length&&canPlay(r.cards[0])){S.drawn=S.hands[p].length-1;r.playable=true}else advance(1);
 return r}
function pass(){advance(1)}
function pts(c){return'SRD'.indexOf(c.v)>=0?20:c.c==='k'?50:+c.v}
function score(w){var t=0,p,i;for(p=0;p<S.n;p++)if(p!==w)for(i=0;i<S.hands[p].length;i++)t+=pts(S.hands[p][i]);return t}
function botChoose(p){var h=S.hands[p],pl=playable(p),i,j,c,sc,best=-1e9,bi=-1,cnt={r:0,y:0,g:0,b:0},nx=S.hands[nextP(1)].length;
 if(!pl.length)return null;
 for(i=0;i<h.length;i++)if(h[i].c!=='k')cnt[h[i].c]++;
 for(j=0;j<pl.length;j++){i=pl[j];c=h[i];sc=Math.random()*2;
  if(c.c==='k'){sc+=pl.length===1?6:-8;if(nx<=2)sc+=14;if(h.length<=2)sc+=4}
  else{sc+=5+cnt[c.c]*.8;if('SRD'.indexOf(c.v)>=0)sc+=nx<=2?12:(S.pend>0?20:3);if(c.v!==S.topV)sc+=0;if(/\d/.test(c.v))sc+=(+c.v)*.25}
  if(S.pend>0)sc+=20;
  if(sc>best){best=sc;bi=i}}
 var col='r',bc=-1,k;for(k in cnt)if(cnt[k]>bc||(cnt[k]===bc&&Math.random()<.5)){bc=cnt[k];col=k}
 if(bc<=0)col=COLORS[Math.floor(Math.random()*4)];
 return{i:bi,col:col}}
return{init:init,S:function(){return S},canPlay:canPlay,playable:playable,play:play,drawTurn:drawTurn,pass:pass,botChoose:botChoose,score:score,mkDeck:mkDeck,drawCards:drawCards}}


(function(){
"use strict";
var U=UnoCore(),S=null,$=function(i){return document.getElementById(i)};
var NAMES=['Luna','Zorro','Panda'],AVS=['🌙','🦊','🐼'],CN={r:'rojo',y:'amarillo',g:'verde',b:'azul'},CE={r:'🟥',y:'🟨',g:'🟩',b:'🟦'},CH={r:'#e53935',y:'#f6b800',g:'#2e9e4a',b:'#1e7be0'};
var KEY='mp_uno_stats',mem=null,nOpp=2,stack=true,uno=false,busy=false,gen=0,pendIdx=-1,oppKey='';
function ldS(){try{var s=JSON.parse(localStorage.getItem(KEY));if(s&&typeof s.w==='number')return s}catch(e){}return mem||{w:0,l:0,p:0}}
function svS(s){mem=s;try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}
function sym(c){var v=c.v;return v==='S'?'⊘':v==='R'?'⇄':v==='D'?'+2':v==='F'?'+4':v==='W'?'★':v}
function txt(c){return(c.c==='k'?'🎨 ':CE[c.c]+' ')+(c.v==='W'?'Comodín':c.v==='F'?'+4':sym(c))}
function cardH(c,i,cls,st){var s=sym(c);return'<div class="cd c-'+c.c+(cls?' '+cls:'')+'" data-i="'+i+'"'+(st?' style="'+st+'"':'')+'><i class="tl">'+s+'</i><b>'+s+'</b><i class="br">'+s+'</i></div>'}
function stats(){var s=ldS();$('stat').textContent='🏆 '+s.w+' victorias · 💀 '+s.l+' derrotas · ⭐ '+s.p+' puntos'}
function menu(){gen++;busy=false;$('ovEnd').className='ov';$('ovCol').className='ov';$('scSet').className='';$('scGame').className='hide';$('bMenu').className='sbtn hide';stats()}
$('nOpt').addEventListener('click',function(e){var b=e.target;while(b&&b!==this&&!b.getAttribute('data-n'))b=b.parentNode;if(!b||b===this)return;nOpp=+b.getAttribute('data-n');var k=this.children,i;for(i=0;i<k.length;i++)k[i].className='opt'+(k[i]===b?' on':'')});
$('tStack').addEventListener('click',function(){stack=!stack;this.className='tog'+(stack?' on':'')});
$('bGo').addEventListener('click',start);$('mAgain').addEventListener('click',start);$('mMenu').addEventListener('click',menu);$('bMenu').addEventListener('click',menu);
function start(){gen++;uno=false;busy=false;pendIdx=-1;oppKey='';S=U.init(nOpp+1,stack);$('ovEnd').className='ov';$('ovCol').className='ov';$('scSet').className='hide';$('scGame').className='';$('bMenu').className='sbtn';
 $('msg').textContent='¡Reparto listo! Tienes 7 cartas.';render();loop()}
function render(){var h=S.hands[0],me=S.cur===0&&S.winner<0&&!busy,pl=me?U.playable(0):[],i,o='',top=S.disc[S.disc.length-1],avail=$('hand').clientWidth-24,step=h.length>1?Math.max(24,Math.min(62,(avail-58)/(h.length-1))):62;
 var ok={};for(i=0;i<pl.length;i++)ok[pl[i]]=1;
 for(i=0;i<h.length;i++)o+=cardH(h[i],i,me?(ok[i]?'ok':'no'):'',i?'margin-left:'+(step-58)+'px':'');
 $('hand').innerHTML=o;
 var ok2=oppKey,k='';for(i=1;i<S.n;i++)k+=i+':'+S.hands[i].length+':'+(S.cur===i?1:0)+'|';
 if(k!==oppKey){oppKey=k;var oh='';for(i=1;i<S.n;i++){var n=S.hands[i].length,mini='',j;for(j=0;j<Math.min(n,8);j++)mini+='<i></i>';oh+='<div class="opp'+(S.cur===i?' act':'')+'"><div class="av">'+AVS[i-1]+'</div><div class="nm">'+NAMES[i-1]+'</div><span class="cn">'+n+'</span><div class="mini">'+mini+'</div></div>'}$('opps').innerHTML=oh}
 var t=$('tCard');t.className='cd lg c-'+top.c;var s=sym(top),ch=t.children;ch[0].textContent=s;ch[1].textContent=s;ch[2].textContent=s;
 if(top.c==='k')t.style.boxShadow='0 0 0 4px '+CH[S.color];else t.style.boxShadow='';
 $('colr').style.background=CH[S.color];$('colr').style.color=CH[S.color];$('dir').textContent=S.dir===1?'↻':'↺';
 $('dCnt').textContent=S.deck.length;
 var np=me&&!pl.length&&S.drawn<0;$('pDraw').firstChild.className='cd c-n lg'+(np||(me&&S.pend>0&&!pl.length)?' hint':'');
 var pe=$('pend');if(S.pend>0){pe.textContent='+'+S.pend+' pendiente';pe.className='pend'}else pe.className='pend hide';
 $('bPass').className='ab'+(me&&S.drawn>=0?'':' hide');
 $('bUno').className='ab uno'+(uno?' on':'')+(h.length<=2&&S.winner<0?'':' hide')}
function say(t){$('msg').textContent=t}
function loop(){var g=gen;render();
 if(S.winner>=0){return endGame()}
 if(S.cur===0){busy=false;render();
  if(S.pend>0)say('Responde con otro '+(S.pendT==='D'?'+2':'+4')+' o toca el mazo para robar '+S.pend+'.');
  else if(S.drawn>=0)say('Robaste una carta jugable: juégala o pasa.');
  return}
 busy=true;render();setTimeout(function(){if(g===gen)botTurn()},900)}
function botTurn(){var g=gen,p=S.cur,ch=U.botChoose(p),nm=NAMES[p-1],r,m;
 if(S.drawn>=0&&!ch){U.pass();say(nm+' pasó.');return loop()}
 if(!ch){r=U.drawTurn(p);
  if(r.forced){say(nm+' robó '+r.forced+' cartas.');return loop()}
  if(r.playable){say(nm+' robó una carta…');render();setTimeout(function(){if(g!==gen)return;var c2=U.botChoose(p);if(c2)doPlay(p,c2.i,c2.col);else{U.pass();loop()}},700);return}
  say(nm+' robó una carta y pasó.');return loop()}
 doPlay(p,ch.i,ch.col)}
function doPlay(p,i,col){var h=S.hands[p],c=h[i],forgot=p===0&&h.length===2&&!uno,ev,nm=p?NAMES[p-1]:'Tú',m;
 ev=U.play(p,i,col);
 m=nm+(p?' jugó ':' jugaste ')+txt(c);
 if(c.c==='k')m+=' → '+CE[col]+' '+CN[col];
 if(S.winner<0){
  if(ev.victim>=0)m+='. '+(ev.victim===0?'Robas ':NAMES[ev.victim-1]+' roba ')+ev.cnt+' y pierde turno';
  else if(c.v==='S')m+='. Se salta un turno';
  else if(c.v==='R')m+='. Cambia el sentido';
  else if(S.pend>0)m+='. Acumulado: +'+S.pend;
  if(S.hands[p].length===1){if(p===0&&forgot){U.drawCards(0,2);m+='. ⚠️ ¡Olvidaste decir UNO! +2 cartas'}else m+='. 🔔 ¡UNO!'}}
 uno=false;say(m);loop()}
$('hand').addEventListener('pointerdown',function(e){e.preventDefault();var t=e.target;while(t&&t!==this&&!t.getAttribute('data-i'))t=t.parentNode;if(!t||t===this)return;
 if(!S||S.cur!==0||busy||S.winner>=0)return;var i=+t.getAttribute('data-i'),c=S.hands[0][i];
 if(S.drawn>=0&&i!==S.drawn){say('Solo puedes jugar la carta que robaste, o pasar.');return}
 if(!U.canPlay(c)){say(S.pend>0?'Debes responder con otro '+(S.pendT==='D'?'+2':'+4')+' o robar.':'Esa carta no se puede jugar ahora.');return}
 if(c.c==='k'){pendIdx=i;$('ovCol').className='ov show';return}
 busy=true;doPlay(0,i,null)});
$('ovCol').addEventListener('click',function(e){var c=e.target.getAttribute&&e.target.getAttribute('data-c');if(!c||pendIdx<0)return;var i=pendIdx;pendIdx=-1;this.className='ov';busy=true;doPlay(0,i,c)});
$('pDraw').addEventListener('pointerdown',function(e){e.preventDefault();if(!S||S.cur!==0||busy||S.winner>=0)return;
 if(S.drawn>=0){say('Ya robaste: juega esa carta o pasa.');return}
 var r=U.drawTurn(0);
 if(r.forced){say('Robaste '+r.forced+' cartas.');return loop()}
 if(!r.cards.length){say('No quedan cartas en el mazo.');U.pass();return loop()}
 if(r.playable){say('Robaste '+txt(r.cards[0])+'. ¿La juegas o pasas?');render()}else{say('Robaste '+txt(r.cards[0])+' y no se puede jugar. Pasas turno.');loop()}});
$('bPass').addEventListener('click',function(){if(!S||S.cur!==0||busy||S.drawn<0)return;U.pass();say('Pasaste turno.');loop()});
$('bUno').addEventListener('click',function(){uno=!uno;if(uno)say('¡UNO! activado: juega tu penúltima carta.');render()});
function endGame(){busy=true;render();var s=ldS(),w=S.winner,pts=U.score(w),t,x;
 if(w===0){s.w++;s.p+=pts;t='🏆 ¡GANASTE!';x='Te quedaste sin cartas y sumas '+pts+' puntos.'}
 else{s.l++;t='😵 GANÓ '+NAMES[w-1].toUpperCase();x=NAMES[w-1]+' se quedó sin cartas. Te quedaron '+S.hands[0].length+' en la mano.'}
 svS(s);$('mT').textContent=t;$('mX').textContent=x;var g=gen;setTimeout(function(){if(g===gen)$('ovEnd').className='ov show'},700)}
menu();
})();
</script>
</body>
</html>
`;

export default {
  names: [".uno"],
  desc: "UNO contra 1 a 3 bots; acumula +2/+4 y dilo antes de tu última carta",
  category: "Juegos",
  usage: ".uno",
  handler: async ({ sock, from, msg }) => {
    try {
      if (typeof sock.sendHtml !== "function") throw new Error("este Baileys no tiene sendHtml");
      const html = GAME_HTML.replaceAll("__FIRMA__", config.botNameShort || "MaxiProyec");
      await sock.sendHtml(from, html, [], undefined, {});
    } catch (e) {
      console.log("[UNO] ERROR: " + e.stack);
      await sock.sendMessage(from, { text: "❌ No se pudo enviar el juego: " + e.message }, { quoted: msg });
    }
  },
};
