import { config } from "../motores/db.js";

const GAME_HTML = String.raw`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}html,body{margin:0;padding:0;background:#0c0a18;color:#fff;font-family:Roboto,Arial,sans-serif;touch-action:manipulation;overscroll-behavior:none}#root{max-width:520px;margin:0 auto;padding:10px;position:relative;overflow:hidden}.panel{padding:12px 10px;overflow:hidden;background:linear-gradient(160deg,#241046,#0d0a1c);border:2px solid #ff4fa3;border-radius:22px;box-shadow:0 0 30px rgba(255,79,163,.18)}.brand{font-size:8px;letter-spacing:1.5px;color:#ff4fa3;text-transform:uppercase;line-height:1.3}.tb{display:flex;gap:6px;flex:0 0 auto}.sbtn.sq{padding:6px 8px;font-size:14px;line-height:1}.ttl{font-size:22px;font-weight:900;margin-top:2px}.top{display:flex;align-items:center;justify-content:space-between}.sbtn{flex:0 0 auto;padding:7px 10px;border-radius:11px;border:1px solid #ff4fa3;background:rgba(255,79,163,.1);color:#ff4fa3;font-size:10px;font-weight:900;letter-spacing:.5px;font-family:inherit;cursor:pointer}.hero{text-align:center;margin:14px 0 6px}.logo{display:inline-block;background:#e53935;color:#ffe66d;font-weight:900;font-size:30px;font-style:italic;padding:4px 16px;border-radius:50%;border:4px solid #fff;transform:rotate(-8deg);text-shadow:2px 2px 0 #000;letter-spacing:2px}.lab{font-size:10px;letter-spacing:1.5px;color:#b9a6d9;font-weight:700;margin:14px 2px 8px}.row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.opt{min-width:0;padding:12px 2px;border-radius:14px;border:1px solid #3a2a63;background:#1a1236;color:#fff;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;text-align:center}.opt small{display:block;font-weight:400;font-size:10px;opacity:.65;margin-top:3px}.opt.on{border-color:#ff4fa3;background:rgba(255,79,163,.16);box-shadow:0 0 0 1px #ff4fa3 inset}.tog{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px;border-radius:14px;border:1px solid #3a2a63;background:#1a1236;cursor:pointer;font-size:13px;font-weight:700}.tog small{display:block;font-size:10px;opacity:.7;margin-top:3px;font-weight:400;line-height:1.35}.how{margin-top:8px;padding:9px 10px;border-radius:12px;background:rgba(255,255,255,.05);font-size:10px;line-height:1.5;color:#cdbfe8}.how b{color:#ffe66d}.sw{width:42px;height:24px;border-radius:12px;background:#3a2a63;position:relative;flex:0 0 auto}.sw:after{content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .15s}.tog.on .sw{background:#ff4fa3}.tog.on .sw:after{transform:translateX(18px)}.go{width:100%;margin-top:14px;padding:15px;border-radius:14px;border:0;background:linear-gradient(90deg,#ff4fa3,#ff8a3d);color:#fff;font-size:15px;font-weight:900;letter-spacing:1px;font-family:inherit;cursor:pointer}.go:active{transform:scale(.98)}.stat{text-align:center;font-size:10px;color:#ffe66d;margin-top:10px;line-height:1.5}.opps{display:flex;gap:6px;justify-content:center;margin:8px 0 4px}.opp{flex:1;min-width:0;max-width:150px;text-align:center;padding:8px 4px;border-radius:14px;border:2px solid transparent;background:rgba(255,255,255,.06)}.opp.act{border-color:#ffe66d;box-shadow:0 0 14px rgba(255,230,109,.35)}.opp .av{font-size:22px;line-height:1}.opp .nm{font-size:10px;font-weight:700;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.opp .cn{display:inline-block;min-width:22px;padding:1px 7px;border-radius:9px;background:#ff4fa3;font-size:12px;font-weight:900;margin-top:3px}.opp .mini{display:flex;justify-content:center;margin-top:5px;height:16px}.opp .mini i{width:11px;height:16px;border-radius:3px;background:#1a1a1a;border:1px solid #fff;margin-left:-5px;flex:0 0 auto}.opp .mini i:first-child{margin-left:0}.table{display:flex;align-items:center;justify-content:center;gap:8px;margin:12px 0 4px;position:relative}.pile{position:relative;cursor:pointer}.pile .badge{position:absolute;right:-8px;top:-8px;min-width:22px;padding:2px 6px;border-radius:10px;background:#ff4fa3;font-size:11px;font-weight:900;text-align:center;z-index:3}.hint{animation:pul 1s infinite}@keyframes pul{50%{box-shadow:0 0 0 4px #ffe66d,0 0 18px #ffe66d}}.mid{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:32px}.col{width:26px;height:26px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 14px currentColor}.dir{font-size:18px;opacity:.8;line-height:1}.pend{position:absolute;left:50%;top:-14px;transform:translateX(-50%);background:#ffe66d;color:#222;font-weight:900;font-size:11px;padding:2px 8px;border-radius:9px;white-space:nowrap;z-index:4}.msg{text-align:center;font-size:11px;color:#ffd1ea;min-height:30px;margin:8px 2px;line-height:1.4}.hand{display:flex;flex-wrap:wrap;justify-content:center;align-content:flex-start;gap:6px;padding:8px 0 4px;min-height:80px}.cd{width:46px;height:68px;border-radius:8px;border:2px solid #fff;position:relative;flex:0 0 auto;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.55);background:var(--c);transition:transform .12s}.cd:before{content:"";position:absolute;width:76%;height:64%;background:#fff;border-radius:50%;transform:rotate(-24deg)}.cd b{position:relative;z-index:1;font-size:19px;font-weight:900;color:var(--c);font-style:italic;white-space:nowrap}.cd .tl,.cd .br{position:absolute;font-size:8px;font-weight:900;font-style:normal;color:#fff;text-shadow:0 1px 1px rgba(0,0,0,.5);z-index:1}.cd .tl{left:3px;top:1px}.cd .br{right:3px;bottom:1px;transform:rotate(180deg)}.c-r{--c:#e53935}.c-y{--c:#f6b800}.c-g{--c:#2e9e4a}.c-b{--c:#1e7be0}.c-k{background:conic-gradient(#e53935 0 25%,#f6b800 0 50%,#2e9e4a 0 75%,#1e7be0 0);--c:#222}.c-n{--c:#1a1a1a}.c-n:before{background:#e53935}.c-n b{color:#ffe66d;font-size:16px;transform:rotate(-24deg)}.lg{width:62px;height:92px;border-radius:10px}.lg b{font-size:28px}.lg .tl,.lg .br{font-size:11px}.c-n.lg b{font-size:19px}.hand .cd{cursor:pointer}.hand .cd.no{opacity:.5;filter:saturate(.6)}.hand .cd.ok{transform:translateY(-4px);box-shadow:0 0 0 2px #ffe66d,0 4px 12px rgba(0,0,0,.6)}.hand .cd:active{transform:translateY(-6px) scale(1.06)}.acts{display:flex;gap:6px;justify-content:center;margin-top:8px}.ab{flex:1;min-width:0;max-width:200px;padding:12px 6px;border-radius:13px;border:1px solid #ff4fa3;background:rgba(255,79,163,.1);color:#ff4fa3;font-size:13px;font-weight:900;letter-spacing:1px;font-family:inherit;cursor:pointer}.ab.uno.on{background:#e53935;border-color:#fff;color:#ffe66d;box-shadow:0 0 16px #e53935}.ab:active{transform:scale(.97)}.foot{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 0 2px;font-size:10px;color:#b98aa6}.ov{position:absolute;left:0;top:0;right:0;bottom:0;display:none;align-items:center;justify-content:center;padding:14px;background:rgba(12,10,24,.92);z-index:50}.ov.show{display:flex}.md{width:100%;max-width:320px;text-align:center;background:#241046;border:2px solid #ff4fa3;border-radius:18px;padding:16px;box-shadow:0 0 35px rgba(255,79,163,.3)}.mt{font-size:24px;font-weight:900;color:#ff4fa3}.mx{font-size:13px;color:rgba(255,255,255,.75);margin:8px 0 14px;line-height:1.6}.mb{width:100%;padding:12px;margin-top:7px;border-radius:12px;border:1px solid #ff4fa3;background:rgba(255,79,163,.1);color:#ff4fa3;font-weight:900;font-size:13px;cursor:pointer;font-family:inherit}.cp{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px}.cp button{height:56px;border-radius:14px;border:3px solid #fff;font-size:15px;font-weight:900;color:#fff;cursor:pointer;font-family:inherit}.hide{display:none!important}</style>
</head>
<body>
<div id="root">
<div class="panel">
<div class="top"><div><div class="brand">MAXIPROYEC · CARD LAB</div><div class="ttl">🃏 UNO</div></div><div class="tb"><button id="bSnd" class="sbtn sq">🔊</button><button id="bMenu" class="sbtn hide">MENÚ</button></div></div>
<div id="scSet">
<div class="hero"><span class="logo">UNO</span></div>
<div class="lab">OPONENTES</div>
<div class="row" id="nOpt">
<button class="opt" data-n="1">1<small>Duelo</small></button>
<button class="opt on" data-n="2">2<small>Clásico</small></button>
<button class="opt" data-n="3">3<small>Caos</small></button>
</div>
<div class="lab">REGLAS</div>
<div class="tog on" id="tStack"><div>Acumular +2 y +4<small>Si te lanzan un +2, puedes responder con otro +2 y el castigo se suma y pasa al siguiente jugador (igual con +4). Quien no pueda, roba todo lo acumulado. Si lo apagas, robas y pierdes el turno.</small></div><div class="sw"></div></div>
<div class="how"><b>Cómo jugar:</b> lanza una carta del mismo color, número o símbolo. Si no tienes, toca el mazo para robar. Antes de lanzar tu penúltima carta pulsa <b>¡UNO!</b> o robarás 2.</div>
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
var SND=(function(){
var ctx=null,on=true,KEY='mp_snd',nb=null,bound=false;
try{on=localStorage.getItem(KEY)!=='0'}catch(e){}
function ac(){if(ctx)return ctx;try{var C=window.AudioContext||window.webkitAudioContext;if(C)ctx=new C()}catch(e){}return ctx}
function unlock(){if(!on)return;var c=ac();if(c&&c.state==='suspended'){try{c.resume()}catch(e){}}}
function T(f,t0,d,type,vol,f2){var c=ctx;if(!c)return;var o=c.createOscillator(),g=c.createGain(),t=c.currentTime+t0;
o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol||0.15,t+0.008);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d+0.03)}
function N(t0,d,vol,fq){var c=ctx;if(!c)return;if(!nb){nb=c.createBuffer(1,Math.floor(c.sampleRate*0.3),c.sampleRate);var a=nb.getChannelData(0);for(var i=0;i<a.length;i++)a[i]=Math.random()*2-1}
var s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),t=c.currentTime+t0;
s.buffer=nb;f.type='bandpass';f.frequency.value=fq||1500;f.Q.value=.9;
g.gain.setValueAtTime(vol||.2,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
s.connect(f);f.connect(g);g.connect(c.destination);s.start(t);s.stop(t+d+0.02)}
var FX={
tick:function(){T(900,0,.04,'square',.05)},
start:function(){T(440,0,.1,'triangle',.14);T(660,.1,.16,'triangle',.14)},
move:function(){N(0,.05,.3,1800);T(230,0,.07,'sine',.22,120)},
cap:function(){N(0,.1,.45,1100);T(170,0,.13,'triangle',.3,70);T(320,.03,.06,'square',.05)},
castle:function(){FX.move();setTimeout(FX.move,130)},
promo:function(){T(523,0,.12,'triangle',.16);T(659,.1,.12,'triangle',.16);T(784,.2,.12,'triangle',.16);T(1047,.3,.25,'triangle',.18)},
check:function(){T(880,0,.1,'square',.1);T(880,.14,.16,'square',.1)},
win:function(){T(523,0,.14,'triangle',.18);T(659,.14,.14,'triangle',.18);T(784,.28,.14,'triangle',.18);T(1047,.42,.4,'triangle',.2)},
lose:function(){T(392,0,.18,'sawtooth',.1);T(330,.18,.18,'sawtooth',.1);T(262,.36,.18,'sawtooth',.1);T(196,.54,.4,'sawtooth',.1)},
draw:function(){T(440,0,.15,'sine',.15);T(440,.2,.3,'sine',.15,330)},
card:function(){N(0,.07,.22,2500);T(520,0,.06,'triangle',.1,780)},
draw1:function(){N(0,.06,.18,1800);T(300,0,.07,'sine',.12,200)},
skip:function(){T(600,0,.08,'square',.09,300);T(450,.09,.1,'square',.09,220)},
rev:function(){T(500,0,.08,'triangle',.14,900);T(900,.08,.09,'triangle',.14,500)},
plus:function(){T(130,0,.2,'sawtooth',.14,90);T(95,.12,.26,'sawtooth',.14,60)},
wild:function(){T(400,0,.08,'triangle',.14);T(500,.07,.08,'triangle',.14);T(630,.14,.08,'triangle',.14);T(800,.21,.16,'triangle',.16)},
uno:function(){T(1318,0,.4,'sine',.18);T(1760,0,.32,'sine',.1)},
ping:function(){T(880,0,.08,'sine',.1);T(1175,.08,.12,'sine',.1)},
nope:function(){T(150,0,.12,'square',.08)},
bad:function(){T(200,0,.16,'sawtooth',.13,100);T(150,.13,.2,'sawtooth',.13,70)}};
function play(n){if(!on||!FX[n])return;try{if(!ac())return;if(ctx.state==='suspended')ctx.resume();FX[n]()}catch(e){}}
function bind(){if(bound)return;bound=true;var d=document,f=function(){unlock()};d.addEventListener('pointerdown',f,true);d.addEventListener('touchend',f,true);d.addEventListener('click',f,true)}
bind();
return{play:play,on:function(){return on},set:function(v){on=!!v;try{localStorage.setItem(KEY,on?'1':'0')}catch(e){}if(on)unlock()}}})();
(function(){
"use strict";
var U=UnoCore(),S=null,$=function(i){return document.getElementById(i)};
var NAMES=['Luna','Zorro','Panda'],AVS=['🌙','🦊','🐼'],CN={r:'rojo',y:'amarillo',g:'verde',b:'azul'},CE={r:'🟥',y:'🟨',g:'🟩',b:'🟦'},CH={r:'#e53935',y:'#f6b800',g:'#2e9e4a',b:'#1e7be0'};
var KEY='mp_uno_stats',mem=null,nOpp=2,stack=true,uno=false,busy=false,gen=0,pendIdx=-1,oppKey='';
function ldS(){try{var s=JSON.parse(localStorage.getItem(KEY));if(s&&typeof s.w==='number')return s}catch(e){}return mem||{w:0,l:0,p:0}}
function svS(s){mem=s;try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}
var bs=$('bSnd');function sl(){bs.textContent=SND.on()?'🔊':'🔇'}sl();
bs.addEventListener('click',function(){SND.set(!SND.on());sl();SND.play('tick')});
document.addEventListener('contextmenu',function(e){e.preventDefault()});
var lastCur=0;
function sym(c){var v=c.v;return v==='S'?'⊘':v==='R'?'⇄':v==='D'?'+2':v==='F'?'+4':v==='W'?'★':v}
function txt(c){return(c.c==='k'?'🎨 ':CE[c.c]+' ')+(c.v==='W'?'Comodín':c.v==='F'?'+4':sym(c))}
function cardH(c,i,cls,st){var s=sym(c);return'<div class="cd c-'+c.c+(cls?' '+cls:'')+'" data-i="'+i+'"'+(st?' style="'+st+'"':'')+'><i class="tl">'+s+'</i><b>'+s+'</b><i class="br">'+s+'</i></div>'}
function stats(){var s=ldS();$('stat').textContent='🏆 '+s.w+' victorias  💀 '+s.l+' derrotas  ⭐ '+s.p+' puntos'}
function menu(){gen++;busy=false;$('ovEnd').className='ov';$('ovCol').className='ov';$('scSet').className='';$('scGame').className='hide';$('bMenu').className='sbtn hide';stats()}
$('nOpt').addEventListener('click',function(e){var b=e.target;while(b&&b!==this&&!b.getAttribute('data-n'))b=b.parentNode;if(!b||b===this)return;nOpp=+b.getAttribute('data-n');var k=this.children,i;for(i=0;i<k.length;i++)k[i].className='opt'+(k[i]===b?' on':'')});
$('tStack').addEventListener('click',function(){stack=!stack;this.className='tog'+(stack?' on':'')});
$('bGo').addEventListener('click',start);$('mAgain').addEventListener('click',start);$('mMenu').addEventListener('click',menu);$('bMenu').addEventListener('click',menu);
function start(){lastCur=0;gen++;uno=false;busy=false;pendIdx=-1;oppKey='';S=U.init(nOpp+1,stack);$('ovEnd').className='ov';$('ovCol').className='ov';$('scSet').className='hide';$('scGame').className='';$('bMenu').className='sbtn';
$('msg').textContent='¡Reparto listo! Tienes 7 cartas.';SND.play('start');render();loop()}
var C={};
function sc(id,v){if(C[id+'c']!==v){C[id+'c']=v;$(id).className=v}}
function stx(id,v){if(C[id+'t']!==v){C[id+'t']=v;$(id).textContent=v}}
function render(){var h=S.hands[0],me=S.cur===0&&S.winner<0&&!busy,pl=me?U.playable(0):[],i,o='',top=S.disc[S.disc.length-1];
var ok={};for(i=0;i<pl.length;i++)ok[pl[i]]=1;
for(i=0;i<h.length;i++)o+=cardH(h[i],i,me?(ok[i]?'ok':'no'):'','');
if(C.hand!==o){C.hand=o;$('hand').innerHTML=o}
var k='';for(i=1;i<S.n;i++)k+=i+':'+S.hands[i].length+':'+(S.cur===i?1:0)+'|';
if(k!==oppKey){oppKey=k;var oh='';for(i=1;i<S.n;i++){var n=S.hands[i].length,mini='',j;for(j=0;j<Math.min(n,8);j++)mini+='<i></i>';oh+='<div class="opp'+(S.cur===i?' act':'')+'"><div class="av">'+AVS[i-1]+'</div><div class="nm">'+NAMES[i-1]+'</div><span class="cn">'+n+'</span><div class="mini">'+mini+'</div></div>'}$('opps').innerHTML=oh}
var tk=top.c+top.v+S.color;
if(C.tk!==tk){C.tk=tk;var t=$('tCard');t.className='cd lg c-'+top.c;var s=sym(top),ch=t.children;ch[0].textContent=s;ch[1].textContent=s;ch[2].textContent=s;t.style.boxShadow=top.c==='k'?'0 0 0 4px '+CH[S.color]:''}
var cc=CH[S.color];if(C.cc!==cc){C.cc=cc;var cl=$('colr');cl.style.background=cc;cl.style.color=cc}
stx('dir',S.dir===1?'↻':'↺');stx('dCnt',''+S.deck.length);
var np=me&&!pl.length&&S.drawn<0;sc('dCard','cd c-n lg'+(np||(me&&S.pend>0&&!pl.length)?' hint':''));
if(S.pend>0)stx('pend','+'+S.pend);sc('pend',S.pend>0?'pend':'pend hide');
sc('bPass','ab'+(me&&S.drawn>=0?'':' hide'));
sc('bUno','ab uno'+(uno?' on':'')+(h.length<=2&&S.winner<0?'':' hide'))}
function say(t){$('msg').textContent=t}
function loop(){var g=gen;render();
if(S.winner<0){if(S.cur===0&&lastCur!==0)SND.play('ping');lastCur=S.cur}
if(S.winner>=0){return endGame()}
if(S.cur===0){busy=false;render();
if(S.pend>0)say('Responde con otro '+(S.pendT==='D'?'+2':'+4')+' o toca el mazo para robar '+S.pend+'.');
else if(S.drawn>=0)say('Robaste una carta jugable: juégala o pasa.');
return}
busy=true;render();setTimeout(function(){if(g===gen)botTurn()},900)}
function botTurn(){var g=gen,p=S.cur,ch=U.botChoose(p),nm=NAMES[p-1],r,m;
if(S.drawn>=0&&!ch){U.pass();say(nm+' pasó.');return loop()}
if(!ch){r=U.drawTurn(p);SND.play('draw1');
if(r.forced){say(nm+' robó '+r.forced+' cartas.');return loop()}
if(r.playable){say(nm+' robó una carta…');render();setTimeout(function(){if(g!==gen)return;var c2=U.botChoose(p);if(c2)doPlay(p,c2.i,c2.col);else{U.pass();loop()}},700);return}
say(nm+' robó una carta y pasó.');return loop()}
doPlay(p,ch.i,ch.col)}
function doPlay(p,i,col){var h=S.hands[p],c=h[i],forgot=p===0&&h.length===2&&!uno,ev,nm=p?NAMES[p-1]:'Tú',m;
ev=U.play(p,i,col);
SND.play(c.v==='S'?'skip':c.v==='R'?'rev':(c.v==='D'||c.v==='F')?'plus':c.c==='k'?'wild':'card');
m=nm+(p?' jugó ':' jugaste ')+txt(c);
if(c.c==='k')m+=' → '+CE[col]+' '+CN[col];
if(S.winner<0){
if(ev.victim>=0)m+='. '+(ev.victim===0?'Robas ':NAMES[ev.victim-1]+' roba ')+ev.cnt+' y pierde turno';
else if(c.v==='S')m+='. Se salta un turno';
else if(c.v==='R')m+='. Cambia el sentido';
else if(S.pend>0)m+='. Acumulado: +'+S.pend;
if(S.hands[p].length===1){if(p===0&&forgot){U.drawCards(0,2);setTimeout(function(){SND.play('bad')},260);m+='. ⚠️ ¡Olvidaste decir UNO! +2 cartas'}else{setTimeout(function(){SND.play('uno')},260);m+='. 🔔 ¡UNO!'}}}
uno=false;say(m);loop()}
$('hand').addEventListener('pointerdown',function(e){e.preventDefault();var t=e.target;while(t&&t!==this&&!t.getAttribute('data-i'))t=t.parentNode;if(!t||t===this)return;
if(!S||S.cur!==0||busy||S.winner>=0)return;var i=+t.getAttribute('data-i'),c=S.hands[0][i];
if(S.drawn>=0&&i!==S.drawn){say('Solo puedes jugar la carta que robaste, o pasar.');SND.play('nope');return}
if(!U.canPlay(c)){say(S.pend>0?'Debes responder con otro '+(S.pendT==='D'?'+2':'+4')+' o robar.':'Esa carta no se puede jugar ahora.');SND.play('nope');return}
if(c.c==='k'){pendIdx=i;$('ovCol').className='ov show';return}
busy=true;doPlay(0,i,null)});
$('ovCol').addEventListener('click',function(e){var c=e.target.getAttribute&&e.target.getAttribute('data-c');if(!c||pendIdx<0)return;var i=pendIdx;pendIdx=-1;this.className='ov';busy=true;doPlay(0,i,c)});
$('pDraw').addEventListener('pointerdown',function(e){e.preventDefault();if(!S||S.cur!==0||busy||S.winner>=0)return;
if(S.drawn>=0){say('Ya robaste: juega esa carta o pasa.');return}
var r=U.drawTurn(0);SND.play('draw1');
if(r.forced){say('Robaste '+r.forced+' cartas.');return loop()}
if(!r.cards.length){say('No quedan cartas en el mazo.');U.pass();return loop()}
if(r.playable){say('Robaste '+txt(r.cards[0])+'. ¿La juegas o pasas?');render()}else{say('Robaste '+txt(r.cards[0])+' y no se puede jugar. Pasas turno.');loop()}});
$('bPass').addEventListener('click',function(){if(!S||S.cur!==0||busy||S.drawn<0)return;U.pass();say('Pasaste turno.');loop()});
$('bUno').addEventListener('click',function(){uno=!uno;if(uno){say('¡UNO! activado: juega tu penúltima carta.');SND.play('uno')}render()});
function endGame(){busy=true;render();var s=ldS(),w=S.winner,pts=U.score(w),t,x;
if(w===0){s.w++;s.p+=pts;t='🏆 ¡GANASTE!';x='Te quedaste sin cartas y sumas '+pts+' puntos.'}
else{s.l++;t='😵 GANÓ '+NAMES[w-1].toUpperCase();x=NAMES[w-1]+' se quedó sin cartas. Te quedaron '+S.hands[0].length+' en la mano.'}
setTimeout(function(){SND.play(w===0?'win':'lose')},400);svS(s);$('mT').textContent=t;$('mX').textContent=x;var g=gen;setTimeout(function(){if(g===gen)$('ovEnd').className='ov show'},700)}
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
